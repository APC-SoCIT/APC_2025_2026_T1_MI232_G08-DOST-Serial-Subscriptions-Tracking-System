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

class NotifyAcceptedSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notify:accepted-subscriptions {--email : Also send email notifications}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send notifications to TPU users about accepted subscriptions (for existing data)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $sendEmail = $this->option('email');

        // Get all subscriptions
        $subscriptions = Subscription::all();
        
        $acceptedSerials = [];
        
        foreach ($subscriptions as $subscription) {
            $serials = $subscription->serials ?? [];
            foreach ($serials as $serial) {
                $status = $serial['status'] ?? 'pending';
                if ($status === 'accepted') {
                    $acceptedSerials[] = [
                        'subscription' => $subscription,
                        'serial' => $serial,
                        'serial_title' => $serial['serialTitle'] ?? $serial['title'] ?? 'Unknown Serial',
                        'issn' => $serial['issn'] ?? 'N/A',
                        'supplier_name' => $subscription->supplier_name,
                    ];
                }
            }
        }

        if (empty($acceptedSerials)) {
            $this->info('No accepted subscriptions found.');
            return 0;
        }

        $this->info("Found " . count($acceptedSerials) . " accepted serial(s):");
        foreach ($acceptedSerials as $item) {
            $this->line("  - {$item['serial_title']} (ISSN: {$item['issn']}) - Supplier: {$item['supplier_name']}");
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
        $action = 'The serial has been accepted by the supplier. Please proceed with monitoring the preparation and delivery process.';

        foreach ($acceptedSerials as $item) {
            // Create in-app notification for TPU
            try {
                UserNotification::create([
                    'type' => 'serial_accepted',
                    'title' => 'Serial Accepted by Supplier',
                    'message' => "'{$item['serial_title']}' has been accepted by {$item['supplier_name']}.",
                    'user_role' => 'tpu',
                    'reference_id' => $item['subscription']->_id ?? $item['subscription']->id,
                    'reference_type' => 'subscription',
                    'action_url' => '/dashboard-tpu',
                    'is_read' => false,
                    'metadata' => [
                        'serial_title' => $item['serial_title'],
                        'serial_issn' => $item['issn'],
                        'supplier_name' => $item['supplier_name'],
                        'new_status' => 'accepted',
                    ],
                ]);
                $notificationsCreated++;

                // Send email to each TPU user
                if ($sendEmail) {
                    foreach ($tpuUsers as $tpuUser) {
                        try {
                            Mail::to($tpuUser->email)->send(new SerialStatusNotification(
                                $item['serial_title'],
                                'accepted',
                                $updateDateTime,
                                $action,
                                $item['supplier_name'],
                                $tpuUser->name,
                                $item['supplier_name'], // actorName is supplier in this case
                                'tpu' // targetRole
                            ));
                            $emailsSent++;
                            $this->line("  ✓ Email sent to {$tpuUser->email} about {$item['serial_title']}");
                        } catch (\Exception $e) {
                            $this->error("  ✗ Failed to send email to {$tpuUser->email}: " . $e->getMessage());
                            Log::error("Failed to send accepted subscription email to {$tpuUser->email}: " . $e->getMessage());
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
