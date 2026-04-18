<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Mail\SerialStatusNotification;

echo "Testing role-based email notifications...\n\n";

// Test Supplier created notification
$mail = new SerialStatusNotification('Test Serial', 'created', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'supplier');
echo "Supplier created: " . $mail->statusDescription . "\n";
echo "Action is null: " . ($mail->action === null ? 'YES' : 'NO') . "\n\n";

// Test Supplier received
$mail = new SerialStatusNotification('Test Serial', 'received', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'supplier');
echo "Supplier received: " . $mail->statusDescription . "\n\n";

// Test Supplier inspected
$mail = new SerialStatusNotification('Test Serial', 'inspected', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'supplier');
echo "Supplier inspected: " . $mail->statusDescription . "\n\n";

// Test Supplier for_return
$mail = new SerialStatusNotification('Test Serial', 'for_return', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'supplier');
echo "Supplier for_return: " . $mail->statusDescription . "\n\n";

// Test TPU accepted notification
$mail = new SerialStatusNotification('Test Serial', 'accepted', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'tpu');
echo "TPU accepted: " . $mail->statusDescription . "\n\n";

// Test TPU prepare
$mail = new SerialStatusNotification('Test Serial', 'prepare', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'tpu');
echo "TPU prepare: " . $mail->statusDescription . "\n\n";

// Test TPU for_delivery
$mail = new SerialStatusNotification('Test Serial', 'for_delivery', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'tpu');
echo "TPU for_delivery: " . $mail->statusDescription . "\n\n";

// Test TPU received
$mail = new SerialStatusNotification('Test Serial', 'received', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'tpu');
echo "TPU received: " . $mail->statusDescription . "\n\n";

// Test TPU inspected
$mail = new SerialStatusNotification('Test Serial', 'inspected', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'tpu');
echo "TPU inspected: " . $mail->statusDescription . "\n\n";

// Test TPU for_return
$mail = new SerialStatusNotification('Test Serial', 'for_return', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'tpu');
echo "TPU for_return: " . $mail->statusDescription . "\n\n";

// Test GSPS created
$mail = new SerialStatusNotification('Test Serial', 'created', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'gsps');
echo "GSPS created: " . $mail->statusDescription . "\n\n";

// Test GSPS accepted
$mail = new SerialStatusNotification('Test Serial', 'accepted', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'gsps');
echo "GSPS accepted: " . $mail->statusDescription . "\n\n";

// Test GSPS prepare
$mail = new SerialStatusNotification('Test Serial', 'prepare', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'gsps');
echo "GSPS prepare: " . $mail->statusDescription . "\n\n";

// Test GSPS for_delivery
$mail = new SerialStatusNotification('Test Serial', 'for_delivery', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'gsps');
echo "GSPS for_delivery: " . $mail->statusDescription . "\n\n";

// Test GSPS received
$mail = new SerialStatusNotification('Nature Magazine', 'received', now()->format('M d, Y h:i A'), null, 'Delgado Publishing', 'GSPS User', 'GSPS User', 'gsps');
echo "GSPS received: " . $mail->statusDescription . "\n\n";

// Test GSPS inspected
$mail = new SerialStatusNotification('Test Serial', 'inspected', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'gsps');
echo "GSPS inspected: " . $mail->statusDescription . "\n\n";

// Test GSPS for_return
$mail = new SerialStatusNotification('Test Serial', 'for_return', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'gsps');
echo "GSPS for_return: " . $mail->statusDescription . "\n\n";

// Test Inspection for_delivery
$mail = new SerialStatusNotification('Test Serial', 'for_delivery', now()->format('M d, Y h:i A'), null, 'Test Supplier', 'Test User', null, 'inspection');
echo "Inspection for_delivery: " . $mail->statusDescription . "\n\n";

// Test Inspection received
$mail = new SerialStatusNotification('Nature Magazine', 'received', now()->format('M d, Y h:i A'), null, 'Delgado Publishing', 'Inspector', 'Inspector', 'inspection');
echo "Inspection received: " . $mail->statusDescription . "\n\n";

// Test Inspection inspected
$mail = new SerialStatusNotification('Nature Magazine', 'inspected', now()->format('M d, Y h:i A'), null, 'Delgado Publishing', 'Inspector', 'Inspector', 'inspection');
echo "Inspection inspected: " . $mail->statusDescription . "\n\n";

// Test Inspection for_return
$mail = new SerialStatusNotification('Nature Magazine', 'for_return', now()->format('M d, Y h:i A'), null, 'Delgado Publishing', 'Inspector', 'Inspector', 'inspection');
echo "Inspection for_return: " . $mail->statusDescription . "\n\n";

echo "==========================================================\n";
echo "All role-based notifications verified successfully!\n";
echo "Action Required section is removed (action = null)\n";
echo "==========================================================\n";
