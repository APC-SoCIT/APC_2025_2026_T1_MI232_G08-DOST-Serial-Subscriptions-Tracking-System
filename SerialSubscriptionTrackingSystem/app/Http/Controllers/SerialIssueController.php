<?php

namespace App\Http\Controllers;

use App\Models\SerialIssue;
use App\Models\Subscription;
use App\Services\AuditLogService;
use App\Services\ProcessMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SerialIssueController extends Controller
{
    /**
     * Get all serial issues for a subscription
     */
    public function index(Request $request, $subscriptionId)
    {
        $subscription = Subscription::find($subscriptionId);

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription not found',
            ], 404);
        }

        $query = SerialIssue::forSubscription($subscriptionId)
            ->orderBy('issue_number', 'asc');

        // Filter by status if provided
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $issues = $query->get();

        // Calculate summary statistics
        $totalIssues = $issues->count();
        $deliveredIssues = $issues->where('status', SerialIssue::STATUS_DELIVERED)->count();
        $returnedIssues = $issues->where('status', SerialIssue::STATUS_FOR_RETURN)->count();
        $pendingIssues = $issues->whereNotIn('status', [SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN])->count();
        $deliveredCost = $issues->where('status', SerialIssue::STATUS_DELIVERED)->sum('cost');

        return response()->json([
            'success' => true,
            'issues' => $issues,
            'summary' => [
                'total_issues' => $totalIssues,
                'delivered_issues' => $deliveredIssues,
                'returned_issues' => $returnedIssues,
                'pending_issues' => $pendingIssues,
                'delivered_cost' => $deliveredCost,
                'total_cost' => $subscription->award_cost ?? 0,
                'remaining_cost' => max(0, ($subscription->award_cost ?? 0) - $deliveredCost),
            ],
        ]);
    }

    /**
     * Get a single serial issue
     */
    public function show($subscriptionId, $issueId)
    {
        $issue = SerialIssue::where('subscription_id', $subscriptionId)
            ->where('_id', $issueId)
            ->first();

        if (!$issue) {
            return response()->json([
                'success' => false,
                'message' => 'Serial issue not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'issue' => $issue,
        ]);
    }

    /**
     * Update serial issue status (Supplier: accept, prepare, for_delivery)
     */
    public function updateStatus(Request $request, $subscriptionId, $issueId)
    {
        $issue = SerialIssue::where('subscription_id', $subscriptionId)
            ->where('_id', $issueId)
            ->first();

        if (!$issue) {
            return response()->json([
                'success' => false,
                'message' => 'Serial issue not found',
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:pending,accepted,prepare,for_delivery,received,delivered,for_return',
            'notes' => 'nullable|string',
        ]);

        $oldStatus = $issue->status;
        $issue->status = $validated['status'];
        
        if (isset($validated['notes'])) {
            $issue->notes = $validated['notes'];
        }

        // Set timestamps for each status transition
        if ($validated['status'] === SerialIssue::STATUS_PREPARE && !$issue->prepared_at) {
            $issue->prepared_at = now();
        }
        if ($validated['status'] === SerialIssue::STATUS_FOR_DELIVERY && !$issue->for_delivery_at) {
            $issue->for_delivery_at = now();
        }
        if ($validated['status'] === SerialIssue::STATUS_RECEIVED && !$issue->received_at) {
            $issue->received_at = now();
        }

        $issue->save();

        // Sync status to Subscription.serials array and log process movement
        $subscription = Subscription::find($subscriptionId);
        if ($subscription) {
            // Sync status to serials array
            $serials = $subscription->serials ?? [];
            $serialIndex = $issue->issue_number - 1;
            if (isset($serials[$serialIndex])) {
                $serials[$serialIndex]['status'] = $validated['status'];
                $subscription->serials = $serials;
                $subscription->save();
            }

            // Log process movement
            $actionMap = [
                'prepare' => 'preparing',
                'for_delivery' => 'ready_for_delivery',
                'received' => 'receive',
                'delivered' => 'deliver',
                'for_return' => 'return',
            ];
            $action = $actionMap[$validated['status']] ?? 'status_change';

            ProcessMovementService::logMovement(
                'subscription',
                (string) $subscription->_id,
                $subscription->serial_title . " - Issue #{$issue->issue_number}",
                null, // current user
                null,
                $oldStatus,
                $validated['status'],
                $action,
                "Issue #{$issue->issue_number} status changed from {$oldStatus} to {$validated['status']}",
                ['issue_id' => (string) $issue->_id, 'issue_number' => $issue->issue_number]
            );

            AuditLogService::log(
                'update',
                SerialIssue::class,
                (string) $issue->_id,
                "Serial Issue #{$issue->issue_number} status changed from '{$oldStatus}' to '{$validated['status']}'",
                ['status' => $oldStatus],
                ['status' => $validated['status']]
            );

            // Create notification for status change
            ProcessMovementService::createStatusNotifications(
                $validated['status'],
                $subscription->serial_title . " - Issue #{$issue->issue_number}",
                (string) $subscriptionId,
                "ISSUE-{$issue->issue_number}",
                $subscription->supplier_name,
                (string) $issue->_id,
                auth()->user()?->role ?? 'system',
                auth()->user()?->name ?? 'System'
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Serial issue status updated successfully',
            'issue' => $issue,
        ]);
    }

    /**
     * Mark issue as received (GSPS)
     */
    public function markReceived(Request $request, $subscriptionId, $issueId)
    {
        $issue = SerialIssue::where('subscription_id', $subscriptionId)
            ->where('_id', $issueId)
            ->first();

        if (!$issue) {
            return response()->json([
                'success' => false,
                'message' => 'Serial issue not found',
            ], 404);
        }

        // Validate current status allows receiving
        if (!in_array($issue->status, [SerialIssue::STATUS_FOR_DELIVERY])) {
            return response()->json([
                'success' => false,
                'message' => 'Serial issue must be "For Delivery" to mark as received',
            ], 400);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,gif,webp,pdf|max:10240',
        ]);

        $oldStatus = $issue->status;
        $issue->status = SerialIssue::STATUS_RECEIVED;
        $issue->received_at = now();
        
        if (isset($validated['notes'])) {
            $issue->notes = $validated['notes'];
        }

        // Handle file upload if provided
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = 'serial_' . (string)$issue->subscription_id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $uploadPath = public_path('uploads/serial-attachments');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }
            $file->move($uploadPath, $filename);
            $issue->attachment_url = '/uploads/serial-attachments/' . $filename;
        }

        $issue->save();

        // Sync status to Subscription.serials array
        $subscription = Subscription::find($subscriptionId);
        if ($subscription) {
            $serials = $subscription->serials ?? [];
            foreach ($serials as $index => &$serial) {
                // Match by issue number (since serials array doesn't have issue ID)
                if (($index + 1) === $issue->issue_number) {
                    $serial['status'] = SerialIssue::STATUS_RECEIVED;
                    $serial['receivedDate'] = now()->toISOString();
                    if ($issue->attachment_url) {
                        $serial['attachmentUrl'] = $issue->attachment_url;
                    }
                    break;
                }
            }
            $subscription->serials = $serials;
            $subscription->save();

            // Send status notifications to all relevant roles
            ProcessMovementService::createStatusNotifications(
                SerialIssue::STATUS_RECEIVED,
                $subscription->serial_title . " - Issue #{$issue->issue_number}",
                (string) $subscription->_id,
                "ISSUE-{$issue->issue_number}",
                $subscription->supplier_name,
                (string) $issue->_id,
                auth()->user()?->role ?? 'gsps',
                auth()->user()?->name ?? 'GSPS System'
            );

            // Log the process movement
            ProcessMovementService::logMovement(
                'subscription',
                (string) $subscription->_id,
                $subscription->serial_title . " - Issue #{$issue->issue_number}",
                null, // current user
                null,
                $oldStatus,
                SerialIssue::STATUS_RECEIVED,
                'receive',
                "GSPS confirmed receipt of Issue #{$issue->issue_number}" . ($issue->attachment_url ? ' with attachment' : ''),
                ['issue_id' => (string) $issue->_id, 'issue_number' => $issue->issue_number]
            );

            AuditLogService::log(
                'update',
                SerialIssue::class,
                (string) $issue->_id,
                "Serial Issue #{$issue->issue_number} marked as received by GSPS",
                ['status' => $oldStatus, 'received_at' => null],
                ['status' => SerialIssue::STATUS_RECEIVED, 'received_at' => $issue->received_at]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Serial issue marked as received',
            'issue' => $issue,
        ]);
    }

    /**
     * Submit inspection result (Inspection Team)
     */
    public function submitInspection(Request $request, $subscriptionId, $issueId)
    {
        $issue = SerialIssue::where('subscription_id', $subscriptionId)
            ->where('_id', $issueId)
            ->first();

        if (!$issue) {
            return response()->json([
                'success' => false,
                'message' => 'Serial issue not found',
            ], 404);
        }

        // Validate current status allows inspection
        if ($issue->status !== SerialIssue::STATUS_RECEIVED) {
            return response()->json([
                'success' => false,
                'message' => 'Serial issue must be "Received" to submit inspection',
            ], 400);
        }

        $validated = $request->validate([
            'inspection_status' => 'required|string|in:inspected,for_return',
            'notes' => 'nullable|string',
            'inspector_name' => 'nullable|string',
            'condition' => 'nullable|string',
            'remark' => 'nullable|string',
            'checklist' => 'nullable|string', // JSON string
            'other_description' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,gif,webp,pdf|max:10240',
        ]);

        $oldInspectionStatus = $issue->inspection_status;
        $issue->inspection_status = $validated['inspection_status'];
        $issue->inspected_at = now();
        
        // Store inspection details
        if (isset($validated['inspector_name'])) {
            $issue->inspector_name = $validated['inspector_name'];
        }
        if (isset($validated['condition'])) {
            $issue->condition = $validated['condition'];
        }
        if (isset($validated['remark'])) {
            $issue->inspection_remarks = $validated['remark'];
        }
        if (isset($validated['notes'])) {
            $issue->notes = $validated['notes'];
        }
        if (isset($validated['checklist'])) {
            $issue->inspection_checklist = json_decode($validated['checklist'], true);
        }
        if (isset($validated['other_description'])) {
            $issue->other_description = $validated['other_description'];
        }

        // Handle file upload if provided
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = 'inspection_' . (string)$issue->subscription_id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $uploadPath = public_path('uploads/inspection-attachments');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }
            $file->move($uploadPath, $filename);
            $issue->inspection_attachment = '/uploads/inspection-attachments/' . $filename;
        }

        // Update final status based on inspection result
        if ($validated['inspection_status'] === SerialIssue::INSPECTION_INSPECTED) {
            $issue->status = SerialIssue::STATUS_DELIVERED;
        } else if ($validated['inspection_status'] === SerialIssue::INSPECTION_FOR_RETURN) {
            $issue->status = SerialIssue::STATUS_FOR_RETURN;
        }

        $issue->save();

        // Update subscription cost tracking
        $issue->updateSubscriptionCosts();

        // Sync status to Subscription.serials array
        $subscription = Subscription::find($subscriptionId);
        if ($subscription) {
            $serials = $subscription->serials ?? [];
            foreach ($serials as $index => &$serial) {
                // Match by issue number
                if (($index + 1) === $issue->issue_number) {
                    $serial['status'] = $issue->status;
                    $serial['inspection_status'] = $validated['inspection_status'];
                    $serial['inspectedDate'] = now()->toISOString();
                    if ($issue->inspection_attachment) {
                        $serial['inspectionAttachmentUrl'] = $issue->inspection_attachment;
                    }
                    break;
                }
            }
            $subscription->serials = $serials;
            $subscription->save();

            // Determine action for logging
            $action = $validated['inspection_status'] === 'inspected' ? 'inspect' : 'return';
            $remarks = $validated['inspection_status'] === 'inspected' 
                ? "Inspection completed - Acceptable (Issue #{$issue->issue_number})"
                : "Inspection completed - For Return (Issue #{$issue->issue_number})";

            // Send status notifications to all relevant roles
            ProcessMovementService::createStatusNotifications(
                $issue->status, // STATUS_DELIVERED or STATUS_FOR_RETURN
                $subscription->serial_title . " - Issue #{$issue->issue_number}",
                (string) $subscription->_id,
                "ISSUE-{$issue->issue_number}",
                $subscription->supplier_name,
                (string) $issue->_id,
                auth()->user()?->role ?? 'inspection',
                auth()->user()?->name ?? 'Inspection System'
            );

            // Log the process movement
            ProcessMovementService::logMovement(
                'subscription',
                (string) $subscription->_id,
                $subscription->serial_title . " - Issue #{$issue->issue_number}",
                null, // current user
                null,
                SerialIssue::STATUS_RECEIVED,
                $issue->status,
                $action,
                $remarks,
                ['issue_id' => (string) $issue->_id, 'issue_number' => $issue->issue_number, 'condition' => $issue->condition]
            );

            AuditLogService::log(
                'update',
                SerialIssue::class,
                (string) $issue->_id,
                "Serial Issue #{$issue->issue_number} inspection completed: {$validated['inspection_status']}",
                ['inspection_status' => $oldInspectionStatus, 'inspected_at' => null],
                ['inspection_status' => $validated['inspection_status'], 'inspected_at' => $issue->inspected_at]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Inspection submitted successfully',
            'issue' => $issue,
        ]);
    }

    /**
     * Update issue notes
     */
    public function updateNotes(Request $request, $subscriptionId, $issueId)
    {
        $issue = SerialIssue::where('subscription_id', $subscriptionId)
            ->where('_id', $issueId)
            ->first();

        if (!$issue) {
            return response()->json([
                'success' => false,
                'message' => 'Serial issue not found',
            ], 404);
        }

        $validated = $request->validate([
            'notes' => 'required|string',
        ]);

        $oldNotes = $issue->notes;
        $issue->notes = $validated['notes'];
        $issue->save();

        AuditLogService::log(
            'update',
            SerialIssue::class,
            (string) $issue->_id,
            "Serial Issue #{$issue->issue_number} notes updated",
            ['notes' => $oldNotes],
            ['notes' => $validated['notes']]
        );

        return response()->json([
            'success' => true,
            'message' => 'Notes updated successfully',
            'issue' => $issue,
        ]);
    }

    /**
     * Get issues that need inspection (for Inspection Dashboard)
     */
    public function getIssuesForInspection(Request $request)
    {
        $issues = SerialIssue::needsInspection()
            ->orderBy('received_at', 'asc')
            ->get();

        // Enrich with subscription details
        $enrichedIssues = $issues->map(function ($issue) {
            $subscription = Subscription::find($issue->subscription_id);
            return [
                'id' => $issue->_id,
                'issue_number' => $issue->issue_number,
                'expected_delivery_date' => $issue->expected_delivery_date,
                'status' => $issue->status,
                'inspection_status' => $issue->inspection_status,
                'cost' => $issue->cost,
                'received_at' => $issue->received_at,
                'notes' => $issue->notes,
                'subscription_id' => $issue->subscription_id,
                'serial_title' => $subscription?->serial_title ?? 'Unknown',
                'supplier_name' => $subscription?->supplier_name ?? 'Unknown',
            ];
        });

        return response()->json([
            'success' => true,
            'issues' => $enrichedIssues,
        ]);
    }

    /**
     * Get upcoming deliveries (for notifications/dashboard)
     */
    public function getUpcomingDeliveries(Request $request)
    {
        $days = $request->get('days', 7);
        
        $issues = SerialIssue::upcoming($days)
            ->orderBy('expected_delivery_date', 'asc')
            ->get();

        // Enrich with subscription details
        $enrichedIssues = $issues->map(function ($issue) {
            $subscription = Subscription::find($issue->subscription_id);
            return [
                'id' => $issue->_id,
                'issue_number' => $issue->issue_number,
                'expected_delivery_date' => $issue->expected_delivery_date,
                'status' => $issue->status,
                'cost' => $issue->cost,
                'subscription_id' => $issue->subscription_id,
                'serial_title' => $subscription?->serial_title ?? 'Unknown',
                'supplier_name' => $subscription?->supplier_name ?? 'Unknown',
            ];
        });

        return response()->json([
            'success' => true,
            'issues' => $enrichedIssues,
        ]);
    }

    /**
     * Get overdue issues
     */
    public function getOverdueIssues(Request $request)
    {
        $issues = SerialIssue::overdue()
            ->orderBy('expected_delivery_date', 'asc')
            ->get();

        // Enrich with subscription details
        $enrichedIssues = $issues->map(function ($issue) {
            $subscription = Subscription::find($issue->subscription_id);
            return [
                'id' => $issue->_id,
                'issue_number' => $issue->issue_number,
                'expected_delivery_date' => $issue->expected_delivery_date,
                'status' => $issue->status,
                'cost' => $issue->cost,
                'days_overdue' => now()->diffInDays($issue->expected_delivery_date),
                'subscription_id' => $issue->subscription_id,
                'serial_title' => $subscription?->serial_title ?? 'Unknown',
                'supplier_name' => $subscription?->supplier_name ?? 'Unknown',
            ];
        });

        return response()->json([
            'success' => true,
            'issues' => $enrichedIssues,
        ]);
    }

    /**
     * Get issues for a specific supplier
     */
    public function getSupplierIssues(Request $request)
    {
        $supplierName = $request->get('supplier_name');
        
        if (!$supplierName) {
            return response()->json([
                'success' => false,
                'message' => 'Supplier name is required',
            ], 400);
        }

        // Find subscriptions for this supplier that are ACCEPTED (not pending)
        // Only show issues from accepted subscriptions
        $subscriptions = Subscription::where('supplier_name', 'regex', '/^' . preg_quote($supplierName, '/') . '$/i')
            ->whereIn('status', ['Active', 'accepted', 'Delivered', 'delivered']) // Only accepted or delivered subscriptions
            ->get();

        $subscriptionIds = $subscriptions->pluck('_id')->map(fn($id) => (string) $id)->toArray();

        $issues = SerialIssue::whereIn('subscription_id', $subscriptionIds)
            ->orderBy('expected_delivery_date', 'asc')
            ->get();

        // Enrich with subscription details including inspection info
        $enrichedIssues = $issues->map(function ($issue) use ($subscriptions) {
            $subscription = $subscriptions->first(fn($s) => (string)$s->_id === $issue->subscription_id);
            
            // Get the delivered date from the process movement log (TPU Monitor Delivery timeline)
            // When issue is marked as "received" or "delivered", that's when it was delivered
            $deliveredDate = null;
            if ($issue->status === 'delivered' || $issue->status === 'received') {
                // Use received_at as the delivered date (captured from TPU timeline)
                $deliveredDate = $issue->received_at;
            } else if ($issue->status === 'for_return') {
                // For return items, use inspected_at as the delivery date
                $deliveredDate = $issue->inspected_at;
            }
            
            return [
                'id' => $issue->_id,
                'issue_number' => $issue->issue_number,
                'expected_delivery_date' => $issue->expected_delivery_date,
                'delivered_date' => $deliveredDate, // Map to delivered_date for frontend
                'status' => $issue->status,
                'inspection_status' => $issue->inspection_status,
                'cost' => $issue->cost,
                'received_at' => $issue->received_at,
                'inspected_at' => $issue->inspected_at,
                'notes' => $issue->notes,
                'subscription_id' => $issue->subscription_id,
                'serial_title' => $subscription?->serial_title ?? 'Unknown',
                // Include inspection details for "for_return" issues
                'inspector_name' => $issue->inspector_name,
                'condition' => $issue->condition,
                'inspection_remarks' => $issue->inspection_remarks,
                'inspection_checklist' => $issue->inspection_checklist,
                'other_description' => $issue->other_description,
                'inspection_attachment' => $issue->inspection_attachment,
            ];
        });

        return response()->json([
            'success' => true,
            'issues' => $enrichedIssues,
        ]);
    }

    /**
     * Generate serial issues for an existing subscription (manual trigger)
     */
    public function generateIssues(Request $request, $subscriptionId)
    {
        $subscription = Subscription::find($subscriptionId);

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription not found',
            ], 404);
        }

        // Check if issues already exist
        $existingCount = SerialIssue::forSubscription($subscriptionId)->count();
        if ($existingCount > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Serial issues already exist for this subscription',
            ], 400);
        }

        $validated = $request->validate([
            'total_issues' => 'required|integer|min:1|max:52',
            'frequency' => 'required|string|in:weekly,biweekly,monthly,quarterly,annually',
            'start_date' => 'required|date',
        ]);

        $issues = SerialIssue::generateForSubscription(
            $subscription,
            $validated['frequency'],
            $validated['total_issues'],
            $validated['start_date'],
            $subscription->award_cost ?? 0
        );

        // Log the generation
        AuditLogService::log(
            'create',
            SerialIssue::class,
            (string) $subscription->_id,
            "Generated {$validated['total_issues']} serial issues for subscription '{$subscription->serial_title}'",
            null,
            ['total_issues' => $validated['total_issues'], 'frequency' => $validated['frequency']]
        );

        return response()->json([
            'success' => true,
            'message' => "Generated {$validated['total_issues']} serial issues successfully",
            'issues' => $issues,
        ]);
    }

    /**
     * Get statistics for all serial issues (for dashboards)
     */
    public function getStats(Request $request)
    {
        $totalIssues = SerialIssue::count();
        $pendingIssues = SerialIssue::whereNotIn('status', [
            SerialIssue::STATUS_DELIVERED, 
            SerialIssue::STATUS_FOR_RETURN
        ])->count();
        $deliveredIssues = SerialIssue::where('status', SerialIssue::STATUS_DELIVERED)->count();
        $returnedIssues = SerialIssue::where('status', SerialIssue::STATUS_FOR_RETURN)->count();
        $awaitingInspection = SerialIssue::needsInspection()->count();
        $overdueIssues = SerialIssue::overdue()->count();
        $upcomingIssues = SerialIssue::upcoming(7)->count();

        $totalDeliveredCost = SerialIssue::where('status', SerialIssue::STATUS_DELIVERED)->sum('cost');

        return response()->json([
            'success' => true,
            'stats' => [
                'total_issues' => $totalIssues,
                'pending_issues' => $pendingIssues,
                'delivered_issues' => $deliveredIssues,
                'returned_issues' => $returnedIssues,
                'awaiting_inspection' => $awaitingInspection,
                'overdue_issues' => $overdueIssues,
                'upcoming_issues' => $upcomingIssues,
                'total_delivered_cost' => $totalDeliveredCost,
            ],
        ]);
    }

    /**
     * Get all serial issues globally (for GSPS delivery view)
     */
    public function getAllIssues(Request $request)
    {
        $query = SerialIssue::orderBy('expected_delivery_date', 'asc');

        // Filter by status if provided
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $issues = $query->get();

        // Enrich with subscription details
        $subscriptionIds = $issues->pluck('subscription_id')->unique()->toArray();
        $subscriptions = Subscription::whereIn('_id', $subscriptionIds)
            ->get()
            ->keyBy(fn($s) => (string)$s->_id);

        $enrichedIssues = $issues->map(function ($issue) use ($subscriptions) {
            $subscription = $subscriptions->get($issue->subscription_id);
            return [
                'id' => (string) $issue->_id,
                'issue_number' => $issue->issue_number,
                'expected_delivery_date' => $issue->expected_delivery_date,
                'status' => $issue->status,
                'inspection_status' => $issue->inspection_status,
                'cost' => $issue->cost,
                'received_at' => $issue->received_at,
                'inspected_at' => $issue->inspected_at,
                'notes' => $issue->notes,
                'subscription_id' => $issue->subscription_id,
                'serial_title' => $subscription?->serial_title ?? 'Unknown',
                'supplier_name' => $subscription?->supplier_name ?? 'Unknown',
                'issn' => $subscription?->issn ?? 'Unknown',
            ];
        });

        return response()->json([
            'success' => true,
            'issues' => $enrichedIssues,
        ]);
    }
}
