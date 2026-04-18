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

class NotifyExistingSerials extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notify:existing-serials {--email : Also send email notifications} {--status= : Specific status to notify (accepted,prepare,for_delivery,received)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send notifications to TPU users about existing serials that suppliers have accepted/processed (for existing data)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $sendEmail = $this->option('email');
        $specificStatus = $this->option('status');
        
        // Statuses that indicate supplier has accepted (including prepare, for_delivery, received which imply acceptance)
        $acceptedStatuses = $specificStatus 
            ? [$specificStatus]
            : ['accepted', 'prepare', 'for_delivery', 'received'];

        // Get all subscriptions
        $subscriptions = Subscription::all();
        
        $processedSerials = [];
        
        foreach ($subscriptions as $subscription) {
            $serials = $subscription->serials ?? [];
            foreach ($serials as $serial) {
                $status = $serial['status'] ?? 'pending';
                if (in_array($status, $acceptedStatuses)) {
                    $processedSerials[] = [
                        'subscription' => $subscription,
                        'serial' => $serial,
                        'serial_title' => $serial['serialTitle'] ?? $serial['title'] ?? 'Unknown Serial',
                        'issn' => $serial['issn'] ?? 'N/A',
                        'supplier_name' => $subscription->supplier_name,
                        'status' => $status,
                    ];
                }
            }
        }

        if (empty($processedSerials)) {
            $this->info('No processed serials found with status: ' . implode(', ', $acceptedStatuses));
            return 0;
        }

        $this->info("Found " . count($processedSerials) . " processed serial(s):");
        foreach ($processedSerials as $item) {
            $this->line("  - {$item['serial_title']} (ISSN: {$item['issn']}) - Status: {$item['status']} - Supplier: {$item['supplier_name']}");
        }

        // Get all TPU users
        $tpuUsers = User::where('role', 'regex', '/^tpu$/i')->get();

        if ($tpuUsers->isEmpty()) {
            $this->warn('No TPU users found to notify.');
            return 0;
        }

        $this->info("Found {$tpuUsers->count()} TPU user(s) to notify:");
        foreach ($tpuUsers as $user) {
            $this->line("  - {$user->name} ({$user->email})");
        }

        $notificationsCreated = 0;
        $emailsSent = 0;

        $updateDateTime = Carbon::now()->format('F j, Y \a\t g:i A');

        // Status messages for emails
        $statusMessages = [
            'accepted' => 'The serial has been accepted by the supplier.',
            'prepare' => 'The serial is being prepared by the supplier.',
            'for_delivery' => 'The serial is ready for delivery.',
            'received' => 'The serial has been received.',
        ];

        foreach ($processedSerials as $item) {
            $status = $item['status'];
            $notificationTitle = '';
            $notificationMessage = '';

            switch ($status) {
                case 'accepted':
                    $notificationTitle = 'Serial Accepted by Supplier';
                    $notificationMessage = "'{$item['serial_title']}' has been accepted by {$item['supplier_name']}.";
                    break;
                case 'prepare':
                    $notificationTitle = 'Serial Being Prepared';
                    $notificationMessage = "'{$item['serial_title']}' is being prepared by {$item['supplier_name']}.";
                    break;
                case 'for_delivery':
                    $notificationTitle = 'Serial Ready for Delivery';
                    $notificationMessage = "'{$item['serial_title']}' is ready for delivery from {$item['supplier_name']}.";
                    break;
                case 'received':
                    $notificationTitle = 'Serial Received';
                    $notificationMessage = "'{$item['serial_title']}' from {$item['supplier_name']} has been received.";
                    break;
            }

            // Create in-app notification for TPU
            try {
                UserNotification::create([
                    'type' => 'serial_status_update',
                    'title' => $notificationTitle,
                    'message' => $notificationMessage,
                    'user_role' => 'tpu',
                    'reference_id' => $item['subscription']->_id ?? $item['subscription']->id,
                    'reference_type' => 'subscription',
                    'action_url' => '/dashboard-tpu',
                    'is_read' => false,
                    'metadata' => [
                        'serial_title' => $item['serial_title'],
                        'serial_issn' => $item['issn'],
                        'supplier_name' => $item['supplier_name'],
                        'new_status' => $status,
                    ],
                ]);
                $notificationsCreated++;

                // Send email to each TPU user
                if ($sendEmail) {
                    $action = $statusMessages[$status] ?? '';
                    foreach ($tpuUsers as $tpuUser) {
                        try {
                            Mail::to($tpuUser->email)->send(new SerialStatusNotification(
                                $item['serial_title'],
                                $status,
                                $updateDateTime,
                                $action,
                                $item['supplier_name'],
                                $tpuUser->name,
                                $item['supplier_name'], // actorName is supplier
                                'tpu' // targetRole
                            ));
                            $emailsSent++;
                            $this->line("  ✓ Email sent to {$tpuUser->email} about {$item['serial_title']} ({$status})");
                        } catch (\Exception $e) {
                            $this->error("  ✗ Failed to send email to {$tpuUser->email}: " . $e->getMessage());
                            Log::error("Failed to send serial status email to {$tpuUser->email}: " . $e->getMessage());
                        }
                    }
                }
            } catch (\Exception $e) {
                $this->error("  ✗ Failed to create notification for {$item['serial_title']}: " . $e->getMessage());
                Log::error("Failed to create notification for serial {$item['serial_title']}: " . $e->getMessage());
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
