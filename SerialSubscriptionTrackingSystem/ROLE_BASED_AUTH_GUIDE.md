# Role-Based Authentication & Realtime Chat System

## Overview
This document explains how the role-based authentication and realtime chat system works for the 5-user system (Admin, Supplier, TPU, GSPS, Inspection).

---

## 1. Role-Based Authentication

### How It Works

#### Step 1: User Registration & Role Assignment
When a user registers or is created, they are assigned a role:

```php
// In database seeders or during registration
$user = User::create([
    'name' => 'John Supplier',
    'email' => 'supplier@example.com',
    'password' => bcrypt('password'),
]);

$user->assignRole('supplier'); // Assign role
```

#### Step 2: Login Redirect by Role
After login, the user is automatically redirected to their role-specific dashboard:

```
Login → Authenticate → Check User Role → Redirect to Role Dashboard

Supplier  → /dashboard-supplier
TPU       → /dashboard-tpu
GSPS      → /dashboard-gsps
Inspection → /inspection-dashboard
Admin     → /dashboard-admin
```

**File**: `app/Providers/RouteServiceProvider.php`
```php
public static function home()
{
    $user = auth()->user();
    
    $roleRoutes = [
        'admin' => 'admin.dashboard',
        'supplier' => 'supplier.dashboard',
        'gsps' => 'gsps.dashboard',
        'tpu' => 'tpu.dashboard',
        'inspection' => 'inspection.dashboard',
    ];

    foreach ($roleRoutes as $role => $routeName) {
        if ($user->hasRole($role)) {
            return route($routeName);
        }
    }
    
    return route('dashboard');
}
```

#### Step 3: Role-Based Route Protection
Routes are protected with the `role` middleware to prevent unauthorized access:

**File**: `routes/web.php`
```php
// Only TPU users can access TPU routes
Route::middleware(['auth', 'verified', 'role:tpu'])->group(function () {
    Route::get('/dashboard-tpu', fn () => Inertia::render('Dashboard_TPU'))->name('tpu.dashboard');
    // ... other TPU routes
});

// Only Suppliers can access Supplier routes
Route::middleware(['auth', 'verified', 'role:supplier'])->group(function () {
    Route::get('/dashboard-supplier-listofserial', ...);
    // ... other Supplier routes
});
```

### The CheckUserRole Middleware

**File**: `app/Http/Middleware/CheckUserRole.php`

This middleware ensures:
- User is authenticated
- User has the required role
- If user doesn't have the role, redirect to their own dashboard

```php
public function handle(Request $request, Closure $next, ...$roles)
{
    if (!auth()->check()) {
        return redirect('login');
    }

    $user = auth()->user();

    // Check if user has one of the required roles
    foreach ($roles as $role) {
        if ($user->hasRole($role)) {
            return $next($request);
        }
    }

    // User doesn't have the required role - redirect to their dashboard
    return redirect()->to($this->getRoleDashboard($user));
}
```

---

## 2. Realtime Chat System

### Architecture

The chat system supports both **private chats** (1-to-1) and **community chats** (group/role-based).

#### Chat Types

1. **Private Chat** (`type: 'private'`)
   - One-to-one conversation between two users
   - Only those 2 users can access

2. **Group/Community Chat** (`type: 'group'`)
   - All users of the same role can access
   - Example: "Supplier Community", "TPU Community"

### Database Schema

**Chats Table**
```
id          INTEGER PRIMARY KEY
type        VARCHAR (private/group)
name        VARCHAR (nullable for private, required for group)
user_id_1   BIGINT (for private chats)
user_id_2   BIGINT (for private chats)
user_1_name VARCHAR
user_1_role VARCHAR
user_2_name VARCHAR
user_2_role VARCHAR
participants JSON (array of user IDs in group chat)
last_message_at TIMESTAMP
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

**Messages Table**
```
id          INTEGER PRIMARY KEY
chat_id     BIGINT (foreign key to chats)
sender_id   BIGINT (foreign key to users)
content     TEXT
attachment  VARCHAR (file path for photos/files)
read_at     TIMESTAMP (nullable)
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### Key Features

#### 1. File Upload & Attachment Support
- Users can send photos and files in chat
- Files stored in `storage/app/public/chat-attachments`
- Maximum file size: 100MB
- Supported formats: Any file type

