<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SupplierAccount;
use App\Models\DeliveryNotification;
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
        
        $subscriptions = Subscription::orderBy('created_at', 'desc')->get();
        
        $notifications = [];
        $notificationId = 1;
        $sevenDaysAgo = Carbon::now()->subDays(7);
        
        foreach ($subscriptions as $subscription) {
            $serials = $subscription->serials ?? [];
            
            foreach ($serials as $serial) {
                $status = $serial['status'] ?? 'pending';
                $inspectionStatus = $serial['inspection_status'] ?? null;
                
                // Include serials that are:
                // 1. For delivery (incoming)
                // 2. Recently received (within last 7 days) but not yet inspected
                // 3. Pending inspection
                $isForDelivery = $status === 'for_delivery';
                $isRecentlyReceived = $status === 'received' && !$inspectionStatus;
                $isPendingInspection = $inspectionStatus === 'pending';
                
                // Check if this is relevant for the user's role
                $isRelevant = false;
                switch ($userRole) {
                    case 'tpu':
                    case 'gsps':
                    case 'admin':
                        // TPU/GSPS/Admin see all incoming serials
                        $isRelevant = $isForDelivery || $isRecentlyReceived || $isPendingInspection;
                        break;
                    case 'inspection':
                        // Inspection only sees serials pending inspection
                        $isRelevant = $isPendingInspection || $isRecentlyReceived;
                        break;
                    case 'supplier':
                        // Supplier sees their own serials status
                        $isSupplierOwned = strtolower($subscription->supplier_name ?? '') === strtolower($user->name ?? '');
                        $isRelevant = $isSupplierOwned && ($isForDelivery || $status === 'prepare');
                        break;
                }
                
                if ($isRelevant) {
                    // Determine notification type and message
                    $notificationType = 'info';
                    $message = '';
                    
                    if ($isForDelivery) {
                        $notificationType = 'incoming';
                        $message = 'Serial is on the way for delivery';
                    } elseif ($isRecentlyReceived) {
                        $notificationType = 'received';
                        $message = 'Serial received, pending inspection';
                    } elseif ($isPendingInspection) {
                        $notificationType = 'inspection';
                        $message = 'Serial awaiting inspection';
                    } elseif ($status === 'prepare') {
                        $notificationType = 'prepare';
                        $message = 'Serial being prepared for delivery';
                    }
                    
                    // Parse delivery date if available
                    $deliveryDate = $serial['deliveryDate'] ?? $serial['dateDelivered'] ?? null;
                    $timestamp = $deliveryDate ? Carbon::parse($deliveryDate) : Carbon::now();
                    
                    $notifications[] = [
                        'id' => $notificationId++,
                        'subscription_id' => (string) ($subscription->_id ?? $subscription->id),
                        'serial_title' => $serial['serialTitle'] ?? $serial['title'] ?? 'Unknown Serial',
                        'issn' => $serial['issn'] ?? '',
                        'supplier_name' => $subscription->supplier_name,
                        'status' => $status,
                        'inspection_status' => $inspectionStatus,
                        'notification_type' => $notificationType,
                        'message' => $message,
                        'timestamp' => $timestamp->toISOString(),
                        'is_read' => false, // Could be stored in a notifications table in the future
                    ];
                }
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
                    'is_read' => false,
                    'account_id' => (string) ($account->_id ?? $account->id),
                    'email' => $account->email ?? '',
                ];
            }
        }
        
        // Add delivery reminder notifications for suppliers
        if ($userRole === 'supplier') {
            // Get supplier account ID from user
            $supplierAccount = SupplierAccount::where('email', $user->email)->first();
            
            if ($supplierAccount) {
                $supplierId = (string)($supplierAccount->_id ?? $supplierAccount->id);
                
                // Get upcoming deliveries
                $upcomingDeliveries = DeliveryNotificationService::getUpcomingDeliveries($supplierId, 7);
                
                foreach ($upcomingDeliveries as $delivery) {
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
                        'is_read' => false,
                        'delivery_date' => $delivery['delivery_date'],
                        'days_until_delivery' => $delivery['days_until_delivery'],
                        'urgency' => $delivery['urgency'],
                    ];
                }
                
                // Also get stored delivery notifications
                $storedNotifications = DeliveryNotification::forSupplier($supplierId)
                    ->orderBy('created_at', 'desc')
                    ->limit(20)
                    ->get();
                
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
                        'message' => $notif->notification_type === 'initial_reminder' 
                            ? '3-day delivery reminder' 
                            : 'Daily delivery reminder',
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
        $userNotificationsQuery = UserNotification::where(function ($q) use ($userRole, $user) {
            $q->where('user_role', $userRole)
              ->orWhere('user_id', $user->id);
        });
        
        $userNotifications = $userNotificationsQuery
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();
        
        // For suppliers, filter notifications by supplier_name to show only their notifications
        if ($userRole === 'supplier') {
            $userName = strtolower(trim($user->name ?? ''));
            // Get supplier account if exists
            $supplierAccount = SupplierAccount::where('email', $user->email)->first();
            $companyName = $supplierAccount ? strtolower(trim($supplierAccount->company_name ?? '')) : '';
            
            $userNotifications = $userNotifications->filter(function ($notification) use ($userName, $companyName) {
                $supplierName = strtolower(trim($notification->data['supplier_name'] ?? ''));
                return $supplierName === $userName || ($companyName && $supplierName === $companyName);
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
        ]);

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
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
        ]);
    }
    
    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        $user = Auth::user();
        $userRole = strtolower($user->role ?? 'user');

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
            $supplierAccount = SupplierAccount::where('email', $user->email)->first();
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
            $supplierAccount = SupplierAccount::where('email', $user->email)->first();
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
