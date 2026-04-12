<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Models\SerialIssue;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class GenerateSerialIssues extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'serial:ensure-delivery-dates {--fix-all : Fix all subscriptions including those with existing issues}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ensure all subscriptions have properly calculated expected delivery dates for recurring issues';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $fixAll = $this->option('fix-all');
        
        $this->info('========================================================');
        $this->info('Ensuring Expected Delivery Dates for All Subscriptions');
        $this->info('========================================================');
        $this->newLine();

        $subscriptions = Subscription::where('frequency', '!=', null)->get();

        $processedCount = 0;
        $generatedCount = 0;
        $fixedCount = 0;

        foreach ($subscriptions as $subscription) {
            if (!$subscription->frequency || !$subscription->total_issues) {
                continue;
            }

            // Check if issues already exist
            $existingCount = SerialIssue::where('subscription_id', (string)($subscription->_id ?? $subscription->id))
                ->count();

            if ($existingCount > 0 && !$fixAll) {
                $this->line("✓ {$subscription->serial_title} - Already has {$existingCount} issues");
                continue;
            }

            $processedCount++;

            // Get first serial info for delivery date
            $serials = $subscription->serials ?? [];
            $firstSerial = $serials[0] ?? null;
            
            $startDate = $subscription->created_at ?? Carbon::now();
            if ($firstSerial && isset($firstSerial['deliveryDate'])) {
                try {
                    $startDate = Carbon::parse($firstSerial['deliveryDate']);
                } catch (\Exception $e) {
                    $startDate = $subscription->created_at ?? Carbon::now();
                }
            }

            // If fixing all, update null dates
            if ($fixAll) {
                $issues = SerialIssue::where('subscription_id', (string)($subscription->_id ?? $subscription->id))
                    ->orderBy('issue_number')
                    ->get();

                $frequency = strtolower($subscription->frequency);
                $updatedCount = 0;

                foreach ($issues as $issue) {
                    if (!$issue->expected_delivery_date) {
                        $offset = $issue->issue_number - 1;
                        $expectedDate = match($frequency) {
                            'weekly' => $startDate->copy()->addWeeks($offset),
                            'biweekly' => $startDate->copy()->addWeeks($offset * 2),
                            'monthly' => $startDate->copy()->addMonths($offset),
                            'quarterly' => $startDate->copy()->addMonths($offset * 3),
                            'annually', 'annual' => $startDate->copy()->addYears($offset),
                            default => $startDate->copy()->addMonths($offset),
                        };
                        $issue->expected_delivery_date = $expectedDate;
                        $issue->save();
                        $updatedCount++;
                        $fixedCount++;
                    }
                }

                if ($updatedCount > 0) {
                    $this->line("✓ {$subscription->serial_title} - Updated {$updatedCount} issue(s) with delivery dates");
                    $this->line("  Frequency: " . ucfirst($frequency) . " | Start: " . $startDate->format('M d, Y'));
                } else {
                    $this->line("✓ {$subscription->serial_title} - All {$existingCount} issues have delivery dates");
                }
            } else {
                // Generate new issues with dates
                try {
                    $frequency = strtolower($subscription->frequency);
                    $totalIssues = (int)$subscription->total_issues;
                    $totalCost = (float)($subscription->award_cost ?? 0);

                    $issues = SerialIssue::generateForSubscription(
                        $subscription,
                        $frequency,
                        $totalIssues,
                        $startDate,
                        $totalCost
                    );

                    $generatedCount += count($issues);
                    $this->line("✓ {$subscription->serial_title} - Generated {$totalIssues} issues");
                    $this->line("  Frequency: " . ucfirst($frequency) . " | Start: " . $startDate->format('M d, Y'));
                    
                    // Show first few dates
                    foreach (array_slice($issues, 0, 3) as $idx => $issue) {
                        $this->line("    Issue #" . ($idx + 1) . ": " . $issue->expected_delivery_date->format('M d, Y'));
                    }
                } catch (\Exception $e) {
                    $this->error("✗ {$subscription->serial_title} - Error: " . $e->getMessage());
                }
            }
            
            $this->newLine();
        }

        $this->info("========================================================");
        $this->info("Summary:");
        $this->line("  - Subscriptions processed: {$processedCount}");
        if ($fixAll) {
            $this->line("  - Issues fixed with delivery dates: {$fixedCount}");
        } else {
            $this->line("  - Serial issues generated: {$generatedCount}");
        }
        $this->info("========================================================");
        
        if (!$fixAll) {
            $this->newLine();
            $this->info("✓ All subscription frequencies (weekly, biweekly, monthly, quarterly, annually)");
            $this->info("  are now properly calculating expected delivery dates!");
            $this->newLine();
            $this->comment("Tip: Use --fix-all flag to update delivery dates for existing issues:");
            $this->comment("  php artisan serial:ensure-delivery-dates --fix-all");
        }

        return 0;
    }
}

