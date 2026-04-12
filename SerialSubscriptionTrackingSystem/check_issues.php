<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Subscription;
use App\Models\SerialIssue;

$sub = Subscription::where('serial_title', '7 Deadly Sins')->first();
if ($sub) {
    echo "Found subscription: " . $sub->serial_title . " (ID: " . $sub->_id . ")\n";
    echo "Frequency: " . $sub->frequency . "\n";
    echo "Total Issues: " . $sub->total_issues . "\n";
    echo "\nSerial Issues:\n";
    
    $issues = SerialIssue::where('subscription_id', (string)$sub->_id)->orderBy('issue_number')->get();
    if ($issues->isEmpty()) {
        echo "  No issues found!\n";
    } else {
        foreach ($issues as $issue) {
            $date = $issue->expected_delivery_date ? $issue->expected_delivery_date->format('M d, Y') : 'NULL';
            echo "  Issue #" . $issue->issue_number . ": " . $date . "\n";
        }
    }
} else {
    echo "Subscription not found!\n";
}
