<?php

namespace App\Services;

use App\Mail\SerialStatusNotification;
use App\Mail\AdminSerialSummaryNotification;
use App\Models\SupplierAccount;
use App\Models\User;
use App\Models\ProcessMovementLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;

class EmailNotificationService
{
    /**
     * Status changes that should trigger email notifications
     */
    private static array $notifiableStatuses = [
        'created' => true,
        'pending' => true,
        'accepted' => true,
        'prepare' => true,
        'for_delivery' => true,
        'received' => true,
        'inspected' => true,
        'delivered' => true,
        'for_return' => true,
        'completed' => true,
        'cancelled' => true,
        'delayed' => true,
        'approved' => true,
        'rejected' => true,
        'deleted' => true,
    ];

    /**
     * Mapping of status to action required (if any)
     */
    private static array $statusActions = [
        'created' => 'A new serial has been created and assigned to you. Please review and accept this subscription.',
        'pending' => 'Please prepare the serial for delivery.',
        'accepted' => 'The serial has been accepted. Please proceed with preparing the serial for delivery.',
        'prepare' => 'The serial is being prepared for delivery.',
        'for_delivery' => 'The serial is on its way. Please be ready to receive it.',
        'received' => 'The serial has been received and will undergo inspection.',
        'inspected' => 'The serial has been inspected and is now marked as DELIVERED. The delivery process is complete.',
        'delivered' => 'The serial has been successfully delivered. The delivery process is complete.',
        'for_return' => 'The serial has been inspected and is marked FOR RETURN. Please arrange for the return of this serial to the supplier.',
        'cancelled' => 'No further action is required.',
        'delayed' => 'The delivery has been delayed. Please check for updates.',
        'approved' => null,
        'rejected' => 'Please review the rejection reason and take appropriate action.',
        'deleted' => 'This serial has been removed from the system.',
    ];

    /**
     * Track sent notifications to prevent duplicates
     * Key: hash of (email, serial_title, status, date)
     */
    private static array $sentNotifications = [];

    /**
     * Send email notification for a serial status change
     */
    public static function sendStatusNotification(
        string $serialTitle,
        string $newStatus,
        string $targetRole,
        ?string $supplierName = null,
        ?string $subscriptionId = null,
        ?string $serialIssn = null,
        ?string $actorName = null
    ): bool {
        // Check if this status should trigger a notification
        if (!isset(self::$notifiableStatuses[strtolower($newStatus)])) {
            return false;
        }

        try {
            // For admin, send summary email with status history
            if (strtolower($targetRole) === 'admin') {
                return self::sendAdminSummaryNotification(
                    $serialTitle,
                    $newStatus,
                    $supplierName,
                    $subscriptionId,
                    $serialIssn,
                    $actorName
                );
            }

            // Get recipients based on role
            $recipients = self::getRecipientsForRole($targetRole, $supplierName);

            if (empty($recipients)) {
                Log::info("No email recipients found for role: {$targetRole}");
                return false;
            }

            $updateDateTime = Carbon::now()->format('F j, Y \a\t g:i A');
            $action = self::$statusActions[strtolower($newStatus)] ?? null;

            $sentCount = 0;
            foreach ($recipients as $recipient) {
                // Create notification hash to prevent duplicates
                $notificationHash = md5(
                    $recipient['email'] .
                    $serialTitle .
                    $newStatus .
                    Carbon::now()->format('Y-m-d')
                );

                // Skip if already sent today
                if (isset(self::$sentNotifications[$notificationHash])) {
                    continue;
                }

                // Send the email
                Mail::to($recipient['email'])
                    ->send(new SerialStatusNotification(
                        $serialTitle,
                        $newStatus,
                        $updateDateTime,
                        $action,
                        $supplierName,
                        $recipient['name'],
                        $actorName,
                        $targetRole
                    ));

                // Mark as sent
                self::$sentNotifications[$notificationHash] = true;
                $sentCount++;

                Log::info("Email notification sent", [
                    'to' => $recipient['email'],
                    'serial_title' => $serialTitle,
                    'status' => $newStatus,
                ]);
            }

            return $sentCount > 0;

        } catch (\Exception $e) {
            Log::error("Failed to send email notification", [
                'error' => $e->getMessage(),
                'serial_title' => $serialTitle,
                'status' => $newStatus,
                'target_role' => $targetRole,
            ]);
            return false;
        }
    }

