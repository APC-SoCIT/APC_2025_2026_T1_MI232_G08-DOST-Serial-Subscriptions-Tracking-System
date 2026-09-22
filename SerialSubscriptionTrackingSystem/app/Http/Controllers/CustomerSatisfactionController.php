<?php

namespace App\Http\Controllers;

use App\Models\CustomerSatisfaction;
use App\Models\SupplierAccount;
use App\Models\Subscription;
use App\Models\SerialIssue;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CustomerSatisfactionController extends Controller
{
    public function page()
    {
        return Inertia::render('CustomerSatisfaction');
    }

    public function adminPage()
    {
        return Inertia::render('Admin_CustomerSatisfaction');
    }

    public function tpuReportPage()
    {
        return Inertia::render('TPU_CustomerSatisfactionReport');
    }

    public function eligible()
    {
        $user = Auth::user();
        $role = strtolower((string) $user->role);
        $supplierId = $this->supplierId($user, $role);
        $submitted = CustomerSatisfaction::where('user_id', (string) ($user->_id ?? $user->id))
            ->pluck('delivery_key')->all();
        $submitted = array_fill_keys(array_map('strval', $submitted), true);
        $deliveries = [];

        $subscriptionsQuery = Subscription::orderBy('created_at', 'desc');
        if ($role === 'supplier') {
            if (!$supplierId) {
                return response()->json(['success' => true, 'deliveries' => []]);
            }
            $subscriptionsQuery->where('supplier_id', $supplierId);
        }
        $subscriptions = $subscriptionsQuery->get()->keyBy(fn ($s) => (string) ($s->_id ?? $s->id));

        $issues = SerialIssue::whereIn('subscription_id', $subscriptions->keys()->all())
            ->whereNull('archived_at')
            ->whereIn('inspection_status', ['inspected', 'for_return'])
            ->orderBy('issue_number', 'asc')
            ->get();

        foreach ($issues as $issue) {
            $subscription = $subscriptions->get((string) $issue->subscription_id);
            if (!$subscription) {
                continue;
            }

            $key = $this->deliveryKey($subscription, $issue->issue_number - 1);
            if (isset($submitted[$key])) {
                continue;
            }

            $deliveries[] = $this->issueDeliveryPayload($subscription, $issue, $key);
        }

        return response()->json(['success' => true, 'deliveries' => $deliveries]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'subscription_id' => ['required', 'string'],
            'serial_index' => ['required', 'integer', 'min:0'],
            'ease_of_navigation' => ['required', 'integer', 'between:1,5'],
            'speed_and_reliability' => ['required', 'integer', 'between:1,5'],
            'record_accuracy' => ['required', 'integer', 'between:1,5'],
            'overall_satisfaction' => ['required', 'integer', 'between:1,5'],
            'user_name' => ['nullable', 'string', 'max:120'],
            'suggestions' => ['nullable', 'string', 'max:2000'],
        ]);

        $user = Auth::user();
        $role = strtolower((string) $user->role);
        $subscription = Subscription::find($validated['subscription_id']);
        $issueNumber = $validated['serial_index'] + 1;
        $issue = $subscription ? SerialIssue::where('subscription_id', (string) ($subscription->_id ?? $subscription->id))
            ->where('issue_number', $issueNumber)
            ->first() : null;

        $isCompleted = $issue
            && empty($issue->archived_at)
            && in_array($issue->inspection_status, ['inspected', 'for_return'], true);

        if (!$subscription || !$issue || !$this->canAccess($subscription, $user, $role) || !$isCompleted) {
           return response()->json(['success' => false, 'message' => 'This delivery is not eligible for feedback.'], 403);

        }

        $deliveryKey = $this->deliveryKey($subscription, $validated['serial_index']);
        $userId = (string) ($user->_id ?? $user->id);
        if (CustomerSatisfaction::where('user_id', $userId)->where('delivery_key', $deliveryKey)->exists()) {
            return response()->json(['success' => false, 'message' => 'Feedback has already been submitted for this delivery.'], 409);
        }

        // The summary rating is the arithmetic mean of the four independent
        // category ratings, rounded to one decimal place. The category values
        // remain separate because each measures a different aspect.
        $summaryRating = $this->summaryRating($validated);

        $feedback = CustomerSatisfaction::create([
            'user_id' => $userId,
            'user_name' => $validated['user_name'] ?? null,
            'user_email' => $user->email,
            'role' => $role,
            'subscription_id' => (string) ($subscription->_id ?? $subscription->id),
            'serial_index' => $validated['serial_index'],
            'delivery_key' => $deliveryKey,
            'delivery_title' => $subscription->serial_title ?? 'Delivery',
            'supplier_name' => $subscription->supplier_name,
            'delivery_status' => $issue->inspection_status,
            'ease_of_navigation' => $validated['ease_of_navigation'],
            'speed_and_reliability' => $validated['speed_and_reliability'],
            'record_accuracy' => $validated['record_accuracy'],
            'overall_satisfaction' => $validated['overall_satisfaction'],
            'summary_rating' => $summaryRating,
            'suggestions' => $validated['suggestions'] ?? null,
            'submitted_at' => now(),
        ]);

        UserNotification::createStatusNotification(
            'admin',
            'New customer satisfaction response',
            "A {$role} user submitted feedback for '{$feedback->delivery_title}'.",
            [
                'feedback_id' => (string) ($feedback->_id ?? $feedback->id),
                'subscription_id' => $feedback->subscription_id,
                'delivery_key' => $deliveryKey,
                'delivery_title' => $feedback->delivery_title,
                'role' => $role,
                'action_url' => '/admin/customer-satisfaction',
            ],
            $role
        );

        return response()->json(['success' => true, 'message' => 'Thank you. Your feedback was submitted successfully.']);
    }

    public function adminIndex(Request $request)
    {
        $responses = CustomerSatisfaction::orderBy('submitted_at', 'desc')->get();
        if ($request->filled('role') && $request->role !== 'all') {
            $responses = $responses->where('role', strtolower($request->role));
        }
        if ($request->filled('rating')) {
            $rating = (int) $request->rating;
            // A whole-star filter represents its one-star interval, so 3
            // includes summary ratings from 3.0 through 3.9, including 3.5.
            $responses = $responses->filter(function ($item) use ($rating) {
                $summary = $this->responseSummaryRating($item);
                return $summary >= $rating && ($rating === 5 ? $summary <= 5 : $summary < $rating + 1);
            });
        }
        if ($request->filled('from') || $request->filled('to')) {
            $from = $request->filled('from') ? now()->parse($request->from)->startOfDay() : null;
            $to = $request->filled('to') ? now()->parse($request->to)->endOfDay() : null;
            $responses = $responses->filter(function ($item) use ($from, $to) {
                $submittedAt = $item->submitted_at ? now()->parse($item->submitted_at) : null;
                return $submittedAt && (!$from || $submittedAt->greaterThanOrEqualTo($from)) && (!$to || $submittedAt->lessThanOrEqualTo($to));
            });
        }
        if ($request->filled('search')) {
            $term = strtolower($request->search);
            $responses = $responses->filter(fn ($item) => str_contains(strtolower((string) $item->delivery_title), $term)
                || str_contains(strtolower((string) $item->supplier_name), $term)
                || str_contains(strtolower((string) $item->user_name), $term)
                || str_contains(strtolower((string) $item->user_email), $term))->values();
        }

        return response()->json(['success' => true, 'responses' => $responses->map(function ($item) {
            $item->summary_rating = $this->responseSummaryRating($item);
            return $item;
        })->values()]);
    }

    public function report()
    {
        $responses = CustomerSatisfaction::orderBy('submitted_at', 'desc')->get();
        $ratingFields = ['ease_of_navigation', 'speed_and_reliability', 'record_accuracy', 'overall_satisfaction'];
        $averages = collect($ratingFields)->mapWithKeys(fn ($field) => [$field => round((float) $responses->avg($field), 2)])->all();
        $distribution = collect([1, 2, 3, 4, 5])->mapWithKeys(function ($rating) use ($responses) {
            $count = $responses->filter(function ($item) use ($rating) {
                $summary = $this->responseSummaryRating($item);
                return $summary >= $rating && ($rating === 5 ? $summary <= 5 : $summary < $rating + 1);
            })->count();
            return [(string) $rating => $count];
        })->all();
        $byRole = $responses->groupBy('role')->map->count()->all();
        $byDelivery = $responses->groupBy('delivery_title')->map->count()->sortDesc()->take(10)->all();

        return response()->json([
            'success' => true,
            'total_responses' => $responses->count(),
            'averages' => $averages,
            'average_summary_rating' => round((float) $responses->map(fn ($item) => $this->responseSummaryRating($item))->avg(), 1),
            'distribution' => $distribution,
            'by_role' => $byRole,
            'by_delivery' => $byDelivery,
            'suggestions' => $responses->filter(fn ($item) => filled($item->suggestions))->map(fn ($item) => [
                'suggestion' => $item->suggestions,
                'role' => $item->role,
                'delivery_title' => $item->delivery_title,
                'submitted_at' => $item->submitted_at,
            ])->values(),
        ]);
    }

    private function supplierId($user, string $role): ?string
    {
        if ($role !== 'supplier') return null;
        $account = SupplierAccount::where('user_id', $user->_id ?? $user->id)->orWhere('email', $user->email)->first();
        return $account ? (string) ($account->_id ?? $account->id) : null;
    }

    private function canAccess(Subscription $subscription, $user, string $role): bool
    {
        $supplierId = $this->supplierId($user, $role);
        return $role !== 'supplier' || ($supplierId && (string) $subscription->supplier_id === $supplierId);
    }

    private function deliveryKey(Subscription $subscription, int $index): string
    {
        return (string) ($subscription->_id ?? $subscription->id) . ':' . $index;
    }

    private function issueDeliveryPayload(Subscription $subscription, SerialIssue $issue, string $key): array
    {
        return [
            'delivery_key' => $key,
            'subscription_id' => (string) ($subscription->_id ?? $subscription->id),
            'serial_index' => $issue->issue_number - 1,
            'issue_number' => $issue->issue_number,
            'title' => $subscription->serial_title ?? 'Delivery',
            'supplier_name' => $subscription->supplier_name,
            'status' => $issue->inspection_status,
            'delivery_date' => $issue->received_at ?? $issue->expected_delivery_date,
        ];
    }

    private function summaryRating(array $ratings): float
    {
        return round((
            (int) $ratings['ease_of_navigation']
            + (int) $ratings['speed_and_reliability']
            + (int) $ratings['record_accuracy']
            + (int) $ratings['overall_satisfaction']
        ) / 4, 1);
    }

    private function responseSummaryRating(CustomerSatisfaction $response): float
    {
        if ($response->summary_rating !== null) {
            return round((float) $response->summary_rating, 1);
        }

        return $this->summaryRating([
            'ease_of_navigation' => $response->ease_of_navigation,
            'speed_and_reliability' => $response->speed_and_reliability,
            'record_accuracy' => $response->record_accuracy,
            'overall_satisfaction' => $response->overall_satisfaction,
        ]);
    }
}