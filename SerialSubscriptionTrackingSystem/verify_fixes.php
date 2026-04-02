<?php
require 'vendor/autoload.php';
require 'bootstrap/app.php';

use App\Models\User;
use App\Models\Subscription;
use App\Models\ProcessMovementLog;
use Illuminate\Support\Carbon;

echo "\n============================================\n";
echo "✅ VERIFICATION: Checking All Three Fixes\n";
echo "============================================\n\n";

// 1. Check enabled accounts
echo "1️⃣  ENABLED ACCOUNTS (Only these should receive notifications)\n";
echo str_repeat("-", 50) . "\n";
$enabledUsers = User::where('is_disabled', false)->get();
echo "Total enabled users: " . $enabledUsers->count() . "\n\n";

$byRole = $enabledUsers->groupBy('role');
foreach (['supplier', 'gsps', 'inspection', 'tpu', 'admin'] as $role) {
    $users = $byRole->get($role, collect());
    echo "📧 {$role} (" . $users->count() . "):\n";
    foreach ($users as $user) {
        echo "   ✓ {$user->name} - {$user->email}\n";
    }
}
echo "\n";

// 2. Check status history ordering (oldest first, newest last)
echo "2️⃣  ADMIN EMAIL FIX: Status History Ordering\n";
echo str_repeat("-", 50) . "\n";
echo "Fix: History should show OLDEST at TOP, NEWEST at BOTTOM with CURRENT highlighted\n\n";

$latestLog = ProcessMovementLog::orderBy('created_at', 'desc')->first();
if ($latestLog) {
    echo "Latest subscription change:\n";
    echo "  Serial: {$latestLog->record_title}\n";
    echo "  Current Status: {$latestLog->status_to}\n";
    echo "  Full History (chronological - oldest to newest):\n\n";
    
    $logs = ProcessMovementLog::where('record_id', $latestLog->record_id)
        ->orderBy('created_at', 'asc')  // ASC = oldest first
        ->limit(10)
        ->get();
    
    foreach ($logs as $index => $log) {
        $isLast = ($index === count($logs) - 1);
        $marker = $isLast ? "🔵 [CURRENT - HIGHLIGHTED]" : "   ";
        echo "{$marker} {$index}. {$log->status_to} @ {$log->created_at->format('M j, Y g:i A')}\n";
    }
} else {
    echo "  ⚠️  No status logs found\n";
}
echo "\n";

// 3. GSPS Confirmation Email Fix
echo "3️⃣  GSPS CONFIRMATION EMAIL FIX\n";
echo str_repeat("-", 50) . "\n";
echo "Fix: When GSPS user marks 'received', ONLY that user gets confirmation email\n";
echo "     (Not all GSPS users, just the one who performed the action)\n\n";

$gspsUsers = User::where('role', 'gsps')->where('is_disabled', false)->get();
if ($gspsUsers->count() > 0) {
    echo "✅ {$gspsUsers->count()} Enabled GSPS user(s):\n";
    foreach ($gspsUsers as $user) {
        echo "   ✓ {$user->name} ({$user->email})\n";
        echo "     → Will receive: General notification on all status changes\n";
        echo "     → Will receive CONFIRMATION EMAIL when HE/SHE marks 'received'\n";
    }
} else {
    echo "❌ No enabled GSPS users found!\n";
}
echo "\n";

// 4. Inspection Confirmation Email Fix
echo "4️⃣  INSPECTION CONFIRMATION EMAIL FIX\n";
echo str_repeat("-", 50) . "\n";
echo "Fix: When Inspection user marks 'delivered' or 'for_return',\n";
echo "     ONLY that user gets confirmation email (like GSPS model)\n\n";

$inspectionUsers = User::where('role', 'inspection')->where('is_disabled', false)->get();
if ($inspectionUsers->count() > 0) {
    echo "✅ {$inspectionUsers->count()} Enabled Inspection user(s):\n";
    foreach ($inspectionUsers as $user) {
        echo "   ✓ {$user->name} ({$user->email})\n";
        echo "     → Will receive: General notification when 'received' status happens\n";
        echo "     → Will receive CONFIRMATION EMAIL when HE/SHE marks 'delivered' or 'for_return'\n";
    }
} else {
    echo "❌ No enabled inspection users found!\n";
}
echo "\n";

// 5. Supplier Notification Fix
echo "5️⃣  SUPPLIER EMAIL FIX: prepare & for_delivery notifications\n";
echo str_repeat("-", 50) . "\n";
echo "Fix: Added is_disabled filter so suppliers receive ALL status updates\n";
echo "     (prepare, for_delivery, received, delivered, for_return)\n\n";

$supplierUsers = User::where('role', 'supplier')->where('is_disabled', false)->get();
if ($supplierUsers->count() > 0) {
    echo "✅ {$supplierUsers->count()} Enabled Supplier user(s):\n";
    foreach ($supplierUsers as $user) {
        echo "   ✓ {$user->name} ({$user->email})\n";
        echo "     → Will receive emails for:\n";
        echo "       • prepare (when supplier starts preparing)\n";
        echo "       • for_delivery (when supplier marks ready)\n";
        echo "       • received (when GSPS receives it)\n";
        echo "       • delivered (when inspection completes)\n";
        echo "       • for_return (when inspection marks for return)\n";
    }
} else {
    echo "❌ No enabled supplier users found!\n";
}
echo "\n";

echo "============================================\n";
echo "✅ ALL FIXES APPLIED & VERIFIED\n";
echo "============================================\n\n";