    /**
     * Send admin summary email with status history
     */
    public static function sendAdminSummaryNotification(
        string $serialTitle,
        string $currentStatus,
        ?string $supplierName = null,
        ?string $subscriptionId = null,
        ?string $serialIssn = null,
        ?string $actorName = null
    ): bool {
        try {
            // Get admin recipients
            $recipients = self::getRecipientsForRole('admin');

            if (empty($recipients)) {
                Log::info("No admin recipients found for summary notification");
                return false;
            }

            $updateDateTime = Carbon::now()->format('F j, Y \a\t g:i A');
            
            // Build status history from ProcessMovementLog
            $statusHistory = self::getStatusHistory($subscriptionId, $serialIssn, $serialTitle, $supplierName, $currentStatus);
            
            // Get latest action description
            $latestAction = self::getLatestActionDescription($currentStatus, $supplierName, $actorName);

            $sentCount = 0;
            foreach ($recipients as $recipient) {
                // Create notification hash to prevent duplicates
                $notificationHash = md5(
                    $recipient['email'] .
                    $serialTitle .
                    $currentStatus .
                    'admin_summary' .
                    Carbon::now()->format('Y-m-d-H')
                );

                // Skip if already sent this hour
                if (isset(self::$sentNotifications[$notificationHash])) {
                    continue;
                }

                // Send the summary email
                Mail::to($recipient['email'])
                    ->send(new AdminSerialSummaryNotification(
                        $serialTitle,
                        $currentStatus,
                        $supplierName ?? 'Unknown Supplier',
                        $updateDateTime,
                        $statusHistory,
                        $latestAction,
                        $actorName,
                        $serialIssn
                    ));

                // Mark as sent
                self::$sentNotifications[$notificationHash] = true;
                $sentCount++;

                Log::info("Admin summary email sent", [
                    'to' => $recipient['email'],
                    'serial_title' => $serialTitle,
                    'status' => $currentStatus,
                ]);
            }

            return $sentCount > 0;

        } catch (\Exception $e) {
            Log::error("Failed to send admin summary email", [
                'error' => $e->getMessage(),
                'serial_title' => $serialTitle,
                'status' => $currentStatus,
            ]);
            return false;
        }
    }

