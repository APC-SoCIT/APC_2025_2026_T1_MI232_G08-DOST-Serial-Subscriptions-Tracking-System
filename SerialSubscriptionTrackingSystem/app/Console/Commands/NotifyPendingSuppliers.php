<?php

namespace App\Console\Commands;

use App\Mail\PendingSupplierApproval;
use App\Models\SupplierAccount;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotifyPendingSuppliers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notify:pending-suppliers {--email : Also send email notifications}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send notifications to admins for all existing pending supplier accounts';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $pendingSuppliers = SupplierAccount::where('status', 'pending')->get();
        
        if ($pendingSuppliers->isEmpty()) {
            $this->info('No pending supplier accounts found.');
            return 0;
        }

        $this->info("Found {$pendingSuppliers->count()} pending supplier(s):");
        
        foreach ($pendingSuppliers as $supplier) {
            $this->line("  - {$supplier->company_name} ({$supplier->email})");
        }

        $adminUsers = User::whereRaw(['role' => ['$regex' => '^admin$', '$options' => 'i']])->get();
        
        if ($adminUsers->isEmpty()) {
            $this->warn('No admin users found to notify.');
            return 0;
        }

        $this->info("\nFound {$adminUsers->count()} admin user(s) to notify:");
        foreach ($adminUsers as $admin) {
            $this->line("  - {$admin->name} ({$admin->email})");
        }

        $notificationCount = 0;
        $emailCount = 0;

        $this->newLine();
        $this->info('Creating notifications...');

        foreach ($pendingSuppliers as $supplier) {
            // Create in-app notification
            try {
                UserNotification::createStatusNotification(
                    'admin',
                    'Supplier Account Pending Approval',
                    "A new supplier account '{$supplier->company_name}' requires your approval.",
                    [
                        'supplier_account_id' => (string)($supplier->_id ?? $supplier->id),
                        'company_name' => $supplier->company_name,
                        'contact_person' => $supplier->contact_person,
                        'email' => $supplier->email,
                        'status' => 'pending',
                    ],
                    'tpu'
                );
                $notificationCount++;
                $this->line("  [OK] In-app notification created for: {$supplier->company_name}");
            } catch (\Exception $e) {
                $this->error("  [FAIL] Notification for {$supplier->company_name}: " . $e->getMessage());
            }

            // Send email if --email flag is set
            if ($this->option('email')) {
                $createdAt = $supplier->created_at 
                    ? $supplier->created_at->format('F j, Y \a\t g:i A') 
                    : now()->format('F j, Y \a\t g:i A');
                
                foreach ($adminUsers as $admin) {
                    if ($admin->email) {
                        try {
                            Mail::to($admin->email)->send(new PendingSupplierApproval(
                                $supplier->company_name,
                                $supplier->contact_person ?? 'N/A',
                                $supplier->email ?? 'N/A',
                                $supplier->phone ?? 'N/A',
                                $supplier->address ?? 'N/A',
                                $createdAt
                            ));
                            $emailCount++;
                            $this->line("  [OK] Email sent to {$admin->email} for: {$supplier->company_name}");
                        } catch (\Exception $e) {
                            $this->error("  [FAIL] Email to {$admin->email}: " . $e->getMessage());
                        }
                    }
                }
            }
        }

        $this->newLine();
        $this->info("Summary:");
        $this->line("  - In-app notifications created: {$notificationCount}");
        if ($this->option('email')) {
            $this->line("  - Emails sent: {$emailCount}");
        } else {
            $this->line("  - Emails: Skipped (use --email flag to send)");
        }

        return 0;
    }
}
