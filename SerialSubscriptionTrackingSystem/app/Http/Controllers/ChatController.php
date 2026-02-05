<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Events\MessageSent;

class ChatController extends Controller
{
    /**
     * Roles that have access to chat feature
     */
    private const CHAT_ENABLED_ROLES = ['tpu', 'gsps', 'inspection', 'supplier'];
    
    /**
     * Roles that suppliers are allowed to chat with
     */
    private const SUPPLIER_ALLOWED_ROLES = ['tpu', 'gsps', 'inspection'];

    /**
     * Get all available users that can be chatted with
     */
    public function getAvailableUsers()
    {
        $currentUser = Auth::user();
        $currentUserId = (string) $currentUser->_id;
        $currentRole = strtolower($currentUser->role ?? 'user');
        
        // Build query excluding current user
        $query = User::where('_id', '!=', $currentUserId);
        
        // Apply role-based filtering
        if ($currentRole === 'supplier') {
            // Suppliers can only chat with TPU, GSPS, and Inspection
            $query->whereIn('role', self::SUPPLIER_ALLOWED_ROLES);
        } else {
            // TPU, GSPS, Inspection can chat with all chat-enabled roles (including suppliers)
            $query->whereIn('role', self::CHAT_ENABLED_ROLES);
        }
        
        $users = $query->get()->map(function ($user) {
            return [
                'id' => (string) $user->_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'user',
            ];
        });

        return response()->json($users);
    }

