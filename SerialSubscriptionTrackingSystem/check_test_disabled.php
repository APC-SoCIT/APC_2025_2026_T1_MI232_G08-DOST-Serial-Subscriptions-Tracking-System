<?php

require __DIR__ . '/vendor/autoload.php';

$env = parse_ini_file('.env');
$dsn = $env['DB_DSN'] ?? 'mongodb://localhost:27017';
$database = $env['DB_DATABASE'] ?? 'test';

try {
    // Connect to MongoDB
    $client = new MongoDB\Client($dsn);
    $db = $client->selectDatabase($database);
    $usersCollection = $db->selectCollection('users');
    
    $testEmails = [
        'vacija4503@flownue.com',
        'nipotib705@marvetos.com',
        'welomo2211@cosdas.com',
        'cinewa5648@agoalz.com',
        'calefa8393@cosdas.com'
    ];
    
    echo "=== Checking Test Accounts Status ===\n\n";
    
    $disabledAccounts = [];
    $foundAccounts = [];
    
    foreach ($testEmails as $email) {
        $user = $usersCollection->findOne(['email' => $email]);
        
        if ($user) {
            $isDisabled = (bool)($user['is_disabled'] ?? false);
            echo "✓ FOUND in Users:\n";
            echo "  Email: {$user['email']}\n";
            echo "  Name: {$user['name']}\n";
            echo "  Role: {$user['role']}\n";
            echo "  Disabled: " . ($isDisabled ? 'YES ❌' : 'NO ✓') . "\n\n";
            
            $foundAccounts[] = $email;
            if ($isDisabled) {
                $disabledAccounts[] = $email;
            }
        } else {
            echo "✗ NOT FOUND: {$email}\n\n";
        }
    }
    
    echo "\n=== SUMMARY ===\n";
    echo "Total test accounts found: " . count($foundAccounts) . "\n";
    if (!empty($disabledAccounts)) {
        echo "\n❌ DISABLED ACCOUNTS (need to be enabled):\n";
        foreach ($disabledAccounts as $email) {
            echo "   - {$email}\n";
        }
    } else {
        echo "\n✓ All " . count($foundAccounts) . " test accounts are ENABLED\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
