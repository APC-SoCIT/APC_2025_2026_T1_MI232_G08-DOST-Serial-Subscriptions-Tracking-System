<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\SupplierAccount;
use App\Models\Subscription;
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

            // User Statistics (excluding admin users)
            $userStats = $this->getUserStats($startDate, $endDate);
            
            // Supplier Account Statistics
            $supplierStats = $this->getSupplierStats($startDate, $endDate);
            
            // Subscription Statistics
            $subscriptionStats = $this->getSubscriptionStats($startDate, $endDate);

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
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard statistics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user statistics
     */
    private function getUserStats($startDate, $endDate)
    {
        // Total users (excluding admin)
        $total = User::where('role', '!=', 'admin')->count();
        
        // Approved/verified users
        $approved = User::where('role', '!=', 'admin')
            ->whereNotNull('email_verified_at')
            ->count();
        
        // Pending (unverified) users
        $pending = User::where('role', '!=', 'admin')
            ->whereNull('email_verified_at')
            ->count();
        
        // Disabled users
        $disabled = User::where('role', '!=', 'admin')
            ->where('is_disabled', true)
            ->count();

        // Users created within date range
        $createdInRange = User::where('role', '!=', 'admin')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        // Users by role
        $byRole = [
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

        // Inactive approved suppliers (no subscriptions)
        $activeSupplierIds = Subscription::distinct('supplier_id')->pluck('supplier_id')->toArray();
        $inactiveSuppliers = SupplierAccount::where('status', 'approved')
            ->whereNotIn('_id', $activeSupplierIds)
            ->count();

        return [
            'total' => $total,
            'pending' => $pending,
            'approved' => $approved,
            'rejected' => $rejected,
            'created_in_range' => $createdInRange,
            'approved_in_range' => $approvedInRange,
            'avg_approval_time' => $avgApprovalTime,
            'approval_backlog' => $approvalBacklog,
            'inactive_suppliers' => $inactiveSuppliers,
        ];
    }

    /**
     * Get subscription statistics
     */
    private function getSubscriptionStats($startDate, $endDate)
    {
        $total = Subscription::count();
        $active = Subscription::where('status', 'Active')->count();
        $completed = Subscription::where('status', 'Completed')->count();
        $inactive = Subscription::where('status', 'Inactive')->count();

        // Subscriptions created within date range
        $createdInRange = Subscription::whereBetween('created_at', [$startDate, $endDate])->count();

        // Total value of subscriptions
        $totalValue = Subscription::sum('award_cost') ?? 0;
        $deliveredValue = Subscription::sum('delivered_cost') ?? 0;

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
            $usersCreated = User::where('role', '!=', 'admin')
                ->whereBetween('created_at', [$monthStart, $monthEnd])
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
            ['name' => 'Approved', 'value' => User::where('role', '!=', 'admin')->whereNotNull('email_verified_at')->where(function($q) { $q->where('is_disabled', '!=', true)->orWhereNull('is_disabled'); })->count()],
            ['name' => 'Pending', 'value' => User::where('role', '!=', 'admin')->whereNull('email_verified_at')->count()],
            ['name' => 'Disabled', 'value' => User::where('role', '!=', 'admin')->where('is_disabled', true)->count()],
        ];

        return [
            'monthly' => $months,
            'supplier_status_pie' => $pieData,
            'user_status_pie' => $userPieData,
        ];
    }
}
