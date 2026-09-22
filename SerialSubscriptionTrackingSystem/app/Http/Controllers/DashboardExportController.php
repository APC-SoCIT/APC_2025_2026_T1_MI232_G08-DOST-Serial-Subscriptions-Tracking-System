<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SupplierAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
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
     * Resolve the display ID for a serial item.
     */
    private function getSerialDisplayId(array $serial): string
    {
        return (string) ($serial['issn'] ?? $serial['serialTitle'] ?? $serial['title'] ?? 'N/A');
    }

    /**
     * Normalize a serial's status for the admin report buckets.
     */
    private function getAdminSerialStatus(array $serial): string
    {
        $status = strtolower((string) ($serial['status'] ?? 'pending'));
        $inspectionStatus = strtolower((string) ($serial['inspection_status'] ?? ''));

        if ($inspectionStatus === 'inspected') {
            return 'Inspected';
        }

        if (in_array($status, ['received', 'delivered'], true)) {
            return 'Delivered';
        }

        if (in_array($status, ['pending', 'created'], true)) {
            return 'Pending';
        }

        return 'Awarded';
    }

    /**
     * Resolve the most useful awarded date for the report.
     */
    private function getSerialAwardedDate(array $serial, Subscription $subscription): string
    {
        return $this->formatDate(
            $serial['awarded_date']
                ?? $serial['award_date']
                ?? $serial['created_at']
                ?? $subscription->created_at
        );
    }

    /**
     * Resolve the most useful delivered date for the report.
     */
    private function getSerialDeliveredDate(array $serial): string
    {
        return $this->formatDate(
            $serial['receivedDate']
                ?? $serial['deliveryDate']
                ?? $serial['dateDelivered']
                ?? null
        );
    }

    /**
     * Resolve the most useful inspected date for the report.
     */
    private function getSerialInspectedDate(array $serial): string
    {
        return $this->formatDate(
            $serial['inspection_date']
                ?? $serial['inspected_at']
                ?? null
        );
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
        $totalUsers = User::where('role', '!=', 'admin')->count();
        $approvedUsers = User::where('role', '!=', 'admin')
            ->whereNotNull('email_verified_at')
            ->count();
        $pendingAccounts = SupplierAccount::where('status', 'pending')->count();
        $approvalBacklog = SupplierAccount::where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subDays(7))
            ->count();
        $approvedAccounts = SupplierAccount::where('status', 'approved')
            ->whereNotNull('approved_at')
            ->whereNotNull('created_at')
            ->get();
        $avgApprovalTime = 0;
        if ($approvedAccounts->isNotEmpty()) {
            $totalApprovalDays = 0;
            foreach ($approvedAccounts as $account) {
                $totalApprovalDays += Carbon::parse($account->created_at)
                    ->diffInDays(Carbon::parse($account->approved_at));
            }
            $avgApprovalTime = round($totalApprovalDays / $approvedAccounts->count(), 1);
        }
        $activeSupplierIds = Subscription::distinct('supplier_id')->pluck('supplier_id')->toArray();
        $inactiveApprovedSuppliers = SupplierAccount::where('status', 'approved')
            ->whereNotIn('_id', $activeSupplierIds)
            ->count();
        $serialDetails = [];

        foreach ($subscriptions as $subscription) {
            $serials = $subscription->serials ?? [];
            foreach ($serials as $serial) {
                $serialDetails[] = [
                    $this->getSerialDisplayId($serial),
                    $subscription->serial_title ?? 'N/A',
                    $subscription->supplier_name ?? 'N/A',
                    $this->getAdminSerialStatus($serial),
                    $this->getSerialAwardedDate($serial, $subscription),
                    $this->getSerialDeliveredDate($serial),
                    $this->getSerialInspectedDate($serial),
                ];
            }
        }

        $data = [
            ['Dashboard Report: ' . $dashboardName],
            ['Report Period: ' . $startDate->format('Y-m-d') . ' to ' . $endDate->format('Y-m-d')],
            ['Generated: ' . Carbon::now()->format('Y-m-d H:i:s')],
            [''],
            ['=== KEY PERFORMANCE INDICATORS ==='],
            ['Metric', 'Value'],
            ['Total Users', $totalUsers],
            ['Approved Users', $approvedUsers],
            ['Pending Accounts', $pendingAccounts],
            ['Approval Backlog (>7 days)', $approvalBacklog],
            ['Avg Approval Time (days)', $avgApprovalTime],
            ['Inactive Approved Suppliers', $inactiveApprovedSuppliers],
            [''],
            ['=== SUBSCRIPTIONS DETAIL ==='],
            ['ID', 'Title', 'Status', 'Supplier', 'Serial Count', 'Created At'],
        ];

        foreach ($subscriptions as $subscription) {
            $serialCount = count($subscription->serials ?? []);
            $subscriptionId = (string) ($subscription->_id ?? $subscription->id ?? 'N/A');
            $data[] = [
                $subscriptionId,
                $subscription->serial_title ?? 'N/A',
                $subscription->status ?? 'N/A',
                $subscription->supplier_name ?? 'N/A',
                $serialCount,
                $this->formatDate($subscription->created_at),
            ];
        }

        $data[] = [''];
        $data[] = ['=== SERIAL DETAILS ==='];
        $data[] = ['Serial No./ID', 'Subscription Title', 'Supplier', 'Status', 'Awarded Date', 'Delivered Date', 'Inspected Date'];

        foreach ($serialDetails as $detail) {
            $data[] = $detail;
        }

        return $this->generateXlsxResponse($data, 'Admin_Dashboard_Report');
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
                $serialDate = $serial['deliveryDate']
                    ?? $serial['dateDelivered']
                    ?? $subscription->created_at;
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
            ['Total Serials Encoded', $awardedCount],
            ['Delivered to GSPS', $deliveredCount],
            ['Awaiting delivery', $forDeliveryCount],
            ['Overdue / Returned', $returnedCount],
            ['Inspected', $inspectedCount],
            ['Delivery Success Rate', $efficiency . '%'],
            [''],
            ['=== SERIAL DETAILS ==='],
            ['Subscription', 'Serial Title/ISSN', 'Status', 'Inspection Status', 'Date'],
        ];

        foreach ($serialDetails as $detail) {
            $data[] = $detail;
        }

        return $this->generateXlsxResponse($data, 'TPU_Dashboard_Report');
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

                if ($status === 'received' || $status === 'for_delivery') {
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

        $successRate = $receivedCount > 0 ? round(($forwardedCount / $receivedCount) * 100) : 0;

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

        return $this->generateXlsxResponse($data, 'GSPS_Dashboard_Report');
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

        // Match the dashboard's authenticated supplier scope.
        $user = Auth::user();
        $query = Subscription::query();
        if ($user && strtolower($user->role ?? '') === 'supplier') {
            $supplierAccount = SupplierAccount::where('user_id', $user->_id ?? $user->id)
                ->orWhere('email', $user->email)
                ->first();

            if ($supplierAccount) {
                $supplierAccountId = (string) ($supplierAccount->_id ?? $supplierAccount->id);
                $query->where('supplier_id', $supplierAccountId);
            } else {
                $query->where('supplier_name', $user->name);
            }
        }
        $subscriptions = $query->get();

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

        $deliveryRate = $awardedCount > 0
            ? max(0, round((($deliveredCount - $returnedCount) / $awardedCount) * 100))
            : 0;

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
            ['Success Rate', $deliveryRate . '%'],
            [''],
            ['=== ORDER DETAILS ==='],
            ['Subscription', 'Serial Title/ISSN', 'Status', 'Supplier', 'Date'],
        ];

        foreach ($orderDetails as $detail) {
            $data[] = $detail;
        }

        return $this->generateXlsxResponse($data, 'Supplier_Dashboard_Report');
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
                $serialDate = $serial['inspection_date']
                    ?? $serial['receivedDate']
                    ?? $serial['deliveryDate']
                    ?? $subscription->created_at;
                $serialCarbon = Carbon::parse($serialDate);
                if ($serialCarbon < $startDate || $serialCarbon > $endDate) {
                    continue;
                }

                $status = $serial['status'] ?? 'pending';
                $inspectionStatus = $serial['inspection_status'] ?? null;

                if ($status === 'received') {
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

        return $this->generateXlsxResponse($data, 'Inspection_Dashboard_Report');
    }

    /**
     * Generate a standard Excel XLSX response.
     */
    private function generateXlsxResponse(array $data, string $filename): StreamedResponse
    {
        $filename = $filename . '_' . Carbon::now()->format('Y-m-d_His') . '.xlsx';

        return response()->streamDownload(function () use ($data) {
            $spreadsheet = new Spreadsheet();
            $worksheet = $spreadsheet->getActiveSheet();

            foreach ($data as $rowIndex => $row) {
                foreach ($row as $columnIndex => $value) {
                    $worksheet->setCellValueByColumnAndRow(
                        $columnIndex + 1,
                        $rowIndex + 1,
                        $value
                    );
                }
            }

            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
            $spreadsheet->disconnectWorksheets();
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
