<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SupplierAccount;
use App\Models\User;
use App\Models\SerialIssue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
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
        $supplierName = $request->input('supplier_name') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        if ($supplierName) {
            $query->where('supplier_name', $supplierName);
        }
        if ($serialTitle) {
            $query->where('serial_title', $serialTitle);
        }

        return $query;
    }

    /**
     * EXACT copy of DashboardStatsController::totalSerialTitles() — must stay
     * identical, since TPU's "Total Serials Encoded" is a subscription count
     * built with this specific mutate-then-check sequence, not an issue count.
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
     * SerialIssue records. Returns [bySubscription, allIssues] where
     * bySubscription is used for subscription-level counts (e.g. GSPS/
     * Inspection "Received" cards) and allIssues for issue-level counts.
     */
    private function qualifyingSubscriptionIssues(?string $supplierName, ?string $serialTitle): array
    {
        $query = Subscription::whereIn('status', self::QUALIFYING_STATUSES);
        if ($supplierName) {
            $query->where('supplier_name', $supplierName);
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
    // Admin's dashboard). Total/Active Subscriptions only appear when a
    // Supplier or Serial Title filter is applied, exactly like the live
    // dashboard's extra KPI cards.
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
        $supplierName = $request->input('supplier_name') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        $totalUsers = User::where('role', '!=', 'admin')->count();
        $approvedUsers = User::where('role', '!=', 'admin')->whereNotNull('email_verified_at')->count();
        $pendingAccounts = SupplierAccount::where('status', 'pending')->count();
        $approvalBacklog = SupplierAccount::where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subDays(7))
            ->count();

        $approvedAccounts = SupplierAccount::where('status', 'approved')
            ->whereNotNull('approved_at')->whereNotNull('created_at')->get();
        $avgApprovalTime = 0;
        if ($approvedAccounts->isNotEmpty()) {
            $totalDays = $approvedAccounts->sum(fn ($a) => Carbon::parse($a->created_at)->diffInDays(Carbon::parse($a->approved_at)));
            $avgApprovalTime = round($totalDays / $approvedAccounts->count(), 1);
        }

        $activeSupplierIds = Subscription::distinct('supplier_id')->pluck('supplier_id')->toArray();
        $inactiveSuppliers = SupplierAccount::where('status', 'approved')->whereNotIn('_id', $activeSupplierIds)->count();

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
            ['Inactive Approved Suppliers', $inactiveSuppliers],
        ];

        if ($supplierName || $serialTitle) {
            $subscriptionQuery = $this->applyDashboardFilters(Subscription::query(), $request);
            $subscriptions = $subscriptionQuery->get()->filter(fn ($s) => $s->hasActiveRecords())->values();
            $activeCount = $this->countActiveSubscriptions($subscriptions);

            $data[] = [''];
            $data[] = ['=== FILTERED SUBSCRIPTION SUMMARY ==='];
            $data[] = ['Metric', 'Value'];
            $data[] = ['Total Subscriptions', $subscriptions->count()];
            $data[] = ['Active Subscriptions', $activeCount];

            [, $allIssues] = $this->qualifyingSubscriptionIssues($supplierName, $serialTitle);
            $issueRows = $this->issueRowsFrom($allIssues, $startDate, $endDate);

            $data[] = [''];
            $data[] = ['=== SERIAL ISSUES DETAIL ==='];
            $data[] = self::SERIAL_ISSUE_HEADER;
            foreach ($issueRows as $row) {
                $data[] = $row;
            }
        }

        return $this->generateCsvResponse($data, 'Admin_Dashboard_Report');
    }

    // =====================================================================
    // TPU — summary lines match the 7 KPI cards exactly: Total Serials
    // Encoded, Volumes/Issues, Delivered to GSPS, Awaiting delivery,
    // Returned, Inspected, Delivery Success Rate.
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
        $supplierName = $request->input('supplier_name') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        $subscriptionQuery = $this->applyDashboardFilters(Subscription::query(), $request);
        $allSubscriptions = $subscriptionQuery->get();
        $totalSerialTitles = $this->totalSerialTitles($allSubscriptions);

        $totalVolumes = 0;
        $totalIssuesCount = 0;
        foreach ($allSubscriptions as $subscription) {
            $serials = $subscription->serials ?? [];
            $firstSerial = !empty($serials) ? $serials[0] : [];
            $volumes = $subscription->total_volumes ?? ($firstSerial['volumeNumber'] ?? null);
            if (!empty($volumes)) {
                $totalVolumes += (int) $volumes;
                $totalIssuesCount += (int) ($subscription->total_issues ?? 0);
            }
        }

        [, $allIssues] = $this->qualifyingSubscriptionIssues($supplierName, $serialTitle);

        $delivered = $allIssues->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN], true))->count();
        $awaiting = $allIssues->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_PENDING, SerialIssue::STATUS_PREPARE, SerialIssue::STATUS_FOR_DELIVERY], true))->count();
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
            ['Total Serials Encoded', $totalSerialTitles],
            ['Volumes / Issues', "{$totalVolumes} Vols / {$totalIssuesCount} Issues"],
            ['Delivered to GSPS', $delivered],
            ['Awaiting delivery', $awaiting],
            ['Returned', $returned],
            ['Inspected', $inspected],
            ['Delivery Success Rate', $efficiency . '%'],
            [''],
            ['=== SERIAL ISSUES DETAIL ==='],
            self::SERIAL_ISSUE_HEADER,
        ];

        foreach ($this->issueRowsFrom($allIssues, $startDate, $endDate) as $row) {
            $data[] = $row;
        }

        return $this->generateCsvResponse($data, 'TPU_Dashboard_Report');
    }

    // =====================================================================
    // GSPS — summary matches the 5 KPI cards exactly: Received Serials,
    // Forwarded to Inspection, Pending Receipt Confirmation, Returned
    // Issues, Success Rate. "Received Serials" is a SUBSCRIPTION count
    // (subscriptions with at least one non-archived issue), matching the
    // live dashboard — not an issue count.
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
        $supplierName = $request->input('supplier_name') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        [$bySubscription, $allIssues] = $this->qualifyingSubscriptionIssues($supplierName, $serialTitle);
        $receivedSerials = count($bySubscription);

        $forwardedTier = $allIssues->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN], true));
        $returned = $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_RETURN);
        $pending = $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_DELIVERY);
        $successNumerator = $forwardedTier->count() - $returned->count();
        $successRate = $forwardedTier->count() ? round(($successNumerator / $forwardedTier->count()) * 100) : 0;

        $data = [
            ['Dashboard Report: ' . $dashboardName],
            ['Report Period: ' . $startDate->format('M d, Y') . ' to ' . $endDate->format('M d, Y')],
            ['Generated: ' . Carbon::now()->format('M d, Y g:i A')],
            [''],
            ['=== SUMMARY ==='],
            ['Metric', 'Value'],
            ['Received Serials', $receivedSerials],
            ['Forwarded to Inspection', $forwardedTier->count()],
            ['Pending Receipt Confirmation', $pending->count()],
            ['Returned Issues', $returned->count()],
            ['Success Rate', $successRate . '%'],
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

        return $this->generateCsvResponse($data, 'GSPS_Dashboard_Report');
    }

    // =====================================================================
    // INSPECTION — summary matches the 5 KPI cards exactly: Received from
    // GSPS, Inspected (Passed), Returned (Damaged), Pending Inspection,
    // Inspection Success Rate. "Received from GSPS" is a SUBSCRIPTION count
    // (qualifying subscriptions with at least one issue that reached
    // Received/Delivered/For Return), matching the live dashboard.
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
        $supplierName = $request->input('supplier_name') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        $subscriptionQuery = $this->applyDashboardFilters(Subscription::whereIn('status', self::QUALIFYING_STATUSES), $request);
        $subscriptions = $subscriptionQuery->get();
        $receivedTier = [SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN];

        $qualifyingSubs = 0;
        $inspectionIssuesWithSub = collect();
        foreach ($subscriptions as $subscription) {
            $issues = SerialIssue::where('subscription_id', (string) ($subscription->_id ?? $subscription->id))
                ->whereNull('archived_at')
                ->get();
            $tierIssues = $issues->whereIn('status', $receivedTier);
            if ($tierIssues->count() === 0) {
                continue;
            }
            $qualifyingSubs++;
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
            ['Received from GSPS', $qualifyingSubs],
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
    // SUPPLIER — summary matches all 6 KPI cards exactly: Awarded Serials
    // Issues, Preparing Delivery, For Delivery, Delivered to GSPS, Returned,
    // Success Rate. Scoped to the logged-in supplier's own subscriptions.
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
        $subscriptionIds = $subscriptions->map(fn ($s) => (string) ($s->_id ?? $s->id))->all();

        $issuesWithSub = collect();
        foreach ($subscriptions as $subscription) {
            $issues = SerialIssue::where('subscription_id', (string) ($subscription->_id ?? $subscription->id))
                ->whereNull('archived_at')
                ->get();
            $issuesWithSub = $issuesWithSub->merge($issues->map(fn ($issue) => ['subscription' => $subscription, 'issue' => $issue]));
        }

        $awarded = $issuesWithSub->count();
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
            ['Awarded Serials Issues', $awarded],
            ['Preparing Delivery', $preparing],
            ['For Delivery', $forDelivery],
            ['Delivered to GSPS', $delivered],
            ['Completed Issues', $deliveredOnly],
            ['Returned', $returned],
            ['Success Rate', $successRate . '%'],
            [''],
            ['=== SERIAL ISSUES DETAIL ==='],
            self::SERIAL_ISSUE_HEADER,
        ];

        foreach ($this->issueRowsFrom($issuesWithSub, $startDate, $endDate) as $row) {
            $data[] = $row;
        }

        return $this->generateCsvResponse($data, 'Supplier_Dashboard_Report');
    }

    private function generateCsvResponse(array $data, string $filename): StreamedResponse
    {
        $filename = $filename . '_' . Carbon::now()->format('Y-m-d_His') . '.csv';

        return response()->streamDownload(function () use ($data) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));
            foreach ($data as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}