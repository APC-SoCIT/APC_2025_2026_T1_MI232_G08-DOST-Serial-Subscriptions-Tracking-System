<?php
require 'vendor/autoload.php';
require 'bootstrap/app.php';

echo "\n=== Testing Inspection Confirmation Email ===\n\n";
echo "Clearing old logs and tail the log file...\n";
echo "After you submit an inspection from the UI, check the logs below:\n\n";

// Show last 50 lines
$logFile = 'storage/logs/laravel.log';
if (file_exists($logFile)) {
    $lines = file($logFile);
    $recentLines = array_slice($lines, -50);
    
    echo "Recent logs (last 50 lines):\n";
    echo str_repeat("-", 80) . "\n";
    foreach ($recentLines as $line) {
        if (strpos($line, 'Confirmation') !== false || 
            strpos($line, 'confirmation') !== false ||
            strpos($line, 'createStatusNotifications') !== false ||
            strpos($line, 'sendConfirmationEmail') !== false ||
            strpos($line, 'delivered') !== false) {
            echo $line;
        }
    }
    echo str_repeat("-", 80) . "\n";
}

echo "\nWAIT 30 seconds then run this command again:\n";
echo "php get_logs.php\n\n";
