<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccountCredentialsNotification extends Mailable
{
    use SerializesModels;

    public string $recipientName;
    public string $email;
    public string $temporaryPassword;
    public string $role;
    public string $loginUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(
        string $recipientName,
        string $email,
        string $temporaryPassword,
        string $role,
        string $loginUrl = null
    ) {
        $this->recipientName = $recipientName;
        $this->email = $email;
        $this->temporaryPassword = $temporaryPassword;
        $this->role = ucfirst($role);
        $this->loginUrl = $loginUrl ?? (config('app.url') . '/login');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your DOST-STII LAMS Account Has Been Created",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.account-credentials',
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
