<?php
/**
 * Test: Send RECEIVED notification email
 * This script will:
 * 1. Update test user emails
 * 2. Get subscription with serial in "for_delivery" status
 * 3. Trigger received notification
 * 4. Show what was queued to send
 */

require __DIR__ . '/bootstrap/app.php';

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Subscription;
use App\Models\SerialIssue;
use App\Models\UserNotification;
use App\Services\ProcessMovementService;

// Test email mapping
$testEmails = [
    'tpu' => 'fobov47923@muncloud.com',
    'gsps' => 'jokepa9809@muncloud.com',
    'inspection' => 'rayipi9335@exespay.com',
    'admin' => 'sibohov673@exespay.com',
    'supplier' => 'febagev799@fabaos.com',
];

echo "\n╔════════════════════════════════════════════════════════════╗\n";
echo "║          RECEIVED NOTIFICATION EMAIL TEST                 ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";

// Step 1: Update test users with correct emails
echo "\n📧 Step 1: Updating test user email addresses...\n";
foreach ($testEmails as $role => $email) {
    $user = User::where('role', $role)->first();
    if ($user) {
        $user->update(['email' => $email]);
        echo "   ✓ {$role}: {$email}\n";
    } else {
        echo "   ✗ No user found with role: {$role}\n";
    }
}

// Step 2: Get subscription and issue
echo "\n🔍 Step 2: Finding subscription with serial in 'for_delivery' status...\n";
$subscription = Subscription::where('serial_title', 'ABCD')->first() 
    ?? Subscription::where('serial_title', '4 Seasons')->first();

if (!$subscription) {
    echo "   ✗ No subscription found!\n";
    exit(1);
}

echo "   ✓ Found: {$subscription->serial_title} (ID: {$subscription->_id})\n";
echo "   • Supplier: {$subscription->supplier_name}\n";

$issue = SerialIssue::where('subscription_id', $subscription->_id)
    ->where('status', 'for_delivery')
    ->first();

if (!$issue) {
    echo "   ✗ No issue in 'for_delivery' status found!\n";
    exit(1);
}

echo "   ✓ Issue #{$issue->issue_number} in status: {$issue->status}\n";
echo "   • Issue ID: {$issue->_id}\n";

// Step 3: Count notifications before
echo "\n📊 Step 3: Counting notifications before...\n";
$beforeCount = UserNotification::count();
echo "   Total notifications: $beforeCount\n";

// Step 4: Trigger received notification
echo "\n🚀 Step 4: Triggering RECEIVED notification...\n";
ProcessMovementService::createStatusNotifications(
    'received',
    $subscription->serial_title . " - Issue #{$issue->issue_number}",
    (string) $subscription->_id,
    "ISSUE-{$issue->issue_number}",
    $subscription->supplier_name,
    (string) $issue->_id,
    'gsps',
    'Test GSPS User'
);

echo "   ✓ Notification queued!\n";

// Step 5: Show new notifications
echo "\n📬 Step 5: New notifications created...\n";
$afterCount = UserNotification::count();
$newCount = $afterCount - $beforeCount;
echo "   Total after: $afterCount (+" . $newCount . " new)\n\n";

$newNotifications = UserNotification::orderBy('created_at', 'desc')
    ->limit($newCount)
    ->get();

foreach ($newNotifications as $n) {
    $user = User::where('_id', $n->user_id)->first();
    $userEmail = $user?->email ?? 'unknown';
    echo "   📧 " . strtoupper($n->user_role) . " ({$userEmail}):\n";
    echo "      Title: {$n->title}\n";
    echo "      Status: {$n->status}\n";
    echo "      Created: {$n->created_at}\n\n";
}

// Step 6: Show queued jobs
echo "⏳ Step 6: Checking mail queue...\n";
$queuedJobs = \DB::table('jobs')->count();
echo "   Queued jobs: $queuedJobs\n";

echo "\n✅ TEST COMPLETE!\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Expected emails to be sent to:\n";
foreach ($testEmails as $role => $email) {
    echo "   • $role: $email\n";
}
echo "\nCheck your email inboxes and spam folders for the notifications!\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
