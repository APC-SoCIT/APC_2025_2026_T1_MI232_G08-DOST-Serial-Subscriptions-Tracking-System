<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Events\MessageSent;

class ChatController extends Controller
{
    /**
     * Get all chats for the current user
     */
    public function index()
    {
        $userId = Auth::id();

        $chats = Chat::where('user_id_1', $userId)
            ->orWhere('user_id_2', $userId)
            ->with(['latestMessage', 'messages'])
            ->orderBy('last_message_at', 'desc')
            ->get()
            ->map(function ($chat) use ($userId) {
                $otherUser = $chat->user_id_1 === $userId ? $chat->user_id_2 : $chat->user_id_1;
                $otherName = $chat->user_id_1 === $userId ? $chat->user_2_name : $chat->user_1_name;
                $otherRole = $chat->user_id_1 === $userId ? $chat->user_2_role : $chat->user_1_role;

                return [
                    'id' => $chat->id,
                    'name' => $otherName,
                    'role' => $otherRole,
                    'lastMessage' => $chat->latestMessage?->content ?? 'No messages yet',
                    'time' => $chat->last_message_at ? $this->formatTime($chat->last_message_at) : 'Just now',
                    'unread' => 0,
                ];
            });

        return response()->json($chats);
    }

    /**
     * Get messages for a specific chat
     */
    public function getMessages($chatId)
    {
        $chat = Chat::findOrFail($chatId);
        $userId = Auth::id();

        // Verify user is part of this chat
        if ($chat->user_id_1 !== $userId && $chat->user_id_2 !== $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $messages = Message::where('chat_id', $chatId)
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) use ($userId) {
                return [
                    'id' => $message->id,
                    'sender' => $message->sender->name,
                    'content' => $message->content,
                    'time' => $message->created_at->format('g:i A'),
                    'isOwn' => $message->sender_id === $userId,
                ];
            });

        return response()->json($messages);
    }

    /**
     * Get or create a chat and fetch messages
     */
    public function getOrCreateChat(Request $request)
    {
        $request->validate([
            'other_user_id' => 'required|exists:users,id',
            'other_user_name' => 'required|string',
            'other_user_role' => 'required|string',
        ]);

        $userId = Auth::id();
        $otherUserId = $request->other_user_id;
        $currentUser = Auth::user();

        // Prevent creating chat with yourself
        if ($userId === $otherUserId) {
            return response()->json(['error' => 'Cannot create chat with yourself'], 400);
        }

        // Look for existing chat
        $chat = Chat::where(function ($query) use ($userId, $otherUserId) {
            $query->where('user_id_1', $userId)->where('user_id_2', $otherUserId);
        })->orWhere(function ($query) use ($userId, $otherUserId) {
            $query->where('user_id_1', $otherUserId)->where('user_id_2', $userId);
        })->first();

        // Create chat if doesn't exist
        if (!$chat) {
            $chat = Chat::create([
                'user_id_1' => min($userId, $otherUserId),
                'user_id_2' => max($userId, $otherUserId),
                'user_1_name' => $userId < $otherUserId ? $currentUser->name : $request->other_user_name,
                'user_1_role' => $userId < $otherUserId ? 'Supplier' : $request->other_user_role,
                'user_2_name' => $userId > $otherUserId ? $currentUser->name : $request->other_user_name,
                'user_2_role' => $userId > $otherUserId ? 'Supplier' : $request->other_user_role,
            ]);
        }

        $messages = Message::where('chat_id', $chat->id)
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) use ($userId) {
                return [
                    'id' => $message->id,
                    'sender' => $message->sender->name,
                    'content' => $message->content,
                    'time' => $message->created_at->format('g:i A'),
                    'isOwn' => $message->sender_id === $userId,
                ];
            });

        return response()->json([
            'chat_id' => $chat->id,
            'messages' => $messages,
        ]);
    }

    /**
     * Store a message with optional file attachment
     */
    public function storeMessage(Request $request, $chatId)
    {
        $request->validate([
            'content' => 'nullable|string',
            'attachment' => 'nullable|file|max:102400', // 100MB max
        ]);

        $chat = Chat::findOrFail($chatId);
        $userId = Auth::id();

        // Verify user is part of this chat
        if ($chat->type === 'private' && $chat->user_id_1 !== $userId && $chat->user_id_2 !== $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentPath = $file->store('chat-attachments', 'public');
        }

        $message = Message::create([
            'chat_id' => $chatId,
            'sender_id' => $userId,
            'content' => $request->content ?? '',
            'attachment' => $attachmentPath,
        ]);

        // Update chat's last message timestamp
        $chat->update(['last_message_at' => now()]);

        // Broadcast the message
        broadcast(new MessageSent($message, $chat));

        return response()->json([
            'id' => $message->id,
            'sender' => Auth::user()->name,
            'senderRole' => Auth::user()->roles->first()?->name,
            'senderId' => $userId,
            'content' => $message->content,
            'attachment' => $message->attachment ? route('file.download', $message->id) : null,
            'time' => $message->created_at->format('g:i A'),
            'isOwn' => true,
        ]);
    }

    /**
     * Download a file attachment
     */
    public function downloadAttachment($messageId)
    {
        $message = Message::findOrFail($messageId);
        
        if (!$message->attachment) {
            return response()->json(['error' => 'No attachment'], 404);
        }

        // Verify user has access
        $chat = $message->chat;
        $userId = Auth::id();

        if ($chat->type === 'private' && $chat->user_id_1 !== $userId && $chat->user_id_2 !== $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return Storage::disk('public')->download($message->attachment);
    }

    /**
     * Format time for display
     */
    private function formatTime($dateTime)
    {
        $now = now();
        $diff = $now->diffInDays($dateTime);

        if ($diff === 0) {
            return $dateTime->format('g:i A');
        } elseif ($diff === 1) {
            return 'Yesterday';
        } elseif ($diff < 7) {
            return $diff . ' days ago';
        } else {
            return $dateTime->format('M d');
        }
    }
}
