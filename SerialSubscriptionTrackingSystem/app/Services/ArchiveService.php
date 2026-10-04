<?php

namespace App\Services;

use App\Models\SerialIssue;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class ArchiveService
{
    public const TERMINAL_STATUSES = ['delivered', 'for_return'];

    public static function completionDate(?SerialIssue $issue, array $serial = []): ?Carbon
    {
        foreach ([
            $issue?->inspected_at,
            $issue?->delivered_at,
            $serial['inspectedDate'] ?? null,
            $serial['inspection_date'] ?? null,
            $serial['dateInspected'] ?? null,
            $serial['dateDelivered'] ?? null,
            $serial['deliveryDate'] ?? null,
        ] as $date) {
            if ($date) {
                return Carbon::parse($date);
            }
        }

        return null;
    }

    public static function qualifies(?string $status, ?string $inspectionStatus, ?Carbon $completionDate, ?Carbon $now = null): bool
    {
        $terminal = self::isTerminal($status, $inspectionStatus);

        return $terminal && $completionDate && $completionDate->lessThanOrEqualTo(($now ?? now())->copy()->subYears(3));
    }

    public static function isTerminal(?string $status, ?string $inspectionStatus): bool
    {
        return in_array(strtolower((string) $status), self::TERMINAL_STATUSES, true)
            || in_array(strtolower((string) $inspectionStatus), self::TERMINAL_STATUSES, true);
    }

    /**
     * Who performed the archive/restore action. Falls back to a 'System' actor
     * for console-triggered calls (e.g. the scheduled archiveEligible() sweep)
     * where there is no authenticated user.
     */
    private static function actor(): array
    {
        $user = Auth::user();

        return [
            'archived_by' => $user ? $user->name : 'System',
            'archived_by_role' => $user ? strtolower((string) $user->role) : 'system',
        ];
    }

    public static function archive(Subscription $subscription, int $serialIndex, ?SerialIssue $issue = null): void
    {
        $actor = self::actor();

        $serials = $subscription->serials ?? [];
        if (isset($serials[$serialIndex])) {
            $serials[$serialIndex]['archived_at'] = now()->toISOString();
            $serials[$serialIndex]['archived_by'] = $actor['archived_by'];
            $serials[$serialIndex]['archived_by_role'] = $actor['archived_by_role'];
            $subscription->serials = $serials;
            $subscription->save();
        }

        if ($issue) {
            self::syncEmbeddedArchiveFlag($issue, true);
            $issue->archived_at = now();
            $issue->archived_by = $actor['archived_by'];
            $issue->archived_by_role = $actor['archived_by_role'];
            $issue->save();
        }

        AuditLogService::log(
            'archive',
            Subscription::class,
            (string) ($subscription->_id ?? $subscription->id),
            "Archived serial #" . ($serialIndex + 1) . " on subscription {$subscription->_id}"
        );
    }

    public static function archiveIssue(SerialIssue $issue): void
    {
        $actor = self::actor();

        $issue->archived_at = now();
        $issue->archived_by = $actor['archived_by'];
        $issue->archived_by_role = $actor['archived_by_role'];
        $issue->save();
        self::syncEmbeddedArchiveFlag($issue, true);

        AuditLogService::log(
            'archive',
            SerialIssue::class,
            (string) ($issue->_id ?? $issue->id),
            "Archived serial issue #{$issue->issue_number} for subscription {$issue->subscription_id}"
        );
    }

    public static function restore(Subscription $subscription, int $serialIndex, ?SerialIssue $issue = null): void
    {
        $serials = $subscription->serials ?? [];
        if (isset($serials[$serialIndex])) {
            unset(
                $serials[$serialIndex]['archived_at'],
                $serials[$serialIndex]['archived_by'],
                $serials[$serialIndex]['archived_by_role']
            );
            $subscription->serials = $serials;
            $subscription->save();
        }

        if ($issue) {
            self::syncEmbeddedArchiveFlag($issue, false);
            $issue->archived_at = null;
            $issue->archived_by = null;
            $issue->archived_by_role = null;
            $issue->save();
        }

        AuditLogService::log(
            'restore',
            Subscription::class,
            (string) ($subscription->_id ?? $subscription->id),
            "Restored serial #" . ($serialIndex + 1) . " on subscription {$subscription->_id}"
        );
    }

    public static function restoreIssue(SerialIssue $issue): void
    {
        $issue->archived_at = null;
        $issue->archived_by = null;
        $issue->archived_by_role = null;
        $issue->save();
        self::syncEmbeddedArchiveFlag($issue, false);

        AuditLogService::log(
            'restore',
            SerialIssue::class,
            (string) ($issue->_id ?? $issue->id),
            "Restored serial issue #{$issue->issue_number} for subscription {$issue->subscription_id}"
        );
    }

    private static function syncEmbeddedArchiveFlag(SerialIssue $issue, bool $archived): void
    {
        $subscription = Subscription::find($issue->subscription_id);
        if (!$subscription) return;

        $serials = $subscription->serials ?? [];
        $serialIndex = (int) $issue->issue_number - 1;
        if (!isset($serials[$serialIndex])) return;

        if ($archived) {
            $actor = self::actor();
            $serials[$serialIndex]['archived_at'] = now()->toISOString();
            $serials[$serialIndex]['archived_by'] = $actor['archived_by'];
            $serials[$serialIndex]['archived_by_role'] = $actor['archived_by_role'];
        } else {
            unset(
                $serials[$serialIndex]['archived_at'],
                $serials[$serialIndex]['archived_by'],
                $serials[$serialIndex]['archived_by_role']
            );
        }

        $subscription->serials = $serials;
        $subscription->save();
    }

    public static function archiveEligible(?Carbon $now = null): int
    {
        $count = 0;
        foreach (Subscription::cursor() as $subscription) {
            $issues = SerialIssue::where('subscription_id', (string) ($subscription->_id ?? $subscription->id))->get();
            foreach ($issues as $issue) {
                if ($issue->archived_at) {
                    continue;
                }
                if (self::qualifies($issue->status, $issue->inspection_status, self::completionDate($issue), $now)) {
                    self::archiveIssue($issue);
                    $count++;
                }
            }

            if ($issues->isEmpty()) {
                foreach (($subscription->serials ?? []) as $index => $serial) {
                    if (!empty($serial['archived_at'])) continue;
                    if (self::qualifies($serial['status'] ?? null, $serial['inspection_status'] ?? null, self::completionDate(null, $serial), $now)) {
                        self::archive($subscription, $index);
                        $count++;
                    }
                }
            }
        }

        return $count;
    }
}