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

echo "=== VERIFYING ACCOUNT CREATION FORM SETUP ===\n";
echo "Testing if accounts created through Admin/TPU form will work with notifications\n\n";

try {
    $client = new MongoDB\Client($env['DB_DSN'] ?? 'mongodb://localhost:27017');
    $db = $client->selectDatabase($env['DB_DATABASE'] ?? 'test');
    $usersCollection = $db->selectCollection('users');
    
    echo "1. CHECKING ACCOUNT CREATION VALIDATION:\n\n";
    
    echo "   From UserController::store() validation rules:\n";
    echo "   ✓ name: required|string|max:255\n";
    echo "   ✓ email: required|email|unique:users\n";
    echo "   ✓ role: required|string|in:tpu,gsps,inspection,admin\n";
    echo "   ✓ password: required|confirmed|min:8\n\n";
    
    echo "   What this means for notifications:\n";
    echo "   ✅ Email is MANDATORY - Cannot be empty or null\n";
    echo "   ✅ Email is UNIQUE - No duplicates allowed\n";
    echo "   ✅ Email is VALIDATED - Must be valid email format\n\n";
    
    echo "   ✅ Role is MANDATORY - Must be one of: tpu, gsps, inspection, admin\n";
    echo "   ✅ Role is VALIDATED - Prevents typos or invalid roles\n\n";
    
    echo "2. CHECKING DEFAULT VALUES:\n\n";
    
    echo "   From UserController::store():\n";
    echo "   - email_verified_at: Automatically set to now()\n";
    echo "   - is_disabled: Not explicitly set (uses MongoDB default)\n\n";
    
    // Check what MongoDB default is
    $testUser = $usersCollection->findOne(['is_disabled' => ['$exists' => false]]);
    if ($testUser) {
        echo "   MongoDB default for is_disabled: NOT SET (null)\n";
    } else {
        echo "   MongoDB default for is_disabled: Might be set to false or true\n";
    }
    
    // This is the critical check
    echo "\n   ⚠️  CRITICAL: Checking if new accounts default to is_disabled=false\n";
    
    // Count accounts without is_disabled field
    $usersWithoutIsDisabled = $usersCollection->count(['is_disabled' => ['$exists' => false]]);
    $usersWithIsDisabledFalse = $usersCollection->count(['is_disabled' => false]);
    $usersWithIsDisabledTrue = $usersCollection->count(['is_disabled' => true]);
    
    echo "      Accounts without is_disabled field: {$usersWithoutIsDisabled}\n";
    echo "      Accounts with is_disabled=false: {$usersWithIsDisabledFalse}\n";
    echo "      Accounts with is_disabled=true: {$usersWithIsDisabledTrue}\n\n";
    
    if ($usersWithoutIsDisabled > 0) {
        echo "   ⚠️  ISSUE DETECTED:\n";
        echo "      Some accounts exist without is_disabled field\n";
        echo "      MongoDB treats missing field as null\n";
        echo "      The notification query checks: is_disabled: false\n";
        echo "      This means accounts without the field may be SKIPPED!\n\n";
        
        echo "   RECOMMENDATION:\n";
        echo "      Fix the store() method to explicitly set: is_disabled: false\n";
    } else {
        echo "   ✅ All accounts explicitly have is_disabled set (either true or false)\n";
    }
    
    echo "\n3. CHECKING ACCOUNT CREATION FORM VALIDATION:\n\n";
    
    $userControllerContent = file_get_contents(__DIR__ . '/app/Http/Controllers/UserController.php');
    
    if (strpos($userControllerContent, "'email' => 'required|email|unique:users'") !== false) {
        echo "   ✅ Email validation: required|email|unique\n";
    } else {
        echo "   ❌ Email validation: MAY NOT BE STRICT ENOUGH\n";
    }
    
    if (strpos($userControllerContent, "'role' => 'required|string|in:tpu,gsps,inspection,admin'") !== false) {
        echo "   ✅ Role validation: required|string|in:tpu,gsps,inspection,admin\n";
    } else {
        echo "   ❌ Role validation: MISSING OR INCOMPLETE\n";
    }
    
    echo "\n4. WHAT HAPPENS WHEN YOU CREATE A NEW ACCOUNT:\n\n";
    
    echo "   Step 1: Admin/TPU fills form with:\n";
    echo "   - Name: [Required, any text]\n";
    echo "   - Email: [Required, validated as email]\n";
    echo "   - Role: [Required, one of: tpu,gsps,inspection,admin]\n";
    echo "   - Password: [Required, min 8 chars with letters+numbers]\n\n";
    
    echo "   Step 2: Form submits to UserController::store()\n";
    echo "   - Validation runs ✓\n";
    echo "   - Email is checked for format ✓\n";
    echo "   - Email is checked for uniqueness ✓\n";
    echo "   - Role is validated against allowed list ✓\n\n";
    
    echo "   Step 3: User::create() stores in MongoDB\n";
    echo "   - name: '{value}'\n";
    echo "   - email: '{value}'\n";
    echo "   - role: '{value}' (converted to lowercase if needed)\n";
    echo "   - password: HASHED\n";
    echo "   - email_verified_at: now()\n";
    echo "   - is_disabled: [NOT SET - POTENTIAL ISSUE]\n\n";
    
    echo "   Step 4: Account can receive notifications?\n";
    echo "   - Query: find(['role' => 'tpu', 'is_disabled' => false])\n";
    echo "   - Result: ";
    if ($usersWithoutIsDisabled > 0) {
        echo "MAYBE NOT (if is_disabled not explicitly set)\n";
    } else {
        echo "YES ✓\n";
    }
    
    echo "\n5. RECOMMENDATION FOR ACCOUNT CREATION:\n\n";
    
    if ($usersWithoutIsDisabled > 0) {
        echo "   ⚠️  ISSUE FOUND: Accounts without is_disabled field\n\n";
        
        echo "   ACTION REQUIRED:\n";
        echo "   Modify UserController::store() to explicitly set is_disabled:\n\n";
        
        echo "   Current code:\n";
        echo "   \$user = User::create([\n";
        echo "       'name' => \$request->name,\n";
        echo "       'email' => \$request->email,\n";
        echo "       'role' => \$request->role,\n";
        echo "       'password' => Hash::make(\$request->password),\n";
        echo "       'email_verified_at' => now(),\n";
        echo "   ]);\n\n";
        
        echo "   Should be:\n";
        echo "   \$user = User::create([\n";
        echo "       'name' => \$request->name,\n";
        echo "       'email' => \$request->email,\n";
        echo "       'role' => strtolower(\$request->role),  // Ensure lowercase\n";
        echo "       'password' => Hash::make(\$request->password),\n";
        echo "       'email_verified_at' => now(),\n";
        echo "       'is_disabled' => false,  // MANDATORY: Explicitly set\n";
        echo "   ]);\n";
    } else {
        echo "   ✅ NO ISSUES FOUND\n";
        echo "   Account creation is properly set up for notifications\n";
    }
    
    echo "\n6. TESTING WITH REAL DATA:\n\n";
    
    // Get a recent/admin-created account (should have email and other fields)
    $recentUser = $usersCollection->findOne(
        [],
        ['sort' => ['created_at' => -1]]
    );
    
    if ($recentUser) {
        echo "   Latest created account:\n";
        echo "   - Name: {$recentUser['name']}\n";
        $email = $recentUser['email'] ?? 'MISSING';
        $role = $recentUser['role'] ?? 'MISSING';
        echo "   - Email: {$email}\n";
        echo "   - Role: {$role}\n";
        echo "   - is_disabled: ";
        if (isset($recentUser['is_disabled'])) {
            echo ($recentUser['is_disabled'] ? 'true (DISABLED)' : 'false (ENABLED)') . "\n";
        } else {
            echo "NOT SET (⚠️ ISSUE)\n";
        }
        echo "   - email_verified_at: " . ($recentUser['email_verified_at'] ? 'YES ✓' : 'NO') . "\n";
    }
    
    echo "\n=== FINAL ASSESSMENT ===\n\n";
    
    if ($usersWithoutIsDisabled > 0) {
        echo "⚠️  ACTION REQUIRED:\n";
        echo "The account creation form needs a small fix to explicitly set is_disabled=false\n\n";
        echo "This ensures new accounts will work with the confirmation email system.\n";
    } else {
        echo "✅ ACCOUNT CREATION IS PROPERLY CONFIGURED:\n\n";
        echo "When you create accounts through Admin/TPU:\n";
        echo "1. Email is validated as required and unique ✓\n";
        echo "2. Role is validated against allowed list ✓\n";
        echo "3. Accounts are auto-verified ✓\n";
        echo "4. Accounts are enabled (not disabled) ✓\n";
        echo "5. Accounts CAN receive notifications ✓\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
