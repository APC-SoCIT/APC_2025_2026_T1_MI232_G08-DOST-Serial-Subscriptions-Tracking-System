<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Subscription;
use App\Models\SerialIssue;
use Carbon\Carbon;

echo "==============================================\n";
echo "Fixing Expected Delivery Dates for ALL Subscriptions\n";
echo "==============================================\n\n";

$subscriptions = Subscription::all();
$fixedCount = 0;
$updatedIssuesCount = 0;

foreach ($subscriptions as $sub) {
    if (!$sub->frequency) {
        continue;
    }

    echo "Processing: " . $sub->serial_title . " (Frequency: " . ucfirst($sub->frequency) . ")\n";

    // Get start date
    $startDate = $sub->created_at ?? Carbon::now();
    if ($sub->serials && count($sub->serials) > 0 && isset($sub->serials[0]['deliveryDate'])) {
        try {
            $startDate = Carbon::parse($sub->serials[0]['deliveryDate']);
        } catch (\Exception $e) {
            // Use created_at
        }
    }

    // Get all issues for this subscription
    $issues = SerialIssue::where('subscription_id', (string)($sub->_id ?? $sub->id))->orderBy('issue_number')->get();

    if ($issues->isEmpty()) {
        echo "  ✓ No issues to update\n\n";
        continue;
    }

    $frequency = strtolower($sub->frequency ?? 'monthly');
    $issuesUpdated = 0;

    foreach ($issues as $issue) {
        // Calculate expected date based on frequency
        $offset = $issue->issue_number - 1;

        $expectedDate = match($frequency) {
            'weekly' => $startDate->copy()->addWeeks($offset),
            'biweekly' => $startDate->copy()->addWeeks($offset * 2),
            'monthly' => $startDate->copy()->addMonths($offset),
            'quarterly' => $startDate->copy()->addMonths($offset * 3),
            'annually',
            'annual' => $startDate->copy()->addYears($offset),
            default => $startDate->copy()->addMonths($offset),
        };

        // Only update if NULL
        if (!$issue->expected_delivery_date) {
            $issue->expected_delivery_date = $expectedDate;
            $issue->save();
            $issuesUpdated++;
            $updatedIssuesCount++;
        }
    }

    if ($issuesUpdated > 0) {
        echo "  ✓ Updated {$issuesUpdated} issue(s)\n";
        echo "    Start: " . $startDate->format('M d, Y') . "\n";
        foreach ($issues as $issue) {
            echo "    Issue #" . $issue->issue_number . ": " . $issue->expected_delivery_date->format('M d, Y') . "\n";
        }
        $fixedCount++;
    } else {
        echo "  ✓ All issues already have delivery dates\n";
    }

    echo "\n";
}

echo "==============================================\n";
echo "Summary:\n";
echo "  - Subscriptions with updates: {$fixedCount}\n";
echo "  - Total issues updated: {$updatedIssuesCount}\n";
echo "==============================================\n";
echo "\nAll frequency types (weekly, biweekly, monthly, quarterly, annually)\n";
echo "are now properly calculating expected delivery dates!\n";
