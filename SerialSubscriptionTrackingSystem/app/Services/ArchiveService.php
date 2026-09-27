<?php

namespace App\Services;

use App\Models\SerialIssue;
use App\Models\Subscription;
use Carbon\Carbon;

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

    public static function archive(Subscription $subscription, int $serialIndex, ?SerialIssue $issue = null): void
    {
        $serials = $subscription->serials ?? [];
        if (isset($serials[$serialIndex])) {
            $serials[$serialIndex]['archived_at'] = now()->toISOString();
            $subscription->serials = $serials;
            $subscription->save();
        }

        if ($issue) {
            self::syncEmbeddedArchiveFlag($issue, true);
            $issue->archived_at = now();
            $issue->save();
        }
    }

    public static function archiveIssue(SerialIssue $issue): void
    {
        $issue->archived_at = now();
        $issue->save();
        self::syncEmbeddedArchiveFlag($issue, true);
    }

    public static function restore(Subscription $subscription, int $serialIndex, ?SerialIssue $issue = null): void
    {
        $serials = $subscription->serials ?? [];
        if (isset($serials[$serialIndex])) {
            unset($serials[$serialIndex]['archived_at']);
            $subscription->serials = $serials;
            $subscription->save();
        }

        if ($issue) {
            self::syncEmbeddedArchiveFlag($issue, false);
            $issue->archived_at = null;
            $issue->save();
        }
    }

    public static function restoreIssue(SerialIssue $issue): void
    {
        $issue->archived_at = null;
        $issue->save();
        self::syncEmbeddedArchiveFlag($issue, false);
    }

    private static function syncEmbeddedArchiveFlag(SerialIssue $issue, bool $archived): void
    {
        $subscription = Subscription::find($issue->subscription_id);
        if (!$subscription) return;

        $serials = $subscription->serials ?? [];
        $serialIndex = (int) $issue->issue_number - 1;
        if (!isset($serials[$serialIndex])) return;

        if ($archived) {
            $serials[$serialIndex]['archived_at'] = now()->toISOString();
        } else {
            unset($serials[$serialIndex]['archived_at']);
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