<?php

namespace App\Console\Commands;

use App\Services\ArchiveService;
use Illuminate\Console\Command;

class ArchiveEligibleRecords extends Command
{
    protected $signature = 'archive:eligible-records';
    protected $description = 'Archive terminal serial delivery records completed at least three years ago';

    public function handle(): int
    {
        $count = ArchiveService::archiveEligible();
        $this->info("Archived {$count} eligible record(s).");
        return self::SUCCESS;
    }
}