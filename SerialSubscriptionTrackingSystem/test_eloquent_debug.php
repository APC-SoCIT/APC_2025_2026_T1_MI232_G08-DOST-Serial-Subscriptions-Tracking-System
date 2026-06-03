<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

// Get the kernel
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

// Use the app and test
use App\Models\User;
use Illuminate\Support\Facades\Log;

echo "=== Eloquent User Query Test ===\n\n";

try {
    // Skip connection check, just test queries
    echo "1. Testing queries:\n";
    
    $allCount = User::count();
    echo "   Total users: {$allCount}\n";
    
    $tpuCount = User::where('role', 'tpu')->count();
    echo "   TPU users: {$tpuCount}\n";
    
    $gspsCount = User::where('role', 'gsps')->count();
    echo "   GSPS users: {$gspsCount}\n";
    
    $enabledTpuCount = User::where('role', 'tpu')->where('is_disabled', false)->count();
    echo "   Enabled TPU: {$enabledTpuCount}\n";
    
    echo "\n2. Test TPU User fetch:\n";
    $tpuUsers = User::where('role', 'tpu')->where('is_disabled', false)->get();
    echo "   Query returned: " . $tpuUsers->count() . " users\n";
    
    foreach ($tpuUsers as $user) {
        echo "   - {$user->name} ({$user->email})\n";
    }
    
    echo "\n3. Test specific user lookup:\n";
    $nick = User::where('email', 'nipotib705@marvetos.com')->first();
    if ($nick) {
        echo "   ✓ Found Nick: {$nick->name} ({$nick->email})\n";
    } else {
        echo "   ✗ Nick not found\n";
    }
    
    echo "\n4. Would getRecipientsForRole work?\n";
    
    // Simulate the getRecipientsForRole function
    $role = 'tpu';
    $recipients = [];
    
    $tpuUsers = User::where('role', $role)
        ->where('is_disabled', false)
        ->get();
    
    foreach ($tpuUsers as $user) {
        if ($user->email) {
            $recipients[] = [
                'email' => $user->email,
                'name' => $user->name,
            ];
        }
    }
    
    echo "   Recipients found: " . count($recipients) . "\n";
    if (count($recipients) > 0) {
        echo "   ✓ Would work!\n";
        foreach ($recipients as $r) {
            echo "     - {$r['email']}\n";
        }
    } else {
        echo "   ✗ Would return empty array (THIS IS THE BUG!)\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
