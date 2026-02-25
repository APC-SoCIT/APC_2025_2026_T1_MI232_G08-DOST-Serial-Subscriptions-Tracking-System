<?php

namespace App\Console\Commands;

use App\Models\SupplierAccount;
use App\Models\User;
use App\Models\UserNotification;
use App\Mail\SupplierApprovedNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotifyApprovedSuppliers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notify:approved-suppliers {--email : Also send email notifications}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send notifications to TPU users about approved suppliers (for existing data)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $sendEmail = $this->option('email');

        // Get all approved suppliers
        $approvedSuppliers = SupplierAccount::where('status', 'approved')->get();

        if ($approvedSuppliers->isEmpty()) {
            $this->info('No approved suppliers found.');
            return 0;
        }

        $this->info("Found {$approvedSuppliers->count()} approved supplier(s):");
        foreach ($approvedSuppliers as $supplier) {
            $this->line("  - {$supplier->company_name} ({$supplier->email})");
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

        foreach ($approvedSuppliers as $supplier) {
            // Create in-app notification for TPU
            try {
                $approverName = 'Admin';
                if ($supplier->approved_by) {
                    $approver = User::find($supplier->approved_by);
                    if ($approver) {
                        $approverName = $approver->name;
                    }
                }

                $approvedAt = $supplier->approved_at 
                    ? \Carbon\Carbon::parse($supplier->approved_at)->format('F j, Y \a\t g:i A')
                    : 'Unknown date';

                UserNotification::create([
                    'type' => 'supplier_approved',
                    'title' => 'Supplier Approved',
                    'message' => "The supplier '{$supplier->company_name}' has been approved by {$approverName}.",
                    'user_role' => 'tpu',
                    'reference_id' => $supplier->_id ?? $supplier->id,
                    'reference_type' => 'supplier_account',
                    'action_url' => '/dashboard-tpu',
                    'is_read' => false,
                ]);
                $notificationsCreated++;

                // Send email to each TPU user
                if ($sendEmail) {
                    foreach ($tpuUsers as $tpuUser) {
                        try {
                            Mail::to($tpuUser->email)->send(new SupplierApprovedNotification(
                                $supplier->company_name,
                                $supplier->contact_person,
                                $supplier->email,
                                $approverName,
                                $approvedAt
                            ));
                            $emailsSent++;
                            $this->line("  ✓ Email sent to {$tpuUser->email} about {$supplier->company_name}");
                        } catch (\Exception $e) {
                            $this->error("  ✗ Failed to send email to {$tpuUser->email}: {$e->getMessage()}");
                            Log::error("Failed to send supplier approval email to {$tpuUser->email}: " . $e->getMessage());
                        }
                    }
                }
            } catch (\Exception $e) {
                $this->error("  ✗ Failed to create notification for {$supplier->company_name}: {$e->getMessage()}");
                Log::error("Failed to create notification for supplier {$supplier->company_name}: " . $e->getMessage());
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
