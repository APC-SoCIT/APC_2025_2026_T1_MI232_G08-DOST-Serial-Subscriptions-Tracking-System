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
        'supplier_id',
        'supplier_name',
        'delivered_on_schedule',
        'completeness_of_delivery',
        'compliance_technical_specs',
        'quality_of_goods',
        'packaging_handling_condition',
        'responsiveness',
        'after_sales_support',
        'compliance_contract_terms',
        'summary_rating',
        'comments',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'delivered_on_schedule' => 'integer',
            'completeness_of_delivery' => 'integer',
            'compliance_technical_specs' => 'integer',
            'quality_of_goods' => 'integer',
            'packaging_handling_condition' => 'integer',
            'responsiveness' => 'integer',
            'after_sales_support' => 'integer',
            'compliance_contract_terms' => 'integer',
            'summary_rating' => 'float',
            'submitted_at' => 'datetime',
        ];
    }
}