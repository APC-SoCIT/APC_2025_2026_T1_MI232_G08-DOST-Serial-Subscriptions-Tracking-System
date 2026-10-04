<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SupplierAccount;
use App\Models\DeliveryNotification;
use App\Models\SerialIssue;
use App\Models\UserNotification;
use App\Services\DeliveryNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;

class NotificationController extends Controller
{
    /**
     * Get incoming serials notifications
     * Returns serials that are marked for delivery or recently delivered (within last 7 days)
     */
    public function getIncomingSerials(Request $request)
    {
        $user = Auth::user();
        $userRole = strtolower($user->role ?? 'user');
        $supplierAccount = null;

        if ($userRole === 'supplier') {
            $supplierAccount = SupplierAccount::where('user_id', $user->_id ?? $user->id)
                ->orWhere('email', $user->email)
                ->first();
        }
        
        $subscriptions = Subscription::orderBy('created_at', 'desc')->get();
        
        $notifications = [];
        $notificationId = 1;
        $sevenDaysAgo = Carbon::now()->subDays(7);
        $readAllAt = UserNotification::where('user_id', (string) ($user->_id ?? $user->id))
            ->where('type', '__incoming_notifications_read_all')
            ->orderBy('created_at', 'desc')
            ->first()?->created_at;
        $readNotificationKeys = UserNotification::where('user_id', (string) ($user->_id ?? $user->id))
            ->where('type', '__incoming_notification_read')
            ->get()
            ->pluck('data.notification_key')
            ->filter()
            ->flip();
        $isRead = function (string $key, Carbon $timestamp) use ($readAllAt, $readNotificationKeys): bool {
            return $readNotificationKeys->has($key) || ($readAllAt && $timestamp->lte($readAllAt));
        };
        
        // Given (status, inspectionStatus, isOverdue, role, isSupplierOwned), decide whether
        // this serial is notification-worthy for the current user and what to say about it.
        // Shared by both the SerialIssue path and the legacy-embedded-array fallback below,
        // so the two can never silently diverge in what counts as "relevant".
        $classify = function (string $status, ?string $inspectionStatus, bool $isOverdue, string $userRole, bool $isSupplierOwned) {
            $isForDelivery = $status === SerialIssue::STATUS_FOR_DELIVERY;
            $needsInspection = $status === SerialIssue::STATUS_RECEIVED && is_null($inspectionStatus);
            $isPrepare = $status === SerialIssue::STATUS_PREPARE;

            $isRelevant = false;
            switch ($userRole) {
                case 'tpu':
                case 'gsps':
                case 'admin':
                    // TPU/GSPS/Admin see all incoming serials, plus overdue/delayed deliveries
                    $isRelevant = $isForDelivery || $needsInspection || $isOverdue;
                    break;
                case 'inspection':
                    // Inspection only sees serials pending inspection
                    $isRelevant = $needsInspection;
                    break;
                case 'supplier':
                    // Supplier sees only subscriptions tied to their own supplier account ID.
                    $isRelevant = $isSupplierOwned && ($isForDelivery || $isPrepare || $isOverdue);
                    break;
            }

            if (!$isRelevant) {
                return [false, null, null];
            }

            // Overdue takes priority — it's the most urgent state a serial can be in.
            if ($isOverdue) {
                return [true, 'overdue', 'Delivery is overdue — expected date has passed'];
            }
            if ($isForDelivery) {
                return [true, 'incoming', 'Serial is on the way for delivery'];
            }
            if ($needsInspection) {
                return [true, $userRole === 'inspection' ? 'inspection' : 'received', $userRole === 'inspection' ? 'Serial awaiting inspection' : 'Serial received, pending inspection'];
            }
            if ($isPrepare) {
                return [true, 'prepare', 'Serial being prepared for delivery'];
            }

            return [false, null, null];
        };

        $currentSupplierId = $supplierAccount ? (string)($supplierAccount->_id ?? $supplierAccount->id) : null;

        foreach ($subscriptions as $subscription) {
            $subscriptionId = (string) ($subscription->_id ?? $subscription->id);
            $subscriptionSupplierId = (string)($subscription->supplier_id ?? '');
            $isSupplierOwned = $currentSupplierId && $subscriptionSupplierId === $currentSupplierId;

            // SerialIssue is the real source of truth for a serial's lifecycle once a
            // subscription has been accepted and its issues generated — the embedded
            // Subscription.serials[] array is only reliably in sync for older
            // subscriptions that predate issue-based tracking. Prefer SerialIssue
            // whenever it exists; fall back to the embedded array only when it doesn't
            // (same fallback pattern used by ArchiveController/ArchiveService).
            $issues = SerialIssue::where('subscription_id', $subscriptionId)
                ->whereNull('archived_at')
                ->get();

            if ($issues->isNotEmpty()) {
                foreach ($issues as $issue) {
                    $status = $issue->status ?? SerialIssue::STATUS_PENDING;
                    $inspectionStatus = $issue->inspection_status ?? null;

                    $isOverdue = false;
                    if (!in_array($status, [SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN], true) && $issue->expected_delivery_date) {
                        $isOverdue = $issue->expected_delivery_date->lt(Carbon::today());
                    }

                    [$isRelevant, $notificationType, $message] = $classify($status, $inspectionStatus, $isOverdue, $userRole, $isSupplierOwned);
                    if (!$isRelevant) {
                        continue;
                    }

                    $timestamp = $issue->updated_at
                        ?? $issue->inspected_at
                        ?? $issue->received_at
                        ?? $subscription->updated_at
                        ?? $subscription->created_at;
                    $timestamp = $timestamp instanceof Carbon ? $timestamp : Carbon::parse($timestamp);

                    $issueId = (string) ($issue->_id ?? $issue->id);
                    $notificationKey = "issue:{$issueId}:{$status}:{$inspectionStatus}";

                    $notifications[] = [
                        'id' => $notificationId++,
                        'subscription_id' => $subscriptionId,
                        'serial_title' => $subscription->serial_title ?? 'Unknown Serial',
                        'issn' => $subscription->issn ?? '',
                        'supplier_name' => $subscription->supplier_name,
                        'status' => $status,
                        'inspection_status' => $inspectionStatus,
                        'notification_type' => $notificationType,
                        'message' => $message,
                        'timestamp' => $timestamp->toISOString(),
                        'is_read' => $isRead($notificationKey, $timestamp),
                        'notification_key' => $notificationKey,
                    ];
                }

                continue;
            }

            // Legacy fallback: subscriptions with no SerialIssue records at all
            // (predate issue-based generation) still carry their real state in the
            // embedded serials[] array.
            $serials = $subscription->activeSerials();

            foreach ($serials as $serialIndex => $serial) {
                $status = $serial['status'] ?? 'pending';
                $inspectionStatus = $serial['inspection_status'] ?? null;

                $isOverdue = false;
                if (!in_array($status, ['delivered', 'for_return'], true)) {
                    $deliveryDateStr = $serial['deliveryDate'] ?? $serial['expected_delivery'] ?? null;
                    if ($deliveryDateStr) {
                        try {
                            $isOverdue = Carbon::parse($deliveryDateStr)->lt(Carbon::today());
                        } catch (\Exception $e) {
                            // Unparsable date, treat as not overdue
                        }
                    }
                }

                [$isRelevant, $notificationType, $message] = $classify($status, $inspectionStatus, $isOverdue, $userRole, $isSupplierOwned);
                if (!$isRelevant) {
                    continue;
                }

                $timestamp = Carbon::parse(
                    $serial['updated_at']
                        ?? $serial['inspected_at']
                        ?? $serial['received_at']
                        ?? $subscription->updated_at
                        ?? $subscription->created_at
                );
                $notificationKey = "serial:{$subscriptionId}:{$serialIndex}:{$status}:{$inspectionStatus}";

                $notifications[] = [
                    'id' => $notificationId++,
                    'subscription_id' => $subscriptionId,
                    'serial_title' => $serial['serialTitle'] ?? $serial['title'] ?? 'Unknown Serial',
                    'issn' => $serial['issn'] ?? '',
                    'supplier_name' => $subscription->supplier_name,
                    'status' => $status,
                    'inspection_status' => $inspectionStatus,
                    'notification_type' => $notificationType,
                    'message' => $message,
                    'timestamp' => $timestamp->toISOString(),
                    'is_read' => $isRead($notificationKey, $timestamp),
                    'notification_key' => $notificationKey,
                ];
            }
        }
        
        // Add account approval notifications for admin users
        if ($userRole === 'admin') {
            $pendingAccounts = SupplierAccount::pending()->orderBy('created_at', 'desc')->get();
            
            foreach ($pendingAccounts as $account) {
                $notifications[] = [
                    'id' => $notificationId++,
                    'subscription_id' => null,
                    'serial_title' => $account->company_name ?? 'Unknown Company',
                    'issn' => '',
                    'supplier_name' => $account->contact_person ?? 'Pending Registration',
                    'status' => 'pending_approval',
                    'inspection_status' => null,
                    'notification_type' => 'account_approval',
                    'message' => 'New supplier account awaiting approval',
                    'timestamp' => $account->created_at ? $account->created_at->toISOString() : Carbon::now()->toISOString(),
                        'is_read' => $isRead('account:' . (string) ($account->_id ?? $account->id), Carbon::parse($account->created_at)),
                        'notification_key' => 'account:' . (string) ($account->_id ?? $account->id),
                    'account_id' => (string) ($account->_id ?? $account->id),
                    'email' => $account->email ?? '',
                ];
            }
        }
        
        // Add delivery reminder notifications for suppliers
        if ($userRole === 'supplier') {
            // Get supplier account ID from user
            $supplierAccount = SupplierAccount::where('user_id', $user->_id ?? $user->id)
                ->orWhere('email', $user->email)
                ->first();
            
            if ($supplierAccount) {
                $supplierId = (string)($supplierAccount->_id ?? $supplierAccount->id);
                $storedNotifications = DeliveryNotification::forSupplier($supplierId)
                    ->orderBy('created_at', 'desc')
                    ->limit(20)
                    ->get();
                $storedReminderKeys = $storedNotifications->mapWithKeys(function ($notification) {
                    return [
                        (string) $notification->subscription_id . ':' . optional($notification->delivery_date)->toDateString() => true,
                    ];
                });
                
                // Get upcoming deliveries
                $upcomingDeliveries = DeliveryNotificationService::getUpcomingDeliveries($supplierId, 7);
                
                foreach ($upcomingDeliveries as $delivery) {
                    $reminderKey = (string) ($delivery['subscription_id'] ?? '') . ':' . ($delivery['delivery_date'] ?? '');
                    if ($storedReminderKeys->has($reminderKey)) {
                        continue;
                    }
                    $urgencyMessages = [
                        'high' => 'Delivery due today or tomorrow!',
                        'medium' => 'Delivery due within 3 days',
                        'low' => 'Upcoming delivery reminder',
                    ];
                    
                    $notifications[] = [
                        'id' => $notificationId++,
                        'subscription_id' => $delivery['subscription_id'],
                        'serial_title' => $delivery['serial_title'],
                        'issn' => '',
                        'supplier_name' => $delivery['supplier_name'],
                        'status' => $delivery['status'],
                        'inspection_status' => null,
                        'notification_type' => 'delivery_reminder',
                        'message' => $urgencyMessages[$delivery['urgency']] ?? 'Delivery reminder',
                        'timestamp' => Carbon::parse($delivery['delivery_date'])->toISOString(),
                        'is_read' => $isRead('delivery-reminder:' . ($delivery['subscription_id'] ?? '') . ':' . $delivery['delivery_date'], Carbon::parse($delivery['delivery_date'])),
                        'notification_key' => 'delivery-reminder:' . ($delivery['subscription_id'] ?? '') . ':' . $delivery['delivery_date'],
                        'delivery_date' => $delivery['delivery_date'],
                        'days_until_delivery' => $delivery['days_until_delivery'],
                        'urgency' => $delivery['urgency'],
                    ];
                }
                
                // Also get stored delivery notifications
                foreach ($storedNotifications as $notif) {
                    $notifications[] = [
                        'id' => $notificationId++,
                        'subscription_id' => $notif->subscription_id,
                        'serial_title' => $notif->serial_title,
                        'issn' => '',
                        'supplier_name' => $notif->supplier_name,
                        'status' => 'pending',
                        'inspection_status' => null,
                        'notification_type' => $notif->notification_type,
                        'message' => match ($notif->notification_type) {
                            'initial_reminder' => '3-day delivery reminder',
                            'overdue' => 'Delivery is overdue — expected date has passed',
                            default => 'Daily delivery reminder',
                        },
                        'timestamp' => $notif->created_at->toISOString(),
                        'is_read' => $notif->is_read,
                        'delivery_date' => $notif->delivery_date?->toDateString(),
                        'days_until_delivery' => $notif->days_until_delivery,
                        'notification_id' => (string)($notif->_id ?? $notif->id),
                    ];
                }
            }
        }
        
        // Sort by timestamp (most recent first)
        usort($notifications, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });
        
