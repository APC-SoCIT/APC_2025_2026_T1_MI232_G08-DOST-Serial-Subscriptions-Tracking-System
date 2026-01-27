<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $connection = DB::connection('mongodb');
    $client = $connection->getMongoClient();
    echo "✅ MongoDB connection successful!\n";
    echo "Connected to: " . $connection->getDatabaseName() . "\n";
} catch (Exception $e) {
    echo "❌ MongoDB connection failed:\n";
    echo $e->getMessage() . "\n";
}
