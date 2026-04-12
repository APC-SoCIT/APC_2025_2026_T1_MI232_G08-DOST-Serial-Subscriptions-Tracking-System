<?php

require __DIR__ . '/vendor/autoload.php';

// Parse .env
$env = [];
$lines = file('.env');
foreach ($lines as $line) {
    $line = trim($line);
    if (empty($line) || $line[0] === '#') continue;
    if (strpos($line, '=') === false) continue;
    list($key, $value) = explode('=', $line, 2);
    $env[trim($key)] = trim($value);
}

$dsn = $env['DB_DSN'] ?? 'mongodb://localhost:27017';
$database = $env['DB_DATABASE'] ?? 'test';

try {
    // Connect to MongoDB
    $client = new MongoDB\Client($dsn);
    $db = $client->selectDatabase($database);
    $usersCollection = $db->selectCollection('users');
    
    echo "=== Database Query Test ===\n\n";
    
    echo "1. ALL USERS:\n";
    $allUsers = $usersCollection->find([]);
    $count = 0;
    foreach ($allUsers as $user) {
        echo "   - {$user['email']} | Role: {$user['role']} | Disabled: " . ($user['is_disabled'] ? 'YES' : 'NO') . "\n";
        $count++;
    }
    echo "   Total: {$count}\n";
    
    echo "\n2. TPU USERS (enabled only):\n";
    $tpuUsers = $usersCollection->find(['role' => 'tpu', 'is_disabled' => false]);
    foreach ($tpuUsers as $user) {
        echo "   - {$user['name']} ({$user['email']})\n";
    }
    
    echo "\n3. GSPS USERS (enabled only):\n";
    $gspsUsers = $usersCollection->find(['role' => 'gsps', 'is_disabled' => false]);
    foreach ($gspsUsers as $user) {
        echo "   - {$user['name']} ({$user['email']})\n";
    }
    
    echo "\n4. INSPECTION USERS (enabled only):\n";
    $inspectionUsers = $usersCollection->find(['role' => 'inspection', 'is_disabled' => false]);
    foreach ($inspectionUsers as $user) {
        echo "   - {$user['name']} ({$user['email']})\n";
    }
    
    echo "\n5. ADMIN USERS (enabled only):\n";
    $adminUsers = $usersCollection->find(['role' => 'admin', 'is_disabled' => false]);
    foreach ($adminUsers as $user) {
        echo "   - {$user['name']} ({$user['email']})\n";
    }
    
    echo "\n6. SUPPLIER USERS (enabled only):\n";
    $supplierUsers = $usersCollection->find(['role' => 'supplier', 'is_disabled' => false]);
    foreach ($supplierUsers as $user) {
        echo "   - {$user['name']} ({$user['email']})\n";
    }
    
    echo "\n7. Test Email Lookups:\n";
    $testEmails = [
        'vacija4503@flownue.com',  
        'nipotib705@marvetos.com', 
        'welomo2211@cosdas.com',   
        'cinewa5648@agoalz.com',   
        'calefa8393@cosdas.com'    
    ];
    
    foreach ($testEmails as $email) {
        $user = $usersCollection->findOne(['email' => $email]);
        if ($user) {
            echo "   ✓ {$email} - {$user['name']} ({$user['role']})\n";
        } else {
            echo "   ✗ {$email} - NOT FOUND\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
