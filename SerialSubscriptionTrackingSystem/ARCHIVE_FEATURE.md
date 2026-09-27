# Archive Feature

## Behavior

- Serial issues and embedded subscription serial records use `archived_at` as the archive flag.
- Archived records are retained, read-only, and excluded from active subscription, delivery, inspection, issue, dashboard, and chart queries.
- TPU can archive terminal records manually before three years and restore them from `/archive`.
- Admin can search and filter the Archive page but cannot archive or restore.
- GSPS, Inspection, and Supplier have no Archive route or navigation item.
- Customer Satisfaction data remains independent of archive filtering and continues to resolve archived deliveries by subscription ID and serial index.

## Automatic Scheduler

The scheduled command is:

```text
php artisan archive:eligible-records
```

It is registered in `routes/console.php` to run daily at `02:00`:

```text
php artisan schedule:run
```

The command archives records whose terminal status is Delivered, Inspected, Returned, or For Return and whose completion timestamp is at least three years old. Preparing and For Delivery records never qualify.

## Verification

Backdated MongoDB fixtures were created temporarily and removed after verification. Running `php artisan archive:eligible-records` produced:

- Exact three-year Delivered fixture: archived in both Subscription.serials and SerialIssue.
- Older Returned fixture: archived in both representations.
- One-day-newer Delivered fixture: remained active.
- Ten-year-old Preparing fixture: remained active.
- Manual archive/restore: `archived_at` set, then cleared; record remained present.
- `php artisan schedule:run`: scheduler entry point executed and reported no commands ready because the current time was outside the daily 02:00 window.

Deterministic Carbon tests are in `tests/Unit/ArchiveServiceTest.php` and verify the exact boundary, newer-than-three-years exclusion, and non-terminal exclusion.

## Validation

- `npm run build`: passed.
- `php artisan test tests/Unit/ArchiveServiceTest.php`: 2 tests, 6 assertions passed.
- Full `php artisan test`: archive tests passed, but the existing SQLite-backed feature tests could not run because the PHP SQLite PDO driver is unavailable in this environment (`could not find driver`).
