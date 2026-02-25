<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SerialStatusNotification extends Mailable
{
    use SerializesModels;

    public string $serialTitle;
    public string $currentStatus;
    public string $updateDateTime;
    public ?string $action;
    public ?string $supplierName;
    public ?string $recipientName;
    public ?string $actorName;
    public string $statusDescription;
    public string $targetRole;

    /**
     * Create a new message instance.
     */
    public function __construct(
        string $serialTitle,
        string $currentStatus,
        string $updateDateTime,
        ?string $action = null,
        ?string $supplierName = null,
        ?string $recipientName = null,
        ?string $actorName = null,
        string $targetRole = 'user'
    ) {
        $this->serialTitle = $serialTitle;
        $this->currentStatus = $currentStatus;
        $this->updateDateTime = $updateDateTime;
        $this->action = $action;
        $this->supplierName = $supplierName;
        $this->recipientName = $recipientName;
        $this->actorName = $actorName;
        $this->targetRole = strtolower($targetRole);
        $this->action = null; // Remove action required section
        $this->statusDescription = $this->getStatusDescription($currentStatus, $targetRole, $serialTitle, $supplierName);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Serial Update: {$this->serialTitle} - " . ucfirst($this->currentStatus),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.serial-status-notification',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }

    /**
     * Get human-readable status description based on role
     */
    private function getStatusDescription(string $status, string $targetRole, string $serialTitle, ?string $supplierName): string
    {
        $status = strtolower($status);
        $role = strtolower($targetRole);

        // Supplier-specific descriptions
        if ($role === 'supplier') {
            $supplierDescriptions = [
                'created' => 'A new serial has been created and assigned to you. Please review and accept the subscription.',
                'received' => 'The serial has been received by the GSPS and will now undergo inspection.',
                'inspected' => 'The serial has been inspected and is now marked as DELIVERED.',
                'for_return' => 'The serial has been inspected and is now marked as FOR RETURN. The inspection has found issues that require the serial to be returned to the supplier.',
            ];
            if (isset($supplierDescriptions[$status])) {
                return $supplierDescriptions[$status];
            }
        }

        // TPU-specific descriptions
        if ($role === 'tpu') {
            $tpuDescriptions = [
                'accepted' => 'The serial has been accepted by the supplier.',
                'prepare' => 'The serial is being prepared for delivery.',
                'for_delivery' => 'The serial is on its way. Please be ready to receive it.',
                'received' => 'The serial has been received by the GSPS and will now undergo inspection.',
                'inspected' => 'The serial has been inspected and is now marked as DELIVERED.',
                'for_return' => 'The serial has been inspected and is now marked as FOR RETURN. The inspection has found issues that require the serial to be returned to the supplier.',
            ];
            if (isset($tpuDescriptions[$status])) {
                return $tpuDescriptions[$status];
            }
        }

        // GSPS-specific descriptions
        if ($role === 'gsps') {
            $gspsDescriptions = [
                'created' => 'A new serial has been created and assigned to a supplier.',
                'accepted' => 'The serial has been accepted by the supplier.',
                'prepare' => 'The serial is being prepared for delivery.',
                'for_delivery' => 'The serial is on its way. Please be ready to receive it.',
                'received' => "This is to confirm that you have successfully received the serial \"{$serialTitle}\" from \"{$supplierName}\". The serial is now pending for inspection.",
                'inspected' => 'The serial has been inspected and is now marked as DELIVERED.',
                'for_return' => 'The serial has been inspected and is now marked as FOR RETURN. The inspection has found issues that require the serial to be returned to the supplier.',
            ];
            if (isset($gspsDescriptions[$status])) {
                return $gspsDescriptions[$status];
            }
        }

        // Inspection-specific descriptions
        if ($role === 'inspection') {
            $inspectionDescriptions = [
                'for_delivery' => 'The serial is on its way. Please be ready to receive it.',
                'received' => "This is to confirm that you have successfully received the serial \"{$serialTitle}\" from \"{$supplierName}\". The serial is now pending for inspection.",
                'inspected' => "You have successfully inspected \"{$serialTitle}\" from \"{$supplierName}\" and marked it as Delivered.",
                'for_return' => "You have successfully inspected \"{$serialTitle}\" from \"{$supplierName}\" and marked it as For Return.",
            ];
            if (isset($inspectionDescriptions[$status])) {
                return $inspectionDescriptions[$status];
            }
        }

        // Default descriptions for admin or fallback
        $defaultDescriptions = [
            'created' => 'A new serial has been created and assigned to a supplier.',
            'pending' => 'The serial is pending and awaiting processing.',
            'accepted' => 'The serial has been accepted by the supplier.',
            'prepare' => 'The serial is being prepared for delivery.',
            'for_delivery' => 'The serial is on its way.',
            'received' => 'The serial has been received by GSPS.',
            'inspected' => 'The serial has been inspected and is now marked as DELIVERED.',
            'for_return' => 'The serial has been inspected and is now marked as FOR RETURN.',
            'delivered' => 'The serial has been delivered.',
            'completed' => 'The serial delivery has been completed.',
            'cancelled' => 'The serial has been cancelled.',
            'delayed' => 'The serial delivery has been delayed.',
            'approved' => 'The serial has been approved.',
            'rejected' => 'The serial has been rejected.',
            'deleted' => 'The serial has been removed from the system.',
        ];

        return $defaultDescriptions[$status] ?? "The serial status has been updated to: {$status}";
    }
}