    /**
     * Get status history for a serial from ProcessMovementLog
     */
    private static function getStatusHistory(?string $subscriptionId, ?string $serialIssn, string $serialTitle, ?string $supplierName = null, string $currentStatus = 'unknown'): array
    {
        $history = [];
        
        // Try to get from ProcessMovementLog
        if ($subscriptionId) {
            $logs = ProcessMovementLog::where('record_id', $subscriptionId)
                ->where(function ($q) use ($serialTitle, $serialIssn) {
                    $q->where('record_title', 'like', "%{$serialTitle}%");
                    if ($serialIssn) {
                        $q->orWhere('record_title', 'like', "%{$serialIssn}%");
                    }
                })
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            foreach ($logs as $log) {
                $history[] = [
                    'status' => $log->status_to ?? $log->action ?? 'unknown',
                    'status_label' => ucfirst(str_replace('_', ' ', $log->status_to ?? $log->action ?? 'unknown')),
                    'date' => $log->created_at ? $log->created_at->format('M j, Y') : 'N/A',
                    'time' => $log->created_at ? $log->created_at->format('g:i A') : 'N/A',
                    'actor' => $log->from_user_name ?? 'System',
                    'description' => $log->remarks ?? null,
                ];
            }
            
            // Add 'created' at the end if not present
            $hasCreated = collect($history)->contains(function ($h) {
                return ($h['status'] === 'created') || (stripos($h['status_label'] ?? '', 'created') !== false);
            });
            
            if (!$hasCreated) {
                $history[] = [
                    'status' => 'created',
                    'status_label' => 'Subscription Created',
                    'date' => Carbon::now()->subDays(count($history) + 1)->format('M j, Y'),
                    'time' => '9:00 AM',
                    'actor' => 'TPU User',
                    'description' => 'Serial subscription created and assigned to supplier',
                ];
            }
        }

        // If no history found, create entries based on current status
        if (empty($history)) {
            $statusFlow = ['created', 'accepted', 'prepare', 'for_delivery', 'received'];
            $statusActors = [
                'created' => 'TPU User',
                'accepted' => $supplierName ?? 'Supplier',
                'prepare' => $supplierName ?? 'Supplier',
                'for_delivery' => $supplierName ?? 'Supplier',
                'received' => 'GSPS Team',
                'inspected' => 'Inspection Team',
                'for_return' => 'Inspection Team',
            ];
            
            // Handle inspected or for_return
            if ($currentStatus === 'inspected' || $currentStatus === 'for_return') {
                $history[] = [
                    'status' => $currentStatus,
                    'status_label' => $currentStatus === 'inspected' ? 'Delivered (Inspected)' : 'For Return',
                    'date' => Carbon::now()->format('M j, Y'),
                    'time' => Carbon::now()->format('g:i A'),
                    'actor' => $statusActors[$currentStatus] ?? 'Inspection Team',
                    'description' => $currentStatus === 'for_return' ? 'Serial marked for return due to issues' : 'Serial inspected and approved',
                ];
                
                foreach (array_reverse($statusFlow) as $status) {
                    $history[] = [
                        'status' => $status,
                        'status_label' => $status === 'created' ? 'Subscription Created' : ucfirst(str_replace('_', ' ', $status)),
                        'date' => Carbon::now()->subDays(count($history))->format('M j, Y'),
                        'time' => Carbon::now()->subHours(count($history) + 2)->format('g:i A'),
                        'actor' => $statusActors[$status] ?? 'System',
                        'description' => $status === 'created' ? 'Serial subscription created and assigned to supplier' : null,
                    ];
                }
            } else {
                // Current status + created
                $history[] = [
                    'status' => $currentStatus,
                    'status_label' => ucfirst(str_replace('_', ' ', $currentStatus)),
                    'date' => Carbon::now()->format('M j, Y'),
                    'time' => Carbon::now()->format('g:i A'),
                    'actor' => $statusActors[$currentStatus] ?? 'System',
                    'description' => null,
                ];
                $history[] = [
                    'status' => 'created',
                    'status_label' => 'Subscription Created',
                    'date' => Carbon::now()->subDays(1)->format('M j, Y'),
                    'time' => '9:00 AM',
                    'actor' => 'TPU User',
                    'description' => 'Serial subscription created and assigned to supplier',
                ];
            }
        }

        return $history;
    }

    /**
     * Get latest action description
     */
    private static function getLatestActionDescription(string $status, ?string $supplierName, ?string $actorName): string
    {
        $descriptions = [
            'created' => "New serial created and assigned to {$supplierName}",
            'accepted' => "Serial accepted by {$supplierName}",
            'prepare' => "Serial being prepared by {$supplierName}",
            'for_delivery' => "Serial ready for delivery from {$supplierName}",
            'received' => "Serial received by " . ($actorName ?? 'GSPS'),
            'inspected' => "Serial inspected and marked as Delivered by " . ($actorName ?? 'Inspection'),
            'delivered' => "Serial delivered successfully",
            'for_return' => "Serial marked for return by " . ($actorName ?? 'Inspection'),
        ];

        return $descriptions[$status] ?? "Status updated to " . ucfirst(str_replace('_', ' ', $status));
    }

