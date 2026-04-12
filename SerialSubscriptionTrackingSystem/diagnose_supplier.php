<?php
require 'vendor/autoload.php';
require 'bootstrap/app.php';

use Illuminate\Support\Facades\DB;

echo "\n========== SUPPLIER EMAIL LOOKUP DIAGNOSIS ==========\n\n";

// 1. Find the supplier by email
echo "1. Looking for supplier with email: xikav33130@cosdas.com\n";
echo str_repeat("-", 50) . "\n";

$supplierByEmail = DB::connection('mongodb')
    ->collection('users')
    ->where('email', 'xikav33130@cosdas.com')
    ->first();

if ($supplierByEmail) {
    echo "✅ Found in Users collection:\n";
    echo "   Name: {$supplierByEmail['name']}\n";
    echo "   Email: {$supplierByEmail['email']}\n";
    echo "   Role: {$supplierByEmail['role']}\n";
    echo "   Is Disabled: " . ($supplierByEmail['is_disabled'] ?? 'false') . "\n";
    echo "   ID: {$supplierByEmail['_id']}\n";
    $supplierName = $supplierByEmail['name'];
} else {
    echo "❌ NOT found in Users collection\n";
}
echo "\n";

// 2. Check SupplierAccount
echo "2. Looking in SupplierAccount collection:\n";
echo str_repeat("-", 50) . "\n";

$supplierAccount = DB::connection('mongodb')
    ->collection('supplier_accounts')
    ->where('email', 'xikav33130@cosdas.com')
    ->first();

if ($supplierAccount) {
    echo "✅ Found in SupplierAccount collection:\n";
    echo "   Company: {$supplierAccount['company_name']}\n";
    echo "   Email: {$supplierAccount['email']}\n";
    echo "   Contact: {$supplierAccount['contact_person']}\n";
    echo "   Status: {$supplierAccount['status']}\n";
    echo "   Is Disabled: " . ($supplierAccount['is_disabled'] ?? 'false') . "\n";
} else {
    echo "❌ NOT found in SupplierAccount collection\n";
}
echo "\n";

// 3. Get recent subscriptions to see what supplier_name is used
echo "3. Recent subscriptions and their supplier names:\n";
echo str_repeat("-", 50) . "\n";

$subscriptions = DB::connection('mongodb')
    ->collection('subscriptions')
    ->orderBy('created_at', 'desc')
    ->limit(5)
    ->get();

foreach ($subscriptions as $sub) {
    echo "Serial: {$sub['title']}\n";
    echo "  Supplier Name Field: {$sub['supplier_name']}\n";
    echo "  Supplier ID Field: " . ($sub['supplier_id'] ?? 'N/A') . "\n\n";
}

// 4. Get all unique supplier names
echo "4. All unique supplier names in database:\n";
echo str_repeat("-", 50) . "\n";

$allSuppliers = DB::connection('mongodb')
    ->collection('subscriptions')
    ->distinct('supplier_name');

foreach ($allSuppliers as $name) {
    echo "  - {$name}\n";
}
echo "\n";

// 5. Check what happens with current lookup logic
if (isset($supplierName)) {
    echo "5. Testing lookup logic with name: {$supplierName}\n";
    echo str_repeat("-", 50) . "\n";
    
    // Try the exact lookup
    $test1 = DB::connection('mongodb')
        ->collection('users')
        ->where('email', 'like', "%{$supplierName}%")
        ->where('role', 'supplier')
        ->where('is_disabled', false)
        ->first();
    
    if ($test1) {
        echo "✅ Direct email search works: {$test1['email']}\n";
    } else {
        echo "❌ Direct email search failed\n";
    }
    
    $test2 = DB::connection('mongodb')
        ->collection('users')
        ->where('name', 'like', "%{$supplierName}%")
        ->where('role', 'supplier')
        ->where('is_disabled', false)
        ->first();
    
    if ($test2) {
        echo "✅ Name search works: {$test2['name']}\n";
    } else {
        echo "❌ Name search failed\n";
    }
}
echo "\n";

echo "========== END DIAGNOSIS ==========\n\n";
