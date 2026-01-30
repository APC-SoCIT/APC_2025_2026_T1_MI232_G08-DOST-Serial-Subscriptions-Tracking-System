<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Chat extends Model
{
    protected $connection = 'mongodb';

    protected $fillable = [
        'user_id_1',
        'user_id_2',
        'user_1_name',
        'user_1_role',
        'user_2_name',
        'user_2_role',
        'last_message_at',
        'type',
        'name',
        'participants',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'participants' => 'array',
    ];

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    public function user1(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id_1');
    }

    public function user2(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id_2');
    }

    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }
}
