<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Subscription;

$subscriptions = Subscription::all();
$statuses = [];

foreach ($subscriptions as $sub) {
    $serials = $sub->serials ?? [];
    foreach ($serials as $serial) {
        $status = $serial['status'] ?? 'pending';
        if (!isset($statuses[$status])) {
            $statuses[$status] = 0;
        }
        $statuses[$status]++;
    }
}

echo "Serial Status Summary:\n";
echo "======================\n";
foreach ($statuses as $status => $count) {
    echo "$status: $count\n";
}
