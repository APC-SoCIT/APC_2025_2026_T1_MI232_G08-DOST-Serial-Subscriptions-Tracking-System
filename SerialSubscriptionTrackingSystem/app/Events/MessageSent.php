<?php

namespace App\Events;

use App\Models\Message;
use App\Models\Chat;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $chat;

    /**
     * Create a new event instance.
     */
    public function __construct(Message $message, Chat $chat)
    {
        $this->message = $message;
        $this->chat = $chat;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        if ($this->chat->type === 'private') {
            $userIds = [$this->chat->user_id_1, $this->chat->user_id_2];
            return array_map(fn($id) => new PrivateChannel('chat.' . $id), $userIds);
        }

        // Group/Community chat
        return [new Channel('chat.' . $this->chat->id)];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'chat_id' => $this->chat->id,
            'sender' => $this->message->sender->name,
            'senderRole' => $this->message->sender->roles->first()?->name,
            'senderId' => $this->message->sender_id,
            'content' => $this->message->content,
            'attachment' => $this->message->attachment,
            'time' => $this->message->created_at->format('g:i A'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}
