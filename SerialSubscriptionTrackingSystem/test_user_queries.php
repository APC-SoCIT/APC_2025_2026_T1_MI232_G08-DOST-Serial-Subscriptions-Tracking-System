<?php

require __DIR__ . '/vendor/autoload.php';

use App\Models\User;

// Bootstrap Laravel app using Composer's autoload
$app = require_once __DIR__ . '/bootstrap/app.php';

// Manually bootstrap if needed
if (!function_exists('app')) {
    $app->makeBeforeBootstrapCallbacks([]);
}

echo "=== Testing User Queries ===\n\n";

echo "1. All users in database:\n";
$allUsers = User::all();
echo "   Total: " . $allUsers->count() . "\n";
foreach ($allUsers as $user) {
    echo "   - {$user->email} | Role: {$user->role} | Disabled: " . ($user->is_disabled ? 'YES' : 'NO') . "\n";
}

echo "\n2. Testing individual role queries:\n";

$roles = ['tpu', 'gsps', 'inspection', 'supplier', 'admin'];
foreach ($roles as $role) {
    $users = User::where('role', $role)
        ->where('is_disabled', false)
        ->get();
    
    echo "\n   Role: {$role}\n";
    echo "   Count: " . $users->count() . "\n";
    foreach ($users as $user) {
        echo "     - {$user->name} ({$user->email})\n";
    }
}

echo "\n3. Testing specific email lookup:\n";
$testEmails = [
    'vacija4503@flownue.com',  // gsps
    'nipotib705@marvetos.com', // tpu
    'welomo2211@cosdas.com',   // inspection
    'cinewa5648@agoalz.com',   // admin
    'calefa8393@cosdas.com'    // supplier
];

foreach ($testEmails as $email) {
    $user = User::where('email', $email)->first();
    if ($user) {
        echo "   ✓ {$email} - Role: {$user->role}\n";
    } else {
        echo "   ✗ {$email} - NOT FOUND\n";
    }
}

echo "\n4. Can we specifically search TPU users?\n";
$tpuCount = User::where('role', 'tpu')->count();
echo "   Total TPU users (including disabled): {$tpuCount}\n";

$tpuEnabled = User::where('role', 'tpu')->where('is_disabled', false)->count();
echo "   Enabled TPU users: {$tpuEnabled}\n";

$allGsps = User::where('role', 'gsps')->get();
echo "\n5. All GSPS users:\n";
foreach ($allGsps as $user) {
    echo "   - {$user->name} ({$user->email}) - Disabled: " . ($user->is_disabled ? 'YES' : 'NO') . "\n";
}
