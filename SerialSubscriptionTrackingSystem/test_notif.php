<?php
/**
 * Quick test to verify notifications are configured
 */

$testCode = <<<'PHP'
// Get 4 Seasons subscription
$sub = \App\Models\Subscription::where('serial_title', '4 Seasons')->first();
echo "✓ Subscription found: " . $sub->serial_title . "\n";
echo "  Supplier: " . $sub->supplier_name . "\n";
echo "  Frequency: " . $sub->frequency . "\n\n";

// Get Issue 2
$issue2 = \App\Models\SerialIssue::where('subscription_id', $sub->_id)->where('issue_number', 2)->first();
echo "✓ Issue #2 found:\n";
echo "  Status: " . $issue2->status . "\n";
echo "  Expected Delivery: " . $issue2->expected_delivery_date . "\n";
echo "  Issue ID: " . $issue2->_id . "\n\n";

// Check recent notifications
$notifs = \App\Models\UserNotification::where('created_at', '>=', \Carbon\Carbon::now()->subHours(2))
    ->orderBy('created_at', 'desc')
    ->limit(5)
    ->get();
    
echo "Recent notifications (last 2 hours): " . $notifs->count() . "\n";
foreach ($notifs as $n) {
    echo "  - " . $n->user_role . ": " . $n->title . " (" . $n->created_at->format('H:i:s') . ")\n";
}
PHP;

echo $testCode;
?>
