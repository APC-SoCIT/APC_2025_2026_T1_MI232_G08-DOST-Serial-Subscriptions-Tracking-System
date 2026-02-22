# System Enhancement Features

This document describes the four major features added to the Serial Subscription Tracking System.

## 1. Token Expiration Handling

### Overview
Automatically detects session expiration and handles it gracefully with user notifications.

### Backend Components
- **Middleware**: `app/Http/Middleware/CheckSessionExpiration.php`
  - Checks session validity for API requests
  - Returns `session_expired: true` flag on 401 responses

- **HandleInertiaRequests Update**: `app/Http/Middleware/HandleInertiaRequests.php`
  - Shares session expiration timestamp with frontend
  - Updates `_last_activity` session variable

- **Session Check Route**: `GET /api/session/check`
  - Verifies user is authenticated
  - Extends session lifetime when accessed

### Frontend Components
- **SessionManager**: `resources/js/Components/SessionManager.jsx`
  - `SessionExpiredModal` - Displays when session has expired
  - `SessionWarningModal` - Shows countdown before expiration
  - `useSessionManager` hook - Manages session state and timers

- **Bootstrap Update**: `resources/js/bootstrap.js`
  - Axios interceptor for 401 responses
  - Custom event dispatch for session expiration

### How It Works
1. Session expiration timestamp is passed to frontend via Inertia
2. Frontend monitors time remaining
3. Warning modal appears 5 minutes before expiration
4. User can extend session or logout
5. When expired, redirect to login page

---

## 2. Automated Supplier Delivery Notifications

### Overview
Automatically notifies suppliers about upcoming deliveries starting 3 days before the scheduled date.

### Backend Components
- **Model**: `app/Models/DeliveryNotification.php`
  - Stores notification records
  - Tracks read status and email sent status

- **Service**: `app/Services/DeliveryNotificationService.php`
  - `generateDeliveryNotifications()` - Creates notifications for upcoming deliveries
  - `getUpcomingDeliveries()` - Returns deliveries within specified days
  - `markAsRead()` / `markAllAsReadForSupplier()` - Mark notifications as read

- **Command**: `app/Console/Commands/SendDeliveryNotifications.php`
  - Artisan command: `php artisan notifications:send-delivery-reminders`
  - Generates notifications automatically

### Scheduled Task
```php
// Located in routes/console.php
Schedule::command('notifications:send-delivery-reminders')
    ->dailyAt('08:00')
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground();
```

### API Endpoints
- `GET /api/notifications/upcoming-deliveries` - Get upcoming delivery list
- `POST /api/notifications/mark-read` - Mark single notification as read
- `POST /api/notifications/mark-all-read` - Mark all notifications as read

### Notification Types
- `initial_reminder` - Sent 3 days before delivery
- `daily_reminder` - Sent daily from 2 days until delivery date

---

## 3. Process Movement Logs (Tracking Workflow)

### Overview
Tracks how records move from one user/role to another in the workflow.

### Backend Components
- **Model**: `app/Models/ProcessMovementLog.php`
  - Fields: `record_type`, `record_id`, `record_title`, `from_user_id`, `from_user_name`, `from_role`, `to_user_id`, `to_user_name`, `to_role`, `status_from`, `status_to`, `action`, `remarks`, `metadata`
  - Scopes for filtering by record, user, role

- **Service**: `app/Services/ProcessMovementService.php`
  - `logMovement()` - Generic movement logging
  - `logSerialStatusChange()` - Log serial status changes
  - `logSubscriptionCreated()` - Log new subscriptions
  - `logSupplierAccountApproval()` / `logSupplierAccountRejection()` - Log account actions
  - `logSerialInspection()` - Log inspection results
  - `getWorkflowHistory()` - Get complete history for a record

### Workflow Tracking Examples
```
Supplier → TPU → GSPS → Inspection Team → Admin

Example flow for a serial:
1. Subscription created (TPU) → status: created
2. Serial prepared (Supplier) → status: prepare
3. Serial marked for delivery (Supplier) → status: for_delivery
4. Serial received (GSPS) → status: received
5. Serial inspected (Inspection) → status: inspected
```

### API Endpoints
- `GET /api/logs/movements` - Get all process movement logs
- `GET /api/logs/movements/stats` - Get movement statistics
- `GET /api/logs/workflow-history` - Get workflow for specific record

---

## 4. Action Logging (Audit Trail)

### Overview
Records every important action performed in the system for accountability and compliance.

### Backend Components
- **Model**: `app/Models/AuditLog.php`
  - Fields: `user_id`, `user_name`, `user_email`, `role`, `action`, `model_type`, `model_id`, `description`, `old_values`, `new_values`, `ip_address`, `user_agent`, `url`, `method`
  - Scopes for filtering by action, user, model, date range

- **Service**: `app/Services/AuditLogService.php`
  - `log()` - Generic action logging
  - `logCreate()` / `logUpdate()` / `logDelete()` - CRUD operations
  - `logApprove()` / `logReject()` - Approval workflow
  - `logLogin()` / `logLogout()` - Authentication events
  - `getLogsForModel()` / `getLogsForUser()` - Query methods

### Logged Actions
| Action | Description |
|--------|-------------|
| `create` | New record created |
| `update` | Record modified |
| `delete` | Record removed |
| `approve` | Record approved |
| `reject` | Record rejected |
| `login` | User logged in |
| `logout` | User logged out |

### Integration Points
- `AuthenticatedSessionController` - Login/logout logging
- `SubscriptionController` - Create/update/delete subscriptions, inspections
- `SupplierAccountController` - Create/approve/reject supplier accounts

### API Endpoints (Admin Only)
- `GET /api/logs/audit` - Get audit logs with filtering
- `GET /api/logs/audit/stats` - Get audit statistics
- `GET /api/logs/audit/{id}` - Get specific audit log entry

---

## Log Cleanup

### Command
```bash
php artisan logs:cleanup --days=90
```

### Scheduled Cleanup
```php
// Runs weekly on Sunday at 3:00 AM
Schedule::command('logs:cleanup --days=90')
    ->weeklyOn(0, '03:00')
    ->withoutOverlapping()
    ->onOneServer();
```

---

## Setup Instructions

### 1. Run the Scheduler
For the automated notifications to work in production, add this to your server's crontab:
```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

### 2. Test Commands Manually
```bash
# Test delivery notifications
php artisan notifications:send-delivery-reminders

# Test log cleanup
php artisan logs:cleanup --days=90
```

### 3. Session Configuration
Adjust session lifetime in `.env`:
```env
SESSION_LIFETIME=120  # minutes
```

---

## Collections Created in MongoDB

The following new collections will be auto-created:
- `audit_logs` - Stores all audit trail entries
- `process_movement_logs` - Stores workflow tracking entries
- `delivery_notifications` - Stores supplier delivery reminders
