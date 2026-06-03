<?php

// Bootstrap Laravel
require __DIR__ . '/bootstrap/app.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = \Illuminate\Http\Request::capture()
);

// Now use Eloquent
use App\Models\User;
use App\Models\SupplierAccount;

$testEmails = [
    'vacija4503@flownue.com',
    'nipotib705@marvetos.com',
    'welomo2211@cosdas.com',
    'cinewa5648@agoalz.com',
    'calefa8393@cosdas.com'
];

echo "=== Checking Test Accounts Disabled Status ===\n\n";

foreach ($testEmails as $email) {
    $user = User::where('email', $email)->first();
    $supplier = SupplierAccount::where('email', $email)->first();
    
    if ($user) {
        echo "✓ FOUND in User table:\n";
        echo "  Email: {$user->email}\n";
        echo "  Name: {$user->name}\n";
        echo "  Role: {$user->role}\n";
        echo "  Is Disabled: " . ($user->is_disabled ? 'YES ❌' : 'NO ✓') . "\n\n";
    } elseif ($supplier) {
        echo "✓ FOUND in SupplierAccount table:\n";
        echo "  Email: {$supplier->email}\n";
        echo "  Company: {$supplier->company_name}\n";
        echo "  Status: {$supplier->status}\n";
        echo "  Is Disabled: " . ($supplier->is_disabled ? 'YES ❌' : 'NO ✓') . "\n\n";
    } else {
        echo "✗ NOT FOUND: {$email}\n\n";
    }
}

echo "\n=== Summary ===\n";
$disabledAccounts = [];
foreach ($testEmails as $email) {
    $user = User::where('email', $email)->first();
    $supplier = SupplierAccount::where('email', $email)->first();
    if (($user && $user->is_disabled) || ($supplier && $supplier->is_disabled)) {
        $disabledAccounts[] = $email;
    }
}

if (empty($disabledAccounts)) {
    echo "✓ All 5 test accounts are ENABLED\n";
} else {
    echo "❌ The following accounts are DISABLED and need to be enabled:\n";
    foreach ($disabledAccounts as $email) {
        echo "   - {$email}\n";
    }
}
