<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking MongoDB configuration...\n";
echo "DB_CONNECTION: " . config('database.default') . "\n";
echo "DB_DSN: " . (config('database.connections.mongodb.dsn') ? 'SET' : 'NOT SET') . "\n";
echo "DB_DATABASE: " . config('database.connections.mongodb.database') . "\n";

echo "\nTrying to connect to MongoDB...\n";

try {
    $connection = DB::connection('mongodb');
    $result = $connection->table('supplier_accounts')->limit(1)->get();
    echo "✓ MongoDB connection successful!\n";
    echo "Collections in database can be accessed.\n";
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
