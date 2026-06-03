<?php

use Illumin ate\Contracts\Console\Kernel;use App\Models\User;

// Bootstrap Laravel the proper way
require __DIR__ . '/bootstrap/app.php';

try {
    echo "=== Testing Eloquent Queries ===\n\n";
    
    echo "1. Get all users via Eloquent:\n";
    $allUsers = User::all();
    echo "   Count: " . $allUsers->count() . "\n";
    if ($allUsers->count() > 0) {
        foreach ($allUsers->take(3) as $user) {
            echo "   - {$user->email} ({$user->role})\n";
        }
        echo "   ...\n";
    }
    
    echo "\n2. Query TPU users:\n";
    $tpuUsers = User::where('role', 'tpu')->where('is_disabled', false)->get();
    echo "   Count: " . $tpuUsers->count() . "\n";
    foreach ($tpuUsers as $user) {
        echo "   - {$user->email}\n";
    }
    
    echo "\n3. Query GSPS users:\n";
    $gspsUsers = User::where('role', 'gsps')->where('is_disabled', false)->get();
    echo "   Count: " . $gspsUsers->count() . "\n";
    foreach ($gspsUsers as $user) {
        echo "   - {$user->email}\n";
    }
    
    echo "\n4. Query by specific email:\n";
    $vaj = User::where('email', 'vacija4503@flownue.com')->first();
    if ($vaj) {
        echo "   Found: {$vaj->name} ({$vaj->email}, role: {$vaj->role})\n";
    } else {
        echo "   NOT FOUND\n";
    }
    
    echo "\n5. Test getRecipientsForRole directly (using Eloquent queries):\n";
    
    $recipients = [];
    $tpuUsers = User::where('role', 'tpu')
        ->where('is_disabled', false)
        ->get();
    
    echo "   TPU query executed\n";
    echo "   TPU Users found: " . $tpuUsers->count() . "\n";
    
    foreach ($tpuUsers as $user) {
        if ($user->email) {
            $recipients[] = [
                'email' => $user->email,
                'name' => $user->name,
            ];
        }
    }
    
    echo "   Recipients array count: " . count($recipients) . "\n";
    if (empty($recipients)) {
        echo "   ❌ NO RECIPIENTS RETURNED (This is the problem!)\n";
    } else {
        echo "   ✓ Recipients found:\n";
        foreach ($recipients as $r) {
            echo "     - {$r['email']}\n";
        }
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack:\n" . $e->getTraceAsString() . "\n";
}
