<?php

namespace App\Mail;

use App\Models\DeliveryNotification;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DeliveryReminderNotification extends Mailable
{
    use SerializesModels;

    public DeliveryNotification $notification;
    public ?string $daysText;

    public function __construct(DeliveryNotification $notification)
    {
        $this->notification = $notification;
        
        // Create human-readable text for days until delivery
        $daysUntil = $notification->days_until_delivery;
        if ($daysUntil === 3) {
            $this->daysText = '3 days';
        } elseif ($daysUntil === 2) {
            $this->daysText = '2 days';
        } elseif ($daysUntil === 1) {
            $this->daysText = '1 day';
        } elseif ($daysUntil === 0) {
            $this->daysText = 'today';
        } else {
            $this->daysText = "{$daysUntil} days";
        }
    }

    public function envelope(): Envelope
    {
        $subject = $this->notification->notification_type === 'initial_reminder'
            ? "Delivery Reminder: {$this->notification->serial_title}"
            : "Urgent: {$this->notification->serial_title} scheduled for delivery {$this->daysText}";

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.delivery_reminder',
            with: [
                'notification' => $this->notification,
                'daysText' => $this->daysText,
                'recipientName' => $this->notification->supplier_name,
                'serialTitle' => $this->notification->serial_title,
                'deliveryDate' => $this->notification->delivery_date,
                'notificationType' => $this->notification->notification_type,
            ],
        );
    }
}