        // Add UserNotifications for the current user's role
        $normalizedRole = strtolower($userRole);
        $userNotificationsQuery = UserNotification::whereNotIn('type', [
            '__incoming_notification_read',
            '__incoming_notifications_read_all',
        ])->where(function ($q) use ($normalizedRole, $user) {
            $q->where('user_role', $normalizedRole)
              ->orWhere('user_id', $user->id);
        });
        
        $userNotifications = $userNotificationsQuery
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();
        
        // For suppliers, filter notifications by supplier_name to show only their notifications
        if ($userRole === 'supplier') {
            // Filter supplier notifications by explicit supplier_id when present.
            $currentSupplierId = $supplierAccount ? (string)($supplierAccount->_id ?? $supplierAccount->id) : '';

            $userNotifications = $userNotifications->filter(function ($notification) use ($currentSupplierId) {
                $notificationSupplierId = (string)($notification->data['supplier_id'] ?? '');
                if ($currentSupplierId && $notificationSupplierId) {
                    return $notificationSupplierId === $currentSupplierId;
                }

                return (string)($notification->user_id ?? '') === (string)Auth::id();
            })->take(30);
        } else {
            $userNotifications = $userNotifications->take(30);
        }
        
        foreach ($userNotifications as $un) {
            $notifications[] = [
                'id' => $notificationId++,
                'subscription_id' => $un->data['subscription_id'] ?? null,
                'serial_title' => $un->data['serial_title'] ?? $un->title,
                'issn' => $un->data['issn'] ?? '',
                'supplier_name' => $un->data['supplier_name'] ?? '',
                'status' => $un->data['status'] ?? 'info',
                'inspection_status' => $un->data['inspection_status'] ?? null,
                'notification_type' => $un->type,
                'message' => $un->message,
                'timestamp' => $un->created_at?->toISOString() ?? Carbon::now()->toISOString(),
                'is_read' => $un->is_read,
                'user_notification_id' => (string)($un->_id ?? $un->id),
            ];
        }
        