    /**
     * Get email recipients based on role
     */
    private static function getRecipientsForRole(string $role, ?string $supplierName = null): array
    {
        $recipients = [];

        switch (strtolower($role)) {
            case 'supplier':
                // Get supplier email by company name
                if ($supplierName) {
                    $supplier = SupplierAccount::where('company_name', 'like', "%{$supplierName}%")
                        ->where('status', 'approved')
                        ->first();

                    if ($supplier && $supplier->email) {
                        $recipients[] = [
                            'email' => $supplier->email,
                            'name' => $supplier->contact_person ?? $supplier->company_name,
                        ];
                    }

                    // Also check User table for supplier role
                    $supplierUser = User::where('role', 'supplier')
                        ->where(function ($query) use ($supplierName) {
                            $query->where('name', 'like', "%{$supplierName}%")
                                  ->orWhere('email', 'like', "%{$supplierName}%");
                        })
                        ->first();

                    if ($supplierUser && $supplierUser->email) {
                        // Avoid duplicate emails
                        $exists = collect($recipients)->contains('email', $supplierUser->email);
                        if (!$exists) {
                            $recipients[] = [
                                'email' => $supplierUser->email,
                                'name' => $supplierUser->name,
                            ];
                        }
                    }
                }
                break;

            case 'tpu':
                // Get all TPU users
                $tpuUsers = User::where('role', 'tpu')->get();
                foreach ($tpuUsers as $user) {
                    if ($user->email) {
                        $recipients[] = [
                            'email' => $user->email,
                            'name' => $user->name,
                        ];
                    }
                }
                break;

            case 'gsps':
                // Get all GSPS users
                $gspsUsers = User::where('role', 'gsps')->get();
                foreach ($gspsUsers as $user) {
                    if ($user->email) {
                        $recipients[] = [
                            'email' => $user->email,
                            'name' => $user->name,
                        ];
                    }
                }
                break;

            case 'inspection':
                // Get all Inspection users
                $inspectionUsers = User::where('role', 'inspection')->get();
                foreach ($inspectionUsers as $user) {
                    if ($user->email) {
                        $recipients[] = [
                            'email' => $user->email,
                            'name' => $user->name,
                        ];
                    }
                }
                break;

            case 'admin':
                // Get all Admin users
                $adminUsers = User::where('role', 'admin')->get();
                foreach ($adminUsers as $user) {
                    if ($user->email) {
                        $recipients[] = [
                            'email' => $user->email,
                            'name' => $user->name,
                        ];
                    }
                }
                break;
        }

        return $recipients;
    }

    /**
     * Send notification when a new serial is created (assigned to supplier)
     * Also notifies GSPS and Admin for tracking purposes
     */
    public static function notifyNewSerialAssigned(
        string $serialTitle,
        string $supplierName,
        ?string $subscriptionId = null
    ): bool {
        $success = true;
        $notifyRoles = ['supplier', 'gsps', 'admin'];
        
        foreach ($notifyRoles as $role) {
            $result = self::sendStatusNotification(
                $serialTitle,
                'created',
                $role,
                $supplierName,
                $subscriptionId
            );
            $success = $success && $result;
        }
        
        return $success;
    }

    /**
     * Send notification when serial is deleted
     */
    public static function notifySerialDeleted(
        string $serialTitle,
        string $supplierName,
        array $notifyRoles = ['supplier', 'tpu', 'gsps', 'inspection', 'admin']
    ): bool {
        $success = true;
        foreach ($notifyRoles as $role) {
            $result = self::sendStatusNotification(
                $serialTitle,
                'deleted',
                $role,
                $supplierName
            );
            $success = $success && $result;
        }
        return $success;
    }

