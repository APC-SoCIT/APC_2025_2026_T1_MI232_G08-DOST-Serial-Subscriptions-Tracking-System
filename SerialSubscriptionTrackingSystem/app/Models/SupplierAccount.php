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
