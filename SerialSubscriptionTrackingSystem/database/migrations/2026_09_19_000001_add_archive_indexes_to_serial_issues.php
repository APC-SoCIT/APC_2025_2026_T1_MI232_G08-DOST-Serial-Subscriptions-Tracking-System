<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mongodb')->table('serial_issues', function (Blueprint $collection): void {
            $collection->index(['archived_at'], 'serial_issues_archived_at_index');
            $collection->index(['subscription_id', 'archived_at'], 'serial_issues_subscription_archived_at_index');
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->table('serial_issues', function (Blueprint $collection): void {
            $collection->dropIndexIfExists('serial_issues_archived_at_index');
            $collection->dropIndexIfExists('serial_issues_subscription_archived_at_index');
        });
    }
};
