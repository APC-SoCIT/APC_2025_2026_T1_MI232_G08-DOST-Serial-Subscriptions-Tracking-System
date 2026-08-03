<?php

namespace App\Services;

use App\Models\ProcessMovementLog;
use App\Models\UserNotification;
use App\Services\EmailNotificationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ProcessMovementService
{
    /**
     * Log a process movement
     *
     * @param string $recordType Type of record (subscription, serial, supplier_account)
     * @param string $recordId ID of the record
     * @param string $recordTitle Human-readable title
     * @param array|null $fromUser From user info [id, name, role] or null for system
     * @param array|null $toUser To user info [id, name, role] or null
     * @param string|null $statusFrom Previous status
     * @param string|null $statusTo New status
     * @param string $action Action performed
     * @param string|null $remarks Optional remarks
     * @param array|null $metadata Additional data
     * @return ProcessMovementLog
     */
    public static function logMovement(
        string $recordType,
        string $recordId,
        string $recordTitle,
        ?array $fromUser = null,
        ?array $toUser = null,
        ?string $statusFrom = null,
        ?string $statusTo = null,
        string $action = 'update',
        ?string $remarks = null,
        ?array $metadata = null
    ): ProcessMovementLog {
        $currentUser = Auth::user();

        // If no fromUser provided, use current user
        if ($fromUser === null && $currentUser) {
            $fromUser = [
                'id' => (string)($currentUser->_id ?? $currentUser->id),
                'name' => $currentUser->name,
                'role' => $currentUser->role,
            ];
        }

        return ProcessMovementLog::create([
            'record_type' => $recordType,
            'record_id' => $recordId,
            'record_title' => $recordTitle,
            'from_user_id' => $fromUser['id'] ?? null,
            'from_user_name' => $fromUser['name'] ?? 'System',
            'from_role' => $fromUser['role'] ?? null,
            'to_user_id' => $toUser['id'] ?? null,
            'to_user_name' => $toUser['name'] ?? null,
            'to_role' => $toUser['role'] ?? null,
            'status_from' => $statusFrom,
            'status_to' => $statusTo,
            'action' => $action,
            'remarks' => $remarks,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log a serial status change
     * This method handles the complete workflow logging including intermediate steps
     */
    public static function logSerialStatusChange(
        $subscription,
        int $serialIndex,
        string $serialTitle,
        string $oldStatus,
        string $newStatus,
        ?string $remarks = null
    ): ProcessMovementLog {
        $currentUser = Auth::user();
        $targetRole = self::getTargetRoleForStatus($newStatus);
        
        // Map status to human-readable action
        $actionMap = [
            'accepted' => 'accept',
            'prepare' => 'preparing',
            'for_delivery' => 'ready_for_delivery',
            'received' => 'receive',
            'pending_inspection' => 'pending_inspection',
            'inspected' => 'inspect',
            'for_return' => 'return',
        ];
        $action = $actionMap[$newStatus] ?? 'status_change';
        
        // Generate descriptive remarks if none provided
        $defaultRemarksMap = [
            'accepted' => 'Supplier accepted the serial subscription',
            'prepare' => 'Supplier is preparing the serial for delivery',
            'for_delivery' => 'Supplier marked serial as ready for delivery',
            'received' => 'GSPS confirmed receipt of serial',
            'pending_inspection' => 'Serial queued for inspection',
            'inspected' => 'Serial inspection completed - Acceptable',
            'for_return' => 'Serial marked for return to supplier',
        ];
        $defaultRemarks = $defaultRemarksMap[$newStatus] ?? "Status changed from {$oldStatus} to {$newStatus}";
        $finalRemarks = $remarks ?? $defaultRemarks;

        // For the "accepted" status (Supplier confirms), log acceptance
        // Flow: Created → Accepted → Preparing → For Delivery
        if ($newStatus === 'accepted' && ($oldStatus === 'created' || $oldStatus === 'pending')) {
            return self::logMovement(
                'subscription',
                (string)($subscription->_id ?? $subscription->id),
                $serialTitle,
                null,
                $targetRole ? ['id' => null, 'name' => null, 'role' => $targetRole] : null,
                $oldStatus,
                'accepted',
                'accept',
                'Supplier accepted the serial subscription',
                [
                    'subscription_id' => (string)($subscription->_id ?? $subscription->id),
                    'serial_index' => $serialIndex,
                    'supplier_name' => $subscription->supplier_name,
                ]
            );
        }

        // For the "prepare" status (Supplier starts preparing)
        if ($newStatus === 'prepare' && $oldStatus === 'accepted') {
            return self::logMovement(
                'subscription',
                (string)($subscription->_id ?? $subscription->id),
                $serialTitle,
                null,
                $targetRole ? ['id' => null, 'name' => null, 'role' => $targetRole] : null,
                'accepted',
                $newStatus,
                'preparing',
                'Supplier is now preparing the serial for delivery',
                [
                    'subscription_id' => (string)($subscription->_id ?? $subscription->id),
                    'serial_index' => $serialIndex,
                    'supplier_name' => $subscription->supplier_name,
                ]
            );
        }

        return self::logMovement(
            'subscription',  // Use subscription as record type for consistent querying
            (string)($subscription->_id ?? $subscription->id),
            $serialTitle,
            null, // fromUser will be set to current user
            $targetRole ? ['id' => null, 'name' => null, 'role' => $targetRole] : null,
            $oldStatus,
            $newStatus,
            $action,
            $finalRemarks,
            [
                'subscription_id' => (string)($subscription->_id ?? $subscription->id),
                'serial_index' => $serialIndex,
                'supplier_name' => $subscription->supplier_name,
            ]
        );
    }

    /**
     * Create notifications for status changes
     * This notifies relevant users when serial status changes
     * 
     * Notification Logic:
     * - TPU creates serial → Supplier receives notification
     * - Supplier updates status (prepare, for_delivery) → TPU receives notification
     * - GSPS updates status (received) → Supplier receives notification
     * - Inspection updates status (inspected/delivered, for_return) → Supplier AND TPU receive notification
     * - GSPS/Inspection also get a confirmation copy of their own action
     */
    public static function createStatusNotifications(
        string $newStatus,
        string $serialTitle,
        ?string $subscriptionId = null,
        ?string $serialIssn = null,
        ?string $supplierName = null,
        ?string $issueId = null,
        ?string $actorRole = null,
        ?string $actorName = null
    ): void {
        // Use provided role/name or fallback to Auth::user()
        $currentUser = Auth::user();
        $currentRole = strtolower($actorRole ?? $currentUser?->role ?? 'system');
        $actor = $actorName ?? $currentUser?->name ?? 'System';
        
        Log::info("createStatusNotifications called", [
            'status' => $newStatus,
            'current_role' => $currentRole,
            'actor_name' => $actor,
            'actor_role_param' => $actorRole,
        ]);
        
        // Define strict role-based notification rules
        // Each status change notifies relevant roles based on workflow
        $notificationMap = [
            // When supplier accepts a serial → notify TPU, Admin
            'accepted' => [
                'target_roles' => ['tpu', 'admin'],
                'title' => 'Serial Accepted by Supplier',
                'message' => "'{$serialTitle}' has been accepted by {$supplierName}.",
            ],
            // When supplier starts preparing a serial → notify Supplier, TPU, Admin
            'prepare' => [
                'target_roles' => ['supplier', 'tpu', 'admin'],
                'title' => 'Serial Being Prepared',
                'message' => "'{$serialTitle}' is being prepared by {$supplierName}.",
                'send_actor_copy' => true, // Supplier gets confirmation
                'actor_title' => 'Confirmation: Serial Preparation Started',
                'actor_message' => "You have started preparing '{$serialTitle}'. The serial is now in preparation status.",
            ],
            // When supplier marks for delivery → notify Supplier, TPU, GSPS, Admin (Inspection notified when GSPS receives)
            'for_delivery' => [
                'target_roles' => ['supplier', 'tpu', 'gsps', 'admin'],
                'title' => 'Serial Ready for Delivery',
                'message' => "'{$serialTitle}' is now ready for delivery from {$supplierName}.",
                'send_actor_copy' => true, // Supplier gets confirmation
                'actor_title' => 'Confirmation: Serial Ready for Delivery',
                'actor_message' => "You have marked '{$serialTitle}' as ready for delivery. It is now awaiting pickup.",
            ],
            // When GSPS receives → notify Supplier, TPU, Inspection, Admin (GSPS gets confirmation)
            'received' => [
                'target_roles' => ['supplier', 'tpu', 'inspection', 'admin'],
                'title' => 'Serial Received by GSPS',
                'message' => "'{$serialTitle}' has been received by {$actor} and is pending inspection.",
                'supplier_name' => $supplierName,
                'send_actor_copy' => true, // GSPS gets confirmation
                'actor_title' => 'Confirmation: Serial Received',
                'actor_message' => "You have successfully received '{$serialTitle}' from {$supplierName}. The serial is now pending inspection.",
            ],
            // When inspection completes (delivered) → notify ALL roles: Supplier, TPU, GSPS, Inspection, Admin (Inspection gets confirmation)
            'inspected' => [
                'target_roles' => ['supplier', 'tpu', 'gsps', 'inspection', 'admin'],
                'title' => 'Serial Delivered Successfully',
                'message' => "'{$serialTitle}' has been inspected by {$actor} and marked as Delivered.",
                'supplier_name' => $supplierName,
                'send_actor_copy' => true, // Inspection gets confirmation
                'actor_title' => 'Confirmation: Serial Inspected',
                'actor_message' => "You have successfully inspected '{$serialTitle}' from {$supplierName} and marked it as Delivered.",
            ],
            // Alias for inspected (form sends "delivered") - notify ALL roles
            'delivered' => [
                'target_roles' => ['supplier', 'tpu', 'gsps', 'inspection', 'admin'],
                'title' => 'Serial Delivered Successfully',
                'message' => "'{$serialTitle}' has been inspected by {$actor} and marked as Delivered.",
                'supplier_name' => $supplierName,
                'send_actor_copy' => true, // Inspection gets confirmation
                'actor_title' => 'Confirmation: Serial Inspected',
                'actor_message' => "You have successfully inspected '{$serialTitle}' from {$supplierName} and marked it as Delivered.",
            ],
            // When inspection marks for return → notify ALL roles: Supplier, TPU, GSPS, Inspection, Admin (Inspection gets confirmation)
            'for_return' => [
                'target_roles' => ['supplier', 'tpu', 'gsps', 'inspection', 'admin'],
                'title' => 'Serial Marked for Return',
                'message' => "'{$serialTitle}' has been marked for return by {$actor}.",
                'supplier_name' => $supplierName,
                'send_actor_copy' => true, // Inspection gets confirmation
                'actor_title' => 'Confirmation: Serial Marked for Return',
                'actor_message' => "You have marked '{$serialTitle}' from {$supplierName} for return.",
            ],
        ];
        
        $config = $notificationMap[$newStatus] ?? null;
        
        if ($config) {
            // Send notifications to target roles
            foreach ($config['target_roles'] as $role) {
                // Supplier should still receive the external status email even when they triggered
                // the update themselves. Other actors can receive the confirmation copy only.
                if ($role === $currentRole && $currentRole !== 'supplier' && isset($config['send_actor_copy']) && $config['send_actor_copy']) {
                    continue;
                }
                
                UserNotification::createStatusNotification(
                    $role,
                    $config['title'],
                    $config['message'],
                    [
                        'serial_title' => $serialTitle,
                        'new_status' => $newStatus,
                        'supplier_name' => $supplierName,
                        'subscription_id' => $subscriptionId,
                        'serial_issn' => $serialIssn,
                        'actor_name' => $actorName,
                    ],
                    $currentRole
                );

                // Send email notification
                EmailNotificationService::sendStatusNotification(
                    $serialTitle,
                    $newStatus,
                    $role,
                    $supplierName,
                    $subscriptionId,
                    $serialIssn,
                    $actor,
                    $issueId
                );
            }
            
            // Send confirmation copy to the actor (GSPS/Inspection)
            if (isset($config['send_actor_copy']) && $config['send_actor_copy'] && $currentRole !== 'system') {
                Log::info("Preparing to send confirmation email", [
                    'actor_role' => $currentRole,
                    'actor_name' => $actor,
                    'status' => $newStatus
                ]);
                
                // Create in-app notification for the actor
                UserNotification::createStatusNotification(
                    $currentRole,
                    $config['actor_title'],
                    $config['actor_message'],
                    [
                        'serial_title' => $serialTitle,
                        'new_status' => $newStatus,
                        'supplier_name' => $supplierName,
                        'subscription_id' => $subscriptionId,
                        'serial_issn' => $serialIssn,
                        'actor_name' => $actor,
                        'is_confirmation' => true,
                    ],
                    $currentRole
                );
                
                // Send confirmation email to ONLY the actor who performed the action
                EmailNotificationService::sendConfirmationEmail(
                    $serialTitle,
                    $newStatus,
                    $currentRole,
                    $supplierName,
                    $actor  // Actor name is used to find the specific user
                );
            }
        }
    }

    /**
     * Create notification when TPU creates a serial (notifies assigned supplier)
     */
    public static function notifySupplierOfNewSerial(
        string $serialTitle,
        string $supplierName,
        ?string $subscriptionId = null,
        ?string $serialIssn = null,
        ?string $supplierId = null
    ): void {
        $currentUser = Auth::user();
        $currentRole = strtolower($currentUser?->role ?? 'tpu');
        
        UserNotification::createStatusNotification(
            'supplier',
            'New Serial Assigned',
            "A new serial '{$serialTitle}' has been created and assigned to you. Please accept and prepare for delivery.",
            [
                'serial_title' => $serialTitle,
                'new_status' => 'created',
                'supplier_name' => $supplierName,
                'supplier_id' => $supplierId,
                'subscription_id' => $subscriptionId,
                'serial_issn' => $serialIssn,
            ],
            $currentRole
        );

        // Send email notification to supplier
        EmailNotificationService::notifyNewSerialAssigned(
            $serialTitle,
            $supplierName,
            $subscriptionId
        );
    }

    /**
     * Delete notifications related to a specific serial
     */
    public static function deleteSerialNotifications(
        ?string $subscriptionId,
        ?string $serialIssn = null,
        ?string $serialTitle = null
    ): int {
        if (!$subscriptionId && !$serialIssn && !$serialTitle) {
            return 0;
        }
        
        $deleted = 0;
        
        // Delete by subscription_id
        if ($subscriptionId) {
            $deleted += UserNotification::where('data.subscription_id', $subscriptionId)->delete();
        }
        
        // Delete by serial_issn
        if ($serialIssn) {
            $deleted += UserNotification::where('data.serial_issn', $serialIssn)->delete();
        }
        
        // Delete by serial_title
        if ($serialTitle) {
            $deleted += UserNotification::where('data.serial_title', $serialTitle)->delete();
        }
        
        return $deleted;
    }

    /**
     * Log when a subscription is created
     */
    public static function logSubscriptionCreated($subscription, ?string $remarks = null): ProcessMovementLog
    {
        return self::logMovement(
            'subscription',
            (string)($subscription->_id ?? $subscription->id),
            $subscription->serial_title,
            null,
            ['id' => null, 'name' => $subscription->supplier_name, 'role' => 'supplier'],
            null,
            'created',
            'create',
            $remarks ?? 'Subscription created and assigned to supplier',
            [
                'supplier_name' => $subscription->supplier_name,
                'award_cost' => $subscription->award_cost,
            ]
        );
    }

    /**
     * Log supplier account approval
     */
    public static function logSupplierAccountApproval($account, ?string $remarks = null): ProcessMovementLog
    {
        return self::logMovement(
            'supplier_account',
            (string)($account->_id ?? $account->id),
            $account->company_name,
            null,
            ['id' => null, 'name' => $account->company_name, 'role' => 'supplier'],
            'pending',
            'approved',
            'approve',
            $remarks ?? 'Supplier account approved'
        );
    }

    /**
     * Log supplier account rejection
     */
    public static function logSupplierAccountRejection($account, ?string $remarks = null): ProcessMovementLog
    {
        return self::logMovement(
            'supplier_account',
            (string)($account->_id ?? $account->id),
            $account->company_name,
            null,
            null,
            'pending',
            'rejected',
            'reject',
            $remarks ?? 'Supplier account rejected'
        );
    }

    /**
     * Log serial inspection
     */
    public static function logSerialInspection(
        $subscription,
        int $serialIndex,
        string $serialTitle,
        string $inspectionResult,
        ?string $remarks = null
    ): ProcessMovementLog {
        return self::logMovement(
            'serial',
            (string)($subscription->_id ?? $subscription->id) . '_' . $serialIndex,
            $serialTitle,
            null,
            ['id' => null, 'name' => null, 'role' => 'tpu'], // After inspection, goes back to TPU
            'pending_inspection',
            'inspected',
            'inspect',
            $remarks,
            [
                'subscription_id' => (string)($subscription->_id ?? $subscription->id),
                'serial_index' => $serialIndex,
                'inspection_result' => $inspectionResult,
            ]
        );
    }

    /**
     * Get the target role for a given status
     */
    private static function getTargetRoleForStatus(string $status): ?string
    {
        $statusRoleMap = [
            'pending' => 'supplier',
            'prepare' => 'supplier',
            'for_delivery' => 'gsps',
            'received' => 'tpu',
            'pending_inspection' => 'inspection',
            'inspected' => 'tpu',
            'completed' => null,
        ];

        return $statusRoleMap[$status] ?? null;
    }

    /**
     * Get workflow history for a record
     */
    public static function getWorkflowHistory(string $recordType, string $recordId)
    {
        return ProcessMovementLog::forRecord($recordType, $recordId)
                                 ->orderBy('created_at', 'asc')
                                 ->get();
    }

    /**
     * Get recent movements for a user
     */
    public static function getRecentMovementsForUser(string $userId, int $limit = 50)
    {
        return ProcessMovementLog::where(function ($query) use ($userId) {
            $query->where('from_user_id', $userId)
                  ->orWhere('to_user_id', $userId);
        })
        ->orderBy('created_at', 'desc')
        ->limit($limit)
        ->get();
    }

    /**
     * Get recent movements by role
     */
    public static function getMovementsByRole(string $role, int $limit = 50)
    {
        return ProcessMovementLog::where(function ($query) use ($role) {
            $query->where('from_role', $role)
                  ->orWhere('to_role', $role);
        })
        ->orderBy('created_at', 'desc')
        ->limit($limit)
        ->get();
    }
}
