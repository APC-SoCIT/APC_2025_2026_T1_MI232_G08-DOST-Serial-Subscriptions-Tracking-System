<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\ProcessMovementLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogsController extends Controller
{
    /**
     * Get audit logs with filtering
     */
    public function getAuditLogs(Request $request)
    {
        $query = AuditLog::query();

        // Filter by action
        if ($request->has('action') && $request->action !== 'all') {
            $query->where('action', $request->action);
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by model type
        if ($request->has('model_type')) {
            $query->where('model_type', $request->model_type);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('created_at', '<=', $request->end_date);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%")
                  ->orWhere('user_email', 'like', "%{$search}%");
            });
        }

        $logs = $query->orderBy('created_at', 'desc')
                      ->limit($request->get('limit', 100))
                      ->get();

        return response()->json([
            'success' => true,
            'logs' => $logs,
            'count' => $logs->count(),
        ]);
    }

    /**
     * Get a specific audit log entry
     */
    public function getAuditLog($id)
    {
        $log = AuditLog::find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Audit log not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'log' => $log,
        ]);
    }

    /**
     * Get process movement logs with filtering
     */
    public function getProcessMovementLogs(Request $request)
    {
        $query = ProcessMovementLog::query();

        // Filter by record type
        if ($request->has('record_type') && $request->record_type !== 'all') {
            $query->where('record_type', $request->record_type);
        }

        // Filter by specific record
        if ($request->has('record_id')) {
            $query->where('record_id', $request->record_id);
        }

        // Filter by action
        if ($request->has('action') && $request->action !== 'all') {
            $query->where('action', $request->action);
        }

        // Filter by role (from or to)
        if ($request->has('role')) {
            $role = $request->role;
            $query->where(function ($q) use ($role) {
                $q->where('from_role', $role)
                  ->orWhere('to_role', $role);
            });
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('created_at', '<=', $request->end_date);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('record_title', 'like', "%{$search}%")
                  ->orWhere('from_user_name', 'like', "%{$search}%")
                  ->orWhere('to_user_name', 'like', "%{$search}%")
                  ->orWhere('remarks', 'like', "%{$search}%");
            });
        }

        $logs = $query->orderBy('created_at', 'desc')
                      ->limit($request->get('limit', 100))
                      ->get();

        return response()->json([
            'success' => true,
            'logs' => $logs,
            'count' => $logs->count(),
        ]);
    }

    /**
     * Get workflow history for a specific record
     */
    public function getWorkflowHistory(Request $request)
    {
        $validated = $request->validate([
            'record_type' => 'required|string',
            'record_id' => 'required|string',
        ]);

        $history = ProcessMovementLog::forRecord($validated['record_type'], $validated['record_id'])
                                     ->orderBy('created_at', 'asc')
                                     ->get();

        return response()->json([
            'success' => true,
            'history' => $history,
            'count' => $history->count(),
        ]);
    }

    /**
     * Get audit log statistics
     */
    public function getAuditStats(Request $request)
    {
        $stats = [
            'total' => AuditLog::count(),
            'by_action' => [
                'create' => AuditLog::where('action', 'create')->count(),
                'update' => AuditLog::where('action', 'update')->count(),
                'delete' => AuditLog::where('action', 'delete')->count(),
                'approve' => AuditLog::where('action', 'approve')->count(),
                'reject' => AuditLog::where('action', 'reject')->count(),
                'login' => AuditLog::where('action', 'login')->count(),
                'logout' => AuditLog::where('action', 'logout')->count(),
            ],
            'today' => AuditLog::whereDate('created_at', today())->count(),
            'this_week' => AuditLog::where('created_at', '>=', now()->startOfWeek())->count(),
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats,
        ]);
    }

    /**
     * Get process movement statistics
     */
    public function getMovementStats(Request $request)
    {
        $stats = [
            'total' => ProcessMovementLog::count(),
            'by_record_type' => [
                'subscription' => ProcessMovementLog::where('record_type', 'subscription')->count(),
                'serial' => ProcessMovementLog::where('record_type', 'serial')->count(),
                'supplier_account' => ProcessMovementLog::where('record_type', 'supplier_account')->count(),
            ],
            'by_action' => [
                'create' => ProcessMovementLog::where('action', 'create')->count(),
                'status_change' => ProcessMovementLog::where('action', 'status_change')->count(),
                'approve' => ProcessMovementLog::where('action', 'approve')->count(),
                'reject' => ProcessMovementLog::where('action', 'reject')->count(),
                'inspect' => ProcessMovementLog::where('action', 'inspect')->count(),
            ],
            'today' => ProcessMovementLog::whereDate('created_at', today())->count(),
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats,
        ]);
    }

    /**
     * Download audit logs as CSV or JSON
     */
    public function downloadAuditLogs(Request $request)
    {
        $query = AuditLog::query();

        // Filter by action
        if ($request->has('action') && $request->action !== 'all' && $request->action) {
            $query->where('action', $request->action);
        }

        // Filter by role
        if ($request->has('role') && $request->role !== 'all' && $request->role) {
            $query->where('role', $request->role);
        }

        // Filter by module (model_type contains the module name)
        if ($request->has('module') && $request->module !== 'all' && $request->module) {
            $query->where('model_type', 'like', "%{$request->module}%");
        }

        // Filter by date range
        if ($request->has('start_date') && $request->start_date) {
            $query->where('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->where('created_at', '<=', $request->end_date . ' 23:59:59');
        }

        // Filter by search term
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%")
                  ->orWhere('user_email', 'like', "%{$search}%");
            });
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        $format = $request->get('format', 'csv');

        if ($format === 'json') {
            return response()->json($logs)
                ->header('Content-Disposition', 'attachment; filename="activity_logs_' . date('Y-m-d') . '.json"');
        }

        // Default: CSV format
        $csvData = [];
        $csvData[] = [
            'Log ID',
            'User Name',
            'User Email',
            'User Role',
            'Action',
            'Module',
            'Description',
            'IP Address',
            'URL',
            'Method',
            'Timestamp'
        ];

        foreach ($logs as $log) {
            // Extract module name from model_type
            $moduleName = 'System';
            if ($log->model_type) {
                $parts = explode('\\', $log->model_type);
                $moduleName = end($parts);
            }

            $csvData[] = [
                $log->_id ?? $log->id ?? '',
                $log->user_name ?? 'System',
                $log->user_email ?? '',
                $log->role ?? 'N/A',
                $log->action ?? '',
                $moduleName,
                $log->description ?? '',
                $log->ip_address ?? '',
                $log->url ?? '',
                $log->method ?? '',
                $log->created_at ? $log->created_at->format('Y-m-d H:i:s') : '',
            ];
        }

        // Generate CSV content
        $callback = function () use ($csvData) {
            $file = fopen('php://output', 'w');
            // Add BOM for Excel UTF-8 compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            foreach ($csvData as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="activity_logs_' . date('Y-m-d') . '.csv"',
        ]);
    }
}
