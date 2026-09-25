<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\SupplierAccount;
use App\Models\Subscription;
use App\Models\SerialIssue;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    /**
     * Get comprehensive dashboard statistics
     */
    public function stats(Request $request)
    {
        try {
            // Parse date filters
            $startDate = $request->input('start_date') 
                ? Carbon::parse($request->input('start_date'))->startOfDay() 
                : Carbon::now()->startOfYear();
            $endDate = $request->input('end_date') 
                ? Carbon::parse($request->input('end_date'))->endOfDay() 
                : Carbon::now()->endOfDay();

            // User Statistics
            $userStats = $this->getUserStats($startDate, $endDate);
            
            // Supplier Account Statistics
            $supplierStats = $this->getSupplierStats($startDate, $endDate);
            
            // Subscription Statistics — optionally scoped by Supplier / Serial Title
            $supplierId = $request->input('supplier_id') ?: null;
            $serialTitle = $request->input('serial_title') ?: null;
            $subscriptionStats = $this->getSubscriptionStats($startDate, $endDate, $supplierId, $serialTitle);

            // Time Series Data for Charts
            $chartData = $this->getChartData($startDate, $endDate);

            return response()->json([
                'success' => true,
                'stats' => [
                    'users' => $userStats,
                    'suppliers' => $supplierStats,
                    'subscriptions' => $subscriptionStats,
                ],
                'charts' => $chartData,
                'filters' => [
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $endDate->toDateString(),
                ],
            ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard statistics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user statistics — mirrors UserController::stats() and
     * UserController::index() EXACTLY (both count ALL users, admins
     * included), so "Total Users" and "Approved Users" here always match
     * what List of Users shows. Do not add role exclusions here without
     * also adding them to UserController, or the two will drift apart again.
     */
    private function getUserStats($startDate, $endDate)
    {
        // Total users — matches UserController::index()'s User::all() exactly.
        $total = User::count();
        
        // Approved/verified users — matches UserController::stats()'s
        // definition exactly: whereNotNull('email_verified_at').
        $approved = User::whereNotNull('email_verified_at')->count();
        
        // Pending (unverified) users
        $pending = User::whereNull('email_verified_at')->count();
        
        // Disabled users
        $disabled = User::where('is_disabled', true)->count();

        // Users created within date range
        $createdInRange = User::whereBetween('created_at', [$startDate, $endDate])->count();

        // Users by role (informational — not used for Total/Approved cards)
        $byRole = [
            'admin' => User::where('role', 'admin')->count(),
            'tpu' => User::where('role', 'tpu')->count(),
            'gsps' => User::where('role', 'gsps')->count(),
            'inspection' => User::where('role', 'inspection')->count(),
            'supplier' => User::where('role', 'supplier')->count(),
        ];

        return [
            'total' => $total,
            'approved' => $approved,
            'pending' => $pending,
            'disabled' => $disabled,
            'created_in_range' => $createdInRange,
            'by_role' => $byRole,
        ];
    }

    /**
     * Get supplier account statistics
     */
    private function getSupplierStats($startDate, $endDate)
    {
        $total = SupplierAccount::count();
        $pending = SupplierAccount::where('status', 'pending')->count();
        $approved = SupplierAccount::where('status', 'approved')->count();
        $rejected = SupplierAccount::where('status', 'rejected')->count();

        // Accounts created within date range
        $createdInRange = SupplierAccount::whereBetween('created_at', [$startDate, $endDate])->count();

        // Accounts approved within date range
        $approvedInRange = SupplierAccount::where('status', 'approved')
            ->whereBetween('approved_at', [$startDate, $endDate])
            ->count();

        // Calculate average approval time (in days) for recently approved accounts
        $avgApprovalTime = $this->calculateAvgApprovalTime();

        // Approval backlog (pending > 7 days)
        $approvalBacklog = SupplierAccount::where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subDays(7))
            ->count();

        // Disabled Supplier Accounts — mirrors SupplierList.jsx's (List of
        // Suppliers) exact definition: approved supplier accounts whose
        // linked User has is_disabled = true. This is NOT the same as "no
        // subscriptions" — never conflate the two.
        $disabledSupplierAccounts = $this->getDisabledSupplierAccountsCount();

        return [
            'total' => $total,
            'pending' => $pending,
            'approved' => $approved,
            'rejected' => $rejected,
            'created_in_range' => $createdInRange,
            'approved_in_range' => $approvedInRange,
            'avg_approval_time' => $avgApprovalTime,
            'approval_backlog' => $approvalBacklog,
            'disabled_supplier_accounts' => $disabledSupplierAccounts,
        ];
    }

    /**
     * Count of approved supplier accounts whose linked User is disabled —
     * matches SupplierList.jsx's approved()-fetch + is_disabled-via-user_id
     * logic exactly, so this number and List of Suppliers' "Disabled" filter
     * count always agree.
     */
    private function getDisabledSupplierAccountsCount(): int
    {
        $approvedAccounts = SupplierAccount::approved()->get();
        $count = 0;
        foreach ($approvedAccounts as $account) {
            $user = $account->user_id ? User::find($account->user_id) : null;
            if ($user && ($user->is_disabled ?? false)) {
                $count++;
            }
        }
        return $count;
    }

    /**
     * Get subscription statistics — optionally scoped by Supplier ACCOUNT ID
     * (never by name — two accounts can share a company name and must be
     * scoped independently) and/or Serial Title.
     * "Active" mirrors TPU Monitor Delivery's "Ongoing" definition exactly (see below).
     */
    private function getSubscriptionStats($startDate, $endDate, $supplierId = null, $serialTitle = null)
    {
        $query = Subscription::query();
        if ($supplierId) {
            $query->where('supplier_id', $supplierId);
        }
        if ($serialTitle) {
            $query->where('serial_title', $serialTitle);
        }
        $subscriptions = $query->get()->filter(fn ($subscription) => $subscription->hasActiveRecords());
        $total = $subscriptions->count();

        // "Active" here mirrors TPU Monitor Delivery's "Ongoing" definition exactly:
        // a subscription counts as active/ongoing if it's in the qualifying status
        // list, has at least one non-archived serial issue, and not every issue has
        // been delivered (or any issue is For Return). This intentionally ignores
        // the subscription's own `status` field beyond the qualifying-status check,
        // since that field alone doesn't reflect real delivery progress.
        $qualifyingStatuses = ['Active', 'accepted', 'Delivered', 'delivered'];
        $active = 0;
        foreach ($subscriptions as $subscription) {
            if (!in_array($subscription->status, $qualifyingStatuses, true)) {
                continue;
            }
            $issues = SerialIssue::where('subscription_id', (string) ($subscription->_id ?? $subscription->id))
                ->whereNull('archived_at')
                ->get();
            if ($issues->isEmpty()) {
                continue;
            }
            $deliveredCount = $issues->where('status', 'delivered')->count();
            $forReturnCount = $issues->where('status', 'for_return')->count();
            $totalIssueCount = $issues->count();
            $isDelivered = ($forReturnCount === 0 && $totalIssueCount > 0 && $deliveredCount === $totalIssueCount);
            if (!$isDelivered) {
                $active++;
            }
        }

        $completed = $subscriptions->where('status', 'Completed')->count();
        $inactive = $subscriptions->where('status', 'Inactive')->count();

        // Subscriptions created within date range
        $createdInRange = $subscriptions->filter(fn ($subscription) => $subscription->created_at >= $startDate && $subscription->created_at <= $endDate)->count();

        $totalValue = 0;
        $deliveredValue = 0;
        foreach ($subscriptions as $subscription) {
            $issues = SerialIssue::where('subscription_id', (string) ($subscription->_id ?? $subscription->id))
                ->whereNull('archived_at')->get();
            $totalValue += $issues->isEmpty() ? ($subscription->award_cost ?? 0) : $issues->sum('cost');
            $deliveredValue += $issues->isEmpty()
                ? ($subscription->delivered_cost ?? 0)
                : $issues->where('status', 'delivered')->sum('cost');
        }

        return [
            'total' => $total,
            'active' => $active,
            'completed' => $completed,
            'inactive' => $inactive,
            'created_in_range' => $createdInRange,
            'total_value' => $totalValue,
            'delivered_value' => $deliveredValue,
        ];
    }

    /**
     * Calculate average approval time for supplier accounts
     */
    private function calculateAvgApprovalTime()
    {
        $approvedAccounts = SupplierAccount::where('status', 'approved')
            ->whereNotNull('approved_at')
            ->whereNotNull('created_at')
            ->get();

        if ($approvedAccounts->isEmpty()) {
            return 0;
        }

        $totalDays = 0;
        $count = 0;

        foreach ($approvedAccounts as $account) {
            $createdAt = Carbon::parse($account->created_at);
            $approvedAt = Carbon::parse($account->approved_at);
            $days = $createdAt->diffInDays($approvedAt);
            $totalDays += $days;
            $count++;
        }

        return $count > 0 ? round($totalDays / $count, 1) : 0;
    }

    /**
     * Get time series data for charts
     */
    private function getChartData($startDate, $endDate)
    {
        $months = [];
        $current = Carbon::parse($startDate)->startOfMonth();
        $end = Carbon::parse($endDate)->endOfMonth();

        while ($current <= $end) {
            $monthStart = $current->copy()->startOfMonth();
            $monthEnd = $current->copy()->endOfMonth();
            $monthName = $current->format('F');

            // Supplier accounts approved in this month
            $approvedCount = SupplierAccount::where('status', 'approved')
                ->whereBetween('approved_at', [$monthStart, $monthEnd])
                ->count();

            // Supplier accounts pending at month end (those created before month end and still pending)
            $pendingAtMonth = SupplierAccount::where('status', 'pending')
                ->where('created_at', '<=', $monthEnd)
                ->count();

            // Alternatively, accounts created in this month that were still pending
            $pendingCreated = SupplierAccount::where('status', 'pending')
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->count();

            // Supplier accounts created in this month
            $createdCount = SupplierAccount::whereBetween('created_at', [$monthStart, $monthEnd])
                ->count();

            // Users created in this month
            $usersCreated = User::whereBetween('created_at', [$monthStart, $monthEnd])
                ->count();

            $months[] = [
                'month' => $monthName,
                'year' => $current->year,
                'approved' => $approvedCount,
                'pending' => max($pendingCreated, 1), // Ensure at least 1 for chart visibility
                'created' => $createdCount,
                'users_created' => $usersCreated,
            ];

            $current->addMonth();
        }

        // Calculate pie chart data from current totals
        $pieData = [
            ['name' => 'Approved', 'value' => SupplierAccount::where('status', 'approved')->count()],
            ['name' => 'Pending', 'value' => SupplierAccount::where('status', 'pending')->count()],
            ['name' => 'Rejected', 'value' => SupplierAccount::where('status', 'rejected')->count()],
        ];

        // User status pie chart
        $userPieData = [
            ['name' => 'Approved', 'value' => User::whereNotNull('email_verified_at')->where(function($q) { $q->where('is_disabled', '!=', true)->orWhereNull('is_disabled'); })->count()],
            ['name' => 'Pending', 'value' => User::whereNull('email_verified_at')->count()],
            ['name' => 'Disabled', 'value' => User::where('is_disabled', true)->count()],
        ];

        return [
            'monthly' => $months,
            'supplier_status_pie' => $pieData,
            'user_status_pie' => $userPieData,
        ];
    }
}