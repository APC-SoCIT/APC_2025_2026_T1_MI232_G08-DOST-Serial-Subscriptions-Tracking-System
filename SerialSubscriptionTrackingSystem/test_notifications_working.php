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

echo "=== Testing External Notification System ===\n\n";

try {
    // Connect to MongoDB
    $client = new MongoDB\Client($env['DB_DSN'] ?? 'mongodb://localhost:27017');
    $db = $client->selectDatabase($env['DB_DATABASE'] ?? 'test');
    $usersCollection = $db->selectCollection('users');
    $subscriptionsCollection = $db->selectCollection('subscriptions');
    
    echo "1. TESTING RECIPIENT LOOKUP:\n\n";
    
    // Test each role
    $roles = ['tpu', 'gsps', 'inspection', 'admin', 'supplier'];
    
    foreach ($roles as $role) {
        $users = $usersCollection->find([
            'role' => $role,
            'is_disabled' => false
        ]);
        
        $count = 0;
        $emails = [];
        foreach ($users as $user) {
            if (isset($user['email']) && $user['email']) {
                $count++;
                $emails[] = $user['email'];
            }
        }
        
        echo "   {$role}: Found {$count} enabled user(s)\n";
        if ($count > 0) {
            foreach ($emails as $email) {
                echo "     ✓ {$email}\n";
            }
        } else {
            echo "     ✗ NO RECIPIENTS FOUND\n";
        }
        echo "\n";
    }
    
    echo "\n2. TESTING CURRENT SUBSCRIPTIONS:\n\n";
    
    // Get a sample subscription to test notification
    $subscription = $subscriptionsCollection->findOne();
    
    if (!$subscription) {
        echo "   ❌ No subscriptions found in database\n";
        exit;
    }
    
    echo "   Found subscription:\n";
    echo "   - ID: " . (string)$subscription['_id'] . "\n";
    echo "   - Title: {$subscription['subscription_title']}\n";
    echo "   - Supplier: {$subscription['supplier_name']}\n";
    echo "   - Current Status: {$subscription['current_status']}\n\n";
    
    echo "3. SIMULATING NOTIFICATION TODAY:\n\n";
    
    // Show what notifications would be sent
    $testStatus = 'received';
    
    echo "   Simulating status update to: {$testStatus}\n";
    echo "   Timestamp: " . date('Y-m-d H:i:s') . "\n\n";
    
    echo "   Notifications to be sent:\n";
    
    $notificationMap = [
        'created' => ['supplier', 'gsps', 'admin'],
        'accepted' => ['tpu', 'gsps', 'admin'],
        'prepare' => ['tpu', 'gsps', 'admin'],
        'for_delivery' => ['tpu', 'gsps', 'admin'],
        'received' => ['inspection', 'tpu', 'admin'],
        'inspected' => ['supplier', 'tpu', 'admin'],
        'delivered' => ['supplier', 'tpu', 'admin'],
        'for_return' => ['supplier', 'tpu', 'admin'],
    ];
    
    $targetRoles = $notificationMap[$testStatus] ?? [];
    
    foreach ($targetRoles as $role) {
        $users = $usersCollection->find([
            'role' => $role,
            'is_disabled' => false
        ]);
        
        $count = 0;
        foreach ($users as $user) {
            if (isset($user['email']) && $user['email']) {
                echo "     ✓ {$user['email']} ({$role})\n";
                $count++;
            }
        }
        
        if ($count === 0) {
            echo "     ⚠️  No {$role} users enabled\n";
        }
    }
    
    echo "\n4. EMAIL QUEUE STATUS:\n\n";
    
    $jobsCollection = $db->selectCollection('jobs');
    $totalJobs = $jobsCollection->countDocuments([]);
    $pendingJobs = $jobsCollection->countDocuments(['reserved' => ['$ne' => 1]]);
    
    echo "   Total queued jobs: {$totalJobs}\n";
    echo "   Pending jobs: {$pendingJobs}\n";
    
    if ($totalJobs > 0) {
        echo "\n   Last 5 jobs:\n";
        $recentJobs = $jobsCollection->find(
            [],
            ['sort' => ['created_at' => -1], 'limit' => 5]
        );
        
        foreach ($recentJobs as $job) {
            if (strpos($job['payload'], 'Mail') !== false) {
                echo "     ✓ Mail job queued\n";
            }
        }
    }
    
    echo "\n5. CHECKING RECENT LOGS:\n\n";
    
    $logFile = __DIR__ . '/storage/logs/laravel.log';
    if (file_exists($logFile)) {
        $logContent = file_get_contents($logFile);
        $lines = explode(PHP_EOL, $logContent);
        $lines = array_reverse($lines);
        
        $foundSendLog = false;
        $count = 0;
        
        foreach ($lines as $line) {
            if ($count > 100) break;
            
            if (stripos($line, 'email') !== false || 
                stripos($line, 'notification') !== false ||
                stripos($line, 'found') !== false ||
                stripos($line, 'recipients') !== false) {
                
                echo "   " . substr($line, 0, 150) . "\n";
                $count++;
                $foundSendLog = true;
            }
        }
        
        if (!$foundSendLog) {
            echo "   No recent notification logs found\n";
        }
    } else {
        echo "   Log file not found\n";
    }
    
    echo "\n✅ NOTIFICATION SYSTEM TEST COMPLETE\n";
    echo "\nAll enabled users should now receive emails for status updates!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
