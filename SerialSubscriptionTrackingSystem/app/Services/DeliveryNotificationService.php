<?php

namespace App\Services;

use App\Mail\DeliveryReminderNotification;
use App\Models\DeliveryNotification;
use App\Models\SerialIssue;
use App\Models\Subscription;
use App\Models\SupplierAccount;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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
                $subscriptionId = (string) ($subscription->_id ?? $subscription->id);

                // SerialIssue is the real source of truth once a subscription's issues
                // have been generated; the embedded serials[] array only stays accurate
                // for subscriptions that predate issue-based tracking. Prefer SerialIssue
                // whenever it exists (same fallback pattern used in NotificationController
                // and ArchiveController/ArchiveService).
                $issues = SerialIssue::where('subscription_id', $subscriptionId)
                    ->whereNull('archived_at')
                    ->get();

                if ($issues->isNotEmpty()) {
                    foreach ($issues as $issue) {
                        $status = $issue->status ?? SerialIssue::STATUS_PENDING;
                        if (in_array($status, [SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN], true)) {
                            continue;
                        }

                        $deliveryDate = $issue->expected_delivery_date;
                        if (!$deliveryDate) {
                            continue;
                        }

                        $daysUntilDelivery = $today->diffInDays($deliveryDate, false);
                        $notificationType = self::determineNotificationType($daysUntilDelivery);
                        if (!$notificationType) {
                            continue;
                        }

                        $supplierInfo = self::getSupplierInfo($subscription);
                        $dedupIndex = $issue->issue_number - 1;

                        if (DeliveryNotification::wasAlreadySentToday($subscriptionId, $dedupIndex, $notificationType)) {
                            $results['skipped']++;
                            continue;
                        }

                        $notification = DeliveryNotification::create([
                            'subscription_id' => $subscriptionId,
                            'serial_index' => $dedupIndex,
                            'serial_title' => $subscription->serial_title ?? 'Unknown Serial',
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
                        self::sendEmailNotification($notification);
                    }

                    continue;
                }

                // Legacy fallback: subscriptions with no SerialIssue records at all.
                $serials = $subscription->activeSerials();

                foreach ($serials as $index => $serial) {
                    if (!empty($serial['archived_at'])) continue;
                    $status = $serial['status'] ?? 'pending';
                    if (in_array($status, ['delivered', 'for_return'])) {
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

                    $daysUntilDelivery = $today->diffInDays($deliveryDate, false);
                    $notificationType = self::determineNotificationType($daysUntilDelivery);
                    if (!$notificationType) {
                        continue;
                    }

                    $supplierInfo = self::getSupplierInfo($subscription);

                    if (DeliveryNotification::wasAlreadySentToday($subscriptionId, $index, $notificationType)) {
                        $results['skipped']++;
                        continue;
                    }

                    $notification = DeliveryNotification::create([
                        'subscription_id' => $subscriptionId,
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
                    self::sendEmailNotification($notification);
                }
            } // end foreach subscription

        } catch (\Exception $e) {
            $results['errors'][] = $e->getMessage();
            Log::error('Error generating delivery notifications: ' . $e->getMessage());
        }

        return $results;
    }

    /**
     * Decide what kind of reminder (if any) a delivery is due for, purely from how
     * many days remain until its expected delivery date. Negative means the date has
     * already passed and the serial is still not delivered/returned — overdue.
     */
    private static function determineNotificationType(int $daysUntilDelivery): ?string
    {
        if ($daysUntilDelivery < 0) {
            return 'overdue';
        }
        if ($daysUntilDelivery === 3) {
            return 'initial_reminder';
        }
        if ($daysUntilDelivery <= 2 && $daysUntilDelivery >= 0) {
            return 'daily_reminder';
        }

        return null;
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
                if (!empty($supplier->user_id)) {
                    $supplierUser = User::find($supplier->user_id);
                    if ($supplierUser && !empty($supplierUser->email)) {
                        $supplierEmail = $supplierUser->email;
                    }
                }

                if (empty($supplierEmail) && !empty($supplier->email)) {
                    $supplierEmail = $supplier->email;
                }
            }
        }

        if (empty($supplierEmail) && $supplierName) {
            $supplier = SupplierAccount::where('company_name', 'like', "%{$supplierName}%")->first();

            if ($supplier) {
                if (!empty($supplier->user_id)) {
                    $supplierUser = User::find($supplier->user_id);
                    if ($supplierUser && !empty($supplierUser->email)) {
                        $supplierEmail = $supplierUser->email;
                    }
                }

                if (empty($supplierEmail) && !empty($supplier->email)) {
                    $supplierEmail = $supplier->email;
                }

                if (empty($supplierId)) {
                    $supplierId = (string) ($supplier->_id ?? $supplier->id);
                }
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

        $subscriptions = Subscription::where('status', 'Active')->get();

        foreach ($subscriptions as $subscription) {
            // Filter by supplier if specified
            if ($supplierId && (string) $subscription->supplier_id !== (string) $supplierId) {
                continue;
            }

            $subscriptionId = (string) ($subscription->_id ?? $subscription->id);

            // Same SerialIssue-first, embedded-array-fallback pattern as
            // generateDeliveryNotifications() above.
            $issues = SerialIssue::where('subscription_id', $subscriptionId)
                ->whereNull('archived_at')
                ->get();

            if ($issues->isNotEmpty()) {
                foreach ($issues as $issue) {
                    $status = $issue->status ?? SerialIssue::STATUS_PENDING;
                    if (in_array($status, [SerialIssue::STATUS_DELIVERED, SerialIssue::STATUS_FOR_RETURN], true)) {
                        continue;
                    }

                    $deliveryDate = $issue->expected_delivery_date;
                    if (!$deliveryDate) {
                        continue;
                    }

                    if ($deliveryDate >= $today && $deliveryDate <= $endDate) {
                        $daysUntil = $today->diffInDays($deliveryDate, false);

                        $upcomingDeliveries[] = [
                            'subscription_id' => $subscriptionId,
                            'serial_index' => $issue->issue_number - 1,
                            'serial_title' => $subscription->serial_title ?? 'Unknown',
                            'supplier_name' => $subscription->supplier_name,
                            'delivery_date' => $deliveryDate->toDateString(),
                            'days_until_delivery' => $daysUntil,
                            'status' => $status,
                            'urgency' => $daysUntil <= 1 ? 'high' : ($daysUntil <= 3 ? 'medium' : 'low'),
                        ];
                    }
                }

                continue;
            }

            // Legacy fallback: subscriptions with no SerialIssue records at all.
            $serials = $subscription->activeSerials();

            foreach ($serials as $index => $serial) {
                if (!empty($serial['archived_at'])) continue;
                $status = $serial['status'] ?? 'pending';
                if (in_array($status, ['delivered', 'for_return'])) {
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
                        'subscription_id' => $subscriptionId,
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
        try {
            // Verify email address exists
            if (empty($notification->supplier_email)) {
                Log::warning("Cannot send delivery notification: no supplier email for {$notification->serial_title}");
                return;
            }

            // Send email to supplier
            Mail::to($notification->supplier_email)
                ->send(new DeliveryReminderNotification($notification));

            // Mark as sent
            $notification->is_email_sent = true;
            $notification->save();

            Log::info("Delivery reminder email sent", [
                'to' => $notification->supplier_email,
                'serial_title' => $notification->serial_title,
                'notification_type' => $notification->notification_type,
                'days_until_delivery' => $notification->days_until_delivery,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send delivery notification email", [
                'error' => $e->getMessage(),
                'supplier_email' => $notification->supplier_email,
                'serial_title' => $notification->serial_title,
            ]);
        }
    }
}