        // Re-sort after adding UserNotifications
        usort($notifications, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });
        
        // Limit to most recent 50 notifications
        $notifications = array_slice($notifications, 0, 50);
        
        // Count unread
        $unreadCount = count(array_filter($notifications, fn($n) => !$n['is_read']));
        
        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }
    
    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request)
    {
        $validated = $request->validate([
            'notification_id' => 'nullable|string',
            'notification_type' => 'nullable|string',
            'user_notification_id' => 'nullable|string',
            'notification_key' => 'nullable|string',
        ]);
        $user = Auth::user();

        // If it's a UserNotification, mark it as read
        if (!empty($validated['user_notification_id'])) {
            $userNotif = UserNotification::find($validated['user_notification_id']);
            if ($userNotif) {
                $userNotif->markAsRead();
                return response()->json([
                    'success' => true,
                    'message' => 'Notification marked as read',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Notification not found',
            ], 404);
        }

        if (!empty($validated['notification_key'])) {
            UserNotification::create([
                'user_id' => (string) ($user->_id ?? $user->id),
                'user_role' => strtolower($user->role ?? 'user'),
                'type' => '__incoming_notification_read',
                'title' => 'Notification read marker',
                'message' => 'Synthetic notification marked as read',
                'data' => ['notification_key' => $validated['notification_key']],
                'is_read' => true,
                'read_at' => now(),
            ]);

            return response()->json(['success' => true, 'message' => 'Notification marked as read']);
        }

        // If it's a delivery notification, mark it as read
        if (!empty($validated['notification_id'])) {
            $result = DeliveryNotificationService::markAsRead($validated['notification_id']);
            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'Notification marked as read',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Notification not found',
            ], 404);
        }

        return response()->json([
            'success' => false,
            'message' => 'A notification identifier is required',
        ], 422);
    }
    
    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        $user = Auth::user();
        $userRole = strtolower($user->role ?? 'user');

        UserNotification::create([
            'user_id' => (string) ($user->_id ?? $user->id),
            'user_role' => $userRole,
            'type' => '__incoming_notifications_read_all',
            'title' => 'Notifications read marker',
            'message' => 'All current notifications marked as read',
            'data' => [],
            'is_read' => true,
            'read_at' => now(),
        ]);

        // Mark all UserNotifications as read for this role
        $userNotifCount = UserNotification::where(function ($q) use ($userRole, $user) {
            $q->where('user_role', $userRole)
              ->orWhere('user_id', $user->id);
        })
        ->where('is_read', false)
        ->update(['is_read' => true, 'read_at' => now()]);

        // Mark all delivery notifications as read for suppliers
        $deliveryCount = 0;
        if ($userRole === 'supplier') {
            $supplierAccount = SupplierAccount::where('user_id', $user->_id ?? $user->id)
                ->orWhere('email', $user->email)
                ->first();
            if ($supplierAccount) {
                $supplierId = (string)($supplierAccount->_id ?? $supplierAccount->id);
                $deliveryCount = DeliveryNotificationService::markAllAsReadForSupplier($supplierId);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
            'marked_count' => $userNotifCount + $deliveryCount,
        ]);
    }
    
    /**
     * Get upcoming deliveries for the current user
     */
    public function getUpcomingDeliveries(Request $request)
    {
        $user = Auth::user();
        $userRole = strtolower($user->role ?? 'user');
        $days = $request->get('days', 7);
        
        $supplierId = null;
        
        // For suppliers, filter by their supplier ID
        if ($userRole === 'supplier') {
            $supplierAccount = SupplierAccount::where('user_id', $user->_id ?? $user->id)
                ->orWhere('email', $user->email)
                ->first();
            if ($supplierAccount) {
                $supplierId = (string)($supplierAccount->_id ?? $supplierAccount->id);
            }
        }
        
        $upcomingDeliveries = DeliveryNotificationService::getUpcomingDeliveries($supplierId, $days);
        
        return response()->json([
            'success' => true,
            'deliveries' => $upcomingDeliveries,
            'count' => count($upcomingDeliveries),
        ]);
    }
}