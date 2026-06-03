<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Subscription;
use App\Models\SerialIssue;
use Carbon\Carbon;

$sub = Subscription::where('serial_title', '7 Deadly Sins')->first();
if (!$sub) {
    echo "Subscription not found!\n";
    exit(1);
}

echo "Fixing expected delivery dates for: " . $sub->serial_title . "\n";
echo "Frequency: " . $sub->frequency . "\n\n";

// Get start date from subscription creation or serials
$startDate = $sub->created_at ?? Carbon::now();
if ($sub->serials && count($sub->serials) > 0 && isset($sub->serials[0]['deliveryDate'])) {
    try {
        $startDate = Carbon::parse($sub->serials[0]['deliveryDate']);
    } catch (\Exception $e) {
        // Use created_at
    }
}

echo "Using start date: " . $startDate->format('M d, Y') . "\n\n";

// Get all issues for this subscription
$issues = SerialIssue::where('subscription_id', (string)$sub->_id)->orderBy('issue_number')->get();

echo "Updating " . count($issues) . " issues:\n";

foreach ($issues as $issue) {
    // Calculate expected date based on frequency
    $frequency = strtolower($sub->frequency ?? 'monthly');
    $offset = $issue->issue_number - 1;
    
    $expectedDate = match($frequency) {
        'quarterly' => $startDate->copy()->addMonths($offset * 3),
        'monthly' => $startDate->copy()->addMonths($offset),
        'weekly' => $startDate->copy()->addWeeks($offset),
        'biweekly' => $startDate->copy()->addWeeks($offset * 2),
        'annually', 'annual' => $startDate->copy()->addYears($offset),
        default => $startDate->copy()->addMonths($offset),
    };
    
    $issue->expected_delivery_date = $expectedDate;
    $issue->save();
    
    echo "  Issue #" . $issue->issue_number . ": " . $expectedDate->format('M d, Y') . "\n";
}

echo "\nDone! Expected delivery dates have been populated.\n";
