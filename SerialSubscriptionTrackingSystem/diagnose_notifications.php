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

echo "=== NOTIFICATION SYSTEM DIAGNOSTIC ===\n\n";

echo "1. MAIL CONFIGURATION:\n";
echo "   MAIL_MAILER: " . ($env['MAIL_MAILER'] ?? 'NOT SET') . "\n";
echo "   MAIL_HOST: " . ($env['MAIL_HOST'] ?? 'NOT SET') . "\n";
echo "   MAIL_PORT: " . ($env['MAIL_PORT'] ?? 'NOT SET') . "\n";
echo "   MAIL_USERNAME: " . ($env['MAIL_USERNAME'] ? '***' : 'NOT SET') . "\n";
echo "   MAIL_FROM_ADDRESS: " . ($env['MAIL_FROM_ADDRESS'] ?? 'NOT SET') . "\n\n";

echo "2. QUEUE CONFIGURATION:\n";
echo "   QUEUE_CONNECTION: " . ($env['QUEUE_CONNECTION'] ?? 'NOT SET') . "\n";
echo "   APP_ENV: " . ($env['APP_ENV'] ?? 'NOT SET') . "\n\n";

echo "3. EMAIL LOG FILES:\n";
$logDir = __DIR__ . '/storage/logs';
if (is_dir($logDir)) {
    $files = glob($logDir . '/laravel*.log');
    if (empty($files)) {
        echo "   No log files found\n";
    } else {
        // Get most recent 20 lines with 'Mail' or 'email' or 'notification'
        $recentFile = end($files);
        echo "   Most recent log: " . basename($recentFile) . "\n\n";
        echo "   === Recent entries with 'email' or 'notification' (last 50 lines): ===\n";
        
        $handle = fopen($recentFile, 'r');
        $lines = [];
        while (!feof($handle)) {
            $line = fgets($handle);
            if ($line !== false) {
                $lines[] = $line;
            }
        }
        fclose($handle);
        
        $lines = array_reverse($lines);
        $count = 0;
        foreach ($lines as $line) {
            if (stripos($line, 'email') !== false || 
                stripos($line, 'notification') !== false ||
                stripos($line, 'mail') !== false ||
                stripos($line, 'sent') !== false ||
                stripos($line, 'failed') !== false) {
                echo $line;
                $count++;
                if ($count >= 30) break;
            }
        }
        
        if ($count === 0) {
            echo "   No email/notification related logs found\n";
        }
    }
} else {
    echo "   Log directory not found\n";
}

echo "\n4. DATABASE QUEUE STATUS:\n";
try {
    $client = new MongoDB\Client($env['DB_DSN'] ?? 'mongodb://localhost:27017');
    $db = $client->selectDatabase($env['DB_DATABASE'] ?? 'test');
    $jobsCollection = $db->selectCollection('jobs');
    
    $totalJobs = $jobsCollection->countDocuments([]);
    $failedJobs = $jobsCollection->countDocuments(['reserved' => 1]);
    
    echo "   Total jobs in queue: {$totalJobs}\n";
    echo "   Reserved jobs: {$failedJobs}\n";
    
    if ($totalJobs > 0) {
        echo "\n   Last 5 jobs:\n";
        $jobs = $jobsCollection->find([], ['sort' => ['created_at' => -1], 'limit' => 5]);
        foreach ($jobs as $job) {
            echo "   - ID: {$job['_id']}\n";
            echo "     Payload: " . substr($job['payload'], 0, 100) . "...\n";
        }
    }
} catch (Exception $e) {
    echo "   Error checking queue: " . $e->getMessage() . "\n";
}

echo "\n\n5. QUICK CHECKS:\n";

// Check if mailable classes exist
$mailablesPath = __DIR__ . '/app/Mail';
if (is_dir($mailablesPath)) {
    $files = glob($mailablesPath . '/*.php');
    echo "   Mailable classes found: " . count($files) . "\n";
    foreach ($files as $file) {
        echo "     - " . basename($file) . "\n";
    }
} else {
    echo "   Mail directory not found\n";
}

echo "\n6. NOTIFICATION SERVICES:\n";
$servicesPath = __DIR__ . '/app/Services';
if (is_dir($servicesPath)) {
    $files = glob($servicesPath . '/*.php');
    echo "   Service classes found:\n";
    foreach ($files as $file) {
        echo "     - " . basename($file) . "\n";
    }
} else {
    echo "   Services directory not found\n";
}
