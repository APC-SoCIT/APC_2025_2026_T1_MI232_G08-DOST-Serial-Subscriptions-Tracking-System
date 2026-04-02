<?php

require __DIR__ . '/vendor/autoload.php';

// Parse .env properly
$env = [];
$lines = file('.env');
foreach ($lines as $line) {
    $line = trim($line);
    if (empty($line) || $line[0] === '#') continue;
    if (strpos($line, '=') === false) continue;
    
    [$key, $value] = explode('=', $line, 2);
    $env[trim($key)] = trim($value);
}

$dsn = $env['DB_DSN'] ?? 'mongodb://localhost:27017';
$database = $env['DB_DATABASE'] ?? 'test';

try {
    // Connect to MongoDB
    $client = new MongoDB\Client($dsn);
    $db = $client->selectDatabase($database);
    $usersCollection = $db->selectCollection('users');
    $suppliersCollection = $db->selectCollection('supplier_accounts');
    
    $testEmails = [
        'vacija4503@flownue.com',
        'nipotib705@marvetos.com',
        'welomo2211@cosdas.com',
        'cinewa5648@agoalz.com',
        'calefa8393@cosdas.com'
    ];
    
    echo "=== Checking Test Accounts in Both Collections ===\n\n";
    
    $disabledAccounts = [];
    $foundAccounts = [];
    
    foreach ($testEmails as $email) {
        // Check Users collection
        $user = $usersCollection->findOne(['email' => $email]);
        if ($user) {
            $isDisabled = (bool)($user['is_disabled'] ?? false);
            echo "✓ FOUND in Users Collection:\n";
            echo "  Email: {$user['email']}\n";
            echo "  Name: {$user['name']}\n";
            echo "  Role: {$user['role']}\n";
            echo "  Disabled: " . ($isDisabled ? 'YES ❌' : 'NO ✓') . "\n\n";
            
            $foundAccounts[] = $email;
            if ($isDisabled) {
                $disabledAccounts[] = ['email' => $email, 'type' => 'User'];
            }
        } else {
            // Check Supplier Accounts collection
            $supplier = $suppliersCollection->findOne(['email' => $email]);
            if ($supplier) {
                $isDisabled = (bool)($supplier['is_disabled'] ?? false);
                echo "✓ FOUND in SupplierAccount Collection:\n";
                echo "  Email: {$supplier['email']}\n";
                echo "  Company: {$supplier['company_name']}\n";
                echo "  Status: {$supplier['status']}\n";
                echo "  Disabled: " . ($isDisabled ? 'YES ❌' : 'NO ✓') . "\n\n";
                
                $foundAccounts[] = $email;
                if ($isDisabled) {
                    $disabledAccounts[] = ['email' => $email, 'type' => 'SupplierAccount'];
                }
            } else {
                echo "✗ NOT FOUND in any collection: {$email}\n\n";
            }
        }
    }
    
    echo "\n=== SUMMARY ===\n";
    echo "Total test accounts found: " . count($foundAccounts) . " out of 5\n";
    
    if (empty($foundAccounts)) {
        echo "\n⚠️  WARNING: None of the 5 test accounts were found in the system!\n";
        echo "   They may need to be created.\n";
    } elseif (!empty($disabledAccounts)) {
        echo "\n❌ DISABLED ACCOUNTS (need to be enabled):\n";
        foreach ($disabledAccounts as $account) {
            echo "   - {$account['email']} ({$account['type']})\n";
        }
    } else {
        echo "\n✓ All " . count($foundAccounts) . " test accounts are ENABLED\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
