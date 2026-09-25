<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SupplierAccount;
use App\Models\User;
use App\Models\SerialIssue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DashboardExportController extends Controller
{
    /** Same qualifying statuses used by the live dashboards, so exports match what's on screen. */
    private const QUALIFYING_STATUSES = ['Active', 'accepted', 'Delivered', 'delivered'];

    private const SERIAL_ISSUE_HEADER = ['Serial Title', 'ISSN', 'Supplier', 'Issue', 'Expected Delivery', 'Status', 'Inspection Result', 'Cost', 'Received Date'];

    private function formatDate($date): string
    {
        if (!$date) return 'N/A';
        try {
            return Carbon::parse($date)->format('M d, Y');
        } catch (\Exception $e) {
            return 'N/A';
        }
    }

    private function readableStatus(?string $status): string
    {
        return match ($status) {
            'pending' => 'Pending',
            'prepare' => 'Preparing',
            'for_delivery' => 'For Delivery',
            'received' => 'Received',
            'delivered' => 'Delivered',
            'for_return' => 'For Return',
            default => $status ? ucfirst(str_replace('_', ' ', $status)) : 'N/A',
        };
    }

    private function formatCost($cost): string
    {
        return 'P' . number_format((float) ($cost ?? 0), 2);
    }

    private function applyDashboardFilters($query, Request $request)
    {
        $supplierId = $request->input('supplier_id') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        if ($supplierId) {
            $query->where('supplier_id', $supplierId);
        }
        if ($serialTitle) {
            $query->where('serial_title', $serialTitle);
        }

        return $query;
    }

    /**
     * Resolve the display ID for a serial item.
     */
    private function getSerialDisplayId(array $serial): string
    {
        return (string) ($serial['issn'] ?? $serial['serialTitle'] ?? $serial['title'] ?? 'N/A');
    }

    /**
     * Normalize a serial's status for the admin report buckets.
     */
    private function getAdminSerialStatus(array $serial): string
    {
        $status = strtolower((string) ($serial['status'] ?? 'pending'));
        $inspectionStatus = strtolower((string) ($serial['inspection_status'] ?? ''));

        if ($inspectionStatus === 'inspected') {
            return 'Inspected';
        }

        if (in_array($status, ['received', 'delivered'], true)) {
            return 'Delivered';
        }

        if (in_array($status, ['pending', 'created'], true)) {
            return 'Pending';
        }

        return 'Awarded';
    }

    /**
     * Resolve the most useful awarded date for the report.
     */
    private function getSerialAwardedDate(array $serial, Subscription $subscription): string
    {
        return $this->formatDate(
            $serial['awarded_date']
                ?? $serial['award_date']
                ?? $serial['created_at']
                ?? $subscription->created_at
        );
    }

    /**
     * Resolve the most useful delivered date for the report.
     */
    private function getSerialDeliveredDate(array $serial): string
    {
        return $this->formatDate(
            $serial['receivedDate']
                ?? $serial['deliveryDate']
                ?? $serial['dateDelivered']
                ?? null
        );
    }

    /**
     * Resolve the most useful inspected date for the report.
     */
    private function getSerialInspectedDate(array $serial): string
    {
        return $this->formatDate(
            $serial['inspection_date']
                ?? $serial['inspected_at']
                ?? null
        );
    }

    /**
     * EXACT copy of DashboardStatsController::totalSerialTitles() — must stay
     * identical, since TPU's "Total Serial Titles Encoded" is a subscription
     * count built with this specific mutate-then-check sequence, not an
     * issue count.
     */
    private function totalSerialTitles($subscriptions): int
    {
        return $subscriptions->filter(function ($subscription) {
            $subscription->serials = $subscription->activeSerials();
            return $subscription->hasActiveRecords();
        })->count();
    }

    /**
     * EXACT copy of DashboardStatsController::qualifyingSubscriptionIssues() —
     * subscriptions in the qualifying status list, each with its non-archived
     * SerialIssue records. Scoped by supplier ACCOUNT id (not name) — two
     * accounts sharing a company name must never be conflated together, same
     * as every live dashboard controller. Returns [bySubscription, allIssues]
     * where bySubscription is used for subscription-level counts and
     * allIssues for issue-level counts.
     */
    private function qualifyingSubscriptionIssues(?string $supplierId, ?string $serialTitle): array
    {
        $query = Subscription::whereIn('status', self::QUALIFYING_STATUSES);
        if ($supplierId) {
            $query->where('supplier_id', $supplierId);
        }
        if ($serialTitle) {
            $query->where('serial_title', $serialTitle);
        }
        $subscriptions = $query->get();
        $bySubscription = [];
        $allIssues = collect();

        foreach ($subscriptions as $subscription) {
            $issues = SerialIssue::where('subscription_id', (string) ($subscription->_id ?? $subscription->id))
                ->whereNull('archived_at')
                ->get();

            if ($issues->isEmpty()) {
                continue;
            }

            $bySubscription[] = ['subscription' => $subscription, 'issues' => $issues];
            $allIssues = $allIssues->merge($issues->map(fn ($issue) => ['subscription' => $subscription, 'issue' => $issue]));
        }

        return [$bySubscription, $allIssues];
    }

    /**
     * Detail rows built directly from an already-fetched issue collection
     * (subscription + issue pairs), so the rows are guaranteed to be exactly
     * the population the summary numbers above were computed from — no
     * separate re-query that could drift out of sync.
     */
    private function issueRowsFrom($allIssuesWithSubscription, Carbon $startDate, Carbon $endDate, ?array $onlyStatuses = null): array
    {
        $rows = [];

        foreach ($allIssuesWithSubscription as $entry) {
            $subscription = $entry['subscription'];
            $issue = $entry['issue'];

            if ($onlyStatuses && !in_array($issue->status, $onlyStatuses, true)) {
                continue;
            }

            $relevantDate = $issue->received_at ?? $issue->inspected_at ?? $issue->for_delivery_at ?? $issue->expected_delivery_date ?? $issue->created_at;
            if ($relevantDate) {
                try {
                    $dateCarbon = Carbon::parse($relevantDate);
                    if ($dateCarbon->lt($startDate) || $dateCarbon->gt($endDate)) {
                        continue;
                    }
                } catch (\Exception $e) {
                    // Keep the row if the date can't be parsed rather than silently dropping it.
                }
            }

            $rows[] = [
                'title' => $subscription->serial_title ?? 'N/A',
                'issue_number' => $issue->issue_number,
                'row' => [
                    $subscription->serial_title ?? 'N/A',
                    $subscription->issn ?: 'N/A',
                    $subscription->supplier_name ?? 'N/A',
                    'Issue #' . $issue->issue_number,
                    $this->formatDate($issue->expected_delivery_date),
                    $this->readableStatus($issue->status),
                    $issue->inspection_status ? $this->readableStatus($issue->inspection_status) : 'N/A',
                    $this->formatCost($issue->cost),
                    $this->formatDate($issue->received_at),
                ],
            ];
        }

        usort($rows, function ($a, $b) {
            $titleCompare = strcmp($a['title'], $b['title']);
            return $titleCompare !== 0 ? $titleCompare : ($a['issue_number'] <=> $b['issue_number']);
        });

        return array_map(fn ($r) => $r['row'], $rows);
    }

    /**
     * EXACT copy of AdminDashboardController's active-subscriptions logic —
     * mirrors Monitor Delivery's "Ongoing" definition. Used for Admin's
     * filtered "Active Subscriptions" export line.
     */
    private function countActiveSubscriptions($subscriptions): int
    {
        $qualifyingStatuses = self::QUALIFYING_STATUSES;
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
        return $active;
    }

    // =====================================================================
    // ADMIN — leads with Account & Approval Summary (the real subject of
    // Admin's dashboard), and every summary metric is immediately followed
    // by its own detail table listing the actual records that add up to
    // that number. Total/Active Subscriptions + Serial Issues Detail only
    // appear when a Supplier or Serial Title filter is applied, exactly
    // like the live dashboard's extra KPI cards.
    // =====================================================================
    public function adminExport(Request $request)
    {
        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : Carbon::now()->startOfYear();
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : Carbon::now()->endOfDay();
        $dashboardName = $request->input('dashboard_name', 'Admin Dashboard');
        $supplierId = $request->input('supplier_id') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        $subscriptions = Subscription::whereBetween('created_at', [$startDate, $endDate])->get();

        // Matches UserController::index()'s User::all() and
        // UserController::stats()'s definitions exactly — no admin exclusion.
        $allUsers = User::all();
        $totalUsers = $allUsers->count();
        $approvedUsersList = $allUsers->filter(fn ($u) => !empty($u->email_verified_at));
        $approvedUsers = $approvedUsersList->count();

        $pendingSupplierAccounts = SupplierAccount::where('status', 'pending')->get();
        $pendingAccounts = $pendingSupplierAccounts->count();

        $backlogAccounts = SupplierAccount::where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subDays(7))
            ->get();
        $approvalBacklog = $backlogAccounts->count();

        $approvedAccounts = SupplierAccount::where('status', 'approved')
            ->whereNotNull('approved_at')
            ->whereNotNull('created_at')
            ->get();
        $avgApprovalTime = 0;
        if ($approvedAccounts->isNotEmpty()) {
            $totalApprovalDays = 0;
            foreach ($approvedAccounts as $account) {
                $totalApprovalDays += Carbon::parse($account->created_at)
                    ->diffInDays(Carbon::parse($account->approved_at));
            }
            $avgApprovalTime = round($totalApprovalDays / $approvedAccounts->count(), 1);
        }

        // "Disabled Supplier Accounts" — approved accounts whose linked User
        // is disabled. Matches List of Suppliers' own definition exactly.
        $allApprovedSupplierAccounts = SupplierAccount::approved()->get();
        $disabledSupplierAccountsList = [];
        foreach ($allApprovedSupplierAccounts as $account) {
            $user = $account->user_id ? User::find($account->user_id) : null;
            if ($user && ($user->is_disabled ?? false)) {
                $disabledSupplierAccountsList[] = $account;
            }
        }
        $disabledSupplierAccounts = count($disabledSupplierAccountsList);

        $data = [
            ['Dashboard Report: ' . $dashboardName],
            ['Report Period: ' . $startDate->format('M d, Y') . ' to ' . $endDate->format('M d, Y')],
            ['Generated: ' . Carbon::now()->format('M d, Y g:i A')],
            [''],
            ['=== ACCOUNT & APPROVAL SUMMARY ==='],
            ['Metric', 'Value'],
            ['Total Users', $totalUsers],
            ['Approved Users', $approvedUsers],
            ['Pending Accounts', $pendingAccounts],
            ['Approval Backlog (>7 days)', $approvalBacklog],
            ['Avg Approval Time (days)', $avgApprovalTime],
            ['Disabled Supplier Accounts', $disabledSupplierAccounts],
        ];

        // --- Total Users detail: every user in the system ---
        $data[] = [''];
        $data[] = ['=== TOTAL USERS DETAIL (' . $totalUsers . ') ==='];
        $data[] = ['Name', 'Email', 'Role', 'Verified?', 'Disabled?', 'Date Created'];
        foreach ($allUsers as $user) {
            $data[] = [
                $user->name ?? 'N/A',
                $user->email ?? 'N/A',
                ucfirst($user->role ?? 'N/A'),
                !empty($user->email_verified_at) ? 'Yes' : 'No',
                ($user->is_disabled ?? false) ? 'Yes' : 'No',
                $this->formatDate($user->created_at),
            ];
        }

        // --- Approved Users detail: subset of the above, verified only ---
        $data[] = [''];
        $data[] = ['=== APPROVED USERS DETAIL (' . $approvedUsers . ') ==='];
        $data[] = ['Name', 'Email', 'Role', 'Date Verified'];
        foreach ($approvedUsersList as $user) {
            $data[] = [
                $user->name ?? 'N/A',
                $user->email ?? 'N/A',
                ucfirst($user->role ?? 'N/A'),
                $this->formatDate($user->email_verified_at),
            ];
        }

        // --- Pending Accounts detail: pending supplier accounts ---
        $data[] = [''];
        $data[] = ['=== PENDING ACCOUNTS DETAIL (' . $pendingAccounts . ') ==='];
        $data[] = ['Company Name', 'Contact Person', 'Email', 'Date Submitted', 'Days Pending'];
        foreach ($pendingSupplierAccounts as $account) {
            $daysPending = $account->created_at ? Carbon::parse($account->created_at)->diffInDays(Carbon::now()) : 'N/A';
            $data[] = [
                $account->company_name ?? 'N/A',
                $account->contact_person ?? 'N/A',
                $account->email ?? 'N/A',
                $this->formatDate($account->created_at),
                $daysPending,
            ];
        }

        // --- Approval Backlog detail: subset of the above, pending >7 days ---
        $data[] = [''];
        $data[] = ['=== APPROVAL BACKLOG DETAIL (' . $approvalBacklog . ') ==='];
        $data[] = ['Company Name', 'Contact Person', 'Email', 'Date Submitted', 'Days Pending'];
        foreach ($backlogAccounts as $account) {
            $daysPending = $account->created_at ? Carbon::parse($account->created_at)->diffInDays(Carbon::now()) : 'N/A';
            $data[] = [
                $account->company_name ?? 'N/A',
                $account->contact_person ?? 'N/A',
                $account->email ?? 'N/A',
                $this->formatDate($account->created_at),
                $daysPending,
            ];
        }

        // --- Avg Approval Time detail: every approved account's own turnaround ---
        $data[] = [''];
        $data[] = ['=== AVG APPROVAL TIME DETAIL (avg ' . $avgApprovalTime . ' days across ' . $approvedAccounts->count() . ' accounts) ==='];
        $data[] = ['Company Name', 'Date Submitted', 'Date Approved', 'Days to Approve'];
        foreach ($approvedAccounts as $account) {
            $days = Carbon::parse($account->created_at)->diffInDays(Carbon::parse($account->approved_at));
            $data[] = [
                $account->company_name ?? 'N/A',
                $this->formatDate($account->created_at),
                $this->formatDate($account->approved_at),
                $days,
            ];
        }

        // --- Disabled Supplier Accounts detail ---
        $data[] = [''];
        $data[] = ['=== DISABLED SUPPLIER ACCOUNTS DETAIL (' . $disabledSupplierAccounts . ') ==='];
        $data[] = ['Company Name', 'Contact Person', 'Email', 'Date Approved'];
        foreach ($disabledSupplierAccountsList as $account) {
            $data[] = [
                $account->company_name ?? 'N/A',
                $account->contact_person ?? 'N/A',
                $account->email ?? 'N/A',
                $this->formatDate($account->approved_at),
            ];
        }

        if ($supplierId || $serialTitle) {
            $subscriptionQuery = $this->applyDashboardFilters(Subscription::query(), $request);
            $filteredSubscriptions = $subscriptionQuery->get()->filter(fn ($s) => $s->hasActiveRecords())->values();
            $activeCount = $this->countActiveSubscriptions($filteredSubscriptions);

            $data[] = [''];
            $data[] = ['=== FILTERED SUBSCRIPTION SUMMARY ==='];
            $data[] = ['Metric', 'Value'];
            $data[] = ['Total Subscriptions', $filteredSubscriptions->count()];
            $data[] = ['Active Subscriptions', $activeCount];

            [, $allIssues] = $this->qualifyingSubscriptionIssues($supplierId, $serialTitle);
            $issueRows = $this->issueRowsFrom($allIssues, $startDate, $endDate);

            $data[] = [''];
            $data[] = ['=== SERIAL ISSUES DETAIL ==='];
            $data[] = self::SERIAL_ISSUE_HEADER;
            foreach ($issueRows as $row) {
                $data[] = $row;
            }
        }

        return $this->generateXlsxResponse($data, 'Admin_Dashboard_Report');
    }

    // =====================================================================
    // TPU — summary lines match the 7 KPI cards exactly: Total Serial Titles
    // Encoded, Serial Issues Delivered to GSPS, Serial Issue awaiting
    // Delivery, Serial Issues For Delivery, Serial Issues For Returned,
    // Accepted Serial Issues, Delivery Success Rate. Volumes/Issues line
    // removed — that KPI card no longer exists on the live dashboard.
    // =====================================================================
    public function tpuExport(Request $request)
    {
        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : Carbon::now()->startOfYear();
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : Carbon::now()->endOfDay();
        $dashboardName = $request->input('dashboard_name', 'TPU Dashboard');
        $supplierId = $request->input('supplier_id') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        $subscriptionQuery = $this->applyDashboardFilters(Subscription::query(), $request);
        $allSubscriptions = $subscriptionQuery->get();
        $totalSerialTitles = $this->totalSerialTitles($allSubscriptions);

        [, $allIssues] = $this->qualifyingSubscriptionIssues($supplierId, $serialTitle);

        $delivered = $allIssues->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN], true))->count();
        // "Serial Issue awaiting Delivery" — Pending and Preparing only,
        // excluding For Delivery status (that has its own separate metric).
        $awaitingOnly = $allIssues->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_PENDING, SerialIssue::STATUS_PREPARE], true))->count();
        // "Serial Issues For Delivery" — status exactly for_delivery.
        $forDeliveryOnly = $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_DELIVERY)->count();
        $inspected = $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_DELIVERED)->count();
        $returned = $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_RETURN)->count();
        $successBase = $inspected + $returned;
        $efficiency = $successBase ? round(($inspected / $successBase) * 100) : 0;

        $data = [
            ['Dashboard Report: ' . $dashboardName],
            ['Report Period: ' . $startDate->format('M d, Y') . ' to ' . $endDate->format('M d, Y')],
            ['Generated: ' . Carbon::now()->format('M d, Y g:i A')],
            [''],
            ['=== SUMMARY ==='],
            ['Metric', 'Value'],
            ['Total Serial Titles Encoded', $totalSerialTitles],
            ['Serial Issues Delivered to GSPS', $delivered],
            ['Serial Issue awaiting Delivery', $awaitingOnly],
            ['Serial Issues For Delivery', $forDeliveryOnly],
            ['Serial Issues For Returned', $returned],
            ['Accepted Serial Issues', $inspected],
            ['Delivery Success Rate', $efficiency . '%'],
            [''],
            ['=== SERIAL ISSUES DETAIL ==='],
            self::SERIAL_ISSUE_HEADER,
        ];

        foreach ($this->issueRowsFrom($allIssues, $startDate, $endDate) as $row) {
            $data[] = $row;
        }

        return $this->generateXlsxResponse($data, 'TPU_Dashboard_Report');
    }

    // =====================================================================
    // GSPS — summary matches the 4 KPI cards exactly: Received Serial
    // Issues, Serial Issues forwarded to Inspection, Pending Receipt
    // Confirmation, Returned Issues. Success Rate card was removed from the
    // live dashboard, so it's dropped here too. "Received Serial Issues" is
    // now an ISSUE count (status exactly received), not a subscription
    // count.
    // =====================================================================
    public function gspsExport(Request $request)
    {
        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : Carbon::now()->startOfYear();
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : Carbon::now()->endOfDay();
        $dashboardName = $request->input('dashboard_name', 'GSPS Dashboard');
        $supplierId = $request->input('supplier_id') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        [, $allIssues] = $this->qualifyingSubscriptionIssues($supplierId, $serialTitle);

        // Received Serial Issues — status exactly "received", matching the
        // live dashboard's fixed definition, not a subscription count.
        $receivedOnly = $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_RECEIVED)->count();

        $forwardedTier = $allIssues->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN], true));
        $returned = $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_RETURN);
        $pending = $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_DELIVERY);

        $data = [
            ['Dashboard Report: ' . $dashboardName],
            ['Report Period: ' . $startDate->format('M d, Y') . ' to ' . $endDate->format('M d, Y')],
            ['Generated: ' . Carbon::now()->format('M d, Y g:i A')],
            [''],
            ['=== SUMMARY ==='],
            ['Metric', 'Value'],
            ['Received Serial Issues', $receivedOnly],
            ['Serial Issues forwarded to Inspection', $forwardedTier->count()],
            ['Pending Receipt Confirmation', $pending->count()],
            ['Returned Issues', $returned->count()],
            [''],
            ['=== SERIAL ISSUES DETAIL ==='],
            self::SERIAL_ISSUE_HEADER,
        ];

        $detailRows = $this->issueRowsFrom($allIssues, $startDate, $endDate, [
            SerialIssue::STATUS_FOR_DELIVERY, SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN,
        ]);
        foreach ($detailRows as $row) {
            $data[] = $row;
        }

        return $this->generateXlsxResponse($data, 'GSPS_Dashboard_Report');
    }

    // =====================================================================
    // INSPECTION — summary matches the 5 KPI cards exactly: Serial Issues
    // received from GSPS, Inspected (Passed), Returned (Damaged), Pending
    // Inspection, Inspection Success Rate. "Serial Issues received from
    // GSPS" is now the FULL received+delivered+for_return tier (an issue
    // count), matching the live dashboard's fixed definition — not a
    // subscription count, and it does not shrink once an issue is inspected.
    // =====================================================================
    public function inspectionExport(Request $request)
    {
        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : Carbon::now()->startOfYear();
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : Carbon::now()->endOfDay();
        $dashboardName = $request->input('dashboard_name', 'Inspection Dashboard');

        $subscriptionQuery = $this->applyDashboardFilters(Subscription::whereIn('status', self::QUALIFYING_STATUSES), $request);
        $subscriptions = $subscriptionQuery->get();
        $receivedTier = [SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN];

        $inspectionIssuesWithSub = collect();
        foreach ($subscriptions as $subscription) {
            $issues = SerialIssue::where('subscription_id', (string) ($subscription->_id ?? $subscription->id))
                ->whereNull('archived_at')
                ->get();
            $tierIssues = $issues->whereIn('status', $receivedTier);
            if ($tierIssues->count() === 0) {
                continue;
            }
            $inspectionIssuesWithSub = $inspectionIssuesWithSub->merge(
                $tierIssues->map(fn ($issue) => ['subscription' => $subscription, 'issue' => $issue])
            );
        }

        $inspected = $inspectionIssuesWithSub->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_DELIVERED);
        $returned = $inspectionIssuesWithSub->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_RETURN);
        $pending = $inspectionIssuesWithSub->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_RECEIVED);
        $successBase = $inspected->count() + $returned->count();
        $successRate = $successBase ? round(($inspected->count() / $successBase) * 100) : 0;

        $data = [
            ['Dashboard Report: ' . $dashboardName],
            ['Report Period: ' . $startDate->format('M d, Y') . ' to ' . $endDate->format('M d, Y')],
            ['Generated: ' . Carbon::now()->format('M d, Y g:i A')],
            [''],
            ['=== SUMMARY ==='],
            ['Metric', 'Value'],
            ['Serial Issues received from GSPS', $inspectionIssuesWithSub->count()],
            ['Inspected (Passed)', $inspected->count()],
            ['Returned (Damaged)', $returned->count()],
            ['Pending Inspection', $pending->count()],
            ['Inspection Success Rate', $successRate . '%'],
            [''],
            ['=== SERIAL ISSUES DETAIL ==='],
            self::SERIAL_ISSUE_HEADER,
        ];

        foreach ($this->issueRowsFrom($inspectionIssuesWithSub, $startDate, $endDate) as $row) {
            $data[] = $row;
        }

        return $this->generateCsvResponse($data, 'Inspection_Dashboard_Report');
    }

    // =====================================================================
    // SUPPLIER — summary matches the 5 KPI cards exactly: Serial Issues For
    // Preparing, Serial Issues For Delivery, Serial Issues Delivered to
    // GSPS, Serial Issues For Returned, Success Rate. "Awarded Serials
    // Issues" and "Delivered Issues" (was "Completed Issues") cards removed
    // from the live dashboard's summary line — Delivered Issues still shown
    // via Success Rate's own base, so kept out of the top summary to match
    // exactly what's on screen. Scoped to the logged-in supplier's own
    // subscriptions.
    // =====================================================================
    public function supplierExport(Request $request)
    {
        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : Carbon::now()->startOfYear();
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : Carbon::now()->endOfDay();
        $dashboardName = $request->input('dashboard_name', 'Supplier Dashboard');

        $user = Auth::user();
        $account = $user ? SupplierAccount::where('user_id', $user->_id ?? $user->id)->orWhere('email', $user->email)->first() : null;
        $supplierId = $account ? (string) ($account->_id ?? $account->id) : null;

        $subscriptionQuery = Subscription::query()->when($supplierId, fn ($q) => $q->where('supplier_id', $supplierId));
        $serialTitle = $request->input('serial_title') ?: null;
        if ($serialTitle) {
            $subscriptionQuery->where('serial_title', $serialTitle);
        }
        $subscriptions = $subscriptionQuery->get();

        $issuesWithSub = collect();
        foreach ($subscriptions as $subscription) {
            $issues = SerialIssue::where('subscription_id', (string) ($subscription->_id ?? $subscription->id))
                ->whereNull('archived_at')
                ->get();
            $issuesWithSub = $issuesWithSub->merge($issues->map(fn ($issue) => ['subscription' => $subscription, 'issue' => $issue]));
        }

        $preparing = $issuesWithSub->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_PREPARE)->count();
        $forDelivery = $issuesWithSub->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_DELIVERY)->count();
        $delivered = $issuesWithSub->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED], true))->count();
        $deliveredOnly = $issuesWithSub->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_DELIVERED)->count();
        $returned = $issuesWithSub->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_RETURN)->count();
        $successBase = $deliveredOnly + $returned;
        $successRate = $successBase ? round(($deliveredOnly / $successBase) * 100) : 0;

        $data = [
            ['Dashboard Report: ' . $dashboardName],
            ['Report Period: ' . $startDate->format('M d, Y') . ' to ' . $endDate->format('M d, Y')],
            ['Generated: ' . Carbon::now()->format('M d, Y g:i A')],
            [''],
            ['=== SUMMARY ==='],
            ['Metric', 'Value'],
            ['Serial Issues For Preparing', $preparing],
            ['Serial Issues For Delivery', $forDelivery],
            ['Serial Issues Delivered to GSPS', $delivered],
            ['Delivered Issues', $deliveredOnly],
            ['Serial Issues For Returned', $returned],
            ['Success Rate', $successRate . '%'],
            [''],
            ['=== SERIAL ISSUES DETAIL ==='],
            self::SERIAL_ISSUE_HEADER,
        ];

        foreach ($this->issueRowsFrom($issuesWithSub, $startDate, $endDate) as $row) {
            $data[] = $row;
        }

        return $this->generateXlsxResponse($data, 'Supplier_Dashboard_Report');
    }

    private function generateCsvResponse(array $data, string $filename): StreamedResponse
    {
        $filename = $filename . '_' . Carbon::now()->format('Y-m-d_His') . '.xlsx';

        return response()->streamDownload(function () use ($data) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));
            foreach ($data as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Generate a standard Excel XLSX response.
     */
    private function generateXlsxResponse(array $data, string $filename): StreamedResponse
    {
        $filename = $filename . '_' . Carbon::now()->format('Y-m-d_His') . '.xlsx';

        return response()->streamDownload(function () use ($data) {
            $spreadsheet = new Spreadsheet();
            $worksheet = $spreadsheet->getActiveSheet();

            foreach ($data as $rowIndex => $row) {
                foreach ($row as $columnIndex => $value) {
                    $cellCoordinate = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex + 1) . ($rowIndex + 1);
                    $worksheet->setCellValue($cellCoordinate, $value);
                }
            }

            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
            $spreadsheet->disconnectWorksheets();
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}