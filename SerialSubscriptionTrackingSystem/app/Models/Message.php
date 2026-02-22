<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $connection = 'mongodb';

    protected $fillable = [
        'chat_id',
        'sender_id',
        'content',
        'read_at',
        'attachment',      // Legacy: simple string path (for backwards compatibility)
        'attachment_data', // New: structured attachment object
        'is_edited',
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'attachment_data' => 'array', // Cast to array for structured attachment data
    ];

    /**
     * Get the attachment data with original filename.
     * Structure: {
     *   original_name: string,
     *   stored_name: string (hashed filename),
     *   file_path: string (storage path),
     *   file_type: string (mime type),
     *   file_size: int (bytes),
     *   uploaded_by: string (user id),
     *   uploaded_at: datetime
     * }
     */
    public function getAttachmentInfo(): ?array
    {
        // Return new structure if available, otherwise fallback to legacy
        if ($this->attachment_data) {
            return $this->attachment_data;
        }

        // Fallback for legacy messages with simple attachment path
        if ($this->attachment) {
            return [
                'original_name' => basename($this->attachment),
                'stored_name' => basename($this->attachment),
                'file_path' => $this->attachment,
                'file_type' => null,
                'file_size' => null,
                'uploaded_by' => $this->sender_id,
                'uploaded_at' => $this->created_at,
            ];
        }

        return null;
    }

    /**
     * Check if message has an attachment
     */
    public function hasAttachment(): bool
    {
        return !empty($this->attachment_data) || !empty($this->attachment);
    }

    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
