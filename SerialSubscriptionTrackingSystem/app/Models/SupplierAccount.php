<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class SupplierAccount extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'supplier_accounts';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'company_name',
        'contact_person',
        'email',
        'phone',
        'address',
        'username',
        'password',
        'status', // 'pending', 'approved', 'rejected'
        'created_by', // TPU user ID who created the account
        'approved_by', // Admin user ID who approved
        'approved_at',
        'rejected_at',
        'rejection_reason',
        'user_id', // The User ID after approval
        'is_active_supplier', // TPU's "Active Suppliers" list — controls visibility in Add Serial's supplier dropdown. Database-backed, shared across all browsers/devices/deployments (replaces the old localStorage-only version).
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<string>
     */
    protected $hidden = [
        'password',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'is_active_supplier' => 'boolean',
        ];
    }

    /**
     * Get the raw password for creating User account
     * Note: Password is stored encrypted but not using Laravel's hash cast
     * to allow transfer to User model which will hash it
     */
    public function getRawPassword(): ?string
    {
        return $this->attributes['password'] ?? null;
    }

    /**
     * Scope for pending accounts
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for approved accounts
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope for rejected accounts
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Scope for approved accounts that TPU has marked as "active" — i.e.
     * selectable in Add Serial's supplier dropdown. Since MongoDB documents
     * created before this field existed won't have it set at all, this
     * treats a genuinely missing field the same as false (not active) —
     * TPU must explicitly add a supplier to Active Suppliers, matching the
     * old localStorage behavior where nothing was active until added.
     */
    public function scopeActiveSupplier($query)
    {
        return $query->where('status', 'approved')->where('is_active_supplier', true);
    }

    /**
     * Get the TPU user who created this account
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the admin who approved this account
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the User account (after approval)
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}