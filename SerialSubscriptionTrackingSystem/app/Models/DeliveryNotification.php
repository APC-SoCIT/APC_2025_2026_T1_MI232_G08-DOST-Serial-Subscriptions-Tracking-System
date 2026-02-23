<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class DeliveryNotification extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'delivery_notifications';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'subscription_id',
        'serial_index',
        'serial_title',
        'supplier_id',
        'supplier_name',
        'supplier_email',
        'delivery_date',
        'notification_type',    // 'initial_reminder' (3 days), 'daily_reminder'
        'days_until_delivery',
        'is_read',
        'is_email_sent',
        'sent_at',
        'read_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'delivery_date' => 'datetime',
            'sent_at' => 'datetime',
            'read_at' => 'datetime',
            'is_read' => 'boolean',
            'is_email_sent' => 'boolean',
            'days_until_delivery' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Scope for unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope for a specific supplier
     */
    public function scopeForSupplier($query, $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    /**
     * Scope for pending notifications
     */
    public function scopePending($query)
    {
        return $query->whereNull('sent_at');
    }

    /**
     * Mark as read
     */
    public function markAsRead()
    {
        $this->is_read = true;
        $this->read_at = now();
        $this->save();
        return $this;
    }

    /**
     * Mark as sent
     */
    public function markAsSent()
    {
        $this->sent_at = now();
        $this->save();
        return $this;
    }

    /**
     * Get the subscription
     */
    public function subscription()
    {
        return $this->belongsTo(Subscription::class, 'subscription_id');
    }

    /**
     * Check if notification was already sent today for this serial
     */
    public static function wasAlreadySentToday($subscriptionId, $serialIndex, $notificationType)
    {
        return self::where('subscription_id', $subscriptionId)
            ->where('serial_index', $serialIndex)
            ->where('notification_type', $notificationType)
            ->whereDate('sent_at', today())
            ->exists();
    }
}
