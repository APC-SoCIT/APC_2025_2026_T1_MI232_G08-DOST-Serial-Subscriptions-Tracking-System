<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Models\User;
use App\Models\UserNotification;
use App\Mail\SerialStatusNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class NotifyActorConfirmations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notify:actor-confirmations {--email : Also send email notifications}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send confirmation notifications to GSPS (for received) and Inspection (for inspected) users about their actions on existing data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $sendEmail = $this->option('email');

        // Get all subscriptions
        $subscriptions = Subscription::all();
        
        $receivedSerials = [];
        $inspectedSerials = [];
        
        foreach ($subscriptions as $subscription) {
            $serials = $subscription->serials ?? [];
            foreach ($serials as $serial) {
                $status = $serial['status'] ?? 'pending';
                $inspectionStatus = $serial['inspection_status'] ?? null;
                
                // Received serials (status = received, or any post-received status)
                if (in_array($status, ['received'])) {
                    $receivedSerials[] = [
                        'subscription' => $subscription,
                        'serial' => $serial,
                        'serial_title' => $serial['serialTitle'] ?? $serial['title'] ?? 'Unknown Serial',
                        'issn' => $serial['issn'] ?? 'N/A',
                        'supplier_name' => $subscription->supplier_name,
                    ];
                }
                
                // Inspected serials (inspection_status = inspected or for_return)
                if ($inspectionStatus === 'inspected') {
                    $inspectedSerials[] = [
                        'subscription' => $subscription,
                        'serial' => $serial,
                        'serial_title' => $serial['serialTitle'] ?? $serial['title'] ?? 'Unknown Serial',
                        'issn' => $serial['issn'] ?? 'N/A',
                        'supplier_name' => $subscription->supplier_name,
                        'inspection_status' => 'inspected',
                    ];
                } elseif ($inspectionStatus === 'for_return') {
                    $inspectedSerials[] = [
                        'subscription' => $subscription,
                        'serial' => $serial,
                        'serial_title' => $serial['serialTitle'] ?? $serial['title'] ?? 'Unknown Serial',
                        'issn' => $serial['issn'] ?? 'N/A',
                        'supplier_name' => $subscription->supplier_name,
                        'inspection_status' => 'for_return',
                    ];
                }
            }
        }

        $this->info("Found " . count($receivedSerials) . " received serial(s) for GSPS confirmation");
        $this->info("Found " . count($inspectedSerials) . " inspected serial(s) for Inspection confirmation");

        // Get GSPS users
        $gspsUsers = User::where('role', 'regex', '/^gsps$/i')->get();
        // Get Inspection users
        $inspectionUsers = User::where('role', 'regex', '/^inspection$/i')->get();

        $this->info("Found {$gspsUsers->count()} GSPS user(s):");
        foreach ($gspsUsers as $user) {
            $this->line("  - {$user->name} ({$user->email})");
        }
        
        $this->info("Found {$inspectionUsers->count()} Inspection user(s):");
        foreach ($inspectionUsers as $user) {
            $this->line("  - {$user->name} ({$user->email})");
        }

        $notificationsCreated = 0;
        $emailsSent = 0;
        $updateDateTime = Carbon::now()->format('F j, Y \a\t g:i A');

        // Send GSPS confirmations for received serials
        if (!empty($receivedSerials)) {
            $this->newLine();
            $this->info('Processing GSPS confirmations for received serials...');
            
            foreach ($receivedSerials as $item) {
                // Create in-app notification
                try {
                    UserNotification::create([
                        'type' => 'confirmation',
                        'title' => 'Confirmation: Serial Received',
                        'message' => "You have successfully received '{$item['serial_title']}' from {$item['supplier_name']}. The serial is now pending inspection.",
                        'user_role' => 'gsps',
                        'reference_id' => $item['subscription']->_id ?? $item['subscription']->id,
                        'reference_type' => 'subscription',
                        'action_url' => '/dashboard-gsps-delivery-status',
                        'is_read' => false,
                        'metadata' => [
                            'serial_title' => $item['serial_title'],
                            'serial_issn' => $item['issn'],
                            'supplier_name' => $item['supplier_name'],
                            'is_confirmation' => true,
                        ],
                    ]);
                    $notificationsCreated++;
                } catch (\Exception $e) {
                    $this->error("  ✗ Failed to create notification for {$item['serial_title']}: " . $e->getMessage());
                }

                // Send emails
                if ($sendEmail) {
                    $action = "This is to confirm that you have successfully received the serial '{$item['serial_title']}' from {$item['supplier_name']}. The serial is now pending inspection.";
                    
                    foreach ($gspsUsers as $gspsUser) {
                        try {
                            Mail::to($gspsUser->email)->send(new SerialStatusNotification(
                                $item['serial_title'],
                                'received',
                                $updateDateTime,
                                $action,
                                $item['supplier_name'],
                                $gspsUser->name,
                                'GSPS Team',
                                'gsps'
                            ));
                            $emailsSent++;
                            $this->line("  ✓ GSPS confirmation sent to {$gspsUser->email} for {$item['serial_title']}");
                        } catch (\Exception $e) {
                            $this->error("  ✗ Failed: {$gspsUser->email}: " . $e->getMessage());
                            Log::error("Failed to send GSPS confirmation email: " . $e->getMessage());
                        }
                    }
                }
            }
        }

        // Send Inspection confirmations for inspected serials
        if (!empty($inspectedSerials)) {
            $this->newLine();
            $this->info('Processing Inspection confirmations for inspected serials...');
            
            foreach ($inspectedSerials as $item) {
                $status = $item['inspection_status'];
                $title = $status === 'inspected' ? 'Confirmation: Serial Inspected' : 'Confirmation: Serial Marked for Return';
                $message = $status === 'inspected' 
                    ? "You have successfully inspected '{$item['serial_title']}' from {$item['supplier_name']} and marked it as Delivered."
                    : "You have marked '{$item['serial_title']}' from {$item['supplier_name']} for return.";

                // Create in-app notification
                try {
                    UserNotification::create([
                        'type' => 'confirmation',
                        'title' => $title,
                        'message' => $message,
                        'user_role' => 'inspection',
                        'reference_id' => $item['subscription']->_id ?? $item['subscription']->id,
                        'reference_type' => 'subscription',
                        'action_url' => '/dashboard-inspection',
                        'is_read' => false,
                        'metadata' => [
                            'serial_title' => $item['serial_title'],
                            'serial_issn' => $item['issn'],
                            'supplier_name' => $item['supplier_name'],
                            'inspection_status' => $status,
                            'is_confirmation' => true,
                        ],
                    ]);
                    $notificationsCreated++;
                } catch (\Exception $e) {
                    $this->error("  ✗ Failed to create notification for {$item['serial_title']}: " . $e->getMessage());
                }

                // Send emails
                if ($sendEmail) {
                    foreach ($inspectionUsers as $inspUser) {
                        try {
                            Mail::to($inspUser->email)->send(new SerialStatusNotification(
                                $item['serial_title'],
                                $status,
                                $updateDateTime,
                                $message,
                                $item['supplier_name'],
                                $inspUser->name,
                                'Inspection Team',
                                'inspection'
                            ));
                            $emailsSent++;
                            $this->line("  ✓ Inspection confirmation sent to {$inspUser->email} for {$item['serial_title']} ({$status})");
                        } catch (\Exception $e) {
                            $this->error("  ✗ Failed: {$inspUser->email}: " . $e->getMessage());
                            Log::error("Failed to send Inspection confirmation email: " . $e->getMessage());
                        }
                    }
                }
            }
        }

        $this->newLine();
        $this->info('Summary:');
        $this->line("  - In-app notifications created: {$notificationsCreated}");
        if ($sendEmail) {
            $this->line("  - Emails sent: {$emailsSent}");
        }

        return 0;
    }
}
