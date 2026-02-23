<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\ProcessMovementLog;
use App\Models\DeliveryNotification;
use Illuminate\Console\Command;
use Carbon\Carbon;

class CleanupOldLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logs:cleanup {--days=90 : Number of days to keep logs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up old audit logs, process movement logs, and delivery notifications';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoffDate = Carbon::now()->subDays($days);

        $this->info("Cleaning up logs older than {$days} days (before {$cutoffDate->toDateString()})...");

        try {
            // Clean audit logs
            $auditDeleted = AuditLog::where('created_at', '<', $cutoffDate)->delete();
            $this->info("Deleted {$auditDeleted} audit log entries.");

            // Clean process movement logs
            $movementDeleted = ProcessMovementLog::where('created_at', '<', $cutoffDate)->delete();
            $this->info("Deleted {$movementDeleted} process movement log entries.");

            // Clean old delivery notifications (read ones, older than 30 days)
            $notificationCutoff = Carbon::now()->subDays(30);
            $notificationDeleted = DeliveryNotification::where('created_at', '<', $notificationCutoff)
                ->where('is_read', true)
                ->delete();
            $this->info("Deleted {$notificationDeleted} old delivery notifications.");

            $this->info('Log cleanup completed successfully.');
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Failed to cleanup logs: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
