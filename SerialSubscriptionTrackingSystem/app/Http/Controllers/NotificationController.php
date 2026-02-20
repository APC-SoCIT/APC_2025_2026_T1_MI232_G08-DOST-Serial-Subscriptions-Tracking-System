<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SupplierAccount;
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
        
        // Sort by timestamp (most recent first)
        usort($notifications, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });
        
        // Limit to most recent 50 notifications
        $notifications = array_slice($notifications, 0, 50);
        
        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => count($notifications), // All notifications are considered unread for simplicity
        ]);
    }
    
    /**
     * Mark notification as read (placeholder for future implementation)
     */
    public function markAsRead(Request $request)
    {
        // This would update a notifications table in the future
        // For now, just return success
        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
        ]);
    }
    
    /**
     * Mark all notifications as read (placeholder for future implementation)
     */
    public function markAllAsRead(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }
}
