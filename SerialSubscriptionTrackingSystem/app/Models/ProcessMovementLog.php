<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class ProcessMovementLog extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'process_movement_logs';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'record_type',      // subscription, serial, supplier_account, etc.
        'record_id',        // ID of the record being tracked
        'record_title',     // Human-readable title
        'from_user_id',
        'from_user_name',
        'from_role',
        'to_user_id',
        'to_user_name',
        'to_role',
        'status_from',      // Previous status
        'status_to',        // New status
        'action',           // submit, approve, reject, forward, receive, inspect, etc.
        'remarks',
        'metadata',         // Additional data
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Scope for a specific record
     */
    public function scopeForRecord($query, $recordType, $recordId)
    {
        return $query->where('record_type', $recordType)
                     ->where('record_id', $recordId);
    }

    /**
     * Scope for movements by a specific user
     */
    public function scopeFromUser($query, $userId)
    {
        return $query->where('from_user_id', $userId);
    }

    /**
     * Scope for movements to a specific user
     */
    public function scopeToUser($query, $userId)
    {
        return $query->where('to_user_id', $userId);
    }

    /**
     * Scope for movements by role
     */
    public function scopeByRole($query, $role)
    {
        return $query->where('from_role', $role)
                     ->orWhere('to_role', $role);
    }

    /**
     * Get the from user
     */
    public function fromUser()
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    /**
     * Get the to user
     */
    public function toUser()
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    /**
     * Get the workflow history for a specific record
     */
    public static function getWorkflowHistory($recordType, $recordId)
    {
        return self::forRecord($recordType, $recordId)
                   ->orderBy('created_at', 'asc')
                   ->get();
    }
}
