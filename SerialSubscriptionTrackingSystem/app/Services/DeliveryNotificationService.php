<?php

namespace App\Services;

use App\Models\DeliveryNotification;
use App\Models\Subscription;
use App\Models\SupplierAccount;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class DeliveryNotificationService
{
    /**
     * Generate delivery notifications for upcoming deliveries
     * Called by scheduled task
     */
    public static function generateDeliveryNotifications(): array
    {
        $today = Carbon::today();
        $threeDaysFromNow = $today->copy()->addDays(3);
        $results = [
            'generated' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        try {
            $subscriptions = Subscription::where('status', 'Active')->get();

            foreach ($subscriptions as $subscription) {
                $serials = $subscription->serials ?? [];

                foreach ($serials as $index => $serial) {
                    // Skip if serial is already completed or inspected
                    $status = $serial['status'] ?? 'pending';
                    if (in_array($status, ['completed', 'inspected'])) {
                        continue;
                    }

                    // Get delivery date
                    $deliveryDateStr = $serial['deliveryDate'] ?? $serial['expected_delivery'] ?? null;
                    if (!$deliveryDateStr) {
                        continue;
                    }

                    try {
                        $deliveryDate = Carbon::parse($deliveryDateStr);
                    } catch (\Exception $e) {
                        continue;
                    }

                    // Calculate days until delivery
                    $daysUntilDelivery = $today->diffInDays($deliveryDate, false);

                    // Skip if delivery date has passed
                    if ($daysUntilDelivery < 0) {
                        continue;
                    }

                    // Get supplier info
                    $supplierInfo = self::getSupplierInfo($subscription);

                    // Determine notification type
                    if ($daysUntilDelivery === 3) {
                        // Initial 3-day reminder
                        $notificationType = 'initial_reminder';
                    } elseif ($daysUntilDelivery <= 2 && $daysUntilDelivery >= 0) {
                        // Daily reminder (2 days, 1 day, or day of delivery)
                        $notificationType = 'daily_reminder';
                    } else {
                        // Not yet time to notify
                        continue;
                    }

                    // Check if notification already sent today
                    if (DeliveryNotification::wasAlreadySentToday(
                        (string)($subscription->_id ?? $subscription->id),
                        $index,
                        $notificationType
                    )) {
                        $results['skipped']++;
                        continue;
                    }

                    // Create notification
                    $notification = DeliveryNotification::create([
                        'subscription_id' => (string)($subscription->_id ?? $subscription->id),
                        'serial_index' => $index,
                        'serial_title' => $serial['serialTitle'] ?? $serial['title'] ?? 'Unknown Serial',
                        'supplier_id' => $supplierInfo['id'],
                        'supplier_name' => $supplierInfo['name'],
                        'supplier_email' => $supplierInfo['email'],
                        'delivery_date' => $deliveryDate,
                        'notification_type' => $notificationType,
                        'days_until_delivery' => $daysUntilDelivery,
                        'is_read' => false,
                        'is_email_sent' => false,
                        'sent_at' => now(),
                    ]);

                    $results['generated']++;

                    // Optionally send email notification
                    // self::sendEmailNotification($notification);

                } // end foreach serial
            } // end foreach subscription

        } catch (\Exception $e) {
            $results['errors'][] = $e->getMessage();
            Log::error('Error generating delivery notifications: ' . $e->getMessage());
        }

        return $results;
    }

    /**
     * Get supplier information
     */
    private static function getSupplierInfo($subscription): array
    {
        $supplierId = $subscription->supplier_id;
        $supplierName = $subscription->supplier_name;
        $supplierEmail = null;

        if ($supplierId) {
            $supplier = SupplierAccount::find($supplierId);
            if ($supplier) {
                $supplierEmail = $supplier->email;
            }
        }

        return [
            'id' => $supplierId,
            'name' => $supplierName,
            'email' => $supplierEmail,
        ];
    }

    /**
     * Get unread notifications for a supplier
     */
    public static function getUnreadNotificationsForSupplier(string $supplierId): \Illuminate\Support\Collection
    {
        return DeliveryNotification::forSupplier($supplierId)
                                   ->unread()
                                   ->orderBy('delivery_date', 'asc')
                                   ->get();
    }

    /**
     * Get all notifications for a supplier
     */
    public static function getNotificationsForSupplier(string $supplierId, int $limit = 50): \Illuminate\Support\Collection
    {
        return DeliveryNotification::forSupplier($supplierId)
                                   ->orderBy('created_at', 'desc')
                                   ->limit($limit)
                                   ->get();
    }

    /**
     * Get upcoming deliveries (next 7 days)
     */
    public static function getUpcomingDeliveries(?string $supplierId = null, int $days = 7): array
    {
        $today = Carbon::today();
        $endDate = $today->copy()->addDays($days);
        $upcomingDeliveries = [];

        $query = Subscription::where('status', 'Active');

        $subscriptions = $query->get();

        foreach ($subscriptions as $subscription) {
            // Filter by supplier if specified
            if ($supplierId && $subscription->supplier_id !== $supplierId) {
                continue;
            }

            $serials = $subscription->serials ?? [];

            foreach ($serials as $index => $serial) {
                $status = $serial['status'] ?? 'pending';
                if (in_array($status, ['completed', 'inspected', 'received'])) {
                    continue;
                }

                $deliveryDateStr = $serial['deliveryDate'] ?? $serial['expected_delivery'] ?? null;
                if (!$deliveryDateStr) {
                    continue;
                }

                try {
                    $deliveryDate = Carbon::parse($deliveryDateStr);
                } catch (\Exception $e) {
                    continue;
                }

                if ($deliveryDate >= $today && $deliveryDate <= $endDate) {
                    $daysUntil = $today->diffInDays($deliveryDate, false);
                    
                    $upcomingDeliveries[] = [
                        'subscription_id' => (string)($subscription->_id ?? $subscription->id),
                        'serial_index' => $index,
                        'serial_title' => $serial['serialTitle'] ?? $serial['title'] ?? 'Unknown',
                        'supplier_name' => $subscription->supplier_name,
                        'delivery_date' => $deliveryDate->toDateString(),
                        'days_until_delivery' => $daysUntil,
                        'status' => $status,
                        'urgency' => $daysUntil <= 1 ? 'high' : ($daysUntil <= 3 ? 'medium' : 'low'),
                    ];
                }
            }
        }

        // Sort by delivery date
        usort($upcomingDeliveries, function ($a, $b) {
            return $a['days_until_delivery'] <=> $b['days_until_delivery'];
        });

        return $upcomingDeliveries;
    }

    /**
     * Mark notification as read
     */
    public static function markAsRead(string $notificationId): bool
    {
        $notification = DeliveryNotification::find($notificationId);
        if ($notification) {
            $notification->markAsRead();
            return true;
        }
        return false;
    }

    /**
     * Mark all notifications as read for a supplier
     */
    public static function markAllAsReadForSupplier(string $supplierId): int
    {
        return DeliveryNotification::forSupplier($supplierId)
                                   ->unread()
                                   ->update([
                                       'is_read' => true,
                                       'read_at' => now(),
                                   ]);
    }

    /**
     * Send email notification (placeholder - implement with your mail service)
     */
    private static function sendEmailNotification(DeliveryNotification $notification): void
    {
        // TODO: Implement email sending logic
        // Mail::to($notification->supplier_email)->send(new DeliveryReminderMail($notification));
        
        $notification->is_email_sent = true;
        $notification->save();
        
        Log::info("Delivery notification email would be sent to {$notification->supplier_email} for {$notification->serial_title}");
    }
}
