<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SupplierAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DashboardStatsController extends Controller
{
    /**
     * Get TPU Dashboard Statistics
     */
    public function tpuStats(Request $request)
    {
        try {
            $startDate = $request->input('start_date') 
                ? Carbon::parse($request->input('start_date'))->startOfDay() 
                : Carbon::now()->startOfYear();
            $endDate = $request->input('end_date') 
                ? Carbon::parse($request->input('end_date'))->endOfDay() 
                : Carbon::now()->endOfDay();

            $subscriptions = Subscription::all();
            
            // Calculate serial statistics
            $totalSerials = 0;
            $awardedCount = 0;
            $deliveredCount = 0;
            $forDeliveryCount = 0;
            $inspectedCount = 0;
            $returnedCount = 0;
            $pendingCount = 0;
            $prepareCount = 0;

            foreach ($subscriptions as $subscription) {
                $serials = $subscription->serials ?? [];
                
                foreach ($serials as $serial) {
                    $totalSerials++;
                    $status = $serial['status'] ?? 'pending';
                    $inspectionStatus = $serial['inspection_status'] ?? null;

                    // Count awarded (all assigned serials)
                    $awardedCount++;

                    switch ($status) {
                        case 'pending':
                            $pendingCount++;
                            break;
                        case 'prepare':
                            $prepareCount++;
                            break;
                        case 'for_delivery':
                            $forDeliveryCount++;
                            break;
                        case 'received':
                            $deliveredCount++;
                            // Check inspection status
                            if ($inspectionStatus === 'inspected') {
                                $inspectedCount++;
                            } elseif ($inspectionStatus === 'rejected') {
                                $returnedCount++;
                            }
                            break;
                    }
                }
            }

            // Calculate efficiency
            $efficiency = $awardedCount > 0 
                ? round(($inspectedCount / $awardedCount) * 100) 
                : 0;

            // Get monthly chart data
            $chartData = $this->getTPUChartData($subscriptions, $startDate, $endDate);

            return response()->json([
                'success' => true,
                'stats' => [
                    'total_serials' => $totalSerials,
                    'awarded' => $awardedCount,
                    'delivered' => $deliveredCount,
                    'for_delivery' => $forDeliveryCount,
                    'inspected' => $inspectedCount,
                    'returned' => $returnedCount,
                    'pending' => $pendingCount,
                    'prepare' => $prepareCount,
                    'efficiency' => $efficiency,
                    'total_subscriptions' => $subscriptions->count(),
                    'active_subscriptions' => $subscriptions->where('status', 'Active')->count(),
                    'total_award_cost' => $subscriptions->sum('award_cost') ?? 0,
                    'total_delivered_cost' => $subscriptions->sum('delivered_cost') ?? 0,
                ],
                'charts' => $chartData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch TPU statistics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get GSPS Dashboard Statistics
     */
    public function gspsStats(Request $request)
    {
        try {
            $startDate = $request->input('start_date') 
                ? Carbon::parse($request->input('start_date'))->startOfDay() 
                : Carbon::now()->startOfYear();
            $endDate = $request->input('end_date') 
                ? Carbon::parse($request->input('end_date'))->endOfDay() 
                : Carbon::now()->endOfDay();

            $subscriptions = Subscription::all();
            
            // Calculate serial statistics for GSPS
            $receivedCount = 0;
            $forwardedCount = 0; // forwarded to inspection
            $pendingCount = 0;
            $returnedCount = 0;

            foreach ($subscriptions as $subscription) {
                $serials = $subscription->serials ?? [];
                
                foreach ($serials as $serial) {
                    $status = $serial['status'] ?? 'pending';
                    $inspectionStatus = $serial['inspection_status'] ?? null;

                    // GSPS receives serials with "received" status
                    if ($status === 'received') {
                        $receivedCount++;
                        
                        // Count forwarded (has been inspected - either approved or rejected)
                        if ($inspectionStatus === 'inspected') {
                            $forwardedCount++;
                        } elseif ($inspectionStatus === 'rejected') {
                            $returnedCount++;
                        } else {
                            // Pending inspection
                            $pendingCount++;
                        }
                    }
                    
                    // For deliveries still in transit
                    if ($status === 'for_delivery') {
                        $pendingCount++;
                    }
                }
            }

            // Calculate success rate
            $successRate = $receivedCount > 0 
                ? round(($forwardedCount / $receivedCount) * 100) 
                : 0;

            // Get chart data
            $chartData = $this->getGSPSChartData($subscriptions, $startDate, $endDate);

            return response()->json([
                'success' => true,
                'stats' => [
                    'received' => $receivedCount,
                    'forwarded' => $forwardedCount,
                    'pending' => $pendingCount,
                    'returned' => $returnedCount,
                    'success_rate' => $successRate,
                ],
                'charts' => $chartData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch GSPS statistics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get Supplier Dashboard Statistics
     */
    public function supplierStats(Request $request)
    {
        try {
            $user = Auth::user();
            $startDate = $request->input('start_date') 
                ? Carbon::parse($request->input('start_date'))->startOfDay() 
                : Carbon::now()->startOfYear();
            $endDate = $request->input('end_date') 
                ? Carbon::parse($request->input('end_date'))->endOfDay() 
                : Carbon::now()->endOfDay();

            // Get supplier's subscriptions
            $query = Subscription::query();
            
            // Filter by supplier name if user is a supplier
            if ($user && $user->role === 'supplier') {
                $supplierAccount = SupplierAccount::where('user_id', $user->_id ?? $user->id)->first();
                if ($supplierAccount) {
                    $query->where('supplier_name', $supplierAccount->company_name);
                } else {
                    $query->where('supplier_name', $user->name);
                }
            }
            
            $subscriptions = $query->get();
            
            // Calculate statistics
            $awardedCount = 0;
            $preparingCount = 0;
            $forDeliveryCount = 0;
            $deliveredCount = 0;
            $returnedCount = 0;

            foreach ($subscriptions as $subscription) {
                $serials = $subscription->serials ?? [];
                
                foreach ($serials as $serial) {
                    $status = $serial['status'] ?? 'pending';
                    $inspectionStatus = $serial['inspection_status'] ?? null;

                    $awardedCount++;

                    switch ($status) {
                        case 'pending':
                        case 'prepare':
                            $preparingCount++;
                            break;
                        case 'for_delivery':
                            $forDeliveryCount++;
                            break;
                        case 'received':
                            $deliveredCount++;
                            if ($inspectionStatus === 'rejected') {
                                $returnedCount++;
                            }
                            break;
                    }
                }
            }

            // Calculate success rate
            $successRate = $awardedCount > 0 
                ? round((($deliveredCount - $returnedCount) / $awardedCount) * 100) 
                : 0;

            // Get chart data
            $chartData = $this->getSupplierChartData($subscriptions, $startDate, $endDate);

            return response()->json([
                'success' => true,
                'stats' => [
                    'awarded' => $awardedCount,
                    'preparing' => $preparingCount,
                    'for_delivery' => $forDeliveryCount,
                    'delivered' => $deliveredCount,
                    'returned' => $returnedCount,
                    'success_rate' => $successRate,
                    'total_subscriptions' => $subscriptions->count(),
                    'total_award_cost' => $subscriptions->sum('award_cost') ?? 0,
                ],
                'charts' => $chartData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch Supplier statistics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get Inspection Dashboard Statistics
     */
    public function inspectionStats(Request $request)
    {
        try {
            $startDate = $request->input('start_date') 
                ? Carbon::parse($request->input('start_date'))->startOfDay() 
                : Carbon::now()->startOfYear();
            $endDate = $request->input('end_date') 
                ? Carbon::parse($request->input('end_date'))->endOfDay() 
                : Carbon::now()->endOfDay();

            $subscriptions = Subscription::all();
            
            // Calculate inspection statistics
            $receivedCount = 0;  // received for inspection
            $inspectedCount = 0;
            $pendingCount = 0;
            $returnedCount = 0;

            foreach ($subscriptions as $subscription) {
                $serials = $subscription->serials ?? [];
                
                foreach ($serials as $serial) {
                    $status = $serial['status'] ?? 'pending';
                    $inspectionStatus = $serial['inspection_status'] ?? null;

                    // Only count serials that have been received (available for inspection)
                    if ($status === 'received') {
                        $receivedCount++;
                        
                        if ($inspectionStatus === 'inspected') {
                            $inspectedCount++;
                        } elseif ($inspectionStatus === 'rejected') {
                            $returnedCount++;
                        } else {
                            $pendingCount++;
                        }
                    }
                }
            }

            // Calculate success rate
            $successRate = $receivedCount > 0 
                ? round(($inspectedCount / $receivedCount) * 100) 
                : 0;

            // Get chart data
            $chartData = $this->getInspectionChartData($subscriptions, $startDate, $endDate);

            return response()->json([
                'success' => true,
                'stats' => [
                    'received' => $receivedCount,
                    'inspected' => $inspectedCount,
                    'pending' => $pendingCount,
                    'returned' => $returnedCount,
                    'success_rate' => $successRate,
                ],
                'charts' => $chartData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch Inspection statistics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate TPU chart data
     */
    private function getTPUChartData($subscriptions, $startDate, $endDate)
    {
        $months = $this->getMonthsBetween($startDate, $endDate);
        $monthlyData = [];

        foreach ($months as $monthData) {
            $monthName = $monthData['name'];
            $monthStart = $monthData['start'];
            $monthEnd = $monthData['end'];

            $awarded = 0;
            $delivered = 0;
            $forDelivery = 0;
            $inspected = 0;
            $returned = 0;

            foreach ($subscriptions as $subscription) {
                $serials = $subscription->serials ?? [];
                
                foreach ($serials as $serial) {
                    // Check if serial was created/updated in this month
                    $serialDate = $serial['deliveryDate'] ?? $serial['dateDelivered'] ?? $subscription->created_at;
                    if ($serialDate) {
                        $serialCarbon = Carbon::parse($serialDate);
                        if ($serialCarbon >= $monthStart && $serialCarbon <= $monthEnd) {
                            $status = $serial['status'] ?? 'pending';
                            $inspectionStatus = $serial['inspection_status'] ?? null;

                            $awarded++;
                            
                            if ($status === 'received') {
                                $delivered++;
                                if ($inspectionStatus === 'inspected') $inspected++;
                                if ($inspectionStatus === 'rejected') $returned++;
                            }
                            if ($status === 'for_delivery') $forDelivery++;
                        }
                    }
                }
            }

            $monthlyData[] = [
                'month' => $monthName,
                'awarded' => $awarded,
                'delivered' => $delivered,
                'forDelivery' => $forDelivery,
                'inspected' => $inspected,
                'returned' => $returned,
            ];
        }

        // Pipeline data for pie chart
        $pipelineData = $this->calculatePipelineTotals($subscriptions);

        return [
            'monthly' => $monthlyData,
            'pipeline' => $pipelineData,
        ];
    }

    /**
     * Generate GSPS chart data
     */
    private function getGSPSChartData($subscriptions, $startDate, $endDate)
    {
        $months = $this->getMonthsBetween($startDate, $endDate);
        $monthlyData = [];

        foreach ($months as $monthData) {
            $monthName = $monthData['name'];
            $received = 0;
            $forwarded = 0;
            $pending = 0;
            $returned = 0;

            foreach ($subscriptions as $subscription) {
                $serials = $subscription->serials ?? [];
                
                foreach ($serials as $serial) {
                    $status = $serial['status'] ?? 'pending';
                    $inspectionStatus = $serial['inspection_status'] ?? null;
                    
                    // Simplified counting per month
                    if ($status === 'received' || $status === 'for_delivery') {
                        $received++;
                        if ($inspectionStatus === 'inspected') $forwarded++;
                        elseif ($inspectionStatus === 'rejected') $returned++;
                        else $pending++;
                    }
                }
            }

            // Scale by number of months to distribute
            $scale = 1 / max(count($months), 1);

            $monthlyData[] = [
                'month' => $monthName,
                'received' => max(1, round($received * $scale)),
                'forwarded' => round($forwarded * $scale),
                'pending' => round($pending * $scale),
                'returned' => round($returned * $scale),
            ];
        }

        return [
            'monthly' => $monthlyData,
        ];
    }

    /**
     * Generate Supplier chart data
     */
    private function getSupplierChartData($subscriptions, $startDate, $endDate)
    {
        $months = $this->getMonthsBetween($startDate, $endDate);
        $monthlyData = [];

        foreach ($months as $monthData) {
            $monthName = $monthData['name'];
            $awarded = 0;
            $preparing = 0;
            $forDelivery = 0;
            $delivered = 0;

            foreach ($subscriptions as $subscription) {
                $serials = $subscription->serials ?? [];
                
                foreach ($serials as $serial) {
                    $status = $serial['status'] ?? 'pending';
                    $awarded++;
                    
                    if (in_array($status, ['pending', 'prepare'])) $preparing++;
                    if ($status === 'for_delivery') $forDelivery++;
                    if ($status === 'received') $delivered++;
                }
            }

            $scale = 1 / max(count($months), 1);

            $monthlyData[] = [
                'month' => $monthName,
                'awarded' => max(1, round($awarded * $scale)),
                'preparing' => round($preparing * $scale),
                'forDelivery' => round($forDelivery * $scale),
                'delivered' => round($delivered * $scale),
            ];
        }

        return [
            'monthly' => $monthlyData,
        ];
    }

    /**
     * Generate Inspection chart data
     */
    private function getInspectionChartData($subscriptions, $startDate, $endDate)
    {
        $months = $this->getMonthsBetween($startDate, $endDate);
        $monthlyData = [];

        foreach ($months as $monthData) {
            $monthName = $monthData['name'];
            $received = 0;
            $inspected = 0;
            $pending = 0;
            $returned = 0;

            foreach ($subscriptions as $subscription) {
                $serials = $subscription->serials ?? [];
                
                foreach ($serials as $serial) {
                    $status = $serial['status'] ?? 'pending';
                    $inspectionStatus = $serial['inspection_status'] ?? null;
                    
                    if ($status === 'received') {
                        $received++;
                        if ($inspectionStatus === 'inspected') $inspected++;
                        elseif ($inspectionStatus === 'rejected') $returned++;
                        else $pending++;
                    }
                }
            }

            $scale = 1 / max(count($months), 1);

            $monthlyData[] = [
                'month' => $monthName,
                'received' => max(1, round($received * $scale)),
                'inspected' => round($inspected * $scale),
                'pending' => round($pending * $scale),
                'returned' => round($returned * $scale),
            ];
        }

        return [
            'monthly' => $monthlyData,
        ];
    }

    /**
     * Calculate pipeline totals for pie chart
     */
    private function calculatePipelineTotals($subscriptions)
    {
        $awarded = 0;
        $delivered = 0;
        $forDelivery = 0;
        $inspected = 0;
        $returned = 0;

        foreach ($subscriptions as $subscription) {
            $serials = $subscription->serials ?? [];
            
            foreach ($serials as $serial) {
                $status = $serial['status'] ?? 'pending';
                $inspectionStatus = $serial['inspection_status'] ?? null;

                $awarded++;
                
                if ($status === 'for_delivery') $forDelivery++;
                if ($status === 'received') {
                    $delivered++;
                    if ($inspectionStatus === 'inspected') $inspected++;
                    if ($inspectionStatus === 'rejected') $returned++;
                }
            }
        }

        return [
            ['name' => 'Awarded', 'value' => $awarded],
            ['name' => 'Delivered', 'value' => $delivered],
            ['name' => 'For Delivery', 'value' => $forDelivery],
            ['name' => 'Inspected', 'value' => $inspected],
            ['name' => 'Returned', 'value' => $returned],
        ];
    }

    /**
     * Get months between two dates
     */
    private function getMonthsBetween($startDate, $endDate)
    {
        $months = [];
        $current = Carbon::parse($startDate)->startOfMonth();
        $end = Carbon::parse($endDate)->endOfMonth();

        while ($current <= $end) {
            $months[] = [
                'name' => $current->format('F'),
                'year' => $current->year,
                'start' => $current->copy()->startOfMonth(),
                'end' => $current->copy()->endOfMonth(),
            ];
            $current->addMonth();
        }

        return $months;
    }
}
