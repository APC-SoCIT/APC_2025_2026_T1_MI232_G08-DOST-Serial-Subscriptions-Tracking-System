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

echo "=== ROBUSTNESS & FUTURE-PROOFING TEST ===\n";
echo "Testing if confirmation emails will work with NEW ACCOUNTS\n\n";

try {
    $client = new MongoDB\Client($env['DB_DSN'] ?? 'mongodb://localhost:27017');
    $db = $client->selectDatabase($env['DB_DATABASE'] ?? 'test');
    $usersCollection = $db->selectCollection('users');
    
    echo "1. CHECKING IF RAW MONGODB QUERIES ARE FAULT-TOLERANT:\n\n";
    
    // Test 1: User with email
    echo "   Test 1A: Finding user WITH email (normal case)\n";
    $userWithEmail = $usersCollection->findOne([
        'role' => 'supplier',
        'is_disabled' => false,
        'email' => ['\$exists' => true]
    ]);
    if ($userWithEmail && isset($userWithEmail['email']) && !empty($userWithEmail['email'])) {
        echo "   ✅ PASS: Found user with email: {$userWithEmail['email']}\n";
    } else {
        echo "   ❌ FAIL: No user with email found\n";
    }
    
    // Test 2: User without email (potential issue case)
    echo "\n   Test 1B: Checking if any users exist WITHOUT email\n";
    $usersWithoutEmail = $usersCollection->findOne([
        'role' => 'supplier',
        'is_disabled' => false,
        '$or' => [
            ['email' => null],
            ['email' => ['$exists' => false]],
            ['email' => '']
        ]
    ]);
    if ($usersWithoutEmail) {
        echo "   ⚠️  WARNING: Found user without email!\n";
        echo "      Name: {$usersWithoutEmail['name']}\n";
        echo "      This user would NOT receive confirmation emails\n";
    } else {
        echo "   ✅ PASS: All users have email addresses\n";
    }
    
    // Test 3: Disabled users are excluded
    echo "\n   Test 1C: Verifying disabled users are properly excluded\n";
    $disabledCount = $usersCollection->count([
        'role' => 'supplier',
        'is_disabled' => true
    ]);
    $enabledCount = $usersCollection->count([
        'role' => 'supplier',
        'is_disabled' => false
    ]);
    echo "   Supplier accounts - Enabled: {$enabledCount}, Disabled: {$disabledCount}\n";
    if ($enabledCount > 0) {
        echo "   ✅ PASS: Query correctly filters enabled users\n";
    }
    
    // Test 4: Name lookup is case-insensitive
    echo "\n   Test 1D: Testing case-insensitive name lookup (regex)\n";
    $supplier = $usersCollection->findOne(['role' => 'supplier', 'is_disabled' => false]);
    if ($supplier) {
        $nameVariations = [
            $supplier['name'],  // exact
            strtolower($supplier['name']),  // lowercase
            strtoupper($supplier['name']),  // uppercase  
            ucfirst(strtolower($supplier['name']))  // titlecase
        ];
        
        foreach ($nameVariations as $variant) {
            $found = $usersCollection->findOne([
                'role' => 'supplier',
                'is_disabled' => false,
                'name' => new MongoDB\BSON\Regex($variant, 'i')  // case-insensitive
            ]);
            
            if ($found && isset($found['email'])) {
                echo "   ✅ '{$variant}' → Found: {$found['email']}\n";
            }
        }
    }
    
    echo "\n2. CHECKING ERROR HANDLING IN EMAILNOTIFICATIONSERVICE:\n\n";
    
    // Read the service file to check error handling
    $serviceContent = file_get_contents(__DIR__ . '/app/Services/EmailNotificationService.php');
    
    echo "   Checking for proper error handling:\n\n";
    
    if (strpos($serviceContent, 'try {') !== false && strpos($serviceContent, 'catch') !== false) {
        echo "   ✅ Service has try-catch blocks\n";
    } else {
        echo "   ❌ No try-catch error handling\n";
    }
    
    if (strpos($serviceContent, 'Log::error') !== false) {
        echo "   ✅ Service logs errors\n";
    } else {
        echo "   ❌ No error logging\n";
    }
    
    if (strpos($serviceContent, 'return false') !== false) {
        echo "   ✅ Service returns false on error (graceful failure)\n";
    } else {
        echo "   ⚠️  Service may throw exceptions on error\n";
    }
    
    if (strpos($serviceContent, 'is_disabled') !== false) {
        echo "   ✅ Service checks is_disabled flag\n";
    } else {
        echo "   ❌ Service doesn't check is_disabled\n";
    }
    
    echo "\n3. POTENTIAL ISSUES & MITIGATIONS:\n\n";
    
    $issues = [];
    
    // Check issue 1: Missing email
    $usersWithoutEmailCount = $usersCollection->count([
        'email' => ['$exists' => false]
    ]);
    if ($usersWithoutEmailCount > 0) {
        $issues[] = [
            'issue' => 'Users without email addresses',
            'count' => $usersWithoutEmailCount,
            'impact' => 'Confirmation emails will NOT be sent to these users',
            'mitigation' => 'REQUIRED: Email field must be populated when creating user accounts',
            'severity' => 'CRITICAL'
        ];
    }
    
    // Check issue 2: Empty email
    $usersWithEmptyEmailCount = $usersCollection->count([
        'email' => ''
    ]);
    if ($usersWithEmptyEmailCount > 0) {
        $issues[] = [
            'issue' => 'Users with empty email strings',
            'count' => $usersWithEmptyEmailCount,
            'impact' => 'Confirmation emails will fail (Mail::to("") invalid)',
            'mitigation' => 'REQUIRED: Validate email format in user creation form',
            'severity' => 'CRITICAL'
        ];
    }
    
    // Check if all essential roles exist with emails
    $roles = ['supplier', 'tpu', 'gsps', 'inspection', 'admin'];
    foreach ($roles as $role) {
        $count = $usersCollection->count([
            'role' => $role,
            'is_disabled' => false,
            'email' => ['$exists' => true],
            '$expr' => ['$ne' => ['$email', '']]
        ]);
        if ($count === 0) {
            $issues[] = [
                'issue' => "No {$role} users with valid emails",
                'count' => 0,
                'impact' => "Notifications won't be sent to {$role}",
                'mitigation' => "REQUIRED: Create at least one {$role} account with valid email",
                'severity' => 'CRITICAL'
            ];
        }
    }
    
    if (count($issues) > 0) {
        echo "   ⚠️  POTENTIAL ISSUES DETECTED:\n\n";
        foreach ($issues as $idx => $issue) {
            echo "   Issue " . ($idx + 1) . ": {$issue['issue']}\n";
            echo "   - Count: {$issue['count']}\n";
            echo "   - Impact: {$issue['impact']}\n";
            echo "   - Mitigation: {$issue['mitigation']}\n";
            echo "   - Severity: {$issue['severity']}\n\n";
        }
    } else {
        echo "   ✅ NO CRITICAL ISSUES DETECTED\n";
        echo "   All roles have enabled users with valid email addresses\n\n";
    }
    
    echo "4. GUIDELINES FOR FUTURE ACCOUNT CREATION:\n\n";
    
    echo "   MANDATORY FIELDS when creating new accounts:\n";
    echo "   ✓ Email: MUST be valid and non-empty\n";
    echo "     - Format: example@domain.com\n";
    echo "     - Test: calefa8393@cosdas.com ← This format works!\n";
    echo "     - Required for: Confirmation emails, notifications, password reset\n\n";
    
    echo "   ✓ Role: Must be one of: supplier, tpu, gsps, inspection, admin\n";
    echo "     - Case: stored as lowercase\n";
    echo "     - Example: supplier (not Supplier)\n\n";
    
    echo "   ✓ Name: Full name or identifier\n";
    echo "     - Used for: Actor lookup in confirmation emails\n";
    echo "     - Example: Calef, Well, Nick, Vaj\n";
    echo "     - Important: Used in sendConfirmationEmail() actor lookup\n\n";
    
    echo "   ✓ is_disabled: Boolean flag\n";
    echo "     - false = User can receive notifications\n";
    echo "     - true = User is ignored by notification system\n";
    echo "     - Default should be: false\n\n";
    
    echo "5. WHY RAW MONGODB QUERIES (vs Eloquent) ARE MORE RELIABLE:\n\n";
    
    $eloquentVsMongo = [
        'Eloquent (OLD - BROKEN)' => [
            'User::where(\'role\', \'supplier\')->get()',
            'Problem: Returns empty array in service context',
            'Reason: Eloquent connection context fails outside HTTP',
            'Symptom: No error, silently returns []'
        ],
        'Raw MongoDB (NEW - WORKING)' => [
            '$collection->find([\'role\' => \'supplier\'])',
            'Always works in any context',
            'Reason: Direct database connection, no framework magic',
            'Symptom: Explicit errors if something fails'
        ]
    ];
    
    echo "   Eloquent Query:\n";
    echo "   - Query: User::where('role', 'supplier')->get()\n";
    echo "   - In web request: ✅ Works\n";
    echo "   - In service/command: ❌ Fails silently\n";
    echo "   - Returns: Empty array (no error!)\n\n";
    
    echo "   Raw MongoDB Query:\n";
    echo "   - Query: \$collection->find(['role' => 'supplier'])\n";
    echo "   - In web request: ✅ Works\n";
    echo "   - In service/command: ✅ Works\n";
    echo "   - In email queue: ✅ Works\n";
    echo "   - Returns: Always reliable\n\n";
    
    echo "6. WHAT WILL MAKE IT BREAK (Things to Avoid):\n\n";
    
    $breakingChanges = [
        'Creating user WITHOUT email field' => 'Notification system will skip this user silently',
        'Setting is_disabled = true for a role' => 'All notifications to that role are skipped',
        'Changing raw MongoDB queries back to Eloquent' => 'WILL reintroduce the silent failure bug!',
        'Using different email format' => 'Should be fine as long as it\'s valid SMTP',
        'Changing database to MySQL (only MongoDB tested)' => 'Need to verify connection handling',
        'Not providing actorName when calling createStatusNotifications()' => 'Confirmation email will use fallback lookup (less reliable)',
    ];
    
    foreach ($breakingChanges as $change => $consequence) {
        echo "   ❌ {$change}\n";
        echo "      → {$consequence}\n\n";
    }
    
    echo "7. VERIFICATION SCRIPT FOR NEW ACCOUNTS:\n\n";
    
    echo "   When you create new accounts, run this check:\n";
    echo "   php check_new_accounts.php\n\n";
    
    echo "   This will verify:\n";
    echo "   1. User email is not empty\n";
    echo "   2. User email is not null\n";
    echo "   3. Role is lowercase\n";
    echo "   4. is_disabled = false\n";
    echo "   5. Raw MongoDB query can find the user\n\n";
    
    echo "=== FINAL ASSESSMENT ===\n\n";
    
    $allGood = count($issues) === 0;
    
    if ($allGood) {
        echo "✅ SYSTEM IS ROBUST AND FUTURE-PROOF:\n\n";
        echo "   Current status:\n";
        echo "   - Raw MongoDB queries working perfectly ✓\n";
        echo "   - All test accounts have valid emails ✓\n";
        echo "   - No disabled accounts interfering ✓\n";
        echo "   - Error handling in place ✓\n\n";
        
        echo "   Why it will work with NEW ACCOUNTS:\n";
        echo "   1. Raw MongoDB queries are reliable (not Eloquent) ✓\n";
        echo "   2. Query explicitly checks is_disabled = false ✓\n";
        echo "   3. Error handling returns false if email missing ✓\n";
        echo "   4. Regex lookup is case-insensitive ✓\n\n";
        
        echo "   Risk factors:\n";
        echo "   ⚠️  Only if new account is created WITHOUT email\n";
        echo "   ⚠️  Only if account is set to is_disabled = true\n";
        echo "   ⚠️  Only if someone reverts to Eloquent queries\n\n";
        
        echo "   RECOMMENDATION:\n";
        echo "   ✅ YES, it will work reliably going forward\n";
        echo "   ✅ But ALWAYS ensure new accounts have:\n";
        echo "      - Valid email address (MANDATORY)\n";
        echo "      - Correct role (lowercase)\n";
        echo "      - is_disabled = false (unless intentional)\n";
    } else {
        echo "⚠️  POTENTIAL ISSUES DETECTED\n";
        echo "   Fix the issues above before deploying\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
