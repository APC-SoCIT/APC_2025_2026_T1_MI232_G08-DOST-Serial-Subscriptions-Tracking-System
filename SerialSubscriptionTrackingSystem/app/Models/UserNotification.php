<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class UserNotification extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'user_notifications';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'user_id',              // Target user ID
        'user_role',            // Target user role (tpu, supplier, gsps, inspection)
        'type',                 // Notification type (serial_status_change, inspection_complete, etc.)
        'title',                // Notification title
        'message',              // Notification message
        'data',                 // Additional data (serial_title, subscription_id, etc.)
        'is_read',
        'read_at',
        'created_by',           // User who triggered the notification
        'created_by_role',      // Role of user who triggered
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'is_read' => 'boolean',
            'data' => 'array',
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
     * Scope for a specific user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for a specific role
     */
    public function scopeForRole($query, $role)
    {
        return $query->where('user_role', $role);
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
     * Create a notification for serial status changes
     */
    public static function createStatusNotification(
        string $targetRole,
        string $title,
        string $message,
        array $data = [],
        ?string $createdByRole = null
    ): self {
        return self::create([
            'user_id' => null, // null means all users of this role
            'user_role' => $targetRole,
            'type' => 'serial_status_change',
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'is_read' => false,
            'created_by' => null,
            'created_by_role' => $createdByRole,
        ]);
    }

    /**
     * Create notifications for multiple roles
     */
    public static function notifyRoles(
        array $roles,
        string $title,
        string $message,
        array $data = [],
        ?string $createdByRole = null
    ): array {
        $notifications = [];
        foreach ($roles as $role) {
            $notifications[] = self::createStatusNotification(
                $role,
                $title,
                $message,
                $data,
                $createdByRole
            );
        }
        return $notifications;
    }
}
