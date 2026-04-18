<?php

namespace App\Console\Commands;

use App\Services\DeliveryNotificationService;
use Illuminate\Console\Command;

class SendDeliveryNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:send-delivery-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send delivery reminder notifications to suppliers (3 days before and daily until delivery)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting delivery notification generation...');

        try {
            $results = DeliveryNotificationService::generateDeliveryNotifications();

            $this->info("Notifications generated: {$results['generated']}");
            $this->info("Notifications skipped (already sent): {$results['skipped']}");

            if (!empty($results['errors'])) {
                $this->error('Errors encountered:');
                foreach ($results['errors'] as $error) {
                    $this->error("  - {$error}");
                }
                return Command::FAILURE;
            }

            $this->info('Delivery notification generation completed successfully.');
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Failed to generate delivery notifications: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
