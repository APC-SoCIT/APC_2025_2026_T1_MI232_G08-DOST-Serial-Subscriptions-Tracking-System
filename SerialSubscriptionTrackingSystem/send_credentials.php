<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Mail;
use App\Mail\AccountCredentialsNotification;

// Find user by email
$user = User::where('email', 'fobov47923@muncloud.com')->first();

if (!$user) {
    echo "User not found!\n";
    exit(1);
}

echo "Found user: {$user->name} ({$user->email}) - Role: {$user->role}\n";

// Send credentials email with a temporary password
$tempPassword = 'TempPass123';

try {
    Mail::to($user->email)->send(new AccountCredentialsNotification(
        $user->name,
        $user->email,
        $tempPassword,
        ucfirst($user->role),
        url('/login')
    ));
    
    echo "✓ Credentials email sent successfully to {$user->email}\n";
    echo "  Username: {$user->email}\n";
    echo "  Temporary Password: {$tempPassword}\n";
} catch (\Exception $e) {
    echo "✗ Failed to send email: " . $e->getMessage() . "\n";
    exit(1);
}
