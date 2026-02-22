<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Commands
|--------------------------------------------------------------------------
|
| Here you may define your scheduled commands. These commands will be run
| automatically by Laravel's task scheduler.
|
*/

// Send delivery reminder notifications daily at 8:00 AM
Schedule::command('notifications:send-delivery-reminders')
    ->dailyAt('08:00')
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground();

// Cleanup old logs weekly on Sunday at 3:00 AM
Schedule::command('logs:cleanup --days=90')
    ->weeklyOn(0, '03:00')
    ->withoutOverlapping()
    ->onOneServer();
