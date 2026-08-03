<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SupplierAccount;
use App\Models\SerialIssue;
use App\Services\AuditLogService;
use App\Services\ProcessMovementService;
use App\Services\EmailNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class SubscriptionController extends Controller
{
    /**
     * Display listing of all subscriptions
     */
    public function index(Request $request)
    {
        $query = Subscription::query();

        // Filter by status if provided
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by period if provided
        if ($request->has('period') && $request->period !== 'All') {
            $query->where('period', 'like', "%{$request->period}%");
        }

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('serial_title', 'like', "%{$search}%")
                  ->orWhere('supplier_name', 'like', "%{$search}%");
            });
        }

        $subscriptions = $query->orderBy('created_at', 'desc')->get();
        
        // Recalculate delivered_cost for each subscription based on inspected serials
        foreach ($subscriptions as $subscription) {
            $this->recalculateDeliveredCost($subscription);
        }

        return response()->json([
            'subscriptions' => $subscriptions,
            'success' => true,
        ]);
    }
    
    /**
     * Recalculate delivered_cost based on SerialIssue model
     */
    private function recalculateDeliveredCost(Subscription $subscription)
    {
        $subscriptionId = (string) ($subscription->_id ?? $subscription->id);
        
        // Get all issues for this subscription from SerialIssue model
        $issues = SerialIssue::where('subscription_id', $subscriptionId)->get();
        
        if ($issues->isEmpty()) {
            // If no issues found, use the old Subscription.serials array logic
            $serials = $subscription->serials ?? [];
            $deliveredCost = 0;
            
            foreach ($serials as $serial) {
                $inspectionStatus = $serial['inspection_status'] ?? null;
                
                // Only count serials that have been inspected and marked as "Good" (inspected status)
                if ($inspectionStatus === 'inspected') {
                    // Support both 'quantity' and 'amount' field names (frontend saves as 'amount')
                    $quantity = floatval($serial['quantity'] ?? $serial['amount'] ?? 1);
                    $unitPrice = floatval($serial['unitPrice'] ?? 0);
                    $deliveredCost += $quantity * $unitPrice;
                }
            }
        } else {
            // Use SerialIssue model as source of truth
            $deliveredCost = $issues->where('status', 'delivered')->sum('cost');
            
            // Also update Subscription.serials with status from SerialIssue items
            $serials = $subscription->serials ?? [];
            foreach ($issues as $issue) {
                $issueIndex = $issue->issue_number - 1;
                if (isset($serials[$issueIndex])) {
                    $serials[$issueIndex]['status'] = $issue->status;
                    $serials[$issueIndex]['inspection_status'] = $issue->inspection_status;
                }
            }
            $subscription->serials = $serials;
        }
        
        $remainingCost = max(0, ($subscription->award_cost ?? 0) - $deliveredCost);
        
        // Check if all issues are delivered - if so, change subscription status to 'delivered'
        $allDelivered = false;
        if (!$issues->isEmpty()) {
            $deliveredCount = $issues->where('status', 'delivered')->count();
            $totalCount = $issues->count();
            $allDelivered = ($deliveredCount === $totalCount && $totalCount > 0);
        }
        
        // Update the subscription if values differ
        $needsSave = false;
        if ($subscription->delivered_cost != $deliveredCost || $subscription->remaining_cost != $remainingCost) {
            $subscription->delivered_cost = $deliveredCost;
            $subscription->remaining_cost = $remainingCost;
            $subscription->payment_status = $this->calculatePaymentStatus(
                $subscription->award_cost ?? 0,
                $deliveredCost,
                $remainingCost
            );
            $subscription->progress = ($subscription->award_cost ?? 0) > 0 
                ? min(100, round(($deliveredCost / $subscription->award_cost) * 100)) 
                : 0;
            $needsSave = true;
        }
        
        // Update status to 'delivered' if all issues are delivered and status is 'accepted' or 'Active'
        if ($allDelivered && in_array($subscription->status, ['accepted', 'Active'])) {
            $subscription->status = 'Delivered';
            $needsSave = true;
        }
        
        if ($needsSave) {
            $subscription->save();
        }
    }

    /**
     * Get subscription statistics
     */
    public function stats(Request $request)
    {
        $subscriptions = Subscription::all();
        
        // Recalculate delivered_cost for all subscriptions based on inspected serials
        foreach ($subscriptions as $subscription) {
            $this->recalculateDeliveredCost($subscription);
        }
        
        // Refresh the collection after updates
        $subscriptions = Subscription::all();

        $totalAwardCost = $subscriptions->sum('award_cost');
        $totalDeliveredCost = $subscriptions->sum('delivered_cost');
        $totalRemainingCost = $subscriptions->sum('remaining_cost');
        $totalCount = $subscriptions->count();
        $activeCount = $subscriptions->where('status', 'Active')->count();

        return response()->json([
            'success' => true,
            'stats' => [
                'total_award_cost' => $totalAwardCost,
                'total_delivered_cost' => $totalDeliveredCost,
                'total_remaining_cost' => $totalRemainingCost,
                'total_count' => $totalCount,
                'active_count' => $activeCount,
                'payment_rate' => $totalAwardCost > 0 ? round(($totalDeliveredCost / $totalAwardCost) * 100) : 0,
            ],
        ]);
    }

    /**
     * Store a new subscription
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'serial_title' => 'required|string|max:255',
            'issn' => 'nullable|string|max:255',
            'supplier_id' => 'nullable|string',
            'supplier_name' => 'required|string|max:255',
            'period' => 'nullable|string',
            'award_cost' => 'required|numeric|min:0',
            'delivered_cost' => 'nullable|numeric|min:0',
            'serials' => 'nullable|array',
            'transactions' => 'nullable|array',
            // New fields for serial issue generation
            'frequency' => 'nullable|string|in:weekly,biweekly,monthly,quarterly,annually,Weekly,Biweekly,Monthly,Quarterly,Annually',
            'total_issues' => 'nullable|integer|min:1|max:52',
            'start_date' => 'nullable|date',
        ]);

        $deliveredCost = $validated['delivered_cost'] ?? 0;
        $remainingCost = max(0, $validated['award_cost'] - $deliveredCost);

        $supplierName = trim($validated['supplier_name']);
        $supplierId = !empty($validated['supplier_id']) ? trim((string) $validated['supplier_id']) : null;

        if ($supplierId) {
            $supplierAccount = SupplierAccount::where('_id', $supplierId)
                ->orWhere('id', $supplierId)
                ->first();

            if (!$supplierAccount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => ['supplier_id' => ['Selected supplier account was not found.']],
                ], 422);
            }

            $supplierId = (string) ($supplierAccount->_id ?? $supplierAccount->id);
            $supplierName = $supplierAccount->company_name ?? $supplierName;
        } else {
            $matchingSuppliers = SupplierAccount::approved()
                ->where('company_name', 'regex', '/^' . preg_quote($supplierName, '/') . '$/i')
                ->get();

            if ($matchingSuppliers->count() === 1) {
                $supplierAccount = $matchingSuppliers->first();
                $supplierId = (string) ($supplierAccount->_id ?? $supplierAccount->id);
                $supplierName = $supplierAccount->company_name ?? $supplierName;
            } else if ($matchingSuppliers->count() > 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => ['supplier_id' => ['Multiple supplier accounts share this supplier name. Please select the exact supplier contact account.']],
                ], 422);
            }
        }

        // Extract ISSN from first serial if not provided at subscription level
        $issn = $validated['issn'] ?? null;
        if (!$issn && !empty($validated['serials'])) {
            $issn = $validated['serials'][0]['issn'] ?? null;
        }

        $subscription = Subscription::create([
            'serial_title' => $validated['serial_title'],
            'issn' => $issn,
            'supplier_id' => $supplierId,
            'supplier_name' => $supplierName,
            'period' => $validated['period'] ?? null,
            'award_cost' => $validated['award_cost'],
            'delivered_cost' => $deliveredCost,
            'remaining_cost' => $remainingCost,
            'status' => 'pending',
            'payment_status' => $this->calculatePaymentStatus($validated['award_cost'], $deliveredCost, $remainingCost),
            'progress' => $validated['award_cost'] > 0 ? min(100, round(($deliveredCost / $validated['award_cost']) * 100)) : 0,
            'serials' => $validated['serials'] ?? [],
            'transactions' => $validated['transactions'] ?? [],
            'created_by' => Auth::id(),
            'frequency' => $validated['frequency'] ?? null,
            'total_issues' => $validated['total_issues'] ?? null,
        ]);

        // Serial issues will be generated when supplier accepts the subscription

        // Log the creation
        AuditLogService::logCreate($subscription, "Subscription '{$subscription->serial_title}' created");
        ProcessMovementService::logSubscriptionCreated($subscription);

        // Notify supplier of new serials assigned to them
        $serials = $validated['serials'] ?? [];
        foreach ($serials as $serial) {
            $serialTitle = $serial['title'] ?? $serial['serialTitle'] ?? $subscription->serial_title;
            $serialIssn = $serial['issn'] ?? null;
            ProcessMovementService::notifySupplierOfNewSerial(
                $serialTitle,
                $subscription->supplier_name,
                (string)($subscription->_id ?? $subscription->id),
                $serialIssn,
                (string)($subscription->supplier_id ?? '')
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Subscription created successfully',
            'subscription' => $subscription,
        ], 201);
    }

    /**
     * Get a specific subscription
     */
    public function show($id)
    {
        $subscription = Subscription::find($id);

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'subscription' => $subscription,
        ]);
    }

    /**
     * Accept a pending subscription (Supplier action)
     * Changes status from 'pending' to 'accepted' and generates serial issues
     */
    public function acceptSubscription(Request $request, $id)
    {
        $subscription = Subscription::find($id);

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription not found',
            ], 404);
        }

        // Only allow accepting pending subscriptions
        if ($subscription->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending subscriptions can be accepted',
            ], 422);
        }

        $subscriptionId = (string)($subscription->_id ?? $subscription->id);

        // Change status to accepted
        $subscription->status = 'accepted';
        $subscription->accepted_at = now();
        $subscription->save();

        // Generate serial issues if they don't already exist
        $existingIssues = SerialIssue::where('subscription_id', $subscriptionId)->count();

        if ($existingIssues === 0 && !empty($subscription->total_issues)) {
            $totalIssues = intval($subscription->total_issues);
            $serials = $subscription->serials ?? [];

            // Calculate total cost for distribution
            $totalCost = 0;
            $startDate = now();
            
            foreach ($serials as $serial) {
                $quantity = floatval($serial['amount'] ?? $serial['quantity'] ?? 1);
                $unitPrice = floatval($serial['unitPrice'] ?? 0);
                $totalCost += $quantity * $unitPrice;
                
                // Get start date from first serial's delivery date
                if ($startDate === now() && !empty($serial['deliveryDate'])) {
                    try {
                        $startDate = Carbon::parse($serial['deliveryDate']);
                    } catch (\Exception $e) {
                        // Use now()
                    }
                }
            }

            // Use SerialIssue::generateForSubscription to properly calculate expected delivery dates
            $frequency = strtolower($subscription->frequency ?? 'monthly');
            SerialIssue::generateForSubscription(
                $subscription,
                $frequency,
                $totalIssues,
                $startDate,
                $totalCost
            );
        }

        // Log the acceptance
        AuditLogService::logCreate($subscription, "Subscription '{$subscription->serial_title}' accepted by supplier");
        ProcessMovementService::logSubscriptionCreated($subscription);

        return response()->json([
            'success' => true,
            'message' => 'Subscription accepted successfully',
            'subscription' => $subscription,
        ]);
    }

    /**
     * Update a subscription
     */
    public function update(Request $request, $id)
    {
        $subscription = Subscription::find($id);

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription not found',
            ], 404);
        }

        // Store old values for audit logging
        $oldValues = $subscription->toArray();

        $validated = $request->validate([
            'serial_title' => 'sometimes|string|max:255',
            'supplier_id' => 'nullable|string',
            'supplier_name' => 'sometimes|string|max:255',
            'period' => 'sometimes|string',
            'award_cost' => 'sometimes|numeric|min:0',
            'delivered_cost' => 'sometimes|numeric|min:0',
            'remaining_cost' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|string|in:Active,Inactive,Completed',
            'serials' => 'nullable|array',
            'transactions' => 'nullable|array',
            'note' => 'nullable|string',
            'issn' => 'nullable|string|max:50',
            'frequency' => 'nullable|string|max:50',
            'author_publisher' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:100',
        ]);

        $subscription->fill($validated);

        // Recalculate payment status and progress if costs changed
        if (isset($validated['award_cost']) || isset($validated['delivered_cost'])) {
            $awardCost = $validated['award_cost'] ?? $subscription->award_cost;
            $deliveredCost = $validated['delivered_cost'] ?? $subscription->delivered_cost;
            $remainingCost = $validated['remaining_cost'] ?? max(0, $awardCost - $deliveredCost);

            $subscription->remaining_cost = $remainingCost;
            $subscription->payment_status = $this->calculatePaymentStatus($awardCost, $deliveredCost, $remainingCost);
            $subscription->progress = $awardCost > 0 ? min(100, round(($deliveredCost / $awardCost) * 100)) : 0;
        }

        $subscription->save();

        // Log the update
        AuditLogService::logUpdate($subscription, $oldValues, "Subscription '{$subscription->serial_title}' updated");

        return response()->json([
            'success' => true,
            'message' => 'Subscription updated successfully',
            'subscription' => $subscription,
        ]);
    }

    /**
     * Delete a subscription
     */
    public function destroy($id)
    {
        $subscription = Subscription::find($id);

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription not found',
            ], 404);
        }

        // Log the deletion before deleting
        AuditLogService::logDelete($subscription, "Subscription '{$subscription->serial_title}' deleted");

        // Send email notification for deletion
        $serialTitle = $subscription->serial_title ?? 'Unknown Serial';
        $supplierName = $subscription->supplier_name ?? 'Unknown Supplier';
        EmailNotificationService::notifySerialDeleted($serialTitle, $supplierName);

        // Cascade delete all related notifications by subscription ID
        ProcessMovementService::deleteSerialNotifications((string)($subscription->_id ?? $subscription->id), null, null);
        
        // Also delete notifications for each individual serial by title
        $serials = $subscription->serials ?? [];
        foreach ($serials as $serial) {
            $serialTitle = $serial['title'] ?? $serial['serialTitle'] ?? null;
            $serialIssn = $serial['issn'] ?? null;
            if ($serialTitle || $serialIssn) {
                ProcessMovementService::deleteSerialNotifications(null, $serialIssn, $serialTitle);
            }
        }

        $subscription->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subscription deleted successfully',
        ]);
    }

    /**
     * Add a serial item to a subscription
     */
    public function addSerial(Request $request, $id)
    {
        $subscription = Subscription::find($id);

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription not found',
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'issn' => 'required|string',
            'frequency' => 'required|string',
            'status' => 'nullable|string|in:created,Pending,Delivered,Cancelled',
            'delivery_date' => 'nullable|date',
        ]);

        $serials = $subscription->serials ?? [];
        $serials[] = [
            'id' => count($serials) + 1,
            'title' => $validated['title'],
            'issn' => $validated['issn'],
            'frequency' => $validated['frequency'],
            'status' => 'created', // Always start as created when TPU adds a serial
            'deliveryDate' => $validated['delivery_date'],
        ];

        $subscription->serials = $serials;
        $subscription->save();

        return response()->json([
            'success' => true,
            'message' => 'Serial added successfully',
            'subscription' => $subscription,
        ]);
    }

    /**
     * Add a transaction to a subscription
     */
    public function addTransaction(Request $request, $id)
    {
        $subscription = Subscription::find($id);

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription not found',
            ], 404);
        }

        $validated = $request->validate([
            'date' => 'required|date',
            'type' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'status' => 'required|string|in:Pending,Completed,Failed',
            'note' => 'nullable|string',
        ]);

        $transactions = $subscription->transactions ?? [];
        $transactions[] = [
            'id' => count($transactions) + 1,
            'date' => $validated['date'],
            'type' => $validated['type'],
            'amount' => 'P' . number_format($validated['amount'], 0),
            'status' => $validated['status'],
            'note' => $validated['note'] ?? null,
        ];

        $subscription->transactions = $transactions;

        // Update delivered cost if payment is completed
        if ($validated['status'] === 'Completed' && $validated['type'] === 'Payment') {
            $subscription->delivered_cost += $validated['amount'];
            $subscription->remaining_cost = max(0, $subscription->award_cost - $subscription->delivered_cost);
            $subscription->payment_status = $this->calculatePaymentStatus(
                $subscription->award_cost,
                $subscription->delivered_cost,
                $subscription->remaining_cost
            );
            $subscription->progress = $subscription->award_cost > 0 
                ? min(100, round(($subscription->delivered_cost / $subscription->award_cost) * 100)) 
                : 0;
        }

        $subscription->save();

        return response()->json([
            'success' => true,
            'message' => 'Transaction added successfully',
            'subscription' => $subscription,
        ]);
    }

    /**
     * Helper function to calculate payment status
     */
    private function calculatePaymentStatus($awardCost, $deliveredCost, $remainingCost)
    {
        if ($deliveredCost >= $awardCost && $remainingCost == 0) {
            return 'Fully Paid';
        } elseif ($deliveredCost > $awardCost) {
            return 'Overpaid';
        } elseif ($deliveredCost > 0) {
            return 'Partially Paid';
        }
        return 'Unpaid';
    }

    /**
     * Get serials for a specific supplier (for Supplier Dashboard)
     */
    public function getSupplierSerials(Request $request)
    {
        $supplierName = $request->get('supplier_name');
        $user = Auth::user();
        
        // Get subscriptions for this supplier
        $query = Subscription::query();

        // For supplier role, always scope by linked supplier account ID.
        if ($user && strtolower($user->role ?? '') === 'supplier') {
            $supplierAccount = SupplierAccount::where('user_id', $user->_id ?? $user->id)
                ->orWhere('email', $user->email)
                ->first();

            if ($supplierAccount) {
                $supplierAccountId = (string) ($supplierAccount->_id ?? $supplierAccount->id);
                $query->where('supplier_id', $supplierAccountId);
            } else if ($supplierName) {
                // Legacy fallback if account linkage is missing.
                $query->where('supplier_name', 'regex', '/^' . preg_quote($supplierName, '/') . '$/i');
            }
        } else if ($supplierName) {
            // Use case-insensitive regex matching for MongoDB
            $query->where('supplier_name', 'regex', '/^' . preg_quote($supplierName, '/') . '$/i');
        }
        
        $subscriptions = $query->orderBy('created_at', 'desc')->get();
        
        // Extract all serials from subscriptions and flatten them
        $serials = [];
        $serialId = 1;
        
        foreach ($subscriptions as $subscription) {
            $subscriptionSerials = $subscription->serials ?? [];
            
            // Reverse the serials array so newest ones appear first
            $subscriptionSerials = array_reverse($subscriptionSerials);
            
            foreach ($subscriptionSerials as $serial) {
                $serials[] = [
                    'id' => $serialId++,
                    'subscription_id' => $subscription->_id ?? $subscription->id,
                    'subscription_status' => $subscription->status,
                    'issn' => $serial['issn'] ?? '',
                    'title' => $serial['serialTitle'] ?? $serial['title'] ?? '',
                    'dateDelivered' => $serial['deliveryDate'] ?? $serial['dateDelivered'] ?? null,
                    'frequency' => $serial['frequency'] ?? '',
                    'status' => $serial['status'] ?? 'pending', // pending, prepare, for_delivery
                    'supplier_name' => $subscription->supplier_name,
                    // Inspection-related fields for Delivered/For Return status
                    'inspection_status' => $serial['inspection_status'] ?? null,
                    'inspection_checklist' => $serial['inspection_checklist'] ?? [],
                    'other_description' => $serial['other_description'] ?? null,
                    'inspection_remarks' => $serial['inspection_remarks'] ?? null,
                    'inspector_name' => $serial['inspector_name'] ?? null,
                    'inspection_date' => $serial['inspection_date'] ?? null,
                    'condition' => $serial['condition'] ?? null,
                    'inspection_attachment' => $serial['inspection_attachment'] ?? null,
                ];
            }
        }
        
        return response()->json([
            'success' => true,
            'serials' => $serials,
        ]);
    }

    /**
     * Update serial status (for Supplier Dashboard)
     */
    public function updateSerialStatus(Request $request, $subscriptionId)
    {
        $subscription = Subscription::find($subscriptionId);
        
        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription not found',
            ], 404);
        }
        
        $validated = $request->validate([
            'serial_issn' => 'required|string',
            'status' => 'required|string|in:created,pending,accepted,prepare,for_delivery,received',
        ]);
        
        $serials = $subscription->serials ?? [];
        $updated = false;
        $oldStatus = null;
        $serialTitle = '';
        $serialIndex = 0;
        
        foreach ($serials as $index => &$serial) {
            if (($serial['issn'] ?? '') === $validated['serial_issn']) {
                $oldStatus = $serial['status'] ?? 'pending';
                $serialTitle = $serial['serialTitle'] ?? $serial['title'] ?? 'Unknown Serial';
                $serialIndex = $index;
                $serial['status'] = $validated['status'];
                // If marking as received, add received date
                if ($validated['status'] === 'received') {
                    $serial['receivedDate'] = $request->get('received_date', now()->toISOString());
                }
                $updated = true;
                break;
            }
        }
        
        if (!$updated) {
            return response()->json([
                'success' => false,
                'message' => 'Serial not found in subscription',
            ], 404);
        }
        
        $subscription->serials = $serials;
        
        // If accepting the subscription, also update the subscription status/time
        if ($validated['status'] === 'accepted') {
            $subscription->status = 'accepted';
            if (empty($subscription->accepted_at)) {
                $subscription->accepted_at = now();
            }
        }
        
        $subscription->save();
        
        // If accepting, generate serial issues if not already generated
        $generatedIssues = [];
        if ($validated['status'] === 'accepted') {
            // Check if serial issues already exist for this subscription
            $existingIssues = SerialIssue::where('subscription_id', (string)($subscription->_id ?? $subscription->id))->count();
            
            if ($existingIssues === 0) {
                // Get the serial info to determine frequency and amount
                $serialInfo = null;
                foreach ($serials as $s) {
                    if (($s['issn'] ?? '') === $validated['serial_issn']) {
                        $serialInfo = $s;
                        break;
                    }
                }
                
                if ($serialInfo) {
                    $frequency = strtolower($serialInfo['frequency'] ?? $subscription->frequency ?? 'monthly');
                    $totalIssues = (int)($serialInfo['amount'] ?? $subscription->total_issues ?? 12);
                    $startDate = !empty($serialInfo['deliveryDate']) 
                        ? Carbon::parse($serialInfo['deliveryDate']) 
                        : Carbon::now();
                    $awardCost = (float)($subscription->award_cost ?? 0);
                    
                    $generatedIssues = SerialIssue::generateForSubscription(
                        $subscription,
                        $frequency,
                        $totalIssues,
                        $startDate,
                        $awardCost
                    );
                }
            }
        }

        // Keep SerialIssue status/timestamps in sync for supplier workflow updates
        if (in_array($validated['status'], ['prepare', 'for_delivery'])) {
            $issueNumber = $serialIndex + 1;
            $serialIssue = SerialIssue::where('subscription_id', (string)($subscription->_id ?? $subscription->id))
                ->where('issue_number', $issueNumber)
                ->first();

            if ($serialIssue) {
                $serialIssue->status = $validated['status'];
                if ($validated['status'] === 'prepare' && empty($serialIssue->prepared_at)) {
                    $serialIssue->prepared_at = now();
                }
                if ($validated['status'] === 'for_delivery' && empty($serialIssue->for_delivery_at)) {
                    $serialIssue->for_delivery_at = now();
                }
                $serialIssue->save();
            }
        }
        
        // Log the process movement
        ProcessMovementService::logSerialStatusChange(
            $subscription,
            $serialIndex,
            $serialTitle,
            $oldStatus,
            $validated['status'],
            $request->get('remarks')
        );
        
        // Create notifications for the status change
        ProcessMovementService::createStatusNotifications(
            $validated['status'],
            $serialTitle,
            (string)($subscription->_id ?? $subscription->id),
            $validated['serial_issn'],
            $subscription->supplier_name
        );
        
        // Log the audit
        AuditLogService::log(
            'update',
            Subscription::class,
            (string)($subscription->_id ?? $subscription->id),
            "Serial '{$serialTitle}' status changed from '{$oldStatus}' to '{$validated['status']}'",
            ['status' => $oldStatus],
            ['status' => $validated['status']]
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Serial status updated successfully',
            'subscription' => $subscription,
            'issues_generated' => count($generatedIssues),
        ]);
    }

    /**
     * Get serials for GSPS Delivery Status (serials with "for_delivery" status)
     */
    public function getDeliverySerials(Request $request)
    {
        $subscriptions = Subscription::orderBy('created_at', 'desc')->get();
        
        // Extract all serials with "for_delivery" or "received" status
        $deliverySerials = [];
        $serialId = 1;
        
        foreach ($subscriptions as $subscription) {
            $subscriptionSerials = $subscription->serials ?? [];
            
            // Reverse the serials array so newest ones appear first
            $subscriptionSerials = array_reverse($subscriptionSerials);
            
            foreach ($subscriptionSerials as $serial) {
                $status = $serial['status'] ?? 'pending';
                
                // Only include serials that are "for_delivery" or "received"
                if ($status === 'for_delivery' || $status === 'received') {
                    $deliverySerials[] = [
                        'id' => $serialId++,
                        'subscription_id' => $subscription->_id ?? $subscription->id,
                        'issn' => $serial['issn'] ?? '',
                        'serialTitle' => $serial['serialTitle'] ?? $serial['title'] ?? '',
                        'supplierName' => $subscription->supplier_name,
                        'deliveryDate' => $serial['deliveryDate'] ?? null,
                        'status' => $status,
                        'receivedDate' => $serial['receivedDate'] ?? null,
                        'frequency' => $serial['frequency'] ?? '',
                        'quantity' => $serial['quantity'] ?? 1,
                        // Include attachment URL for viewing
                        'attachmentUrl' => $serial['attachmentUrl'] ?? null,
                        // Additional serial details for view modal
                        'language' => $serial['language'] ?? '',
                        'authorPublisher' => $serial['authorPublisher'] ?? '',
                        'category' => $serial['category'] ?? '',
                        'volumeNumber' => $serial['volumeNumber'] ?? '',
                        'issuesNo' => $serial['issuesNo'] ?? '',
                    ];
                }
            }
        }
        
        return response()->json([
            'success' => true,
            'serials' => $deliverySerials,
        ]);
    }

    /**
     * Get subscriptions with serial issues for GSPS delivery tracking
     * Shows subscriptions that have been accepted with their issues
     * Status is "Ongoing" until all issues are "Delivered"
     */
    public function getGSPSDeliveryTracking(Request $request)
    {
        // Get subscriptions that are at least accepted (not pending)
        $subscriptions = Subscription::whereIn('status', ['Active', 'accepted', 'Delivered', 'delivered'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        $deliveryData = [];
        $totalDelivered = 0;
        $totalOngoing = 0;
        
        foreach ($subscriptions as $subscription) {
            // Recalculate delivered cost and status (updates subscription if all issues are delivered)
            $this->recalculateDeliveredCost($subscription);
            
            // Get all serial issues for this subscription
            $issues = SerialIssue::forSubscription((string) $subscription->_id)
                ->orderBy('issue_number', 'asc')
                ->get();

            $acceptedAt = $subscription->accepted_at
                ?? $issues->min('prepared_at')
                ?? $issues->min('for_delivery_at')
                ?? $issues->min('received_at')
                ?? $issues->min('inspected_at')
                ?? null;
            
            if ($issues->count() === 0) {
                continue; // Skip subscriptions without issues
            }
            
            // Calculate aggregated status
            $deliveredCount = $issues->where('status', 'delivered')->count();
            $forReturnCount = $issues->where('status', 'for_return')->count();
            $totalIssueCount = $issues->count();
            
            // Subscription is "Delivered" only if ALL non-return issues are delivered
            // "for_return" issues don't count towards the total
            $deliverableIssueCount = $totalIssueCount - $forReturnCount;
            $aggregatedStatus = ($deliverableIssueCount > 0 && $deliveredCount === $deliverableIssueCount) ? 'Delivered' : 'Ongoing';
            
            if ($aggregatedStatus === 'Delivered') {
                $totalDelivered++;
            } else {
                $totalOngoing++;
            }
            
            // Get ISSN from subscription level, or fallback to first serial's ISSN
            $issn = $subscription->issn;
            if (!$issn && !empty($subscription->serials)) {
                $issn = $subscription->serials[0]['issn'] ?? '';
            }

            $deliveryData[] = [
                'id' => (string) $subscription->_id,
                'subscription_id' => (string) $subscription->_id,
                'serialTitle' => $subscription->serial_title,
                'issn' => $issn ?? '',
                'supplierName' => $subscription->supplier_name,
                'created_at' => $subscription->created_at,
                'pending_at' => $subscription->created_at,
                'accepted_at' => $acceptedAt,
                'deliveryDate' => $subscription->delivery_date ?? $subscription->created_at,
                'aggregatedStatus' => $aggregatedStatus,
                'totalIssues' => $totalIssueCount,
                'deliveredIssues' => $deliveredCount,
                'forReturnIssues' => $forReturnCount,
                'issues' => $issues->map(function ($issue) {
                    return [
                        'id' => (string) $issue->_id,
                        'issue_number' => $issue->issue_number,
                        'created_at' => $issue->created_at,
                        'expected_delivery_date' => $issue->expected_delivery_date,
                        'status' => $issue->status,
                        'cost' => $issue->cost,
                        'received_at' => $issue->received_at,
                        'inspected_at' => $issue->inspected_at,
                        'prepared_at' => $issue->prepared_at,
                        'for_delivery_at' => $issue->for_delivery_at,
                        'attachment_url' => $issue->attachment_url,
                        'receipt_attachment' => $issue->attachment_url,
                        'inspection_status' => $issue->inspection_status,
                        'inspection_attachment' => $issue->inspection_attachment,
                        'inspector_name' => $issue->inspector_name,
                        'condition' => $issue->condition,
                        'inspection_remarks' => $issue->inspection_remarks,
                        'inspection_checklist' => $issue->inspection_checklist,
                    ];
                })->toArray(),
            ];
        }
        
        return response()->json([
            'success' => true,
            'subscriptions' => $deliveryData,
            'stats' => [
                'total' => count($deliveryData),
                'delivered' => $totalDelivered,
                'ongoing' => $totalOngoing,
            ],
        ]);
    }

    /**
     * Mark serial as received (for GSPS Dashboard)
     */
    public function markSerialReceived(Request $request, $subscriptionId)
    {
        $subscription = Subscription::find($subscriptionId);
        
        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription not found',
            ], 404);
        }
        
        $validated = $request->validate([
            'serial_issn' => 'required|string',
            'attachment' => 'nullable|image|max:5120', // 5MB max
        ]);
        
        $serials = $subscription->serials ?? [];
        $updated = false;
        $receivedDate = now()->toISOString();
        $attachmentUrl = null;
        $oldStatus = null;
        $serialTitle = '';
        $serialIndex = 0;
        
        // Handle file upload - store directly in public folder
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = 'serial_' . $subscriptionId . '_' . time() . '.' . $file->getClientOriginalExtension();
            $uploadPath = public_path('uploads/serial-attachments');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }
            $file->move($uploadPath, $filename);
            $attachmentUrl = '/uploads/serial-attachments/' . $filename;
        }
        
        foreach ($serials as $index => &$serial) {
            if (($serial['issn'] ?? '') === $validated['serial_issn']) {
                $oldStatus = $serial['status'] ?? 'for_delivery';
                $serialTitle = $serial['serialTitle'] ?? $serial['title'] ?? 'Unknown Serial';
                $serialIndex = $index;
                $serial['status'] = 'received';
                $serial['receivedDate'] = $receivedDate;
                // Set inspection status to pending when received
                $serial['inspection_status'] = 'pending';
                // Store attachment URL if uploaded
                if ($attachmentUrl) {
                    $serial['attachmentUrl'] = $attachmentUrl;
                }
                $updated = true;
                break;
            }
        }
        
        if (!$updated) {
            return response()->json([
                'success' => false,
                'message' => 'Serial not found in subscription',
            ], 404);
        }
        
        $subscription->serials = $serials;
        $subscription->save();
        
        // IMPORTANT: Also update the SerialIssue model if it exists
        try {
            $issue = SerialIssue::forSubscription((string)$subscription->_id)
                ->where('status', 'for_delivery')
                ->first();
            
            if ($issue) {
                $issue->status = 'received';
                $issue->inspection_status = 'pending'; // Auto-queue for inspection
                $issue->received_at = $receivedDate;
                if ($attachmentUrl) {
                    $issue->attachment_url = $attachmentUrl;
                }
                $issue->save();
            }
        } catch (\Exception $e) {
            // Log error but don't fail the request
        }
        
        // Log the process movement - GSPS receiving the serial
        ProcessMovementService::logMovement(
            'subscription',
            (string)($subscription->_id ?? $subscription->id),
            $serialTitle,
            null, // Current user (GSPS)
            ['id' => null, 'name' => null, 'role' => 'inspection'],
            $oldStatus,
            'received',
            'receive',
            'Serial received by GSPS and forwarded to Inspection',
            [
                'serial_issn' => $validated['serial_issn'],
                'serial_index' => $serialIndex,
                'received_date' => $receivedDate,
            ]
        );
        
        // Log that inspection is now pending
        ProcessMovementService::logMovement(
            'subscription',
            (string)($subscription->_id ?? $subscription->id),
            $serialTitle,
            ['id' => null, 'name' => 'GSPS', 'role' => 'gsps'],
            ['id' => null, 'name' => null, 'role' => 'inspection'],
            'received',
            'pending_inspection',
            'status_change',
            'Serial queued for inspection',
            [
                'serial_issn' => $validated['serial_issn'],
                'serial_index' => $serialIndex,
            ]
        );
        
        AuditLogService::log(
            'update',
            Subscription::class,
            (string)($subscription->_id ?? $subscription->id),
            "Serial '{$serialTitle}' marked as received by GSPS",
            ['status' => $oldStatus],
            ['status' => 'received', 'inspection_status' => 'pending']
        );
        
        // Create notifications for status change
        ProcessMovementService::createStatusNotifications(
            'received',
            $serialTitle,
            (string)($subscription->_id ?? $subscription->id),
            $validated['serial_issn'],
            $subscription->supplier_name
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Serial marked as received',
            'receivedDate' => $receivedDate,
            'attachmentUrl' => $attachmentUrl,
            'subscription' => $subscription,
        ]);
    }

    /**
     * Update attachment for a received serial (re-upload image)
     */
    public function updateSerialAttachment(Request $request, $subscriptionId)
    {
        $validated = $request->validate([
            'serial_issn' => 'required|string',
            'attachment' => 'required|file|image|max:5120', // 5MB max
        ]);

        $subscription = Subscription::find($subscriptionId);
        
        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription not found',
            ], 404);
        }

        $serials = $subscription->serials ?? [];
        $updated = false;
        $attachmentUrl = null;

        // Handle file upload - store directly in public folder
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = 'serial_' . $subscriptionId . '_' . time() . '.' . $file->getClientOriginalExtension();
            $uploadPath = public_path('uploads/serial-attachments');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }
            $file->move($uploadPath, $filename);
            $attachmentUrl = '/uploads/serial-attachments/' . $filename;
        }

        foreach ($serials as &$serial) {
            if (($serial['issn'] ?? '') === $validated['serial_issn']) {
                // Update the attachment URL
                $serial['attachmentUrl'] = $attachmentUrl;
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            return response()->json([
                'success' => false,
                'message' => 'Serial not found in subscription',
            ], 404);
        }

        $subscription->serials = $serials;
        $subscription->save();

        // Also update the SerialIssue document to keep them in sync
        $issue = SerialIssue::forSubscription((string) $subscription->_id)
            ->where('status', '!=', 'pending')
            ->first();
        
        if ($issue) {
            $issue->attachment_url = $attachmentUrl;
            $issue->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Attachment updated successfully',
            'attachmentUrl' => $attachmentUrl,
        ]);
    }

    /**
     * Update inspection attachment for an inspected serial (re-upload image)
     */
    public function updateInspectionAttachment(Request $request, $subscriptionId)
    {
        $validated = $request->validate([
            'serial_issn' => 'required|string',
            'attachment' => 'required|file|image|max:5120', // 5MB max
        ]);

        $subscription = Subscription::find($subscriptionId);
        
        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription not found',
            ], 404);
        }

        $serials = $subscription->serials ?? [];
        $updated = false;
        $attachmentUrl = null;

        // Handle file upload - store directly in public folder
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = 'inspection_' . $subscriptionId . '_' . time() . '.' . $file->getClientOriginalExtension();
            $uploadPath = public_path('uploads/inspection-attachments');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }
            $file->move($uploadPath, $filename);
            $attachmentUrl = '/uploads/inspection-attachments/' . $filename;
        }

        foreach ($serials as &$serial) {
            if (($serial['issn'] ?? '') === $validated['serial_issn']) {
                // Update the inspection attachment URL
                $serial['inspection_attachment'] = $attachmentUrl;
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            return response()->json([
                'success' => false,
                'message' => 'Serial not found in subscription',
            ], 404);
        }

        $subscription->serials = $serials;
        $subscription->save();

        // IMPORTANT: Also update the SerialIssue model if it exists
        try {
            $issue = SerialIssue::forSubscription((string)$subscription->_id)
                ->where('status', 'received')
                ->first();
            
            if ($issue) {
                $issue->inspection_attachment = $attachmentUrl;
                $issue->inspected_at = now();
                $issue->save();
            }
        } catch (\Exception $e) {
            // Log error but don't fail the request
        }

        return response()->json([
            'success' => true,
            'message' => 'Inspection attachment updated successfully',
            'inspection_attachment' => $attachmentUrl,
        ]);
    }

    /**
     * Get serials for inspection (received serials with pending inspection)
     */
    public function getSerialsForInspection(Request $request)
    {
        $subscriptions = Subscription::orderBy('created_at', 'desc')->get();
        
        // Extract all serials that are received and need inspection
        $inspectionSerials = [];
        $serialId = 1;
        
        foreach ($subscriptions as $subscription) {
            $subscriptionSerials = $subscription->serials ?? [];
            
            // Reverse the serials array so newest ones appear first
            $subscriptionSerials = array_reverse($subscriptionSerials);
            
            foreach ($subscriptionSerials as $serial) {
                $status = $serial['status'] ?? 'pending';
                $inspectionStatus = $serial['inspection_status'] ?? null;
                
                // Include serials that are received and have pending/inspected/rejected inspection status
                if ($status === 'received' && $inspectionStatus !== null) {
                    $inspectionSerials[] = [
                        'id' => $serialId++,
                        'subscription_id' => $subscription->_id ?? $subscription->id,
                        'issn' => $serial['issn'] ?? '',
                        'serialTitle' => $serial['serialTitle'] ?? $serial['title'] ?? '',
                        'supplierName' => $subscription->supplier_name,
                        'deliveryDate' => $serial['deliveryDate'] ?? null,
                        'receivedDate' => $serial['receivedDate'] ?? null,
                        'status' => $status,
                        'inspection_status' => $inspectionStatus,
                        'frequency' => $serial['frequency'] ?? '',
                        'quantity' => $serial['quantity'] ?? 1,
                        // Inspection details if already inspected
                        'inspector_name' => $serial['inspector_name'] ?? null,
                        'condition' => $serial['condition'] ?? null,
                        'inspection_date' => $serial['inspection_date'] ?? null,
                        'inspection_checklist' => $serial['inspection_checklist'] ?? null,
                        'inspection_remarks' => $serial['inspection_remarks'] ?? null,
                        // Include attachment URLs for viewing
                        'attachmentUrl' => $serial['attachmentUrl'] ?? null,
                        'inspection_attachment' => $serial['inspection_attachment'] ?? null,
                        // Additional serial details for view modal
                        'language' => $serial['language'] ?? '',
                        'authorPublisher' => $serial['authorPublisher'] ?? '',
                        'category' => $serial['category'] ?? '',
                        'volumeNumber' => $serial['volumeNumber'] ?? '',
                        'issuesNo' => $serial['issuesNo'] ?? '',
                        'other_description' => $serial['other_description'] ?? null,
                    ];
                }
            }
        }
        
        return response()->json([
            'success' => true,
            'serials' => $inspectionSerials,
        ]);
    }

    /**
     * Get subscriptions with serial issues for Inspection tracking
     * Shows subscriptions with issues that have status "received" (pending inspection)
     * Status is "Ongoing" until all issues are "Delivered"
     */
    public function getInspectionTracking(Request $request)
    {
        // Get subscriptions that are at least accepted
        $subscriptions = Subscription::whereIn('status', ['Active', 'accepted', 'Delivered', 'delivered'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        $inspectionData = [];
        $totalDelivered = 0;
        $totalOngoing = 0;
        
        foreach ($subscriptions as $subscription) {
            // Recalculate delivered cost and status (updates subscription if all issues are delivered)
            $this->recalculateDeliveredCost($subscription);
            
            // Get all serial issues for this subscription
            $issues = SerialIssue::forSubscription((string) $subscription->_id)
                ->orderBy('issue_number', 'asc')
                ->get();

            $acceptedAt = $subscription->accepted_at
                ?? $issues->min('prepared_at')
                ?? $issues->min('for_delivery_at')
                ?? $issues->min('received_at')
                ?? $issues->min('inspected_at')
                ?? null;
            
            if ($issues->count() === 0) {
                continue;
            }
            
            // Only include subscriptions that have at least one issue in "received" status
            $receivedIssues = $issues->whereIn('status', ['received', 'delivered', 'for_return']);
            if ($receivedIssues->count() === 0) {
                continue;
            }
            
            // Calculate aggregated status
            $deliveredCount = $issues->where('status', 'delivered')->count();
            $forReturnCount = $issues->where('status', 'for_return')->count();
            $pendingInspectionCount = $issues->where('status', 'received')->count();
            $totalIssueCount = $issues->count();
            
            // Subscription is "Delivered" only if ALL non-return issues are delivered
            // "for_return" issues don't count towards delivered status
            $deliverableCount = $totalIssueCount - $forReturnCount;
            $aggregatedStatus = ($deliverableCount > 0 && $deliveredCount === $deliverableCount) ? 'Delivered' : 'Ongoing';
            
            if ($aggregatedStatus === 'Delivered') {
                $totalDelivered++;
            } else {
                $totalOngoing++;
            }
            
            // Get ISSN from subscription level, or fallback to first serial's ISSN
            $issn = $subscription->issn;
            if (!$issn && !empty($subscription->serials)) {
                $issn = $subscription->serials[0]['issn'] ?? '';
            }

            $inspectionData[] = [
                'id' => (string) $subscription->_id,
                'subscription_id' => (string) $subscription->_id,
                'serialTitle' => $subscription->serial_title,
                'issn' => $issn ?? '',
                'supplierName' => $subscription->supplier_name,
                'created_at' => $subscription->created_at,
                'pending_at' => $subscription->created_at,
                'accepted_at' => $acceptedAt,
                'aggregatedStatus' => $aggregatedStatus,
                'totalIssues' => $totalIssueCount,
                'deliveredIssues' => $deliveredCount,
                'forReturnIssues' => $forReturnCount,
                'pendingInspectionIssues' => $pendingInspectionCount,
                'issues' => $issues->map(function ($issue) use ($subscription, $issn) {
                    $subscriptionId = (string) $subscription->_id;
                    
                    // Scan for any files matching this subscription and return them
                    // GSPS serial attachments
                    $gspsPath = null;
                    $gspsDir = storage_path('app/public/serial-attachments');
                    if (is_dir($gspsDir)) {
                        $files = array_diff(scandir($gspsDir), array('.', '..'));
                        foreach ($files as $file) {
                            if (strpos($file, "serial_$subscriptionId") === 0) {
                                $gspsPath = "/storage/serial-attachments/$file";
                                break;
                            }
                        }
                    }
                    
                    // Inspection attachments
                    $inspectionPath = null;
                    $inspectionDir = storage_path('app/public/inspection-attachments');
                    if (is_dir($inspectionDir)) {
                        $files = array_diff(scandir($inspectionDir), array('.', '..'));
                        foreach ($files as $file) {
                            if (strpos($file, "inspection_$subscriptionId") === 0) {
                                $inspectionPath = "/storage/inspection-attachments/$file";
                                break;
                            }
                        }
                    }
                    
                    return [
                        'id' => (string) $issue->_id,
                        'issue_number' => $issue->issue_number,
                        'created_at' => $issue->created_at,
                        'expected_delivery_date' => $issue->expected_delivery_date,
                        'status' => $issue->status,
                        'cost' => $issue->cost,
                        'prepared_at' => $issue->prepared_at,
                        'for_delivery_at' => $issue->for_delivery_at,
                        'received_at' => $issue->received_at,
                        'inspected_at' => $issue->inspected_at,
                        'attachment_url' => $gspsPath ?? ($issue->attachment_url ?: null),
                        'receipt_attachment' => $gspsPath ?? ($issue->attachment_url ?: null),
                        'inspection_status' => $issue->inspection_status,
                        'inspector_name' => $issue->inspector_name,
                        'condition' => $issue->condition,
                        'inspection_remarks' => $issue->inspection_remarks,
                        'inspection_checklist' => $issue->inspection_checklist,
                        'other_description' => $issue->other_description,
                        'inspection_attachment' => $inspectionPath ?? ($issue->inspection_attachment ?: null),
                    ];
                })->toArray(),
            ];
        }
        
        return response()->json([
            'success' => true,
            'subscriptions' => $inspectionData,
            'stats' => [
                'total' => count($inspectionData),
                'delivered' => $totalDelivered,
                'ongoing' => $totalOngoing,
            ],
        ]);
    }

    /**
     * Submit inspection result for a serial
     */
    public function submitInspection(Request $request, $subscriptionId)
    {
        $subscription = Subscription::find($subscriptionId);
        
        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription not found',
            ], 404);
        }
        
        $validated = $request->validate([
            'serial_issn' => 'required|string',
            'inspector_name' => 'required|string|max:255',
            'condition' => 'required|string|in:Acceptable,For Return',
            'checklist' => 'nullable',
            'other_description' => 'nullable|string',
            'remarks' => 'nullable|string',
            'attachment' => 'nullable|image|max:5120', // 5MB max
        ]);
        
        // Parse checklist if it's a JSON string
        $checklist = $validated['checklist'] ?? null;
        if (is_string($checklist)) {
            $checklist = json_decode($checklist, true);
        }
        
        $serials = $subscription->serials ?? [];
        $updated = false;
        $inspectionDate = now()->toISOString();
        $attachmentUrl = null;
        
        // Handle file upload - store directly in public folder
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = 'inspection_' . $subscriptionId . '_' . time() . '.' . $file->getClientOriginalExtension();
            $uploadPath = public_path('uploads/inspection-attachments');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }
            $file->move($uploadPath, $filename);
            $attachmentUrl = '/uploads/inspection-attachments/' . $filename;
        }
        
        // Determine inspection status based on condition
        $inspectionStatus = $validated['condition'] === 'For Return' ? 'for_return' : 'inspected';
        
        // Track the serial cost for delivered items
        $serialCost = 0;
        $wasAlreadyInspected = false;
        
        foreach ($serials as &$serial) {
            if (($serial['issn'] ?? '') === $validated['serial_issn']) {
                // Check if this serial was already marked as inspected (to prevent double-counting)
                $wasAlreadyInspected = ($serial['inspection_status'] ?? null) === 'inspected';
                
                $serial['inspection_status'] = $inspectionStatus;
                $serial['inspector_name'] = $validated['inspector_name'];
                $serial['condition'] = $validated['condition'];
                $serial['inspection_date'] = $inspectionDate;
                $serial['inspection_checklist'] = $checklist;
                $serial['other_description'] = $validated['other_description'] ?? null;
                $serial['inspection_remarks'] = $validated['remarks'] ?? null;
                
                // Store attachment URL if uploaded
                if ($attachmentUrl) {
                    $serial['inspection_attachment'] = $attachmentUrl;
                }
                
                // Calculate serial cost (quantity * unitPrice)
                // Support both 'quantity' and 'amount' field names (frontend saves as 'amount')
                $quantity = floatval($serial['quantity'] ?? $serial['amount'] ?? 1);
                $unitPrice = floatval($serial['unitPrice'] ?? 0);
                $serialCost = $quantity * $unitPrice;
                
                $updated = true;
                break;
            }
        }
        
        if (!$updated) {
            return response()->json([
                'success' => false,
                'message' => 'Serial not found in subscription',
            ], 404);
        }
        
        $subscription->serials = $serials;
        
        // IMPORTANT: Also update the SerialIssue model for this serial
        // Find the issue by issue_number (serial position) and update its inspection status
        try {
            $issueIndex = null;
            foreach ($serials as $index => $serial) {
                if (($serial['issn'] ?? '') === $validated['serial_issn']) {
                    $issueIndex = $index + 1; // Issue numbers are 1-indexed
                    break;
                }
            }
            
            if ($issueIndex !== null) {
                $issue = SerialIssue::where('subscription_id', (string)($subscription->_id ?? $subscription->id))
                    ->where('issue_number', $issueIndex)
                    ->first();
                
                if ($issue) {
                    $issue->inspection_status = $inspectionStatus; // 'inspected' or 'for_return'
                    $issue->status = $inspectionStatus === 'inspected' ? 'delivered' : 'for_return';
                    $issue->inspector_name = $validated['inspector_name'];
                    $issue->condition = $validated['condition'];
                    $issue->inspection_remarks = $validated['remarks'] ?? null;
                    $issue->inspection_checklist = $checklist;
                    $issue->other_description = $validated['other_description'] ?? null;
                    if ($attachmentUrl) {
                        $issue->inspection_attachment = $attachmentUrl;
                    }
                    $issue->inspected_at = $inspectionDate;
                    $issue->save();
                }
            }
        } catch (\Exception $e) {
            // Log error but don't fail the response
            \Log::error('Error updating SerialIssue in submitInspection: ' . $e->getMessage());
        }
        
        // Update delivered_cost when serial is marked as delivered (Acceptable condition)
        // Only add cost if it wasn't already inspected before (to prevent double-counting)
        if ($inspectionStatus === 'inspected' && !$wasAlreadyInspected && $serialCost > 0) {
            $subscription->delivered_cost = ($subscription->delivered_cost ?? 0) + $serialCost;
            $subscription->remaining_cost = max(0, ($subscription->award_cost ?? 0) - $subscription->delivered_cost);
            $subscription->payment_status = $this->calculatePaymentStatus(
                $subscription->award_cost ?? 0,
                $subscription->delivered_cost,
                $subscription->remaining_cost
            );
            $subscription->progress = ($subscription->award_cost ?? 0) > 0 
                ? min(100, round(($subscription->delivered_cost / $subscription->award_cost) * 100)) 
                : 0;
        }
        
        $subscription->save();
        
        // Log the inspection
        $serialTitle = '';
        foreach ($subscription->serials ?? [] as $s) {
            if (($s['issn'] ?? '') === $validated['serial_issn']) {
                $serialTitle = $s['serialTitle'] ?? $s['title'] ?? 'Unknown Serial';
                break;
            }
        }
        
        ProcessMovementService::logMovement(
            'subscription',
            (string)($subscription->_id ?? $subscription->id),
            $serialTitle,
            null,
            $inspectionStatus === 'for_return' 
                ? ['id' => null, 'name' => null, 'role' => 'supplier'] 
                : ['id' => null, 'name' => null, 'role' => 'tpu'],
            'pending_inspection',
            $inspectionStatus === 'inspected' ? 'delivered' : 'for_return',
            $inspectionStatus === 'inspected' ? 'inspect' : 'return',
            $inspectionStatus === 'inspected' 
                ? "Inspection completed - Serial is Acceptable and marked as Delivered"
                : "Inspection completed - Serial marked For Return to supplier",
            [
                'serial_issn' => $validated['serial_issn'],
                'inspector_name' => $validated['inspector_name'],
                'condition' => $validated['condition'],
                'remarks' => $validated['remarks'] ?? null,
            ]
        );
        
        AuditLogService::log(
            'update',
            Subscription::class,
            (string)($subscription->_id ?? $subscription->id),
            "Inspection submitted for serial '{$serialTitle}' - Condition: {$validated['condition']}",
            null,
            [
                'inspector_name' => $validated['inspector_name'],
                'condition' => $validated['condition'],
                'inspection_status' => $inspectionStatus,
            ]
        );
        
        // Create notifications for inspection result
        ProcessMovementService::createStatusNotifications(
            $inspectionStatus, // 'inspected' or 'for_return'
            $serialTitle,
            (string)($subscription->_id ?? $subscription->id),
            $validated['serial_issn'],
            $subscription->supplier_name
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Inspection submitted successfully',
            'inspection_status' => $inspectionStatus,
            'inspection_date' => $inspectionDate,
            'attachmentUrl' => $attachmentUrl,
            'subscription' => $subscription,
        ]);
    }

    /**
     * Get subscriptions with serial issues for TPU delivery tracking
     * Shows "Ongoing" status until all issues are delivered
     */
    public function getTPUDeliveryTracking(Request $request)
    {
        // Get accepted subscriptions that have serial issues
        $subscriptions = Subscription::whereIn('status', ['Active', 'accepted', 'Delivered', 'delivered'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        $result = [];
        $totalSubs = 0;
        $ongoingSubs = 0;
        $deliveredSubs = 0;
        
        foreach ($subscriptions as $subscription) {
            // Recalculate delivered cost and status (updates subscription if all issues are delivered)
            $this->recalculateDeliveredCost($subscription);
            
            $issues = SerialIssue::where('subscription_id', (string)($subscription->_id ?? $subscription->id))
                ->orderBy('issue_number', 'asc')
                ->get();

            $acceptedAt = $subscription->accepted_at
                ?? $issues->min('prepared_at')
                ?? $issues->min('for_delivery_at')
                ?? $issues->min('received_at')
                ?? $issues->min('inspected_at')
                ?? null;
            
            if ($issues->isEmpty()) continue;
            
            $totalSubs++;
            
            // Map issues with detailed info
            $issueData = [];
            $deliveredCount = 0;
            $forReturnCount = 0;
            
            foreach ($issues as $issue) {
                $issueData[] = [
                    'id' => (string) ($issue->_id ?? $issue->id),
                    'issue_number' => $issue->issue_number,
                    'created_at' => $issue->created_at,
                    'expected_delivery_date' => $issue->expected_delivery_date,
                    'status' => $issue->status,
                    'cost' => $issue->cost,
                    'prepared_at' => $issue->prepared_at,
                    'for_delivery_at' => $issue->for_delivery_at,
                    'supplier_name' => $issue->supplier_name,
                    'received_at' => $issue->received_at,
                    'delivered_at' => $issue->delivered_at,
                    'inspected_at' => $issue->inspected_at,
                    'inspector_name' => $issue->inspector_name,
                    'condition' => $issue->condition,
                    'inspection_remarks' => $issue->inspection_remarks,
                    'inspection_checklist' => $issue->inspection_checklist,
                    'other_description' => $issue->other_description,
                    'attachment_url' => $issue->attachment_url,
                    'receipt_attachment' => $issue->attachment_url,
                    'inspection_attachment' => $issue->inspection_attachment,
                ];
                
                if ($issue->status === 'delivered') {
                    $deliveredCount++;
                } elseif ($issue->status === 'for_return') {
                    $forReturnCount++;
                }
            }
            
            $totalIssues = count($issueData);
            
            // Aggregated status: "Delivered" only if ALL non-return issues are delivered
            // "for_return" issues don't count towards delivered status
            $deliverableCount = $totalIssues - $forReturnCount;
            $aggregatedStatus = ($deliverableCount > 0 && $deliveredCount === $deliverableCount) ? 'Delivered' : 'Ongoing';
            
            if ($aggregatedStatus === 'Delivered') {
                $deliveredSubs++;
            } else {
                $ongoingSubs++;
            }
            
            // Get first serial info for display
            $serials = $subscription->serials ?? [];
            $firstSerial = !empty($serials) ? $serials[0] : [];
            
            $result[] = [
                'id' => (string) ($subscription->_id ?? $subscription->id),
                'subscription_id' => (string) ($subscription->_id ?? $subscription->id),
                'issn' => $firstSerial['issn'] ?? '',
                'serialTitle' => $firstSerial['serialTitle'] ?? $firstSerial['title'] ?? '',
                'supplierName' => $subscription->supplier_name,
                'totalIssues' => $totalIssues,
                'deliveredIssues' => $deliveredCount,
                'forReturnCount' => $forReturnCount,
                'aggregatedStatus' => $aggregatedStatus,
                'issues' => $issueData,
                'subscription_status' => $subscription->status,
                'created_at' => $subscription->created_at,
                'pending_at' => $subscription->created_at,
                'accepted_at' => $acceptedAt,
            ];
        }
        
        return response()->json([
            'success' => true,
            'subscriptions' => $result,
            'stats' => [
                'total' => $totalSubs,
                'delivered' => $deliveredSubs,
                'ongoing' => $ongoingSubs,
            ],
        ]);
    }

    /**
     * Get serials for TPU Monitor Delivery (all serials from subscriptions)
     */
    public function getMonitoredDeliveries(Request $request)
    {
        $subscriptions = Subscription::orderBy('created_at', 'desc')->get();
        
        // Extract all serials - show all serials from creation
        $monitoredSerials = [];
        $serialId = 1;
        
        // Statistics
        $totalCreated = 0;
        $totalAccepted = 0;
        $totalPreparing = 0;
        $totalForDelivery = 0;
        $totalReceived = 0;
        $totalDelivered = 0;
        $totalPending = 0;
        $totalForReturn = 0;
        
        foreach ($subscriptions as $subscription) {
            $subscriptionSerials = $subscription->serials ?? [];
            
            // Reverse to show newest first
            $subscriptionSerials = array_reverse($subscriptionSerials);
            
            foreach ($subscriptionSerials as $serial) {
                $status = $serial['status'] ?? 'created';
                $inspectionStatus = $serial['inspection_status'] ?? null;
                
                // Determine display status based on flow
                // Flow: Created → Accepted → Preparing → For Delivery → Received → Delivered/For Return
                $deliveryStatus = 'Created';
                if ($status === 'created' || $status === 'pending') {
                    // 'pending' is legacy, treat same as 'created'
                    $deliveryStatus = 'Created';
                    $totalCreated++;
                } elseif ($status === 'accepted') {
                    $deliveryStatus = 'Accepted';
                    $totalAccepted++;
                } elseif ($status === 'prepare') {
                    $deliveryStatus = 'Preparing';
                    $totalPreparing++;
                } elseif ($status === 'for_delivery') {
                    $deliveryStatus = 'For Delivery';
                    $totalForDelivery++;
                } elseif ($status === 'received') {
                    if ($inspectionStatus === 'inspected') {
                        $deliveryStatus = 'Delivered';
                        $totalDelivered++;
                    } elseif ($inspectionStatus === 'for_return') {
                        $deliveryStatus = 'For Return';
                        $totalForReturn++;
                    } else {
                        $deliveryStatus = 'Received';
                        $totalReceived++;
                    }
                }
                
                $monitoredSerials[] = [
                    'id' => $serialId++,
                    'subscription_id' => $subscription->_id ?? $subscription->id,
                    'issn' => $serial['issn'] ?? '',
                    'serialTitle' => $serial['serialTitle'] ?? $serial['title'] ?? '',
                    'supplierName' => $subscription->supplier_name,
                    'deliveryDate' => $serial['deliveryDate'] ?? null,
                    'receivedDate' => $serial['receivedDate'] ?? null,
                    'inspectionDate' => $serial['inspection_date'] ?? null,
                    'deliveryStatus' => $deliveryStatus,
                    'status' => $status,
                    'inspection_status' => $inspectionStatus,
                    'frequency' => $serial['frequency'] ?? '',
                    'quantity' => $serial['quantity'] ?? $serial['amount'] ?? 1,
                    'unitPrice' => $serial['unitPrice'] ?? 0,
                    'inspector_name' => $serial['inspector_name'] ?? null,
                    'condition' => $serial['condition'] ?? null,
                    'inspection_remarks' => $serial['inspection_remarks'] ?? null,
                    'attachmentUrl' => $serial['attachmentUrl'] ?? null,
                    'inspection_attachment' => $serial['inspection_attachment'] ?? null,
                ];
            }
        }
        
        return response()->json([
            'success' => true,
            'serials' => $monitoredSerials,
            'stats' => [
                'total' => count($monitoredSerials),
                'created' => $totalCreated,
                'accepted' => $totalAccepted,
                'preparing' => $totalPreparing,
                'for_delivery' => $totalForDelivery,
                'received' => $totalReceived,
                'delivered' => $totalDelivered,
                'for_return' => $totalForReturn,
                'pending' => $totalPending,
            ],
        ]);
    }
}
