<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\ProcessMovementLog;
use App\Mail\AdminSerialSummaryNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class NotifyAdminSummaries extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notify:admin-summaries {--email : Also send email notifications}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send summarized status notifications to admin users for all serials (for existing data)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $sendEmail = $this->option('email');

        // Get all subscriptions
        $subscriptions = Subscription::all();
        
        $allSerials = [];
        
        foreach ($subscriptions as $subscription) {
            $serials = $subscription->serials ?? [];
            foreach ($serials as $serial) {
                $status = $serial['status'] ?? 'pending';
                $inspectionStatus = $serial['inspection_status'] ?? null;
                
                // Get the final/current status
                $currentStatus = $status;
                if ($inspectionStatus === 'inspected') {
                    $currentStatus = 'inspected';
                } elseif ($inspectionStatus === 'for_return') {
                    $currentStatus = 'for_return';
                }
                
                // Only include serials that have progressed beyond pending
                if (!in_array($currentStatus, ['pending', 'created'])) {
                    $allSerials[] = [
                        'subscription' => $subscription,
                        'serial' => $serial,
                        'serial_title' => $serial['serialTitle'] ?? $serial['title'] ?? 'Unknown Serial',
                        'issn' => $serial['issn'] ?? 'N/A',
                        'supplier_name' => $subscription->supplier_name,
                        'current_status' => $currentStatus,
                        'subscription_id' => (string)($subscription->_id ?? $subscription->id),
                    ];
                }
            }
        }

        if (empty($allSerials)) {
            $this->info('No processed serials found for admin summary.');
            return 0;
        }

        $this->info("Found " . count($allSerials) . " processed serial(s) for admin summary:");
        foreach ($allSerials as $item) {
            $this->line("  - {$item['serial_title']} (Status: {$item['current_status']}) - Supplier: {$item['supplier_name']}");
        }

        // Get admin users
        $adminUsers = User::where('role', 'regex', '/^admin$/i')->get();

        if ($adminUsers->isEmpty()) {
            $this->warn('No admin users found to notify.');
            return 0;
        }

        $this->info("Found {$adminUsers->count()} Admin user(s):");
        foreach ($adminUsers as $user) {
            $this->line("  - {$user->name} ({$user->email})");
        }

        $notificationsCreated = 0;
        $emailsSent = 0;
        $updateDateTime = Carbon::now()->format('F j, Y \a\t g:i A');

        foreach ($allSerials as $item) {
            // Build status history
            $statusHistory = $this->buildStatusHistory($item);
            
            // Get latest action description
            $latestAction = $this->getLatestActionDescription($item['current_status'], $item['supplier_name']);

            // Create in-app notification for admin
            try {
                UserNotification::create([
                    'type' => 'admin_serial_summary',
                    'title' => "Serial Update: {$item['serial_title']}",
                    'message' => "{$latestAction}",
                    'user_role' => 'admin',
                    'reference_id' => $item['subscription_id'],
                    'reference_type' => 'subscription',
                    'action_url' => '/dashboard-admin',
                    'is_read' => false,
                    'metadata' => [
                        'serial_title' => $item['serial_title'],
                        'serial_issn' => $item['issn'],
                        'supplier_name' => $item['supplier_name'],
                        'current_status' => $item['current_status'],
                        'status_history' => $statusHistory,
                    ],
                ]);
                $notificationsCreated++;
            } catch (\Exception $e) {
                $this->error("  ✗ Failed to create notification for {$item['serial_title']}: " . $e->getMessage());
            }

            // Send emails
            if ($sendEmail) {
                foreach ($adminUsers as $adminUser) {
                    try {
                        Mail::to($adminUser->email)->send(new AdminSerialSummaryNotification(
                            $item['serial_title'],
                            $item['current_status'],
                            $item['supplier_name'],
                            $updateDateTime,
                            $statusHistory,
                            $latestAction,
                            null,
                            $item['issn']
                        ));
                        $emailsSent++;
                        $this->line("  ✓ Admin summary sent to {$adminUser->email} for {$item['serial_title']}");
                    } catch (\Exception $e) {
                        $this->error("  ✗ Failed: {$adminUser->email}: " . $e->getMessage());
                        Log::error("Failed to send admin summary email: " . $e->getMessage());
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

    /**
     * Build status history for a serial
     */
    private function buildStatusHistory(array $item): array
    {
        $history = [];
        
        // Try to get from ProcessMovementLog
        $logs = ProcessMovementLog::where('record_id', $item['subscription_id'])
            ->where(function ($q) use ($item) {
                $q->where('record_title', 'like', "%{$item['serial_title']}%");
                if ($item['issn'] !== 'N/A') {
                    $q->orWhere('record_title', 'like', "%{$item['issn']}%");
                }
            })
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        foreach ($logs as $log) {
            $history[] = [
                'status' => $log->status_to ?? $log->action ?? 'unknown',
                'status_label' => ucfirst(str_replace('_', ' ', $log->status_to ?? $log->action ?? 'unknown')),
                'date' => $log->created_at ? $log->created_at->format('M j, Y') : 'N/A',
                'time' => $log->created_at ? $log->created_at->format('g:i A') : 'N/A',
                'actor' => $log->from_user_name ?? 'System',
                'description' => $log->remarks ?? null,
            ];
        }

        // If no history found, create entries based on current status
        if (empty($history)) {
            // Define status flow including for_return
            $statusFlow = ['created', 'accepted', 'prepare', 'for_delivery', 'received'];
            $statusActors = [
                'created' => 'TPU User',
                'accepted' => $item['supplier_name'],
                'prepare' => $item['supplier_name'],
                'for_delivery' => $item['supplier_name'],
                'received' => 'GSPS Team',
                'inspected' => 'Inspection Team',
                'for_return' => 'Inspection Team',
            ];
            
            $currentStatus = $item['current_status'];
            
            // Handle inspected or for_return (add them after received)
            if ($currentStatus === 'inspected' || $currentStatus === 'for_return') {
                // Add current status first (most recent)
                $history[] = [
                    'status' => $currentStatus,
                    'status_label' => $currentStatus === 'inspected' ? 'Delivered (Inspected)' : 'For Return',
                    'date' => Carbon::now()->subHours(1)->format('M j, Y'),
                    'time' => Carbon::now()->subHours(1)->format('g:i A'),
                    'actor' => $statusActors[$currentStatus] ?? 'Inspection Team',
                    'description' => $currentStatus === 'for_return' ? 'Serial marked for return due to issues' : 'Serial inspected and approved',
                ];
                
                // Add full journey backwards
                foreach (array_reverse($statusFlow) as $status) {
                    $history[] = [
                        'status' => $status,
                        'status_label' => $status === 'created' ? 'Subscription Created' : ucfirst(str_replace('_', ' ', $status)),
                        'date' => Carbon::now()->subDays(count($history))->format('M j, Y'),
                        'time' => Carbon::now()->subHours(count($history) + 2)->format('g:i A'),
                        'actor' => $statusActors[$status] ?? 'System',
                        'description' => $status === 'created' ? 'Serial subscription created and assigned to supplier' : null,
                    ];
                }
            } else {
                // Find current status in flow
                $currentIndex = array_search($currentStatus, $statusFlow);
                
                if ($currentIndex !== false) {
                    // Add statuses from current back to created
                    for ($i = $currentIndex; $i >= 0; $i--) {
                        $status = $statusFlow[$i];
                        $history[] = [
                            'status' => $status,
                            'status_label' => $status === 'created' ? 'Subscription Created' : ucfirst(str_replace('_', ' ', $status)),
                            'date' => Carbon::now()->subDays($currentIndex - $i)->format('M j, Y'),
                            'time' => Carbon::now()->subHours(($currentIndex - $i) * 3)->format('g:i A'),
                            'actor' => $statusActors[$status] ?? 'System',
                            'description' => $status === 'created' ? 'Serial subscription created and assigned to supplier' : null,
                        ];
                    }
                } else {
                    // Just show current status and created
                    $history[] = [
                        'status' => $currentStatus,
                        'status_label' => ucfirst(str_replace('_', ' ', $currentStatus)),
                        'date' => Carbon::now()->format('M j, Y'),
                        'time' => Carbon::now()->format('g:i A'),
                        'actor' => 'System',
                        'description' => null,
                    ];
                    $history[] = [
                        'status' => 'created',
                        'status_label' => 'Subscription Created',
                        'date' => Carbon::now()->subDays(1)->format('M j, Y'),
                        'time' => Carbon::now()->subDays(1)->format('g:i A'),
                        'actor' => 'TPU User',
                        'description' => 'Serial subscription created and assigned to supplier',
                    ];
                }
            }
        } else {
            // Add created status at the end if not already present
            $hasCreated = collect($history)->contains(function ($h) {
                return ($h['status'] === 'created') || (stripos($h['status_label'] ?? '', 'created') !== false);
            });
            
            if (!$hasCreated) {
                $history[] = [
                    'status' => 'created',
                    'status_label' => 'Subscription Created',
                    'date' => Carbon::now()->subDays(count($history) + 1)->format('M j, Y'),
                    'time' => '9:00 AM',
                    'actor' => 'TPU User',
                    'description' => 'Serial subscription created and assigned to supplier',
                ];
            }
        }

        return $history;
    }

    /**
     * Get latest action description
     */
    private function getLatestActionDescription(string $status, string $supplierName): string
    {
        $descriptions = [
            'accepted' => "Serial accepted by {$supplierName}",
            'prepare' => "Serial being prepared by {$supplierName}",
            'for_delivery' => "Serial ready for delivery from {$supplierName}",
            'received' => "Serial received by GSPS, pending inspection",
            'inspected' => "Serial inspected and marked as Delivered",
            'delivered' => "Serial delivered successfully",
            'for_return' => "Serial marked for return",
        ];

        return $descriptions[$status] ?? "Status updated to " . ucfirst(str_replace('_', ' ', $status));
    }
}
