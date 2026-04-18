<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PendingSupplierApproval extends Mailable
{
    use SerializesModels;

    public string $companyName;
    public string $contactPerson;
    public string $email;
    public string $phone;
    public string $address;
    public string $createdAt;
    public string $approvalUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(
        string $companyName,
        string $contactPerson,
        string $email,
        string $phone,
        string $address,
        string $createdAt
    ) {
        $this->companyName = $companyName;
        $this->contactPerson = $contactPerson;
        $this->email = $email;
        $this->phone = $phone;
        $this->address = $address;
        $this->createdAt = $createdAt;
        $this->approvalUrl = config('app.url') . '/account-approval';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Pending Supplier Approval: {$this->companyName}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.pending-supplier-approval',
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
