<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Carbon\Carbon;

class SerialIssue extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'serial_issues';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'subscription_id',
        'issue_number',
        'expected_delivery_date',
        'status',              // pending, accepted, prepare, for_delivery, received, delivered, for_return
        'inspection_status',   // null, inspected, for_return
        'cost',
        'prepared_at',
        'for_delivery_at',
        'received_at',
        'inspected_at',
        'notes',
        // Attachment fields
        'attachment_url',
        'inspection_attachment',
        // Inspection details
        'inspector_name',
        'condition',
        'inspection_remarks',
        'inspection_checklist',
        'other_description',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'issue_number' => 'integer',
            'cost' => 'float',
            'expected_delivery_date' => 'datetime',
            'prepared_at' => 'datetime',
            'for_delivery_at' => 'datetime',
            'received_at' => 'datetime',
            'inspected_at' => 'datetime',
            'inspection_checklist' => 'array',
        ];
    }

    /**
     * Status constants for the serial issue lifecycle
     */
    const STATUS_PENDING = 'pending';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_PREPARE = 'prepare';
    const STATUS_FOR_DELIVERY = 'for_delivery';
    const STATUS_RECEIVED = 'received';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_FOR_RETURN = 'for_return';

    /**
     * Inspection status constants
     */
    const INSPECTION_INSPECTED = 'inspected';
    const INSPECTION_FOR_RETURN = 'for_return';

    /**
     * Get the subscription that owns this serial issue
     */
    public function subscription()
    {
        return $this->belongsTo(Subscription::class, 'subscription_id', '_id');
    }

    /**
     * Scope for pending issues
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope for delivered issues
     */
    public function scopeDelivered($query)
    {
        return $query->where('status', self::STATUS_DELIVERED);
    }

    /**
     * Scope for issues for a specific subscription
     */
    public function scopeForSubscription($query, $subscriptionId)
    {
        return $query->where('subscription_id', (string) $subscriptionId);
    }

    /**
     * Scope for issues that need inspection
     */
    public function scopeNeedsInspection($query)
    {
        return $query->where('status', self::STATUS_RECEIVED)
                     ->whereNull('inspection_status');
    }

    /**
     * Scope for issues that are due (expected delivery date is past)
     */
    public function scopeOverdue($query)
    {
        return $query->where('expected_delivery_date', '<', now())
                     ->whereNotIn('status', [self::STATUS_DELIVERED, self::STATUS_FOR_RETURN]);
    }

    /**
     * Scope for issues coming up in the next N days
     */
    public function scopeUpcoming($query, $days = 7)
    {
        return $query->where('expected_delivery_date', '>=', now())
                     ->where('expected_delivery_date', '<=', now()->addDays($days))
                     ->whereNotIn('status', [self::STATUS_DELIVERED, self::STATUS_FOR_RETURN]);
    }

    /**
     * Check if issue can be marked as delivered
     */
    public function canBeDelivered(): bool
    {
        return $this->status === self::STATUS_RECEIVED && 
               $this->inspection_status === self::INSPECTION_INSPECTED;
    }

    /**
     * Check if issue can be marked as for return
     */
    public function canBeReturned(): bool
    {
        return $this->status === self::STATUS_RECEIVED && 
               $this->inspection_status === self::INSPECTION_FOR_RETURN;
    }

    /**
     * Get human-readable status label
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_ACCEPTED => 'Accepted',
            self::STATUS_PREPARE => 'Preparing',
            self::STATUS_FOR_DELIVERY => 'For Delivery',
            self::STATUS_RECEIVED => 'Received',
            self::STATUS_DELIVERED => 'Delivered',
            self::STATUS_FOR_RETURN => 'For Return',
            default => ucfirst($this->status),
        };
    }

    /**
     * Get human-readable inspection status label
     */
    public function getInspectionStatusLabelAttribute(): string
    {
        if (!$this->inspection_status) {
            return 'Pending Inspection';
        }

        return match($this->inspection_status) {
            self::INSPECTION_INSPECTED => 'Inspected',
            self::INSPECTION_FOR_RETURN => 'For Return',
            default => ucfirst($this->inspection_status),
        };
    }

    /**
     * Generate serial issues for a subscription based on frequency
     *
     * @param Subscription $subscription
     * @param string $frequency - weekly, biweekly, monthly, quarterly, annually
     * @param int $totalIssues - total number of issues to generate
     * @param Carbon|string $startDate - when to start the subscription
     * @param float $totalCost - total subscription cost to distribute
     * @return array - array of created serial issues
     */
    public static function generateForSubscription(
        Subscription $subscription,
        string $frequency,
        int $totalIssues,
        $startDate,
        float $totalCost
    ): array {
        $startDate = $startDate instanceof Carbon ? $startDate : Carbon::parse($startDate);
        $costPerIssue = $totalIssues > 0 ? round($totalCost / $totalIssues, 2) : 0;
        
        $issues = [];
        
        for ($i = 1; $i <= $totalIssues; $i++) {
            $expectedDate = self::calculateExpectedDate($startDate, $frequency, $i);
            
            $issue = self::create([
                'subscription_id' => (string) ($subscription->_id ?? $subscription->id),
                'issue_number' => $i,
                'expected_delivery_date' => $expectedDate,
                'status' => self::STATUS_PENDING,
                'inspection_status' => null,
                'cost' => $costPerIssue,
                'received_at' => null,
                'inspected_at' => null,
                'notes' => null,
            ]);
            
            $issues[] = $issue;
        }
        
        return $issues;
    }

    /**
     * Calculate expected delivery date based on frequency
     *
     * @param Carbon $startDate
     * @param string $frequency
     * @param int $issueNumber
     * @return Carbon
     */
    private static function calculateExpectedDate(Carbon $startDate, string $frequency, int $issueNumber): Carbon
    {
        $frequency = strtolower($frequency);
        $offset = $issueNumber - 1; // First issue is at start date
        
        return match($frequency) {
            'weekly' => $startDate->copy()->addWeeks($offset),
            'biweekly' => $startDate->copy()->addWeeks($offset * 2),
            'monthly' => $startDate->copy()->addMonths($offset),
            'quarterly' => $startDate->copy()->addMonths($offset * 3),
            'annually', 'annual' => $startDate->copy()->addYears($offset),
            default => $startDate->copy()->addMonths($offset), // Default to monthly
        };
    }

    /**
     * Update subscription cost tracking when an issue is delivered or for_return
     * 
     * Note: "for_return" issues are STILL ONGOING - they need replacement
     * Only "delivered" issues count as truly complete
     */
    public function updateSubscriptionCosts(): void
    {
        $subscription = $this->subscription;
        
        if (!$subscription) {
            return;
        }

        // Get all delivered issues for this subscription
        $deliveredIssues = self::where('subscription_id', $this->subscription_id)
            ->where('status', self::STATUS_DELIVERED)
            ->get();

        // Get all for_return issues (these are STILL ONGOING - awaiting replacements)
        $returningIssueCount = self::where('subscription_id', $this->subscription_id)
            ->where('status', self::STATUS_FOR_RETURN)
            ->count();

        $deliveredCost = $deliveredIssues->sum('cost');
        $totalCost = $subscription->award_cost ?? 0;
        $remainingCost = max(0, $totalCost - $deliveredCost);

        $subscription->delivered_cost = $deliveredCost;
        $subscription->remaining_cost = $remainingCost;
        $subscription->progress = $totalCost > 0 ? min(100, round(($deliveredCost / $totalCost) * 100)) : 0;
        $subscription->payment_status = $this->calculatePaymentStatus($totalCost, $deliveredCost, $remainingCost);

        // Determine subscription status based on issue completion
        $totalIssues = self::where('subscription_id', $this->subscription_id)->count();
        $deliveredCount = $deliveredIssues->count();

        if ($deliveredCount >= $totalIssues && $totalIssues > 0) {
            // ALL issues successfully delivered - COMPLETE
            $subscription->status = 'Delivered';
        } elseif ($returningIssueCount > 0) {
            // Some issues are for_return (STILL ONGOING - awaiting replacements)
            $subscription->status = 'Active';
        } else {
            // Still processing other issues (pending, accepted, prepare, for_delivery, etc.)
            $subscription->status = 'Active';
        }

        $subscription->save();
    }

    /**
     * Calculate payment status
     */
    private function calculatePaymentStatus($awardCost, $deliveredCost, $remainingCost): string
    {
        if ($deliveredCost >= $awardCost && $remainingCost == 0) {
            return 'Fully Paid';
        } elseif ($deliveredCost > $awardCost) {
            return 'Overpaid';
        } elseif ($deliveredCost > 0) {
            return 'Partially Paid';
        }
        return 'Unpaid';
    }

    /**
     * Check if subscription is fully delivered (all issues delivered successfully)
     */
    public function isSubscriptionFullyDelivered(): bool
    {
        $totalIssues = self::where('subscription_id', $this->subscription_id)->count();
        $deliveredIssues = self::where('subscription_id', $this->subscription_id)
            ->where('status', self::STATUS_DELIVERED)
            ->count();
        
        return $deliveredIssues >= $totalIssues && $totalIssues > 0;
    }

    /**
     * Check if subscription has any issues awaiting replacement (for_return)
     * These issues are STILL ONGOING and subscription remains Active
     */
    public function hasIssuesAwaitingReplacement(): bool
    {
        return self::where('subscription_id', $this->subscription_id)
            ->where('status', self::STATUS_FOR_RETURN)
            ->exists();
    }

    /**
     * Check if subscription is still processing (not fully delivered)
     */
    public function isSubscriptionActive(): bool
    {
        $totalIssues = self::where('subscription_id', $this->subscription_id)->count();
        $deliveredIssues = self::where('subscription_id', $this->subscription_id)
            ->where('status', self::STATUS_DELIVERED)
            ->count();
        
        // Active if not all issues are delivered
        return $deliveredIssues < $totalIssues;
    }
}