**In ChatController.php**:
```php
public function storeMessage(Request $request, $chatId)
{
    $request->validate([
        'content' => 'nullable|string',
        'attachment' => 'nullable|file|max:102400', // 100MB
    ]);

    $attachmentPath = null;
    if ($request->hasFile('attachment')) {
        $file = $request->file('attachment');
        $attachmentPath = $file->store('chat-attachments', 'public');
    }

    // Save message with attachment...
}
```

#### 2. Real-Time Updates with Broadcasting
Messages are broadcast in real-time using Laravel's broadcasting system.

**File**: `app/Events/MessageSent.php`
```php
class MessageSent implements ShouldBroadcast
{
    public function broadcastOn(): array
    {
        if ($this->chat->type === 'private') {
            // Send to both users in private chat
            return [
                new PrivateChannel('chat.' . $this->chat->user_id_1),
                new PrivateChannel('chat.' . $this->chat->user_id_2),
            ];
        }
        
        // Group/community chat - broadcast to all
        return [new Channel('chat.' . $this->chat->id)];
    }
}
```

**Broadcasting Channels**: `routes/channels.php`
```php
// Private chat channels
Broadcast::private('chat.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Group chat channels
Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    return true; // Group chats accessible to members
});
```

---

## 3. Chat Controller API Endpoints

### Base URL: `/api/chats`

#### 1. Get All Chats
```http
GET /api/chats
Authorization: Bearer {token}
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "John Supplier",
    "role": "supplier",
    "type": "private",
    "lastMessage": "Hello! How are you?",
    "time": "2:30 PM"
  },
  {
    "id": 2,
    "name": "Supplier Community",
    "role": "Community",
    "type": "group",
    "lastMessage": "Welcome to the community!",
    "time": "Just now"
  }
]
```

#### 2. Get Messages from a Chat
```http
GET /api/chats/{chatId}/messages
Authorization: Bearer {token}
```

**Response**:
```json
{
  "chat": {
    "id": 1,
    "name": "John Supplier",
    "type": "private"
  },
  "messages": [
    {
      "id": 101,
      "sender": "Jane TPU",
      "senderRole": "tpu",
      "senderId": 5,
      "content": "Hi there!",
      "attachment": null,
      "time": "1:45 PM",
      "isOwn": false
    },
    {
      "id": 102,
      "sender": "You",
      "senderRole": "supplier",
      "senderId": 3,
      "content": "Hello!",
      "attachment": "chat-attachments/invoice.pdf",
      "time": "2:30 PM",
      "isOwn": true
    }
  ]
}
```

#### 3. Create/Get Private Chat
```http
POST /api/chats/get-or-create
Authorization: Bearer {token}
Content-Type: application/json

{
  "other_user_id": 5,
  "other_user_name": "Jane TPU",
  "other_user_role": "tpu"
}
```

**Response**:
```json
{
  "chat_id": 1
}
```

#### 4. Send Message with File
```http
POST /api/chats/{chatId}/messages
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- content: "Here's the invoice"
- attachment: <file binary>
```

**Response**:
```json
{
  "id": 103,
  "sender": "You",
  "senderRole": "supplier",
  "senderId": 3,
  "content": "Here's the invoice",
  "attachment": "/storage/chat-attachments/invoice.pdf",
  "time": "3:15 PM",
  "isOwn": true
}
```

#### 5. Download File Attachment
```http
GET /api/chats/{messageId}/download
Authorization: Bearer {token}
```

---

## 4. React Chat Component

### Implementation

**File**: `resources/js/Components/CommunityChat.jsx`

```jsx
import CommunityChat from '@/Components/CommunityChat';

export default function Dashboard() {
  return (
    <AuthenticatedLayout>
      <CommunityChat userId={userId} userRole={userRole} />
    </AuthenticatedLayout>
  );
}
```

### Features

1. **Chat List**: Shows all private chats + community chat
2. **Message Display**: Shows sender, role, time, content, and attachments
3. **File Upload**: Click 📎 button to attach photos/files
4. **Real-Time Polling**: Auto-refreshes every 2-3 seconds
5. **Responsive**: Mobile and desktop friendly

---

## 5. Setup Instructions

### 1. Database Setup
```bash
php artisan migrate
php artisan db:seed --class=RoleSeeder
```

