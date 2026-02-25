<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminSerialSummaryNotification extends Mailable
{
    use SerializesModels;

    public string $serialTitle;
    public string $currentStatus;
    public string $supplierName;
    public string $updateDateTime;
    public array $statusHistory;
    public string $latestAction;
    public ?string $actorName;
    public ?string $issn;

    /**
     * Create a new message instance.
     */
    public function __construct(
        string $serialTitle,
        string $currentStatus,
        string $supplierName,
        string $updateDateTime,
        array $statusHistory,
        string $latestAction,
        ?string $actorName = null,
        ?string $issn = null
    ) {
        $this->serialTitle = $serialTitle;
        $this->currentStatus = $currentStatus;
        $this->supplierName = $supplierName;
        $this->updateDateTime = $updateDateTime;
        $this->statusHistory = $statusHistory;
        $this->latestAction = $latestAction;
        $this->actorName = $actorName;
        $this->issn = $issn;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Serial Update: {$this->serialTitle} - {$this->currentStatus}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.admin-serial-summary',
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
