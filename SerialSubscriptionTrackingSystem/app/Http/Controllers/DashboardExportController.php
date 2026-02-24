<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SupplierAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DashboardExportController extends Controller
{
    /**
     * Helper to format date for CSV export
     */
    private function formatDate($date): string
    {
        if (!$date) return 'N/A';
        try {
            return Carbon::parse($date)->format('Y-m-d');
        } catch (\Exception $e) {
            return 'N/A';
        }
    }

    /**
     * Export Admin Dashboard Report
     */
    public function adminExport(Request $request)
    {
        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : Carbon::now()->startOfYear();
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : Carbon::now()->endOfDay();
        $dashboardName = $request->input('dashboard_name', 'Admin Dashboard');

        $subscriptions = Subscription::whereBetween('created_at', [$startDate, $endDate])->get();
        $users = User::all();
        $suppliers = SupplierAccount::all();

        // Calculate statistics
        $totalSerials = 0;
        $awardedCount = 0;
        $deliveredCount = 0;
        $inspectedCount = 0;
        $pendingCount = 0;

        foreach ($subscriptions as $subscription) {
            $serials = $subscription->serials ?? [];
            foreach ($serials as $serial) {
                $totalSerials++;
                $status = $serial['status'] ?? 'pending';
                $inspectionStatus = $serial['inspection_status'] ?? null;

                $awardedCount++;
                if ($status === 'received') {
                    $deliveredCount++;
                    if ($inspectionStatus === 'inspected') {
                        $inspectedCount++;
                    }
                } elseif ($status === 'pending') {
                    $pendingCount++;
                }
            }
        }

        $data = [
            ['Dashboard Report: ' . $dashboardName],
            ['Report Period: ' . $startDate->format('Y-m-d') . ' to ' . $endDate->format('Y-m-d')],
            ['Generated: ' . Carbon::now()->format('Y-m-d H:i:s')],
            [''],
            ['=== KEY PERFORMANCE INDICATORS ==='],
            ['Metric', 'Value'],
            ['Total Subscriptions', $subscriptions->count()],
            ['Total Serials', $totalSerials],
            ['Awarded Serials', $awardedCount],
            ['Delivered Serials', $deliveredCount],
            ['Inspected Serials', $inspectedCount],
            ['Pending Serials', $pendingCount],
            ['Active Users', $users->count()],
            ['Registered Suppliers', $suppliers->count()],
            [''],
            ['=== SUBSCRIPTIONS DETAIL ==='],
            ['ID', 'Title', 'Status', 'Supplier', 'Serial Count', 'Created At'],
        ];

        foreach ($subscriptions as $subscription) {
            $serialCount = count($subscription->serials ?? []);
            $data[] = [
                (string)$subscription->_id ?? $subscription->id ?? 'N/A',
                $subscription->serial_title ?? 'N/A',
                $subscription->status ?? 'N/A',
                $subscription->supplier_name ?? 'N/A',
                $serialCount,
                $this->formatDate($subscription->created_at),
            ];
        }

        return $this->generateCsvResponse($data, 'Admin_Dashboard_Report');
    }

    /**
     * Export TPU Dashboard Report
     */
    public function tpuExport(Request $request)
    {
        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : Carbon::now()->startOfYear();
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : Carbon::now()->endOfDay();
        $dashboardName = $request->input('dashboard_name', 'TPU Dashboard');

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

        $serialDetails = [];

        foreach ($subscriptions as $subscription) {
            $serials = $subscription->serials ?? [];

            foreach ($serials as $serial) {
                $serialDate = $serial['deliveryDate'] ?? $serial['dateDelivered'] ?? $subscription->created_at;
                $serialCarbon = Carbon::parse($serialDate);
                if ($serialCarbon < $startDate || $serialCarbon > $endDate) {
                    continue;
                }

                $totalSerials++;
                $status = $serial['status'] ?? 'pending';
                $inspectionStatus = $serial['inspection_status'] ?? null;

                $awardedCount++;

                switch ($status) {
                    case 'pending':
                    case 'Pending':
                        $pendingCount++;
                        break;
                    case 'prepare':
                        $prepareCount++;
                        break;
                    case 'for_delivery':
                        $forDeliveryCount++;
                        break;
                    case 'received':
                    case 'Delivered':
                        $deliveredCount++;
                        if ($inspectionStatus === 'inspected') {
                            $inspectedCount++;
                        } elseif ($inspectionStatus === 'for_return') {
                            $returnedCount++;
                        }
                        break;
                }

                $serialDetails[] = [
                    $subscription->serial_title ?? 'N/A',
                    $serial['title'] ?? $serial['issn'] ?? 'N/A',
                    $status,
                    $inspectionStatus ?? 'N/A',
                    $this->formatDate($serialDate),
                ];
            }
        }

        $efficiency = $awardedCount > 0 ? round(($inspectedCount / $awardedCount) * 100) : 0;

        $data = [
            ['Dashboard Report: ' . $dashboardName],
            ['Report Period: ' . $startDate->format('Y-m-d') . ' to ' . $endDate->format('Y-m-d')],
            ['Generated: ' . Carbon::now()->format('Y-m-d H:i:s')],
            [''],
            ['=== SERIAL PIPELINE STATISTICS ==='],
            ['Metric', 'Value'],
            ['Total Serials in Period', $totalSerials],
            ['Awarded', $awardedCount],
            ['Preparing', $prepareCount],
            ['For Delivery', $forDeliveryCount],
            ['Delivered', $deliveredCount],
            ['Inspected', $inspectedCount],
            ['Returned', $returnedCount],
            ['Pending', $pendingCount],
            ['Efficiency Rate', $efficiency . '%'],
            [''],
            ['=== SERIAL DETAILS ==='],
            ['Subscription', 'Serial Title/ISSN', 'Status', 'Inspection Status', 'Date'],
        ];

        foreach ($serialDetails as $detail) {
            $data[] = $detail;
        }

        return $this->generateCsvResponse($data, 'TPU_Dashboard_Report');
    }

    /**
     * Export GSPS Dashboard Report
     */
    public function gspsExport(Request $request)
    {
        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : Carbon::now()->startOfYear();
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : Carbon::now()->endOfDay();
        $dashboardName = $request->input('dashboard_name', 'GSPS Dashboard');

        $subscriptions = Subscription::all();

        $receivedCount = 0;
        $forwardedCount = 0;
        $pendingCount = 0;
        $returnedCount = 0;

        $deliveryDetails = [];

        foreach ($subscriptions as $subscription) {
            $serials = $subscription->serials ?? [];

            foreach ($serials as $serial) {
                $serialDate = $serial['deliveryDate'] ?? $serial['dateDelivered'] ?? $subscription->created_at;
                $serialCarbon = Carbon::parse($serialDate);
                if ($serialCarbon < $startDate || $serialCarbon > $endDate) {
                    continue;
                }

                $status = $serial['status'] ?? 'pending';
                $inspectionStatus = $serial['inspection_status'] ?? null;

                if ($status === 'received' || $status === 'Delivered') {
                    $receivedCount++;
                    if ($inspectionStatus === 'inspected') {
                        $forwardedCount++;
                    } elseif ($inspectionStatus === 'for_return') {
                        $returnedCount++;
                    } else {
                        $pendingCount++;
                    }

                    $deliveryDetails[] = [
                        $subscription->serial_title ?? 'N/A',
                        $serial['title'] ?? $serial['issn'] ?? 'N/A',
                        $status,
                        $inspectionStatus ?? 'Pending',
                        $this->formatDate($serialDate),
                    ];
                }
            }
        }

        $successRate = $receivedCount > 0 ? round((($receivedCount - $returnedCount) / $receivedCount) * 100) : 0;

        $data = [
            ['Dashboard Report: ' . $dashboardName],
            ['Report Period: ' . $startDate->format('Y-m-d') . ' to ' . $endDate->format('Y-m-d')],
            ['Generated: ' . Carbon::now()->format('Y-m-d H:i:s')],
            [''],
            ['=== DELIVERY HANDLING STATISTICS ==='],
            ['Metric', 'Value'],
            ['Received Deliveries', $receivedCount],
            ['Forwarded to Inspection', $forwardedCount],
            ['Pending Forwarding', $pendingCount],
            ['Returned / Issues', $returnedCount],
            ['Handling Success Rate', $successRate . '%'],
            [''],
            ['=== DELIVERY DETAILS ==='],
            ['Subscription', 'Serial Title/ISSN', 'Status', 'Inspection Status', 'Date'],
        ];

        foreach ($deliveryDetails as $detail) {
            $data[] = $detail;
        }

        return $this->generateCsvResponse($data, 'GSPS_Dashboard_Report');
    }

    /**
     * Export Supplier Dashboard Report
     */
    public function supplierExport(Request $request)
    {
        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : Carbon::now()->startOfYear();
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : Carbon::now()->endOfDay();
        $dashboardName = $request->input('dashboard_name', 'Supplier Dashboard');

        // Get supplier specific data if authenticated
        $user = Auth::user();
        $subscriptions = Subscription::all();

        $awardedCount = 0;
        $preparingCount = 0;
        $forDeliveryCount = 0;
        $deliveredCount = 0;
        $returnedCount = 0;

        $orderDetails = [];

        foreach ($subscriptions as $subscription) {
            $serials = $subscription->serials ?? [];

            foreach ($serials as $serial) {
                $serialDate = $serial['deliveryDate'] ?? $serial['dateDelivered'] ?? $subscription->created_at;
                $serialCarbon = Carbon::parse($serialDate);
                if ($serialCarbon < $startDate || $serialCarbon > $endDate) {
                    continue;
                }

                $status = $serial['status'] ?? 'pending';
                $inspectionStatus = $serial['inspection_status'] ?? null;

                $awardedCount++;

                switch ($status) {
                    case 'pending':
                    case 'Pending':
                    case 'prepare':
                        $preparingCount++;
                        break;
                    case 'for_delivery':
                        $forDeliveryCount++;
                        break;
                    case 'received':
                    case 'Delivered':
                        $deliveredCount++;
                        if ($inspectionStatus === 'for_return') {
                            $returnedCount++;
                        }
                        break;
                }

                $orderDetails[] = [
                    $subscription->serial_title ?? 'N/A',
                    $serial['title'] ?? $serial['issn'] ?? 'N/A',
                    $status,
                    $subscription->supplier_name ?? 'N/A',
                    $this->formatDate($serialDate),
                ];
            }
        }

        $deliveryRate = $awardedCount > 0 ? round(($deliveredCount / $awardedCount) * 100) : 0;

        $data = [
            ['Dashboard Report: ' . $dashboardName],
            ['Report Period: ' . $startDate->format('Y-m-d') . ' to ' . $endDate->format('Y-m-d')],
            ['Generated: ' . Carbon::now()->format('Y-m-d H:i:s')],
            [''],
            ['=== SUPPLIER ORDER STATISTICS ==='],
            ['Metric', 'Value'],
            ['Awarded Serials', $awardedCount],
            ['Preparing Delivery', $preparingCount],
            ['For Delivery', $forDeliveryCount],
            ['Delivered to GSPS', $deliveredCount],
            ['Returned', $returnedCount],
            ['Delivery Rate', $deliveryRate . '%'],
            [''],
            ['=== ORDER DETAILS ==='],
            ['Subscription', 'Serial Title/ISSN', 'Status', 'Supplier', 'Date'],
        ];

        foreach ($orderDetails as $detail) {
            $data[] = $detail;
        }

        return $this->generateCsvResponse($data, 'Supplier_Dashboard_Report');
    }

    /**
     * Export Inspection Dashboard Report
     */
    public function inspectionExport(Request $request)
    {
        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : Carbon::now()->startOfYear();
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : Carbon::now()->endOfDay();
        $dashboardName = $request->input('dashboard_name', 'Inspection Dashboard');

        $subscriptions = Subscription::all();

        $receivedCount = 0;
        $inspectedCount = 0;
        $returnedCount = 0;
        $pendingCount = 0;

        $inspectionDetails = [];

        foreach ($subscriptions as $subscription) {
            $serials = $subscription->serials ?? [];

            foreach ($serials as $serial) {
                $serialDate = $serial['deliveryDate'] ?? $serial['dateDelivered'] ?? $subscription->created_at;
                $serialCarbon = Carbon::parse($serialDate);
                if ($serialCarbon < $startDate || $serialCarbon > $endDate) {
                    continue;
                }

                $status = $serial['status'] ?? 'pending';
                $inspectionStatus = $serial['inspection_status'] ?? null;

                if ($status === 'received' || $status === 'Delivered') {
                    $receivedCount++;

                    if ($inspectionStatus === 'inspected') {
                        $inspectedCount++;
                    } elseif ($inspectionStatus === 'for_return') {
                        $returnedCount++;
                    } else {
                        $pendingCount++;
                    }

                    $inspectionDetails[] = [
                        $subscription->serial_title ?? 'N/A',
                        $serial['title'] ?? $serial['issn'] ?? 'N/A',
                        $inspectionStatus ?? 'Pending',
                        $serial['inspectionNotes'] ?? $serial['inspection_notes'] ?? 'N/A',
                        $this->formatDate($serialDate),
                    ];
                }
            }
        }

        $successRate = $receivedCount > 0 ? round(($inspectedCount / $receivedCount) * 100) : 0;

        $data = [
            ['Dashboard Report: ' . $dashboardName],
            ['Report Period: ' . $startDate->format('Y-m-d') . ' to ' . $endDate->format('Y-m-d')],
            ['Generated: ' . Carbon::now()->format('Y-m-d H:i:s')],
            [''],
            ['=== INSPECTION STATISTICS ==='],
            ['Metric', 'Value'],
            ['Received from GSPS', $receivedCount],
            ['Inspected (Passed)', $inspectedCount],
            ['Returned (Damaged)', $returnedCount],
            ['Pending Inspection', $pendingCount],
            ['Inspection Success Rate', $successRate . '%'],
            [''],
            ['=== INSPECTION DETAILS ==='],
            ['Subscription', 'Serial Title/ISSN', 'Inspection Status', 'Notes', 'Date'],
        ];

        foreach ($inspectionDetails as $detail) {
            $data[] = $detail;
        }

        return $this->generateCsvResponse($data, 'Inspection_Dashboard_Report');
    }

    /**
     * Generate CSV Response
     */
    private function generateCsvResponse(array $data, string $filename): StreamedResponse
    {
        $filename = $filename . '_' . Carbon::now()->format('Y-m-d_His') . '.csv';

        return response()->streamDownload(function () use ($data) {
            $handle = fopen('php://output', 'w');
            
            // Add BOM for Excel UTF-8 compatibility
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            foreach ($data as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
