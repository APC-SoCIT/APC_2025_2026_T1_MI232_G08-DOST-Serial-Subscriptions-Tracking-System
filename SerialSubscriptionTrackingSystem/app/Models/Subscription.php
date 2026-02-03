<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Subscription extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'subscriptions';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'serial_title',
        'supplier_id',
        'supplier_name',
        'period',
        'award_cost',
        'delivered_cost',
        'remaining_cost',
        'status', // 'Active', 'Inactive', 'Completed'
        'payment_status', // 'Fully Paid', 'Partially Paid', 'Overpaid', 'Unpaid'
        'progress',
        'note',
        'created_by', // TPU user ID who created
        'serials', // Array of serial items
        'transactions', // Array of payment transactions
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'award_cost' => 'float',
            'delivered_cost' => 'float',
            'remaining_cost' => 'float',
            'progress' => 'integer',
            'serials' => 'array',
            'transactions' => 'array',
        ];
    }

    /**
     * Scope for active subscriptions
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'Active');
    }

    /**
     * Scope for a specific period
     */
    public function scopeForPeriod($query, $period)
    {
        return $query->where('period', 'like', "%{$period}%");
    }

    /**
     * Get the supplier account associated with this subscription
     */
    public function supplier()
    {
        return $this->belongsTo(SupplierAccount::class, 'supplier_id');
    }

    /**
     * Calculate payment status based on costs
     */
    public function calculatePaymentStatus()
    {
        if ($this->delivered_cost >= $this->award_cost && $this->remaining_cost == 0) {
            return 'Fully Paid';
        } elseif ($this->delivered_cost > $this->award_cost) {
            return 'Overpaid';
        } elseif ($this->delivered_cost > 0) {
            return 'Partially Paid';
        }
        return 'Unpaid';
    }

    /**
     * Calculate progress percentage
     */
    public function calculateProgress()
    {
        if ($this->award_cost == 0) return 0;
        return min(100, round(($this->delivered_cost / $this->award_cost) * 100));
    }
}