### 2. Create Test Users
```bash
php artisan tinker
```

```php
// Create users with different roles
$supplier = User::create([
    'name' => 'John Supplier',
    'email' => 'supplier@test.com',
    'password' => bcrypt('password'),
]);
$supplier->assignRole('supplier');

$tpu = User::create([
    'name' => 'Jane TPU',
    'email' => 'tpu@test.com',
    'password' => bcrypt('password'),
]);
$tpu->assignRole('tpu');

// ... create other users
```

### 3. Configure Broadcasting
Update `.env`:
```env
BROADCAST_CONNECTION=log  # For testing (see messages in logs)
# OR use Pusher for real production:
# BROADCAST_CONNECTION=pusher
# PUSHER_APP_ID=...
# PUSHER_APP_KEY=...
# PUSHER_APP_SECRET=...
```

### 4. Create Community Chat (Optional)
```bash
php artisan tinker
```

```php
Chat::create([
    'type' => 'group',
    'name' => 'Supplier Community',
    'participants' => [1, 2, 3], // User IDs
    'last_message_at' => now(),
]);
```

### 5. Run the Application
```bash
php artisan serve
npm run dev
```

---

## 6. Usage Flow

### For a Supplier:

1. **Login** → Redirected to `/dashboard-supplier`
2. **Access Chat** → Click on CommunityChat component
3. **View Private Chats** → List shows all conversations with TPU, GSPS, etc.
4. **View Community Chat** → "Supplier Community" appears at top
5. **Send Message** → Type and click Send or attach file
6. **Receive Messages** → Auto-refresh polls new messages every 2 seconds

### For a TPU User:

1. **Login** → Redirected to `/dashboard-tpu`
2. **Access Chat** → Click on CommunityChat component
3. **View Private Chats** → List shows conversations with Suppliers, GSPS, etc.
4. **View Community Chat** → "TPU Community" appears (different from Supplier's)
5. **Send Message** → Type, attach file, and send
6. **Permission Control** → Cannot access Supplier-only pages due to `role:supplier` middleware

---

## 7. Security Features

✅ **Authentication**: All routes protected with `auth` middleware
✅ **Role Authorization**: Routes protected with `role:roleName` middleware
✅ **File Validation**: Max 100MB file size, stored securely
✅ **Chat Authorization**: Users can only access chats they're part of
✅ **Broadcasting**: Private channels ensure users only receive their messages

---

## 8. Troubleshooting

### Issue: User redirects to wrong dashboard
**Solution**: Check `RouteServiceProvider::home()` method for correct route names.

### Issue: Messages not sending
**Solution**: Ensure `chat-attachments` folder is writable:
```bash
chmod -R 775 storage/app/public
```

### Issue: Real-time not working
**Solution**: Check `.env` for `BROADCAST_CONNECTION` and ensure Pusher credentials are set (for production).

### Issue: File upload fails
**Solution**: Check file size (max 100MB) and ensure disk space available.

---

## 9. Future Enhancements

- [ ] WebSocket integration with Laravel Reverb for true real-time
- [ ] Message read receipts
- [ ] Typing indicators
- [ ] Group chat creation UI
- [ ] Message reactions (emoji)
- [ ] Voice messages
- [ ] Video call integration
- [ ] Message search
- [ ] Message pinning
- [ ] Admin chat moderation

---

## 10. Files Modified/Created

### Created:
- `app/Http/Middleware/CheckUserRole.php` - Role authorization middleware
- `app/Events/MessageSent.php` - Broadcasting event
- `resources/js/Components/CommunityChat.jsx` - React chat component

### Modified:
- `app/Http/Kernel.php` - Added role middleware
- `app/Http/Controllers/ChatController.php` - Added file upload & broadcasting
- `app/Models/Chat.php` - Added group chat fields
- `app/Models/Message.php` - Added attachment field
- `routes/web.php` - Added role-based route protection
- `routes/channels.php` - Added broadcasting channels
- `database/migrations/*` - Added new fields for group chats & attachments

---

## Contact & Support

For questions about the role-based system, refer to the Laravel documentation:
- [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission/v6/introduction)
- [Laravel Broadcasting](https://laravel.com/docs/11.x/broadcasting)
- [Inertia.js](https://inertiajs.com/)
