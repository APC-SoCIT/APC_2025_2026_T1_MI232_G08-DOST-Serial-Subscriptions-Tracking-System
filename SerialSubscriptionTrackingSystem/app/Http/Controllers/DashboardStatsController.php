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
     * EXACTLY, including its mutate-then-check sequence.
     */
    private function totalSerialTitles($subscriptions): int
    {
        return $subscriptions->filter(function ($subscription) {
            $subscription->serials = $subscription->activeSerials();
            return $subscription->hasActiveRecords();
        })->count();
    }

    /**
     * Eligible supplier ACCOUNTS (not just names) for dashboard filtering:
     * approved AND not disabled. Two different supplier accounts that share
     * the same company_name are kept as SEPARATE entries — each is a real,
     * independent account — with id + label ("Company - Contact") so the
     * dropdown can distinguish them, matching the Add Serial form's pattern.
     */
    private function eligibleSuppliers()
    {
        $approvedAccounts = SupplierAccount::where('status', 'approved')->get();

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
                return false;
            }

            return !($matchedUser->is_disabled ?? false);
        })->map(function ($account) {
            $id = (string) ($account->_id ?? $account->id);
            $name = $account->company_name ?? '';
            $contact = $account->contact_person ?? '';
            return [
                'id' => $id,
                'name' => $name,
                'contact_person' => $contact,
                'label' => $contact ? "{$name} - {$contact}" : $name,
            ];
        })->filter(fn ($s) => $s['id'] && $s['name'])->values();
    }

    /**
     * Filter options for dashboard Supplier/Serial Title dropdowns.
     * Suppliers are returned as {id, name, contact_person, label} objects —
     * never collapsed to a bare name string — so two accounts sharing a
     * company name both appear as distinct, selectable options.
     */
    public function filterOptions(Request $request)
    {
        $suppliers = $this->eligibleSuppliers();

        $user = Auth::user();
        $serialTitleQuery = Subscription::query();

        if ($user && strtolower($user->role ?? '') === 'supplier') {
            $supplierAccount = SupplierAccount::where('user_id', $user->_id ?? $user->id)
                ->orWhere('email', $user->email)
                ->first();

            if ($supplierAccount) {
                $supplierAccountId = (string) ($supplierAccount->_id ?? $supplierAccount->id);
                $serialTitleQuery->where('supplier_id', $supplierAccountId);
            } else {
                $serialTitleQuery->whereRaw(['_id' => null]);
            }
        } else {
            // Scope by the selected Supplier ACCOUNT id — never by name, so
            // two accounts sharing a company name are never conflated.
            $supplierId = $request->input('supplier_id') ?: null;
            if ($supplierId) {
                $serialTitleQuery->where('supplier_id', $supplierId);
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
     * Supplier reliability ranking, grouped by supplier ACCOUNT id (not
     * name) so two accounts with the same company name rank separately.
     * Label is disambiguated with the contact person only when a name
     * collision is actually detected among the ranked suppliers.
     */
    private function supplierReliabilityRanking(): array
    {
        [$bySubscription, $allIssues] = $this->qualifyingSubscriptionIssues();

        $bySupplierId = [];
        foreach ($bySubscription as $entry) {
            $supplierId = (string) ($entry['subscription']->supplier_id ?? '');
            if (!$supplierId) {
                continue;
            }
            if (!isset($bySupplierId[$supplierId])) {
                $bySupplierId[$supplierId] = [
                    'label' => $entry['subscription']->supplier_name ?? 'Unknown',
                    'delivered' => 0,
                    'for_return' => 0,
                ];
            }
            foreach ($entry['issues'] as $issue) {
                if ($issue->status === SerialIssue::STATUS_DELIVERED) {
                    $bySupplierId[$supplierId]['delivered']++;
                } elseif ($issue->status === SerialIssue::STATUS_FOR_RETURN) {
                    $bySupplierId[$supplierId]['for_return']++;
                }
            }
        }

        // Detect name collisions among the suppliers that actually made the
        // ranking, and disambiguate only those with a contact person suffix.
        $nameCounts = [];
        foreach ($bySupplierId as $data) {
            $nameCounts[$data['label']] = ($nameCounts[$data['label']] ?? 0) + 1;
        }
        $hasCollision = collect($nameCounts)->contains(fn ($c) => $c > 1);
        if ($hasCollision) {
            $accountsById = SupplierAccount::whereIn('_id', array_keys($bySupplierId))
                ->get()
                ->keyBy(fn ($a) => (string) ($a->_id ?? $a->id));
            foreach ($bySupplierId as $id => &$data) {
                if (($nameCounts[$data['label']] ?? 0) > 1) {
                    $contact = $accountsById->get($id)->contact_person ?? null;
                    if ($contact) {
                        $data['label'] = "{$data['label']} - {$contact}";
                    }
                }
            }
            unset($data);
        }

        $ranking = [];
        foreach ($bySupplierId as $data) {
            $total = $data['delivered'] + $data['for_return'];
            if ($total === 0) {
                continue;
            }
            $ranking[] = [
                'name' => $data['label'],
                'value' => round(($data['delivered'] / $total) * 100),
            ];
        }

        usort($ranking, fn ($a, $b) => $b['value'] <=> $a['value']);

        return array_slice($ranking, 0, 6);
    }

    /**
     * Subscriptions in the qualifying status list, each with its non-archived
     * SerialIssue records. Scoped by supplier ACCOUNT id (not name) so two
     * accounts sharing a company name are never conflated together.
     */
    private function qualifyingSubscriptionIssues(?string $supplierId = null, ?string $serialTitle = null): array
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
    // =====================================================================
    public function tpuStats(Request $request)
    {
        return $this->liveTpuStats($request);
    }

    private function liveTpuStats(Request $request)
    {
        $start = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : Carbon::now()->startOfYear();
        $end = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : Carbon::now()->endOfDay();
        $supplierId = $request->input('supplier_id') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        $subscriptionQuery = Subscription::query();
        if ($supplierId) {
            $subscriptionQuery->where('supplier_id', $supplierId);
        }
        if ($serialTitle) {
            $subscriptionQuery->where('serial_title', $serialTitle);
        }
        $allSubscriptions = $subscriptionQuery->get();
        $totalSerialTitles = $this->totalSerialTitles($allSubscriptions);

        [$bySubscription, $allIssues] = $this->qualifyingSubscriptionIssues($supplierId, $serialTitle);

        $reachedGspsRows = $allIssues->filter(fn ($r) => in_array($r['issue']->status, [
            SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN,
        ], true));
        // "Serial Issue awaiting Delivery" — Pending and Preparing only.
        // "For Delivery" status is intentionally excluded here since it now
        // has its own separate metric (for_delivery_status below) and would
        // otherwise be double-counted across both cards.
        $awaitingRows = $allIssues->filter(fn ($r) => in_array($r['issue']->status, [
            SerialIssue::STATUS_PENDING, SerialIssue::STATUS_PREPARE,
        ], true));
        // Matches Monitor Delivery's own "For Delivery" status exactly — issues
        // whose status is literally for_delivery, not the broader "awaiting"
        // bucket above (which also includes Pending and Preparing).
        $forDeliveryStatusRows = $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_DELIVERY);
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
            'for_delivery_status' => $forDeliveryStatusRows->count(),
            'inspected' => $deliveredRows->count(),
            'returned' => $returnedRows->count(),
            'pending' => $awaitingRows->count(),
            'prepare' => $allIssues->filter(fn ($r) => in_array($r['issue']->status, [SerialIssue::STATUS_PENDING, SerialIssue::STATUS_PREPARE], true))->count(),
            'efficiency' => $successBase ? round(($deliveredRows->count() / $successBase) * 100) : 0,
            'total_subscriptions' => $totalSerialTitles,
            'active_subscriptions' => $allSubscriptions->where('status', 'Active')->count(),
            'total_award_cost' => $allIssues->sum(fn ($r) => (float) ($r['issue']->cost ?? 0)),
            'total_delivered_cost' => $deliveredRows->sum(fn ($r) => (float) ($r['issue']->cost ?? 0)),
        ], 'charts' => ['monthly' => $monthly, 'pipeline' => $pipeline, 'supplierRanking' => $this->supplierReliabilityRanking()]]);
    }

    // =====================================================================
    // GSPS
    // =====================================================================
    public function gspsStats(Request $request)
    {
        return $this->liveGspsStats($request);
    }

    private function liveGspsStats(Request $request)
    {
        $start = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : Carbon::now()->startOfYear();
        $end = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : Carbon::now()->endOfDay();
        $supplierId = $request->input('supplier_id') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        [$bySubscription, $allIssues] = $this->qualifyingSubscriptionIssues($supplierId, $serialTitle);
        $subsWithIssues = count($bySubscription);

        // Received Serial Issues — counts individual serial issues whose
        // status is exactly "received" in the Delivery Status flow, not the
        // broader "reached GSPS" tier below and not a subscription count.
        $receivedStatusRows = $allIssues->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_RECEIVED);

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
            'received' => $receivedStatusRows->count(),
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
    // =====================================================================
    public function inspectionStats(Request $request)
    {
        return $this->liveInspectionStats($request);
    }

    private function liveInspectionStats(Request $request)
    {
        $start = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : Carbon::now()->startOfYear();
        $end = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : Carbon::now()->endOfDay();
        $supplierId = $request->input('supplier_id') ?: null;
        $serialTitle = $request->input('serial_title') ?: null;

        $subscriptionQuery = Subscription::whereIn('status', self::QUALIFYING_STATUSES);
        if ($supplierId) {
            $subscriptionQuery->where('supplier_id', $supplierId);
        }
        if ($serialTitle) {
            $subscriptionQuery->where('serial_title', $serialTitle);
        }
        $subscriptions = $subscriptionQuery->get();
        $receivedTier = [SerialIssue::STATUS_RECEIVED, SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN];

        $qualifyingSubs = 0;
        $inspectionIssues = collect();
        foreach ($subscriptions as $subscription) {
            $issues = SerialIssue::where('subscription_id', (string) ($subscription->_id ?? $subscription->id))
                ->whereNull('archived_at')
                ->get();
            $tierIssues = $issues->whereIn('status', $receivedTier);
            if ($tierIssues->count() === 0) {
                continue;
            }
            $qualifyingSubs++;
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
            // "Serial Issues received from GSPS" — the FULL tier of issues
            // that have ever reached Inspection: received (awaiting
            // inspection), delivered (passed), and for_return (failed).
            // This intentionally does NOT shrink as issues get inspected —
            // an issue that moves from received to delivered/for_return is
            // still counted here, since it still "was received from GSPS".
            'received' => $inspectionIssues->count(),
            'total_subscriptions' => $qualifyingSubs,
            'inspected' => $inspected->count(),
            'pending' => $pending->count(),
            'returned' => $returned->count(),
            'success_rate' => $successBase ? round(($inspected->count() / $successBase) * 100) : 0,
        ], 'charts' => ['monthly' => $monthly, 'pipeline' => [
            ['name' => 'Received', 'value' => $inspectionIssues->count()],
            ['name' => 'Pending', 'value' => $pending->count()],
            ['name' => 'Inspected', 'value' => $inspected->count()],
            ['name' => 'Returned', 'value' => $returned->count()],
        ]]]);
    }

    // =====================================================================
    // Supplier — scoped by the logged-in supplier's account (no supplier
    // filter needed here — already scoped to self).
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
            'completed' => $rows->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_DELIVERED)->count(),
            'returned' => $rows->filter(fn ($r) => $r['issue']->status === SerialIssue::STATUS_FOR_RETURN)->count(),
        ]);

        return response()->json(['success' => true, 'stats' => [
            'awarded' => $counts['awarded'],
            'preparing' => $counts['preparing'],
            'for_delivery' => $counts['for_delivery'],
            'delivered' => $counts['delivered'],
            'completed' => $counts['delivered_only'],
            'returned' => $counts['returned'],
            'success_rate' => $successBase ? round(($counts['delivered_only'] / $successBase) * 100) : 0,
            'total_subscriptions' => $subscriptions->count(),
            'total_award_cost' => $issues->sum(fn ($r) => (float) ($r['issue']->cost ?? 0)),
        ], 'charts' => ['monthly' => $monthly]]);
    }
}