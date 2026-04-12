<?php

namespace App\Services;

use App\Mail\SerialStatusNotification;
use App\Mail\AdminSerialSummaryNotification;
use App\Models\SupplierAccount;
use App\Models\User;
use App\Models\ProcessMovementLog;
use App\Models\Subscription;
use App\Models\SerialIssue;
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
        ?string $actorName = null,
        ?string $issueId = null
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

            $updateDateTime = Carbon::now(config('app.timezone'))->format('F j, Y \a\t g:i A');
            $action = self::$statusActions[strtolower($newStatus)] ?? null;

            // Fetch recurring issue information if subscription ID provided
            $recurringInfo = self::getRecurringIssueInfo($subscriptionId, $issueId);

            $sentCount = 0;
            foreach ($recipients as $recipient) {
                // Create notification hash to prevent duplicates
                $notificationHash = md5(
                    $recipient['email'] .
                    $serialTitle .
                    $newStatus .
                    Carbon::now(config('app.timezone'))->format('Y-m-d')
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
                        $targetRole,
                        $recurringInfo['issue_number'] ?? null,
                        $recurringInfo['total_issues'] ?? null,
                        $recurringInfo['frequency'] ?? null,
                        $recurringInfo['expected_delivery_date'] ?? null,
                        $recurringInfo['next_issue_date'] ?? null
                    ));

                // Mark as sent
                self::$sentNotifications[$notificationHash] = true;
                $sentCount++;

                Log::info("Email notification sent", [
                    'to' => $recipient['email'],
                    'serial_title' => $serialTitle,
                    'status' => $newStatus,
                    'issue_number' => $recurringInfo['issue_number'] ?? 'N/A',
                    'frequency' => $recurringInfo['frequency'] ?? 'N/A',
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

            $updateDateTime = Carbon::now(config('app.timezone'))->format('F j, Y \a\t g:i A');
            
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
                    Carbon::now(config('app.timezone'))->format('Y-m-d-H')
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
     * Returns history in DESCENDING order (newest/most recent at TOP, oldest at BOTTOM)
     * All timestamps are converted to the app timezone (Asia/Manila by default)
     */
    private static function getStatusHistory(?string $subscriptionId, ?string $serialIssn, string $serialTitle, ?string $supplierName = null, string $currentStatus = 'unknown'): array
    {
        $history = [];
        $appTimezone = config('app.timezone');
        
        // Add current status at the TOP (most recent) - use app timezone
        $now = Carbon::now($appTimezone);
        $history[] = [
            'status' => $currentStatus,
            'status_label' => ucfirst(str_replace('_', ' ', $currentStatus)),
            'date' => $now->format('M j, Y'),
            'time' => $now->format('g:i A'),
            'actor' => 'System',
            'description' => null,
        ];
        
        // Try to get from ProcessMovementLog
        if ($subscriptionId) {
            $logs = ProcessMovementLog::where('record_id', $subscriptionId)
                ->where(function ($q) use ($serialTitle, $serialIssn) {
                    $q->where('record_title', 'like', "%{$serialTitle}%");
                    if ($serialIssn) {
                        $q->orWhere('record_title', 'like', "%{$serialIssn}%");
                    }
                })
                ->orderBy('created_at', 'desc')  // DESC order: newest first
                ->limit(10)
                ->get();

            foreach ($logs as $log) {
                // Convert UTC timestamp to app timezone
                $logTime = $log->created_at 
                    ? $log->created_at->setTimezone($appTimezone) 
                    : null;
                
                $history[] = [
                    'status' => $log->status_to ?? $log->action ?? 'unknown',
                    'status_label' => ucfirst(str_replace('_', ' ', $log->status_to ?? $log->action ?? 'unknown')),
                    'date' => $logTime ? $logTime->format('M j, Y') : 'N/A',
                    'time' => $logTime ? $logTime->format('g:i A') : 'N/A',
                    'actor' => $log->from_user_name ?? 'System',
                    'description' => $log->remarks ?? null,
                ];
            }
            
            // Check if 'created' status is already in history
            $hasCreated = collect($history)->contains(function ($h) {
                return ($h['status'] === 'created') || (stripos($h['status_label'] ?? '', 'created') !== false);
            });
            
            // Add 'created' at the BOTTOM (oldest status)
            if (!$hasCreated) {
                $createdTime = Carbon::now($appTimezone)->subDays(count($history) + 1);
                $history[] = [
                    'status' => 'created',
                    'status_label' => 'Subscription Created',
                    'date' => $createdTime->format('M j, Y'),
                    'time' => $createdTime->format('g:i A'),
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
            
            // Handle inspected, delivered or for_return
            $appTz = config('app.timezone');
            if ($currentStatus === 'inspected' || $currentStatus === 'delivered' || $currentStatus === 'for_return') {
                $history[] = [
                    'status' => $currentStatus,
                    'status_label' => ($currentStatus === 'inspected' || $currentStatus === 'delivered') ? 'Delivered (Inspected)' : 'For Return',
                    'date' => Carbon::now($appTz)->format('M j, Y'),
                    'time' => Carbon::now($appTz)->format('g:i A'),
                    'actor' => $statusActors[$currentStatus] ?? 'Inspection Team',
                    'description' => $currentStatus === 'for_return' ? 'Serial marked for return due to issues' : 'Serial inspected and approved',
                ];
                
                foreach (array_reverse($statusFlow) as $status) {
                    $history[] = [
                        'status' => $status,
                        'status_label' => $status === 'created' ? 'Subscription Created' : ucfirst(str_replace('_', ' ', $status)),
                        'date' => Carbon::now($appTz)->subDays(count($history))->format('M j, Y'),
                        'time' => Carbon::now($appTz)->subHours(count($history) + 2)->format('g:i A'),
                        'actor' => $statusActors[$status] ?? 'System',
                        'description' => $status === 'created' ? 'Serial subscription created and assigned to supplier' : null,
                    ];
                }
            } else {
                // Current status + created
                $history[] = [
                    'status' => $currentStatus,
                    'status_label' => ucfirst(str_replace('_', ' ', $currentStatus)),
                    'date' => Carbon::now($appTz)->format('M j, Y'),
                    'time' => Carbon::now($appTz)->format('g:i A'),
                    'actor' => $statusActors[$currentStatus] ?? 'System',
                    'description' => null,
                ];
                $history[] = [
                    'status' => 'created',
                    'status_label' => 'Subscription Created',
                    'date' => Carbon::now($appTz)->subDays(1)->format('M j, Y'),
                    'time' => Carbon::now($appTz)->subDays(1)->format('g:i A'),
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
     * Uses raw MongoDB queries because Eloquent queries don't work reliably in service context
     */
    private static function getRecipientsForRole(string $role, ?string $supplierName = null): array
    {
        $recipients = [];

        try {
            // Use MongoDB client directly for reliability
            $client = new \MongoDB\Client(env('DB_DSN', 'mongodb://localhost:27017'));
            $db = $client->selectDatabase(env('DB_DATABASE', 'test'));
            $usersCollection = $db->selectCollection('users');
            $suppliersCollection = $db->selectCollection('supplier_accounts');

            switch (strtolower($role)) {
                case 'supplier':
                    // Get supplier email by company name
                    if ($supplierName) {
                        // First try SupplierAccount collection
                        $supplier = $suppliersCollection->findOne([
                            'company_name' => new \MongoDB\BSON\Regex($supplierName, 'i'),
                            'status' => 'approved',
                            'is_disabled' => false
                        ]);

                        if ($supplier && isset($supplier['email']) && $supplier['email']) {
                            $recipients[] = [
                                'email' => $supplier['email'],
                                'name' => $supplier['contact_person'] ?? $supplier['company_name'],
                            ];
                            Log::info("Found supplier in SupplierAccount", [
                                'supplier_name' => $supplierName,
                                'email' => $supplier['email'],
                            ]);
                        }

                        // Also check users collection for supplier role
                        $supplierUser = $usersCollection->findOne([
                            'role' => 'supplier',
                            'is_disabled' => false,
                            '$or' => [
                                ['name' => new \MongoDB\BSON\Regex($supplierName, 'i')],
                                ['email' => new \MongoDB\BSON\Regex($supplierName, 'i')]
                            ]
                        ]);

                        if ($supplierUser && isset($supplierUser['email']) && $supplierUser['email']) {
                            $exists = collect($recipients)->contains('email', $supplierUser['email']);
                            if (!$exists) {
                                $recipients[] = [
                                    'email' => $supplierUser['email'],
                                    'name' => $supplierUser['name'],
                                ];
                                Log::info("Found supplier in User table", [
                                    'supplier_name' => $supplierName,
                                    'email' => $supplierUser['email'],
                                ]);
                            }
                        }
                    }
                    break;

                case 'tpu':
                case 'gsps':
                case 'inspection':
                case 'admin':
                    // Get all users with this role and is_disabled = false
                    $users = $usersCollection->find([
                        'role' => $role,
                        'is_disabled' => false
                    ]);

                    foreach ($users as $user) {
                        if (isset($user['email']) && $user['email']) {
                            $recipients[] = [
                                'email' => $user['email'],
                                'name' => $user['name'] ?? 'User',
                            ];
                        }
                    }

                    Log::info("Found {$role} recipients", [
                        'role' => $role,
                        'count' => count($recipients),
                    ]);
                    break;
            }

        } catch (\Exception $e) {
            Log::error("Error fetching recipients for role: {$role}", [
                'error' => $e->getMessage(),
            ]);
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
     * Send confirmation email to the specific actor (GSPS/Inspection) for their own action
     * This serves as a copy/confirmation that THEY completed an action in the system
     * Only the actor who performed the action gets this email, not all users of that role
     */
    public static function sendConfirmationEmail(
        string $serialTitle,
        string $status,
        string $actorRole,
        ?string $supplierName = null,
        ?string $actorName = null
    ): bool {
        try {
            Log::info("sendConfirmationEmail called", [
                'serial_title' => $serialTitle,
                'status' => $status,
                'actor_role' => $actorRole,
                'actor_name' => $actorName,
            ]);

            // Get the specific actor by name and role
            if ($actorName && $actorRole) {
                Log::info("Searching for actor by name and role");
                
                // Use raw MongoDB query for reliability
                try {
                    $client = new \MongoDB\Client(env('DB_DSN', 'mongodb://localhost:27017'));
                    $db = $client->selectDatabase(env('DB_DATABASE', 'test'));
                    $usersCollection = $db->selectCollection('users');
                    
                    $user = $usersCollection->findOne([
                        'role' => $actorRole,
                        'is_disabled' => false,
                        '$or' => [
                            ['name' => $actorName],
                            ['email' => new \MongoDB\BSON\Regex($actorName, 'i')]
                        ]
                    ]);
                    
                    Log::info("User search result", [
                        'actor_name' => $actorName,
                        'actor_role' => $actorRole,
                        'user_found' => $user ? 'yes' : 'no',
                        'user_email' => $user ? ($user['email'] ?? 'N/A') : 'N/A'
                    ]);
                    
                    if ($user && isset($user['email']) && $user['email']) {
                        $recipients = [[
                            'email' => $user['email'],
                            'name' => $user['name'] ?? 'User'
                        ]];
                        Log::info("Sending confirmation to specific actor", [
                            'actor' => $actorName,
                            'role' => $actorRole,
                            'email' => $user['email']
                        ]);
                    } else {
                        Log::info("Actor not found for confirmation email", [
                            'actor_name' => $actorName,
                            'actor_role' => $actorRole
                        ]);
                        return false;
                    }
                } catch (\Exception $e) {
                    Log::error("Error searching for actor", [
                        'error' => $e->getMessage(),
                        'actor_name' => $actorName,
                        'actor_role' => $actorRole
                    ]);
                    return false;
                }
            } else {
                Log::info("No actor name or role provided, using fallback");
                // Fallback: get all users with the actor's role
                $recipients = self::getRecipientsForRole($actorRole, $supplierName);
                
                if (empty($recipients)) {
                    Log::info("No email recipients found for confirmation to role: {$actorRole}");
                    return false;
                }
            }

            if (empty($recipients)) {
                Log::info("Recipients array is empty");
                return false;
            }

            $updateDateTime = Carbon::now(config('app.timezone'))->format('F j, Y \a\t g:i A');
            
            // Confirmation-specific messages for each role/action
            $confirmationMessages = [
                // Supplier confirmations
                'prepare' => "This is to confirm that you have started preparing the serial '{$serialTitle}'. The serial is now in preparation status and awaiting shipment.",
                'for_delivery' => "This is to confirm that you have marked the serial '{$serialTitle}' as ready for delivery. It is now awaiting pickup by GSPS.",
                // GSPS confirmation
                'received' => "This is to confirm that you have successfully received the serial '{$serialTitle}' from {$supplierName}. The serial is now pending inspection.",
                // Inspection confirmations
                'inspected' => "This is to confirm that you have successfully inspected the serial '{$serialTitle}' from {$supplierName} and marked it as Delivered.",
                'delivered' => "This is to confirm that you have successfully inspected the serial '{$serialTitle}' from {$supplierName} and marked it as Delivered.",
                'for_return' => "This is to confirm that you have marked the serial '{$serialTitle}' from {$supplierName} for return due to inspection findings.",
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
                    Carbon::now(config('app.timezone'))->format('Y-m-d')
                );

                // Skip if already sent today
                if (isset(self::$sentNotifications[$notificationHash])) {
                    Log::info("Skipping duplicate confirmation email", [
                        'to' => $recipient['email'],
                        'status' => $status
                    ]);
                    continue;
                }

                try {
                    // Send the confirmation email IMMEDIATELY (synchronously, not queued)
                    Log::info("Attempting to send confirmation email", [
                        'to' => $recipient['email'],
                        'serial_title' => $serialTitle,
                        'status' => $status,
                        'action_message' => $action
                    ]);

                    Mail::to($recipient['email'])
                        ->sendNow(new SerialStatusNotification(  // Use sendNow() to skip queue
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

                    Log::info("✅ Confirmation email successfully sent", [
                        'to' => $recipient['email'],
                        'serial_title' => $serialTitle,
                        'status' => $status,
                        'role' => $actorRole,
                    ]);
                } catch (\Exception $e) {
                    Log::error("❌ Failed to send confirmation email", [
                        'to' => $recipient['email'],
                        'serial_title' => $serialTitle,
                        'status' => $status,
                        'error' => $e->getMessage(),
                    ]);
                }
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

    /**
     * Get recurring issue information for email notifications
     * Fetches subscription details and calculates recurring issue metrics
     */
    private static function getRecurringIssueInfo(?string $subscriptionId, ?string $issueId = null): array
    {
        if (!$subscriptionId) {
            return [];
        }

        try {
            // Fetch subscription details
            $subscription = Subscription::find($subscriptionId);
            if (!$subscription) {
                return [];
            }

            $frequency = strtolower($subscription->frequency ?? 'monthly');
            $totalIssues = $subscription->total_issues ?? 0;

            if ($totalIssues === 0) {
                return [];
            }

            // Get the specific issue if issueId provided, otherwise get the latest
            $currentIssue = null;
            if ($issueId) {
                // Fetch the specific issue by ID
                $currentIssue = SerialIssue::where('subscription_id', $subscriptionId)
                    ->where('_id', $issueId)
                    ->first();
            }
            
            // If no specific issue found or not provided, get the latest issue
            if (!$currentIssue) {
                $currentIssue = SerialIssue::where('subscription_id', $subscriptionId)
                    ->orderBy('issue_number')
                    ->latest()
                    ->first();
            }

            if (!$currentIssue) {
                return [];
            }

            $issueNumber = $currentIssue->issue_number ?? 1;
            $expectedDeliveryDate = $currentIssue->expected_delivery_date 
                ? Carbon::parse($currentIssue->expected_delivery_date)->format('M d, Y')
                : null;

            // Calculate next issue date
            $nextIssueDate = null;
            if ($issueNumber < $totalIssues) {
                $nextIssueDate = self::calculateNextIssueDate(
                    $currentIssue->expected_delivery_date,
                    $frequency
                );
            }

            return [
                'issue_number' => $issueNumber,
                'total_issues' => $totalIssues,
                'frequency' => $frequency,
                'expected_delivery_date' => $expectedDeliveryDate,
                'next_issue_date' => $nextIssueDate,
            ];

        } catch (\Exception $e) {
            Log::warning("Failed to get recurring issue info", [
                'subscription_id' => $subscriptionId,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Calculate next issue expected date based on frequency
     * Supports: weekly, biweekly, monthly, quarterly, annually
     */
    private static function calculateNextIssueDate(?string $currentDate, string $frequency): ?string
    {
        if (!$currentDate) {
            return null;
        }

        try {
            $date = Carbon::parse($currentDate);
            $frequency = strtolower(trim($frequency ?? 'monthly'));

            $nextDate = match ($frequency) {
                'weekly' => $date->copy()->addWeek(),
                'biweekly', 'bi-weekly' => $date->copy()->addWeeks(2),
                'monthly' => $date->copy()->addMonth(),
                'quarterly' => $date->copy()->addMonths(3),
                'annually', 'annual', 'yearly' => $date->copy()->addYear(),
                default => $date->copy()->addMonth(), // Default to monthly
            };

            return $nextDate->format('M d, Y');

        } catch (\Exception $e) {
            Log::warning("Failed to calculate next issue date", [
                'current_date' => $currentDate,
                'frequency' => $frequency,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
