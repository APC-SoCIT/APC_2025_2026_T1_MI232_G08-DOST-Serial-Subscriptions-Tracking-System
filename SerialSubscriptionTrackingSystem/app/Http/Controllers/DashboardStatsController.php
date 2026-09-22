<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SupplierAccount;
use App\Models\User;
use App\Models\SerialIssue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DashboardStatsController extends Controller
{
    /** Subscription statuses that count as "in the delivery pipeline" for TPU/GSPS/Inspection tracking. */
    private const QUALIFYING_STATUSES = ['Active', 'accepted', 'Delivered', 'delivered'];

    private function getMonthsBetween($startDate, $endDate)
    {
        $months = [];
        $current = Carbon::parse($startDate)->startOfMonth();
        $end = Carbon::parse($endDate)->endOfMonth();

        while ($current <= $end) {
            $months[] = [
                'name' => $current->format('F'),
                'year' => $current->year,
                'start' => $current->copy()->startOfMonth(),
                'end' => $current->copy()->endOfMonth(),
            ];
            $current->addMonth();
        }

        return $months;
    }

    private function monthlyData($rows, Carbon $startDate, Carbon $endDate, callable $dateGetter, callable $mapper): array
    {
        $months = $this->getMonthsBetween($startDate, $endDate);
        return array_map(function ($month) use ($rows, $mapper, $dateGetter) {
            $bucketRows = $rows->filter(function ($row) use ($month, $dateGetter) {
                $raw = $dateGetter($row);
                if (!$raw) return false;
                try {
                    $date = Carbon::parse($raw);
                } catch (\Exception $e) {
                    return false;
                }
                return $date >= $month['start'] && $date <= $month['end'];
            });
            return array_merge(['month' => $month['name']], $mapper($bucketRows));
        }, $months);
    }

    /**
     * Serial Titles with active records — replicates SubscriptionController::index()
     * EXACTLY, including its mutate-then-check sequence: it reassigns
     * $subscription->serials to only the active serials BEFORE calling
     * hasActiveRecords(), which changes which branch that method takes for
     * subscriptions whose original serials were all archived. Doing this any
     * other way (e.g. calling hasActiveRecords() on the untouched object)
     * produces a different count.
     */
    private function totalSerialTitles($subscriptions): int
    {
        return $subscriptions->filter(function ($subscription) {
            $subscription->serials = $subscription->activeSerials();
            return $subscription->hasActiveRecords();
        })->count();
    }

    /**
     * Supplier names eligible for dashboard filtering: approved AND not disabled.
     * Joins SupplierAccount to its linked User (by user_id, falling back to
     * matching email) to check the disabled flag, since status and disabled
     * are tracked independently.
     */
    private function eligibleSupplierNames()
    {
        $approvedAccounts = SupplierAccount::where('status', 'approved')->get();

        // Build a lookup of every user by both id and email, so we can confirm
        // a real, resolvable link exists rather than assuming "not found" means
        // "not disabled". A supplier account with no matching user at all is
        // treated as ineligible, since its disabled status can't be verified.
        $usersById = User::all()->keyBy(fn ($u) => (string) $u->_id);
        $usersByEmail = User::all()->keyBy(fn ($u) => strtolower($u->email ?? ''));

        return $approvedAccounts->filter(function ($account) use ($usersById, $usersByEmail) {
            $userId = (string) ($account->user_id ?? '');
            $email = strtolower($account->email ?? '');

            $matchedUser = null;
            if ($userId && $usersById->has($userId)) {
                $matchedUser = $usersById->get($userId);
            } elseif ($email && $usersByEmail->has($email)) {
                $matchedUser = $usersByEmail->get($email);
            }

            if (!$matchedUser) {
                // No resolvable linked user — exclude rather than assume eligible.
                return false;
            }

            return !($matchedUser->is_disabled ?? false);
        })->pluck('company_name')->filter()->unique()->values();
    }

    /**
     * Filter options for dashboard Supplier/Serial Title dropdowns.
     */
    public function filterOptions(Request $request)
    {
        $suppliers = $this->eligibleSupplierNames();

        $user = Auth::user();
        $serialTitleQuery = Subscription::query();

        if ($user && strtolower($user->role ?? '') === 'supplier') {
            // Supplier role: scope strictly to their own subscriptions, the same
            // way SubscriptionController::getSupplierSerials() does, so the
            // dropdown matches exactly what List of Serials shows them.
            $supplierAccount = SupplierAccount::where('user_id', $user->_id ?? $user->id)
                ->orWhere('email', $user->email)
                ->first();

            if ($supplierAccount) {
                $supplierAccountId = (string) ($supplierAccount->_id ?? $supplierAccount->id);
                $serialTitleQuery->where('supplier_id', $supplierAccountId);
            } else {
                // No linked account — return nothing rather than leaking other suppliers' titles.
                $serialTitleQuery->whereRaw(['_id' => null]);
            }
        } else {
            // Other roles: scope by the selected Supplier filter, if any.
            $supplierName = $request->input('supplier_name') ?: null;
            if ($supplierName) {
                $serialTitleQuery->where('supplier_name', $supplierName);
            }
        }

        $serialTitles = $serialTitleQuery->get()
            ->filter(function ($subscription) {
                $subscription->serials = $subscription->activeSerials();
                return $subscription->hasActiveRecords();
            })
            ->pluck('serial_title')
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return response()->json([
            'success' => true,
            'suppliers' => $suppliers,
            'serial_titles' => $serialTitles,
        ]);
    }

    /**
     * Supplier reliability ranking: for each supplier with at least one
     * SerialIssue that reached Delivered or For Return, reliability % =
     * Delivered / (Delivered + For Return) * 100. Suppliers with issues
     * still pending (no Delivered/For Return yet) are excluded — there's
     * nothing to rank yet. Sorted highest reliability first, top 6 returned.
     */
    private function supplierReliabilityRanking(): array
    {
        [$bySubscription, $allIssues] = $this->qualifyingSubscriptionIssues();

        $bySupplier = [];
        foreach ($bySubscription as $entry) {
            $supplierName = $entry['subscription']->supplier_name;
            if (!$supplierName) {
                continue;
            }
            if (!isset($bySupplier[$supplierName])) {
                $bySupplier[$supplierName] = ['delivered' => 0, 'for_return' => 0];
            }
            foreach ($entry['issues'] as $issue) {
                if ($issue->status === SerialIssue::STATUS_DELIVERED) {
                    $bySupplier[$supplierName]['delivered']++;
                } elseif ($issue->status === SerialIssue::STATUS_FOR_RETURN) {
                    $bySupplier[$supplierName]['for_return']++;
                }
            }
        }

        $ranking = [];
        foreach ($bySupplier as $name => $counts) {
            $total = $counts['delivered'] + $counts['for_return'];
            if ($total === 0) {
                continue; // nothing delivered or returned yet — not rankable
            }
            $ranking[] = [
                'name' => $name,
                'value' => round(($counts['delivered'] / $total) * 100),
            ];
        }

        usort($ranking, fn ($a, $b) => $b['value'] <=> $a['value']);

        return array_slice($ranking, 0, 6);
    }

    /**
     * Subscriptions in the qualifying status list, each with its non-archived
     * SerialIssue records — exactly what getTPUDeliveryTracking() and
     * getGSPSDeliveryTracking() both operate on. Optionally scoped by
     * supplier name and/or serial title for dashboard filtering.
     */
    private function qualifyingSubscriptionIssues(?string $supplierName = null, ?string $serialTitle = null): array
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
            $allIssues = $allIssues->merge($issues->map(function ($issue) use ($subscription) {
                return [
                    'issue' => $issue,
                    'subscription_id' => (string) ($subscription->_id ?? $subscription->id),
                    'date' => $issue->received_at ?? $issue->inspected_at ?? $issue->for_delivery_at ?? $issue->created_at,
                ];
            }));
        }

        return [$bySubscription, $allIssues];
    }

    // =====================================================================
    // TPU
    // "Total Serials Encoded" = Subscription (Serial Title) count, matching
    // the Subscription Tracking feature exactly (34).
    // Every other card = SerialIssue counts, scoped to subscriptions in the
    // qualifying status list with non-archived issues — the same population
    // getTPUDeliveryTracking() (Monitor Delivery) uses.
    // =====================================================================
    public function tpuStats(Request $request)
    {
        return $this->liveTpuStats($request);
    }

    private function liveTpuStats(Request $request)
    {
        $start = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : Carbon::now()->startOfYear();
        $end = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : Carbon::now()->endOfDay();
        $supplierName = $request->input('supplier_name') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        $subscriptionQuery = Subscription::query();
        if ($supplierName) {
            $subscriptionQuery->where('supplier_name', $supplierName);
        }
        if ($serialTitle) {
            $subscriptionQuery->where('serial_title', $serialTitle);
        }
        $allSubscriptions = $subscriptionQuery->get();
        $totalSerialTitles = $this->totalSerialTitles($allSubscriptions);

        // Volumes/Issues totals (Item 7). Prefer the subscription-level
        // total_volumes field; fall back to the first serial's volumeNumber
        // for subscriptions created via the Subscription Tracking "Add Serial"
        // modal, which stores volume data per-serial instead — same fallback
        // Monitor Delivery already uses.
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

        [$bySubscription, $allIssues] = $this->qualifyingSubscriptionIssues($supplierName, $serialTitle);

        $reachedGspsRows = $allIssues->filter(fn ($r) => in_array($r['issue']->status, [
            SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN,
        ], true));
        // Awaiting Delivery = Pending, Preparing, For Delivery only.
        $awaitingRows = $allIssues->filter(fn ($r) => in_array($r['issue']->status, [
            SerialIssue::STATUS_PENDING, SerialIssue::STATUS_PREPARE, SerialIssue::STATUS_FOR_DELIVERY,
        ], true));
        $deliveredRows = $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_DELIVERED);
        $returnedRows = $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_RETURN);
        $successBase = $deliveredRows->count() + $returnedRows->count();

        $pipeline = [
            ['name' => 'Awarded', 'value' => $allIssues->count()],
            ['name' => 'Preparing', 'value' => $allIssues->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_PENDING, SerialIssue::STATUS_PREPARE], true))->count()],
            ['name' => 'For Delivery', 'value' => $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_DELIVERY)->count()],
            ['name' => 'Returned', 'value' => $returnedRows->count()],
            ['name' => 'Delivered', 'value' => $deliveredRows->count()],
        ];

        $dateRows = $allIssues->filter(fn ($r) => !$r['date'] || (Carbon::parse($r['date']) >= $start && Carbon::parse($r['date']) <= $end));
        $monthly = $this->monthlyData($dateRows, $start, $end, fn ($r) => $r['date'], function ($rows) {
            return [
                'awarded' => $rows->count(),
                'delivered' => $rows->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN], true))->count(),
                'forDelivery' => $rows->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_DELIVERY)->count(),
                'inspected' => $rows->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_DELIVERED)->count(),
                'returned' => $rows->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_RETURN)->count(),
            ];
        });

        return response()->json(['success' => true, 'stats' => [
            'total_serials' => $totalSerialTitles,
            'awarded' => $allIssues->count(),
            'delivered' => $reachedGspsRows->count(),
            'for_delivery' => $awaitingRows->count(),
            'inspected' => $deliveredRows->count(),
            'returned' => $returnedRows->count(),
            'pending' => $awaitingRows->count(),
            'prepare' => $allIssues->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_PENDING, SerialIssue::STATUS_PREPARE], true))->count(),
            'efficiency' => $successBase ? round(($deliveredRows->count() / $successBase) * 100) : 0,
            'total_subscriptions' => $totalSerialTitles,
            'active_subscriptions' => $allSubscriptions->where('status', 'Active')->count(),
            'total_award_cost' => $allIssues->sum(fn ($r) => (float) ($r['issue']->cost ?? 0)),
            'total_delivered_cost' => $deliveredRows->sum(fn ($r) => (float) ($r['issue']->cost ?? 0)),
            'total_volumes' => $totalVolumes,
            'total_issues_count' => $totalIssuesCount,
        ], 'charts' => ['monthly' => $monthly, 'pipeline' => $pipeline, 'supplierRanking' => $this->supplierReliabilityRanking()]]);
    }

    // =====================================================================
    // GSPS
    // "Received Serials" / "Total Subscriptions" = subscription (title) count.
    // "Forwarded to Inspection" = issues with Received, Delivered OR For Return.
    // "Success Rate" = (Received+Delivered) / (Received+Delivered+For Return).
    // =====================================================================
    public function gspsStats(Request $request)
    {
        return $this->liveGspsStats($request);
    }

    private function liveGspsStats(Request $request)
    {
        $start = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : Carbon::now()->startOfYear();
        $end = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : Carbon::now()->endOfDay();
        $supplierName = $request->input('supplier_name') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        [$bySubscription, $allIssues] = $this->qualifyingSubscriptionIssues($supplierName, $serialTitle);
        $subsWithIssues = count($bySubscription);

        $forwardedTier = $allIssues->filter(fn ($r) => in_array($r['issue']->status, [
            SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN,
        ], true));
        $returned = $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_RETURN);
        $successNumerator = $forwardedTier->count() - $returned->count();
        $pending = $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_DELIVERY);

        $dateRows = $allIssues->filter(fn ($r) => !$r['date'] || (Carbon::parse($r['date']) >= $start && Carbon::parse($r['date']) <= $end));
        $monthly = $this->monthlyData($dateRows, $start, $end, fn ($r) => $r['date'], fn ($rows) => [
            'received' => $rows->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN], true))->count(),
            'pending' => $rows->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_DELIVERY)->count(),
            'forwarded' => $rows->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN], true))->count(),
            'returned' => $rows->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_RETURN)->count(),
        ]);

        return response()->json(['success' => true, 'stats' => [
            'received' => $subsWithIssues,
            'total_subscriptions' => $subsWithIssues,
            'forwarded' => $forwardedTier->count(),
            'pending' => $pending->count(),
            'returned' => $returned->count(),
            'success_rate' => $forwardedTier->count() ? round(($successNumerator / $forwardedTier->count()) * 100) : 0,
        ], 'charts' => ['monthly' => $monthly, 'pipeline' => [
            ['name' => 'Pending', 'value' => $pending->count()],
            ['name' => 'Received', 'value' => $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_RECEIVED)->count()],
            ['name' => 'Forwarded', 'value' => $forwardedTier->count()],
            ['name' => 'Returned', 'value' => $returned->count()],
        ]]]);
    }

    // =====================================================================
    // Inspection
    // Mirrors getInspectionTracking() exactly — including that it does NOT
    // exclude archived issues, unlike the TPU/GSPS queries above. Subscriptions
    // are further restricted to ones with at least one issue that reached
    // Received/Delivered/For Return.
    // =====================================================================
    public function inspectionStats(Request $request)
    {
        return $this->liveInspectionStats($request);
    }

        private function liveInspectionStats(Request $request)
    {
        $start = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : Carbon::now()->startOfYear();
        $end = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : Carbon::now()->endOfDay();
        $supplierName = $request->input('supplier_name') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        $subscriptionQuery = Subscription::whereIn('status', self::QUALIFYING_STATUSES);
        if ($supplierName) {
            $subscriptionQuery->where('supplier_name', $supplierName);
        }
        if ($serialTitle) {
            $subscriptionQuery->where('serial_title', $serialTitle);
        }
        $subscriptions = $subscriptionQuery->get();
        $receivedTier = [SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN];

        $qualifyingSubs = 0;
        $inspectionIssues = collect();
        $totalVolumes = 0;
        $totalIssuesCount = 0;
        foreach ($subscriptions as $subscription) {
            $issues = SerialIssue::where('subscription_id', (string) ($subscription->_id ?? $subscription->id))
                ->whereNull('archived_at')
                ->get();
            $tierIssues = $issues->whereIn('status', $receivedTier);
            if ($tierIssues->count() === 0) {
                continue;
            }
             $qualifyingSubs++;
            $serials = $subscription->serials ?? [];
            $firstSerial = !empty($serials) ? $serials[0] : [];
            $volumes = $subscription->total_volumes ?? ($firstSerial['volumeNumber'] ?? null);
            if (!empty($volumes)) {
                $totalVolumes += (int) $volumes;
                $totalIssuesCount += (int) ($subscription->total_issues ?? 0);
            }
            $inspectionIssues = $inspectionIssues->merge($tierIssues->map(function ($issue) {
                return [
                    'issue' => $issue,
                    'date' => $issue->inspected_at ?? $issue->received_at ?? $issue->created_at,
                ];
            }));
        }

        $inspected = $inspectionIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_DELIVERED);
        $returned = $inspectionIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_RETURN);
        $pending = $inspectionIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_RECEIVED);
        $successBase = $inspected->count() + $returned->count();

        $dateRows = $inspectionIssues->filter(fn ($r) => !$r['date'] || (Carbon::parse($r['date']) >= $start && Carbon::parse($r['date']) <= $end));
        $monthly = $this->monthlyData($dateRows, $start, $end, fn ($r) => $r['date'], fn ($rows) => [
            'received' => $rows->count(),
            'inspected' => $rows->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_DELIVERED)->count(),
            'pending' => $rows->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_RECEIVED)->count(),
            'returned' => $rows->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_RETURN)->count(),
        ]);

        return response()->json(['success' => true, 'stats' => [
            'received' => $qualifyingSubs,
            'total_subscriptions' => $qualifyingSubs,
            'inspected' => $inspected->count(),
            'pending' => $pending->count(),
            'returned' => $returned->count(),
            'success_rate' => $successBase ? round(($inspected->count() / $successBase) * 100) : 0,
            'total_volumes' => $totalVolumes,
            'total_issues_count' => $totalIssuesCount,
        ], 'charts' => ['monthly' => $monthly, 'pipeline' => [
            ['name' => 'Received', 'value' => $inspectionIssues->count()],
            ['name' => 'Pending', 'value' => $pending->count()],
            ['name' => 'Inspected', 'value' => $inspected->count()],
            ['name' => 'Returned', 'value' => $returned->count()],
        ]]]);
    }

    // =====================================================================
    // Supplier — scoped by the logged-in supplier's account.
    // =====================================================================
    public function supplierStats(Request $request)
    {
        return $this->liveSupplierStats($request);
    }

    private function liveSupplierStats(Request $request)
    {
        $user = Auth::user();
        $account = $user ? SupplierAccount::where('user_id', $user->_id ?? $user->id)->orWhere('email', $user->email)->first() : null;
        $supplierId = $account ? (string) ($account->_id ?? $account->id) : null;

        $serialTitle = $request->input('serial_title') ?: null;

        $subscriptions = Subscription::query()
            ->when($supplierId, fn ($q) => $q->where('supplier_id', $supplierId))
            ->when($serialTitle, fn ($q) => $q->where('serial_title', $serialTitle))
            ->get();
        $subscriptionIds = $subscriptions->map(fn ($s) => (string) ($s->_id ?? $s->id))->all();

        $issues = SerialIssue::whereIn('subscription_id', $subscriptionIds)
            ->whereNull('archived_at')
            ->get()
            ->map(fn ($issue) => [
                'issue' => $issue,
                'date' => $issue->received_at ?? $issue->for_delivery_at ?? $issue->created_at,
            ]);

        $start = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : Carbon::now()->startOfYear();
        $end = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : Carbon::now()->endOfDay();

        $counts = [
            'awarded' => $issues->count(),
            'preparing' => $issues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_PREPARE)->count(),
            'for_delivery' => $issues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_DELIVERY)->count(),
            'delivered' => $issues->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED], true))->count(),
            'delivered_only' => $issues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_DELIVERED)->count(),
            'returned' => $issues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_RETURN)->count(),
        ];
        $successBase = $counts['delivered_only'] + $counts['returned'];

        $dateRows = $issues->filter(fn ($r) => !$r['date'] || (Carbon::parse($r['date']) >= $start && Carbon::parse($r['date']) <= $end));
        $monthly = $this->monthlyData($dateRows, $start, $end, fn ($r) => $r['date'], fn ($rows) => [
            'awarded' => $rows->count(),
            'preparing' => $rows->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_PREPARE)->count(),
            'forDelivery' => $rows->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_DELIVERY)->count(),
            'delivered' => $rows->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED], true))->count(),
            'returned' => $rows->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_RETURN)->count(),
        ]);

        return response()->json(['success' => true, 'stats' => [
            'awarded' => $counts['awarded'],
            'preparing' => $counts['preparing'],
            'for_delivery' => $counts['for_delivery'],
            'delivered' => $counts['delivered'],
            'returned' => $counts['returned'],
            'success_rate' => $successBase ? round(($counts['delivered_only'] / $successBase) * 100) : 0,
            'total_subscriptions' => $subscriptions->count(),
            'total_award_cost' => $issues->sum(fn ($r) => (float) ($r['issue']->cost ?? 0)),
        ], 'charts' => ['monthly' => $monthly]]);
    }
}