<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SupplierApprovedNotification extends Mailable
{
    use SerializesModels;

    public string $companyName;
    public string $contactPerson;
    public string $email;
    public string $approvedBy;
    public string $approvedAt;
    public string $dashboardUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(
        string $companyName,
        string $contactPerson,
        string $email,
        string $approvedBy,
        string $approvedAt
    ) {
        $this->companyName = $companyName;
        $this->contactPerson = $contactPerson;
        $this->email = $email;
        $this->approvedBy = $approvedBy;
        $this->approvedAt = $approvedAt;
        $this->dashboardUrl = config('app.url') . '/dashboard-tpu';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Supplier Approved: {$this->companyName}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.supplier-approved-notification',
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
}
