<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    /**
     * Log an action
     *
     * @param string $action The action performed (create, update, delete, approve, reject, login, logout)
     * @param string|null $modelType The model class affected
     * @param string|null $modelId The ID of the affected record
     * @param string|null $description Human-readable description
     * @param array|null $oldValues Previous values
     * @param array|null $newValues New values
     * @return AuditLog
     */
    public static function log(
        string $action,
        ?string $modelType = null,
        ?string $modelId = null,
        ?string $description = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): AuditLog {
        $user = Auth::user();

        return AuditLog::create([
            'user_id' => $user ? (string)($user->_id ?? $user->id) : null,
            'user_name' => $user ? $user->name : 'System',
            'user_email' => $user ? $user->email : null,
            'role' => $user ? $user->role : null,
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'url' => Request::fullUrl(),
            'method' => Request::method(),
        ]);
    }

    /**
     * Log a create action
     */
    public static function logCreate($model, ?string $description = null): AuditLog
    {
        $modelType = get_class($model);
        $modelId = (string)($model->_id ?? $model->id);
        $description = $description ?? "Created {$modelType}";

        return self::log(
            'create',
            $modelType,
            $modelId,
            $description,
            null,
            $model->toArray()
        );
    }

    /**
     * Log an update action
     */
    public static function logUpdate($model, array $oldValues, ?string $description = null): AuditLog
    {
        $modelType = get_class($model);
        $modelId = (string)($model->_id ?? $model->id);
        $description = $description ?? "Updated {$modelType}";

        // Get only changed values
        $newValues = array_intersect_key($model->toArray(), $oldValues);

        return self::log(
            'update',
            $modelType,
            $modelId,
            $description,
            $oldValues,
            $newValues
        );
    }

    /**
     * Log a delete action
     */
    public static function logDelete($model, ?string $description = null): AuditLog
    {
        $modelType = get_class($model);
        $modelId = (string)($model->_id ?? $model->id);
        $description = $description ?? "Deleted {$modelType}";

        return self::log(
            'delete',
            $modelType,
            $modelId,
            $description,
            $model->toArray(),
            null
        );
    }

    /**
     * Log an approval action
     */
    public static function logApprove($model, ?string $description = null): AuditLog
    {
        $modelType = get_class($model);
        $modelId = (string)($model->_id ?? $model->id);
        $description = $description ?? "Approved {$modelType}";

        return self::log(
            'approve',
            $modelType,
            $modelId,
            $description,
            null,
            ['status' => 'approved']
        );
    }

    /**
     * Log a rejection action
     */
    public static function logReject($model, ?string $reason = null): AuditLog
    {
        $modelType = get_class($model);
        $modelId = (string)($model->_id ?? $model->id);
        $description = "Rejected {$modelType}" . ($reason ? ": {$reason}" : '');

        return self::log(
            'reject',
            $modelType,
            $modelId,
            $description,
            null,
            ['status' => 'rejected', 'reason' => $reason]
        );
    }

    /**
     * Log a login action
     */
    public static function logLogin($user): AuditLog
    {
        return AuditLog::create([
            'user_id' => (string)($user->_id ?? $user->id),
            'user_name' => $user->name,
            'user_email' => $user->email,
            'role' => $user->role,
            'action' => 'login',
            'model_type' => 'App\Models\User',
            'model_id' => (string)($user->_id ?? $user->id),
            'description' => "User {$user->name} logged in",
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'url' => Request::fullUrl(),
            'method' => Request::method(),
        ]);
    }

    /**
     * Log a logout action
     */
    public static function logLogout($user): AuditLog
    {
        return AuditLog::create([
            'user_id' => (string)($user->_id ?? $user->id),
            'user_name' => $user->name,
            'user_email' => $user->email,
            'role' => $user->role,
            'action' => 'logout',
            'model_type' => 'App\Models\User',
            'model_id' => (string)($user->_id ?? $user->id),
            'description' => "User {$user->name} logged out",
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'url' => Request::fullUrl(),
            'method' => Request::method(),
        ]);
    }

    /**
     * Get audit logs for a specific model
     */
    public static function getLogsForModel(string $modelType, ?string $modelId = null, int $limit = 50)
    {
        $query = AuditLog::where('model_type', $modelType);
        
        if ($modelId) {
            $query->where('model_id', $modelId);
        }

        return $query->orderBy('created_at', 'desc')
                     ->limit($limit)
                     ->get();
    }

    /**
     * Get recent audit logs
     */
    public static function getRecentLogs(int $limit = 100)
    {
        return AuditLog::orderBy('created_at', 'desc')
                       ->limit($limit)
                       ->get();
    }

    /**
     * Get logs for a specific user
     */
    public static function getLogsForUser(string $userId, int $limit = 50)
    {
        return AuditLog::where('user_id', $userId)
                       ->orderBy('created_at', 'desc')
                       ->limit($limit)
                       ->get();
    }
}
