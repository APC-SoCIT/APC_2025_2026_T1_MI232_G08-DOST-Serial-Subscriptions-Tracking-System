<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SupplierAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
     * Recalculate delivered_cost based on inspected serials
     */
    private function recalculateDeliveredCost(Subscription $subscription)
    {
        $serials = $subscription->serials ?? [];
        $deliveredCost = 0;
        
        foreach ($serials as $serial) {
            $inspectionStatus = $serial['inspection_status'] ?? null;
            
            // Only count serials that have been inspected and marked as "Good" (inspected status)
            if ($inspectionStatus === 'inspected') {
                $quantity = floatval($serial['quantity'] ?? 1);
                $unitPrice = floatval($serial['unitPrice'] ?? 0);
                $deliveredCost += $quantity * $unitPrice;
            }
        }
        
        // Update the subscription if the calculated value differs
        if ($subscription->delivered_cost != $deliveredCost) {
            $subscription->delivered_cost = $deliveredCost;
            $subscription->remaining_cost = max(0, ($subscription->award_cost ?? 0) - $deliveredCost);
            $subscription->payment_status = $this->calculatePaymentStatus(
                $subscription->award_cost ?? 0,
                $deliveredCost,
                $subscription->remaining_cost
            );
            $subscription->progress = ($subscription->award_cost ?? 0) > 0 
                ? min(100, round(($deliveredCost / $subscription->award_cost) * 100)) 
                : 0;
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
            'supplier_id' => 'nullable|string',
            'supplier_name' => 'required|string|max:255',
            'period' => 'nullable|string',
            'award_cost' => 'required|numeric|min:0',
            'delivered_cost' => 'nullable|numeric|min:0',
            'serials' => 'nullable|array',
            'transactions' => 'nullable|array',
        ]);

        $deliveredCost = $validated['delivered_cost'] ?? 0;
        $remainingCost = max(0, $validated['award_cost'] - $deliveredCost);

        $subscription = Subscription::create([
            'serial_title' => $validated['serial_title'],
            'supplier_id' => $validated['supplier_id'] ?? null,
            'supplier_name' => $validated['supplier_name'],
            'period' => $validated['period'] ?? null,
            'award_cost' => $validated['award_cost'],
            'delivered_cost' => $deliveredCost,
            'remaining_cost' => $remainingCost,
            'status' => 'Active',
            'payment_status' => $this->calculatePaymentStatus($validated['award_cost'], $deliveredCost, $remainingCost),
            'progress' => $validated['award_cost'] > 0 ? min(100, round(($deliveredCost / $validated['award_cost']) * 100)) : 0,
            'serials' => $validated['serials'] ?? [],
            'transactions' => $validated['transactions'] ?? [],
            'created_by' => Auth::id(),
        ]);

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
            'status' => 'required|string|in:Pending,Delivered,Cancelled',
            'delivery_date' => 'nullable|date',
        ]);

        $serials = $subscription->serials ?? [];
        $serials[] = [
            'id' => count($serials) + 1,
            'title' => $validated['title'],
            'issn' => $validated['issn'],
            'frequency' => $validated['frequency'],
            'status' => $validated['status'],
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
        
        // Get subscriptions for this supplier
        $query = Subscription::query();
        
        if ($supplierName) {
            // Use case-insensitive regex matching for MongoDB
            $query->where('supplier_name', 'regex', '/^' . preg_quote($supplierName, '/') . '$/i');
        }
        
        $subscriptions = $query->orderBy('created_at', 'desc')->get();
        
        // Extract all serials from subscriptions and flatten them
        $serials = [];
        $serialId = 1;
        
        foreach ($subscriptions as $subscription) {
            $subscriptionSerials = $subscription->serials ?? [];
            
            foreach ($subscriptionSerials as $serial) {
                $serials[] = [
                    'id' => $serialId++,
                    'subscription_id' => $subscription->_id ?? $subscription->id,
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
            'status' => 'required|string|in:pending,prepare,for_delivery,received',
        ]);
        
        $serials = $subscription->serials ?? [];
        $updated = false;
        
        foreach ($serials as &$serial) {
            if (($serial['issn'] ?? '') === $validated['serial_issn']) {
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
        $subscription->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Serial status updated successfully',
            'subscription' => $subscription,
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
        
        // Handle file upload
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = 'serial_' . $subscriptionId . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->storeAs('public/serial-attachments', $filename);
            $attachmentUrl = '/storage/serial-attachments/' . $filename;
        }
        
        foreach ($serials as &$serial) {
            if (($serial['issn'] ?? '') === $validated['serial_issn']) {
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
        
        return response()->json([
            'success' => true,
            'message' => 'Serial marked as received',
            'receivedDate' => $receivedDate,
            'attachmentUrl' => $attachmentUrl,
            'subscription' => $subscription,
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
        
        // Handle file upload
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = 'inspection_' . $subscriptionId . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->storeAs('public/inspection-attachments', $filename);
            $attachmentUrl = '/storage/inspection-attachments/' . $filename;
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
                $quantity = floatval($serial['quantity'] ?? 1);
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
     * Get serials for TPU Monitor Delivery (serials that have been inspected)
     */
    public function getMonitoredDeliveries(Request $request)
    {
        $subscriptions = Subscription::orderBy('created_at', 'desc')->get();
        
        // Extract all serials that have been inspected (inspected or for_return)
        $monitoredSerials = [];
        $serialId = 1;
        
        // Statistics
        $totalDelivered = 0;
        $totalForReturn = 0;
        $totalPending = 0;
        
        foreach ($subscriptions as $subscription) {
            $subscriptionSerials = $subscription->serials ?? [];
            
            foreach ($subscriptionSerials as $serial) {
                $status = $serial['status'] ?? 'pending';
                $inspectionStatus = $serial['inspection_status'] ?? null;
                
                // Include all serials that have gone through the delivery flow
                if ($status === 'received' && $inspectionStatus !== null) {
                    // Determine delivery status based on inspection
                    $deliveryStatus = 'Pending';
                    if ($inspectionStatus === 'inspected') {
                        $deliveryStatus = 'Delivered';
                        $totalDelivered++;
                    } elseif ($inspectionStatus === 'for_return') {
                        $deliveryStatus = 'For Return';
                        $totalForReturn++;
                    } else {
                        $totalPending++;
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
                        'inspection_status' => $inspectionStatus,
                        'frequency' => $serial['frequency'] ?? '',
                        'quantity' => $serial['quantity'] ?? 1,
                        'inspector_name' => $serial['inspector_name'] ?? null,
                        'condition' => $serial['condition'] ?? null,
                        'inspection_remarks' => $serial['inspection_remarks'] ?? null,
                    ];
                }
            }
        }
        
        return response()->json([
            'success' => true,
            'serials' => $monitoredSerials,
            'stats' => [
                'total' => count($monitoredSerials),
                'delivered' => $totalDelivered,
                'for_return' => $totalForReturn,
                'pending' => $totalPending,
            ],
        ]);
    }
}
