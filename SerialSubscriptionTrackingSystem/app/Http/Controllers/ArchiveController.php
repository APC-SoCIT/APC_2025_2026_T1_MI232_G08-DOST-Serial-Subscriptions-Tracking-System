<?php

namespace App\Http\Controllers;

use App\Models\SerialIssue;
use App\Models\Subscription;
use App\Services\ArchiveService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ArchiveController extends Controller
{
    public function page()
    {
        return Inertia::render('Archive');
    }

     public function index(Request $request)
    {
        $records = collect();
        foreach (Subscription::orderBy('created_at', 'desc')->get() as $subscription) {
            $issues = SerialIssue::where('subscription_id', (string) ($subscription->_id ?? $subscription->id))
                ->whereNotNull('archived_at')->get()->keyBy('issue_number');

            foreach ($issues as $issue) {
                $serial = ($subscription->serials ?? [])[0] ?? [];
                $records->push([
                    'subscription_id' => (string) ($subscription->_id ?? $subscription->id),
                    'issue_id' => $issue ? (string) ($issue->_id ?? $issue->id) : null,
                    'issue_number' => $issue->issue_number,
                    'title' => $serial['serialTitle'] ?? $serial['title'] ?? $subscription->serial_title,
                    'issn' => $serial['issn'] ?? $subscription->issn,
                    'supplier_name' => $subscription->supplier_name,
                    'status' => $issue?->status ?? ($serial['status'] ?? null),
                    'inspection_status' => $issue?->inspection_status ?? ($serial['inspection_status'] ?? null),
                    'completion_date' => ArchiveService::completionDate($issue, $serial),
                    'archived_at' => $issue->archived_at,
                    'award_cost' => $subscription->award_cost,
                    'period' => $subscription->period,
                    'author_publisher' => $subscription->author_publisher ?: ($serial['authorPublisher'] ?? $serial['author_publisher'] ?? ''),
                    'language' => $serial['language'] ?? 'English',
                    'frequency' => $subscription->frequency ?: ($serial['frequency'] ?? ''),
                    'category' => $subscription->category ?: ($serial['category'] ?? ''),
                ]);
            }

            if ($issues->isEmpty()) {
                foreach (($subscription->serials ?? []) as $index => $serial) {
                    if (empty($serial['archived_at'])) continue;
                    $records->push([
                        'subscription_id' => (string) ($subscription->_id ?? $subscription->id),
                        'serial_index' => $index,
                        'issue_id' => null,
                        'issue_number' => $index + 1,
                        'title' => $serial['serialTitle'] ?? $serial['title'] ?? $subscription->serial_title,
                        'issn' => $serial['issn'] ?? $subscription->issn,
                        'supplier_name' => $subscription->supplier_name,
                        'status' => $serial['status'] ?? null,
                        'inspection_status' => $serial['inspection_status'] ?? null,
                        'completion_date' => ArchiveService::completionDate(null, $serial),
                        'archived_at' => $serial['archived_at'],
                        'award_cost' => $subscription->award_cost,
                        'period' => $subscription->period,
                        'author_publisher' => $subscription->author_publisher ?: ($serial['authorPublisher'] ?? $serial['author_publisher'] ?? ''),
                        'language' => $serial['language'] ?? 'English',
                        'frequency' => $subscription->frequency ?: ($serial['frequency'] ?? ''),
                        'category' => $subscription->category ?: ($serial['category'] ?? ''),
                    ]);
                }
            }
        }

        $search = strtolower((string) $request->get('search', ''));
        $status = strtolower((string) $request->get('status', 'all'));
        $records = $records->filter(function ($record) use ($search, $status) {
            $matchesSearch = !$search || str_contains(strtolower((string) $record['title']), $search)
                || str_contains(strtolower((string) $record['issn']), $search)
                    || str_contains(strtolower((string) $record['supplier_name']), $search)
                    || str_contains((string) $record['issue_number'], $search)
                    || str_contains(strtolower((string) $record['status']), $search);
            $matchesStatus = $status === 'all' || strtolower((string) $record['status']) === $status;
            return $matchesSearch && $matchesStatus;
        })->values();

        return response()->json(['success' => true, 'records' => $records, 'can_manage' => auth()->user()?->role === 'tpu']);
    }

    public function archive(Request $request, $subscriptionId, $issueNumber)
    {
        $subscription = Subscription::find($subscriptionId);
        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'Serial record not found.'], 404);
        }

        $issue = SerialIssue::where('subscription_id', (string) $subscriptionId)
            ->where('issue_number', (int) $issueNumber)->first();
        if (!$issue || !ArchiveService::isTerminal($issue->status, $issue->inspection_status)) {
            return response()->json(['success' => false, 'message' => 'Only completed terminal records can be archived.'], 422);
        }
        ArchiveService::archiveIssue($issue);

        AuditLogService::log(
            'archive',
            SerialIssue::class,
            (string) ($issue->_id ?? $issue->id),
            "Archived Issue #{$issue->issue_number} of \"{$subscription->serial_title}\" ({$subscription->supplier_name})"
        );

        return response()->json(['success' => true, 'message' => 'Record archived successfully.']);
    }

    public function restore(Request $request, $subscriptionId, $issueNumber)
    {
        $subscription = Subscription::find($subscriptionId);
        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'Serial record not found.'], 404);
        }

        $issue = SerialIssue::where('subscription_id', (string) $subscriptionId)
            ->where('issue_number', (int) $issueNumber)->first();
        if ($issue) {
            ArchiveService::restoreIssue($issue);

            AuditLogService::log(
                'restore',
                SerialIssue::class,
                (string) ($issue->_id ?? $issue->id),
                "Restored Issue #{$issue->issue_number} of \"{$subscription->serial_title}\" ({$subscription->supplier_name})"
            );
        } elseif (isset(($subscription->serials ?? [])[(int) $issueNumber - 1])) {
            ArchiveService::restore($subscription, (int) $issueNumber - 1);

            AuditLogService::log(
                'restore',
                Subscription::class,
                (string) ($subscription->_id ?? $subscription->id),
                "Restored Issue #{$issueNumber} of \"{$subscription->serial_title}\" ({$subscription->supplier_name})"
            );
        } else {
            return response()->json(['success' => false, 'message' => 'Archived issue not found.'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Record restored successfully.']);
    }

     /**
     * Archive an entire serial title (subscription) at once, along with every
     * one of its issues — only when the subscription's own status is exactly
     * "Delivered" (i.e. every issue has already been delivered, none left
     * For Return). This intentionally reuses the same per-issue archiving
     * mechanism as archive()/bulkArchive() rather than introducing a new
     * "archived" concept on the Subscription model itself: once every issue
     * under a subscription has archived_at set, hasActiveRecords() already
     * returns false for it, so it naturally disappears from every active
     * listing (Subscription Tracking, Monitor Delivery, GSPS, Inspection)
     * without any schema change.
     */
    public function archiveSubscription(Request $request, $subscriptionId)
    {
        $subscription = Subscription::find($subscriptionId);
        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'Serial title not found.'], 404);
        }

        $status = strtolower((string) $subscription->status);
        if ($status !== 'delivered') {
            return response()->json([
                'success' => false,
                'message' => 'Only serial titles with a Delivered status can be archived.',
            ], 422);
        }

        $issues = SerialIssue::where('subscription_id', (string) ($subscription->_id ?? $subscription->id))
            ->whereNull('archived_at')
            ->get();

        if ($issues->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'This serial title has no issues available to archive.',
            ], 422);
        }

        foreach ($issues as $issue) {
            ArchiveService::archiveIssue($issue);
        }

        AuditLogService::log(
            'archive',
            Subscription::class,
            (string) ($subscription->_id ?? $subscription->id),
            "Archived serial title \"{$subscription->serial_title}\" ({$subscription->supplier_name}) — {$issues->count()} issue(s)"
        );

        return response()->json([
            'success' => true,
            'message' => 'Serial title archived successfully.',
            'archived_count' => $issues->count(),
        ]);
    }

    public function bulkArchive(Request $request)
    {
        $validated = $request->validate(['records' => ['required', 'array', 'min:1'], 'records.*.subscription_id' => ['required', 'string'], 'records.*.issue_number' => ['required', 'integer', 'min:1']]);
        $archived = 0;
        foreach ($validated['records'] as $record) {
            $issue = SerialIssue::where('subscription_id', $record['subscription_id'])->where('issue_number', $record['issue_number'])->first();
            if ($issue && ArchiveService::isTerminal($issue->status, $issue->inspection_status) && !$issue->archived_at) {
                ArchiveService::archiveIssue($issue);
                $archived++;
            }
        }

        if ($archived > 0) {
            AuditLogService::log('archive', SerialIssue::class, null, "Bulk archived {$archived} record(s)");
        }

        return response()->json(['success' => true, 'archived' => $archived]);
    }

    public function bulkRestore(Request $request)
    {
        $validated = $request->validate(['records' => ['required', 'array', 'min:1'], 'records.*.subscription_id' => ['required', 'string'], 'records.*.issue_number' => ['required', 'integer', 'min:1']]);
        $restored = 0;
        foreach ($validated['records'] as $record) {
            $issue = SerialIssue::where('subscription_id', $record['subscription_id'])->where('issue_number', $record['issue_number'])->whereNotNull('archived_at')->first();
            if ($issue) {
                ArchiveService::restoreIssue($issue);
                $restored++;
            }
        }

        if ($restored > 0) {
            AuditLogService::log('restore', SerialIssue::class, null, "Bulk restored {$restored} record(s)");
        }

        return response()->json(['success' => true, 'restored' => $restored]);
    }
}