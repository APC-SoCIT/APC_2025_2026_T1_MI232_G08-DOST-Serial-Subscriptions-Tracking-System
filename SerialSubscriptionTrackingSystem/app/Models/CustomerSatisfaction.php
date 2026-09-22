<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class CustomerSatisfaction extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'customer_satisfactions';

    protected $fillable = [
        'user_id',
        'user_name',
        'user_email',
        'role',
        'subscription_id',
        'serial_index',
        'delivery_key',
        'delivery_title',
        'supplier_name',
        'delivery_status',
        'ease_of_navigation',
        'speed_and_reliability',
        'record_accuracy',
        'overall_satisfaction',
        'summary_rating',
        'suggestions',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'serial_index' => 'integer',
            'ease_of_navigation' => 'integer',
            'speed_and_reliability' => 'integer',
            'record_accuracy' => 'integer',
            'overall_satisfaction' => 'integer',
            'summary_rating' => 'float',
            'submitted_at' => 'datetime',
        ];
    }
}