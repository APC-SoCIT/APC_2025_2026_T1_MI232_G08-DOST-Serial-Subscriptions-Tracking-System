<?php
/**
 * Verification script to test notification system
 */

require __DIR__ . '/bootstrap/app.php';

use Illuminate\Support\Facades\DB;
use App\Models\SerialIssue;
use App\Models\Subscription;

// Get the app instance
$app = require_once __DIR__ . '/bootstrap/app.php';

// Create console application
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

// Get 4 Seasons subscription and Issue #2
$subscription = Subscription::where('serial_title', '4 Seasons')->first();

if (!$subscription) {
    echo "❌ Subscription '4 Seasons' not found\n";
    exit();
}

echo "✓ Found Subscription: {$subscription->serial_title}\n";
echo "  Supplier: {$subscription->supplier_name}\n";
echo "  Total Issues: {$subscription->total_issues}\n";
echo "  Frequency: {$subscription->frequency}\n\n";

// Get Issue #2
$issue2 = SerialIssue::where('subscription_id', $subscription->_id)
    ->where('issue_number', 2)
    ->first();

if (!$issue2) {
    echo "❌ Issue #2 not found\n";
    exit();
}

echo "✓ Found Issue #2:\n";
echo "  Status: {$issue2->status}\n";
echo "  Expected Delivery: {$issue2->expected_delivery_date}\n";
echo "  Issue ID: {$issue2->_id}\n\n";

// Check the notification system configuration
echo "=== NOTIFICATION SYSTEM CHECK ===\n\n";

echo "1. ProcessMovementService notification roles:\n";
echo "   - prepare: TPU, GSPS, Admin\n";
echo "   - for_delivery: TPU, GSPS, Inspection, Admin\n";
echo "   - received: Supplier, TPU, Inspection, Admin (+ GSPS confirmation)\n";
echo "   - inspected: Supplier, TPU, GSPS, Admin (+ Inspection confirmation)\n";
echo "   - for_return: Supplier, TPU, GSPS, Admin (+ Inspection confirmation)\n\n";

echo "2. Checking user roles in system:\n";
$roles = DB::connection('mongodb')->collection('users')
    ->distinct('role');

foreach ($roles as $role) {
    $count = DB::connection('mongodb')->collection('users')
        ->count(['role' => $role]);
    echo "   - {$role}: {$count} user(s)\n";
}

echo "\n3. Checking for recent notifications in database:\n";
$recentNotifications = DB::connection('mongodb')->collection('user_notifications')
    ->where('created_at', '>=', \Carbon\Carbon::now()->subHours(1))
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();

if ($recentNotifications->count() > 0) {
    echo "   ✓ Found " . $recentNotifications->count() . " notifications in last hour:\n";
    foreach ($recentNotifications as $notif) {
        echo "     - Type: {$notif['type']}, To: {$notif['user_role']}, At: {$notif['created_at']}\n";
    }
} else {
    echo "   ⚠ No notifications found in last hour\n";
}

echo "\n✅ Verification complete!\n";
echo "\nTo test notifications:\n";
echo "1. Update Issue #2 status through the dashboard\n";
echo "2. Check email inbox for notifications\n";
echo "3. Check user_notifications collection in MongoDB\n";
