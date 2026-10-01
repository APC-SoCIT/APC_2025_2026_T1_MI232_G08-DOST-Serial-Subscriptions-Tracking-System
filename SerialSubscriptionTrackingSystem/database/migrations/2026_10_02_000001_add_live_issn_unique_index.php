<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mongodb')->table('subscriptions', function ($collection): void {
            $collection->index(
                ['issn'],
                'subscriptions_live_issn_unique',
                null,
                [
                        'name' => 'subscriptions_live_issn_unique',
                        'unique' => true,
                        'partialFilterExpression' => [
                            '$and' => [
                                ['issn' => ['$type' => 'string']],
                                [
                                    '$or' => [
                                        ['status' => 'pending'],
                                        ['status' => 'accepted'],
                                        ['status' => 'Active'],
                                        ['status' => 'Delivered'],
                                        ['status' => 'delivered'],
                                    ],
                                ],
                            ],
                        ],
                ]
            );
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->table('subscriptions', function ($collection): void {
            $collection->dropIndex('subscriptions_live_issn_unique');
        });
    }
};