    /**
     * Send bulk notification (e.g., for batch updates)
     */
    public static function sendBulkNotification(
        array $serials,
        string $status,
        string $targetRole,
        ?string $supplierName = null
    ): int {
        $sentCount = 0;
        foreach ($serials as $serial) {
            $serialTitle = $serial['serialTitle'] ?? $serial['title'] ?? 'Unknown Serial';
            if (self::sendStatusNotification($serialTitle, $status, $targetRole, $supplierName)) {
                $sentCount++;
            }
        }
        return $sentCount;
    }

    /**
     * Send notification when inspection is complete (delivered or for return)
     * This is called when the Inspection team marks a serial as inspected.
     * 
     * @param string $serialTitle The title of the serial
     * @param bool $isDelivered True if delivered successfully, false if for return
     * @param string $supplierName The supplier's name
     * @param string|null $remarks Optional inspection remarks
     * @param string|null $subscriptionId The subscription ID
     * @return bool
     */
    public static function notifyInspectionComplete(
        string $serialTitle,
        bool $isDelivered,
        string $supplierName,
        ?string $remarks = null,
        ?string $subscriptionId = null
    ): bool {
        $status = $isDelivered ? 'delivered' : 'for_return';
        $notifyRoles = ['supplier', 'tpu'];
        
        $success = true;
        foreach ($notifyRoles as $role) {
            $result = self::sendStatusNotification(
                $serialTitle,
                $status,
                $role,
                $supplierName,
                $subscriptionId
            );
            $success = $success && $result;
        }
        
        return $success;
    }

    /**
     * Send confirmation email to the actor (GSPS/Inspection) for their own action
     * This serves as a copy/confirmation that they completed an action in the system
     */
    public static function sendConfirmationEmail(
        string $serialTitle,
        string $status,
        string $actorRole,
        ?string $supplierName = null,
        ?string $actorName = null
    ): bool {
        try {
            // Get all users with the actor's role
            $recipients = self::getRecipientsForRole($actorRole, $supplierName);

            if (empty($recipients)) {
                Log::info("No email recipients found for confirmation to role: {$actorRole}");
                return false;
            }

            $updateDateTime = Carbon::now()->format('F j, Y \a\t g:i A');
            
            // Confirmation-specific messages
            $confirmationMessages = [
                'received' => "This is to confirm that you have successfully received the serial '{$serialTitle}' from {$supplierName}. The serial is now pending inspection.",
                'inspected' => "This is to confirm that you have successfully inspected the serial '{$serialTitle}' from {$supplierName} and marked it as Delivered.",
                'for_return' => "This is to confirm that you have marked the serial '{$serialTitle}' from {$supplierName} for return.",
            ];
            
            $action = $confirmationMessages[$status] ?? "Action completed for '{$serialTitle}'.";

            $sentCount = 0;
            foreach ($recipients as $recipient) {
                // Create notification hash to prevent duplicates
                $notificationHash = md5(
                    $recipient['email'] .
                    $serialTitle .
                    $status .
                    'confirmation' .
                    Carbon::now()->format('Y-m-d')
                );

                // Skip if already sent today
                if (isset(self::$sentNotifications[$notificationHash])) {
                    continue;
                }

                // Send the confirmation email
                Mail::to($recipient['email'])
                    ->send(new SerialStatusNotification(
                        $serialTitle,
                        $status,
                        $updateDateTime,
                        $action,
                        $supplierName,
                        $recipient['name'],
                        $actorName ?? $recipient['name'],
                        $actorRole // targetRole is same as actor for confirmation
                    ));

                // Mark as sent
                self::$sentNotifications[$notificationHash] = true;
                $sentCount++;

                Log::info("Confirmation email sent", [
                    'to' => $recipient['email'],
                    'serial_title' => $serialTitle,
                    'status' => $status,
                    'role' => $actorRole,
                ]);
            }

            return $sentCount > 0;

        } catch (\Exception $e) {
            Log::error("Failed to send confirmation email", [
                'error' => $e->getMessage(),
                'serial_title' => $serialTitle,
                'status' => $status,
                'actor_role' => $actorRole,
            ]);
            return false;
        }
    }
}