    /**
     * Get all chats for the current user
     */
    public function index()
    {
        $userId = (string) Auth::id();

        $chats = Chat::where('user_id_1', $userId)
            ->orWhere('user_id_2', $userId)
            ->with(['latestMessage', 'messages'])
            ->orderBy('last_message_at', 'desc')
            ->get()
            ->map(function ($chat) use ($userId) {
                $chatUserId1 = (string) $chat->user_id_1;
                $chatUserId2 = (string) $chat->user_id_2;
                
                $otherUser = $chatUserId1 === $userId ? $chatUserId2 : $chatUserId1;
                $otherName = $chatUserId1 === $userId ? $chat->user_2_name : $chat->user_1_name;
                $otherRole = $chatUserId1 === $userId ? $chat->user_2_role : $chat->user_1_role;

                return [
                    'id' => (string) $chat->_id,
                    'name' => $otherName,
                    'role' => $otherRole,
                    'lastMessage' => $chat->latestMessage?->content ?? 'No messages yet',
                    'timestamp' => $chat->last_message_at ? $chat->last_message_at->toISOString() : null,
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
        $userId = (string) Auth::id();
        $chatUserId1 = (string) $chat->user_id_1;
        $chatUserId2 = (string) $chat->user_id_2;

        // Verify user is part of this chat
        if ($chatUserId1 !== $userId && $chatUserId2 !== $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $messages = Message::where('chat_id', $chatId)
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) use ($userId) {
                $senderId = (string) $message->sender_id;
                return [
                    'id' => (string) $message->_id,
                    'sender' => $message->sender->name ?? 'Unknown',
                    'senderId' => $senderId,
                    'senderRole' => $message->sender->role ?? 'user',
                    'content' => $message->content,
                    'attachment' => $message->attachment ? Storage::url($message->attachment) : null,
                    'timestamp' => $message->created_at->toISOString(),
                    'isOwn' => $senderId === $userId,
                    'isEdited' => $message->is_edited ?? false,
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
            'other_user_id' => 'required|string',
            'other_user_name' => 'required|string',
            'other_user_role' => 'required|string',
        ]);

        $userId = (string) Auth::id();
        $otherUserId = (string) $request->other_user_id;
        $currentUser = Auth::user();
        $currentRole = strtolower($currentUser->role ?? 'user');
        $otherUserRole = strtolower($request->other_user_role);

        // Prevent creating chat with yourself
        if ($userId === $otherUserId) {
            return response()->json(['error' => 'Cannot create chat with yourself'], 400);
        }

        // Validate role-based chat permissions (defense-in-depth)
        if ($currentRole === 'supplier' && !in_array($otherUserRole, self::SUPPLIER_ALLOWED_ROLES)) {
            return response()->json(['error' => 'Suppliers can only chat with TPU, GSPS, or Inspection staff'], 403);
        }

        // Look for existing chat
        $chat = Chat::where(function ($query) use ($userId, $otherUserId) {
            $query->where('user_id_1', $userId)->where('user_id_2', $otherUserId);
        })->orWhere(function ($query) use ($userId, $otherUserId) {
            $query->where('user_id_1', $otherUserId)->where('user_id_2', $userId);
        })->first();

        // Get current user's role
        $currentUserRole = $currentUser->role ?? 'user';

        // Create chat if doesn't exist
        if (!$chat) {
            $chat = Chat::create([
                'user_id_1' => $userId < $otherUserId ? $userId : $otherUserId,
                'user_id_2' => $userId > $otherUserId ? $userId : $otherUserId,
                'user_1_name' => $userId < $otherUserId ? $currentUser->name : $request->other_user_name,
                'user_1_role' => $userId < $otherUserId ? $currentUserRole : $request->other_user_role,
                'user_2_name' => $userId > $otherUserId ? $currentUser->name : $request->other_user_name,
                'user_2_role' => $userId > $otherUserId ? $currentUserRole : $request->other_user_role,
            ]);
        }

        $messages = Message::where('chat_id', (string) $chat->_id)
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) use ($userId) {
                $senderId = (string) $message->sender_id;
                return [
                    'id' => (string) $message->_id,
                    'sender' => $message->sender->name ?? 'Unknown',
                    'senderId' => $senderId,
                    'senderRole' => $message->sender->role ?? 'user',
                    'content' => $message->content,
                    'attachment' => $message->attachment ? Storage::url($message->attachment) : null,
                    'timestamp' => $message->created_at->toISOString(),
                    'isOwn' => $senderId === $userId,
                ];
            });

        return response()->json([
            'chat_id' => (string) $chat->_id,
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
        $userId = (string) Auth::id();
        $chatUserId1 = (string) $chat->user_id_1;
        $chatUserId2 = (string) $chat->user_id_2;

        // Verify user is part of this chat
        if ($chatUserId1 !== $userId && $chatUserId2 !== $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentPath = $file->store('chat-attachments', 'public');
        }

        $message = Message::create([
            'chat_id' => (string) $chatId,
            'sender_id' => $userId,
            'content' => $request->content ?? '',
            'attachment' => $attachmentPath,
        ]);

        // Update chat's last message timestamp
        $chat->update(['last_message_at' => now()]);

        // Broadcast the message (optional - for real-time updates)
        try {
            broadcast(new MessageSent($message, $chat));
        } catch (\Exception $e) {
            // Broadcasting is optional, don't fail if it doesn't work
        }

        return response()->json([
            'id' => (string) $message->_id,
            'sender' => Auth::user()->name,
            'senderRole' => Auth::user()->role ?? 'user',
            'senderId' => $userId,
            'content' => $message->content,
            'attachment' => $attachmentPath ? Storage::url($attachmentPath) : null,
            'timestamp' => $message->created_at->toISOString(),
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
        $userId = (string) Auth::id();
        $chatUserId1 = (string) $chat->user_id_1;
        $chatUserId2 = (string) $chat->user_id_2;

        if ($chatUserId1 !== $userId && $chatUserId2 !== $userId) {
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

    /**
     * Update a message
     */
    public function updateMessage(Request $request, $messageId)
    {
        try {
            \Log::info('Update message called', ['messageId' => $messageId, 'content' => $request->content]);
            
            $request->validate([
                'content' => 'required|string|max:5000',
            ]);

            $message = Message::where('_id', $messageId)->first();
            
            if (!$message) {
                \Log::error('Message not found', ['messageId' => $messageId]);
                return response()->json(['error' => 'Message not found'], 404);
            }
            
            $userId = (string) Auth::id();
            $senderId = (string) $message->sender_id;
            
            \Log::info('Comparing user IDs', ['userId' => $userId, 'senderId' => $senderId]);

            // Verify user owns this message
            if ($senderId !== $userId) {
                \Log::error('Unauthorized - not message owner', ['userId' => $userId, 'senderId' => $senderId]);
                return response()->json(['error' => 'Unauthorized - not your message'], 403);
            }

            $message->content = $request->content;
            $message->is_edited = true;
            $message->save();
            
            \Log::info('Message updated successfully', ['messageId' => $messageId]);

            return response()->json([
                'id' => (string) $message->_id,
                'content' => $message->content,
                'isEdited' => true,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating message', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a message
     */
    public function deleteMessage($messageId)
    {
        try {
            $message = Message::where('_id', $messageId)->firstOrFail();
            $userId = (string) Auth::id();

            // Verify user owns this message
            if ((string) $message->sender_id !== $userId) {
                return response()->json(['error' => 'Unauthorized - not your message'], 403);
            }

            // Delete attachment if exists
            if ($message->attachment) {
                Storage::disk('public')->delete($message->attachment);
            }

            $chatId = $message->chat_id;
            $message->delete();

            // Update chat's last message timestamp
            $lastMessage = Message::where('chat_id', $chatId)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($lastMessage) {
                Chat::where('_id', $chatId)->update(['last_message_at' => $lastMessage->created_at]);
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
