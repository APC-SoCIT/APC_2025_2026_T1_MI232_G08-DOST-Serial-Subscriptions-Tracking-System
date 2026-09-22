<?php

namespace App\Http\Controllers;

use App\Models\SerialIssue;
use App\Models\Subscription;
use App\Services\ArchiveService;
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
        } elseif (isset(($subscription->serials ?? [])[(int) $issueNumber - 1])) {
            ArchiveService::restore($subscription, (int) $issueNumber - 1);
        } else {
            return response()->json(['success' => false, 'message' => 'Archived issue not found.'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Record restored successfully.']);
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
        return response()->json(['success' => true, 'restored' => $restored]);
    }
}
