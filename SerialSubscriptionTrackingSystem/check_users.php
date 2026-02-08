<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "=== All Users ===\n\n";

$users = User::all();

foreach ($users as $user) {
    echo "Name: " . ($user->name ?? 'N/A') . "\n";
    echo "Email: " . ($user->email ?? 'N/A') . "\n";
    echo "Role: " . ($user->role ?? 'NO ROLE SET') . "\n";
    echo "---\n";
}

echo "\nTotal users: " . $users->count() . "\n";
