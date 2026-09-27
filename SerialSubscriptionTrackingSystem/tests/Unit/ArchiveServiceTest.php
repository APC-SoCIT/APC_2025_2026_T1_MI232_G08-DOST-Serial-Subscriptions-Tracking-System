<?php

namespace Tests\Unit;

use App\Services\ArchiveService;
use Carbon\Carbon;
use Tests\TestCase;

class ArchiveServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_terminal_record_at_exact_three_year_boundary_qualifies(): void
    {
        $now = Carbon::create(2026, 9, 14, 12);
        Carbon::setTestNow($now);

        $this->assertTrue(ArchiveService::qualifies('delivered', null, $now->copy()->subYears(3), $now));
        $this->assertTrue(ArchiveService::qualifies('for_return', null, $now->copy()->subYears(3)->subSecond(), $now));
        $this->assertFalse(ArchiveService::qualifies(null, 'inspected', $now->copy()->subYears(3), $now));
    }

    public function test_recent_and_non_terminal_records_do_not_qualify(): void
    {
        $now = Carbon::create(2026, 9, 14, 12);
        Carbon::setTestNow($now);

        $this->assertFalse(ArchiveService::qualifies('delivered', null, $now->copy()->subYears(3)->addSecond(), $now));
        $this->assertFalse(ArchiveService::qualifies('prepare', null, $now->copy()->subYears(20), $now));
        $this->assertFalse(ArchiveService::qualifies('for_delivery', null, $now->copy()->subYears(20), $now));
    }
}
