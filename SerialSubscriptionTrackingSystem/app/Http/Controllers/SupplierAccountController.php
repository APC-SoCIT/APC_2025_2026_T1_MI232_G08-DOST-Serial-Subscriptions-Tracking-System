<?php

namespace App\Http\Controllers;

use App\Models\SupplierAccount;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\AuditLogService;
use App\Services\ProcessMovementService;
use App\Mail\AccountCredentialsNotification;
use App\Mail\PendingSupplierApproval;
use App\Mail\SupplierApprovedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class SupplierAccountController extends Controller
{
    /**
     * Display listing of supplier accounts for TPU
     * Shows all accounts created by the current user (or all for admin)
     */
    public function index(Request $request)
    {
        $query = SupplierAccount::query();

        // Filter by status if provided
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%");
            });
        }

        $accounts = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'accounts' => $accounts,
            'success' => true,
        ]);
    }

    /**
     * Get pending accounts for admin approval
     */
    public function pending(Request $request)
    {
        $query = SupplierAccount::pending();

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $accounts = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'accounts' => $accounts,
            'success' => true,
        ]);
    }

    /**
     * Get approved accounts
     */
    public function approved(Request $request)
    {
        $query = SupplierAccount::approved();

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $accounts = $query->orderBy('approved_at', 'desc')->get();

        // Add user disabled status to each account
        $accountsWithStatus = $accounts->map(function ($account) {
            $user = null;
            if ($account->user_id) {
                $user = User::find($account->user_id);
            }
            $accountData = $account->toArray();
            $accountData['is_disabled'] = $user ? ($user->is_disabled ?? false) : false;
            return $accountData;
        });

        return response()->json([
            'accounts' => $accountsWithStatus,
            'success' => true,
        ]);
    }

    /**
     * Store a new supplier account (TPU creates)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'contact_person' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'address' => ['required', 'string', 'max:500'],
            'username' => ['required', 'string', 'min:4', 'max:50'],
            'password' => ['required', 'confirmed', 'min:8', 'regex:/^(?=.*[a-zA-Z])(?=.*[0-9])/'],
        ], [
            'password.regex' => 'Password must contain both letters and numbers',
        ]);

        // Check for duplicate company name manually (MongoDB compatible)
        $existingCompanyName = SupplierAccount::where('company_name', $validated['company_name'])->first();
        if ($existingCompanyName) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => ['company_name' => ['This supplier name already exists.']],
            ], 422);
        }

        // Check for duplicate email manually (MongoDB compatible)
        $existingEmail = SupplierAccount::where('email', $validated['email'])->first();
        if ($existingEmail) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => ['email' => ['This email is already registered.']],
            ], 422);
        }

        // Check for duplicate username manually (MongoDB compatible)
        $existingUsername = SupplierAccount::where('username', $validated['username'])->first();
        if ($existingUsername) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => ['username' => ['This username is already taken.']],
            ], 422);
        }

        try {
            $supplierAccount = SupplierAccount::create([
                'company_name' => $validated['company_name'],
                'contact_person' => $validated['contact_person'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'username' => $validated['username'],
                'password' => $validated['password'], // Stored as plain text, will be hashed when User is created
                'status' => 'pending',
                'created_by' => $request->user()?->id,
            ]);

            // Log the creation
            $creatorName = $request->user()?->name ?? 'System';
            $creatorRole = $request->user()?->role ?? 'unknown';
            AuditLogService::logCreate($supplierAccount, "Supplier account '{$supplierAccount->company_name}' created by {$creatorRole} user '{$creatorName}'");

            // Notify admin of pending supplier approval (in-app notification)
            try {
                UserNotification::createStatusNotification(
                    'admin',
                    'Supplier Account Pending Approval',
                    "A new supplier account '{$supplierAccount->company_name}' requires your approval.",
                    [
                        'supplier_account_id' => (string)($supplierAccount->_id ?? $supplierAccount->id),
                        'company_name' => $supplierAccount->company_name,
                        'contact_person' => $supplierAccount->contact_person,
                        'email' => $supplierAccount->email,
                        'status' => 'pending',
                    ],
                    'tpu'
                );
            } catch (\Exception $notifyError) {
                Log::error("Failed to send admin notification for pending supplier: " . $notifyError->getMessage());
            }

            // Send email notification to all admin users
            try {
                $adminUsers = User::where('role', 'regex', '/^admin$/i')->get();
                $createdAt = now()->format('F j, Y \a\t g:i A');
                
                foreach ($adminUsers as $admin) {
                    if ($admin->email) {
                        Mail::to($admin->email)->send(new PendingSupplierApproval(
                            $supplierAccount->company_name,
                            $supplierAccount->contact_person,
                            $supplierAccount->email,
                            $supplierAccount->phone,
                            $supplierAccount->address,
                            $createdAt
                        ));
                        Log::info("Pending supplier approval email sent to admin: {$admin->email}");
                    }
                }
            } catch (\Exception $emailError) {
                Log::error("Failed to send pending supplier email to admins: " . $emailError->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Supplier account created successfully. Awaiting admin approval.',
                'account' => $supplierAccount,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Failed to create supplier account: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create account: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Approve a supplier account (Admin only)
     */
    public function approve(Request $request, $id)
    {
        $supplierAccount = SupplierAccount::findOrFail($id);

        if ($supplierAccount->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This account has already been processed.',
            ], 400);
        }

        // Check if user with this email already exists
        $existingUser = User::where('email', $supplierAccount->email)->first();
        if ($existingUser) {
            return response()->json([
                'success' => false,
                'message' => 'A user with this email already exists.',
            ], 400);
        }

        // Get the raw password before creating user (for email)
        $rawPassword = $supplierAccount->getRawPassword();

        // Create actual user account for the supplier
        // Password will be hashed by User model's cast
        $user = User::create([
            'name' => $supplierAccount->company_name, // Use company name as display name
            'email' => $supplierAccount->email,
            'password' => $rawPassword, // Raw password, will be hashed by User model
            'role' => 'supplier',
            'email_verified_at' => now(), // Auto-verify since admin approved
            'is_disabled' => false, // Explicitly enable for notifications
        ]);

        // Link supplier account to user
        // Update supplier account status
        $supplierAccount->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
            'user_id' => $user->_id ?? $user->id,
        ]);

        // Send account credentials email to supplier
        try {
            $loginUrl = url('/login');
            
            Mail::to($supplierAccount->email)->send(new AccountCredentialsNotification(
                $supplierAccount->company_name,
                $supplierAccount->email,
                $rawPassword,
                'Supplier',
                $loginUrl
            ));
            
            Log::info("Account credentials email sent to supplier {$supplierAccount->email}");
        } catch (\Exception $emailError) {
            Log::error("Failed to send account credentials email to supplier {$supplierAccount->email}: " . $emailError->getMessage());
            // Don't fail the approval if email fails
        }

        // Send notification to TPU users about the approval
        try {
            $adminName = $request->user()?->name ?? 'Admin';
            $approvedAt = now()->format('F j, Y \a\t g:i A');
            
            // Get all TPU users
            $tpuUsers = User::where('role', 'regex', '/^tpu$/i')->get();
            
            foreach ($tpuUsers as $tpuUser) {
                Mail::to($tpuUser->email)->send(new SupplierApprovedNotification(
                    $supplierAccount->company_name,
                    $supplierAccount->contact_person,
                    $supplierAccount->email,
                    $adminName,
                    $approvedAt
                ));
            }
            
            // Also create in-app notification for TPU
            UserNotification::create([
                'type' => 'supplier_approved',
                'title' => 'Supplier Approved',
                'message' => "The supplier '{$supplierAccount->company_name}' has been approved by {$adminName}.",
                'user_role' => 'tpu',
                'reference_id' => $supplierAccount->_id ?? $supplierAccount->id,
                'reference_type' => 'supplier_account',
                'action_url' => '/dashboard-tpu',
                'is_read' => false,
            ]);
            
            Log::info("Sent supplier approval notification to " . $tpuUsers->count() . " TPU users");
        } catch (\Exception $notifyError) {
            Log::error("Failed to send supplier approval notification to TPU: " . $notifyError->getMessage());
            // Don't fail the approval if notification fails
        }

        // Log the approval
        AuditLogService::logApprove($supplierAccount, "Supplier account '{$supplierAccount->company_name}' approved");
        ProcessMovementService::logSupplierAccountApproval($supplierAccount);

        return response()->json([
            'success' => true,
            'message' => 'Supplier account approved successfully.',
            'account' => $supplierAccount,
        ]);
    }

    /**
     * Reject a supplier account (Admin only)
     */
    public function reject(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $supplierAccount = SupplierAccount::findOrFail($id);

        if ($supplierAccount->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This account has already been processed.',
            ], 400);
        }

        $supplierAccount->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'rejection_reason' => $validated['reason'] ?? null,
        ]);

        // Log the rejection
        AuditLogService::logReject($supplierAccount, $validated['reason'] ?? 'No reason provided');
        ProcessMovementService::logSupplierAccountRejection($supplierAccount, $validated['reason'] ?? null);

        return response()->json([
            'success' => true,
            'message' => 'Supplier account rejected.',
            'account' => $supplierAccount,
        ]);
    }

    /**
     * Get a single supplier account
     */
    public function show($id)
    {
        $account = SupplierAccount::findOrFail($id);

        return response()->json([
            'success' => true,
            'account' => $account,
        ]);
    }

    /**
     * Get statistics for dashboard
     */
    public function stats()
    {
        return response()->json([
            'success' => true,
            'stats' => [
                'total' => SupplierAccount::count(),
                'pending' => SupplierAccount::pending()->count(),
                'approved' => SupplierAccount::approved()->count(),
                'rejected' => SupplierAccount::rejected()->count(),
            ],
        ]);
    }

    /**
     * Resend credentials email to an existing supplier with a new temporary password
     * This is useful for suppliers who were approved before the email feature
     */
    public function resendCredentials($id)
    {
        try {
            $supplierAccount = SupplierAccount::find($id);
            
            if (!$supplierAccount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Supplier account not found',
                ], 404);
            }

            if ($supplierAccount->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Can only resend credentials for approved supplier accounts',
                ], 400);
            }

            // Find the associated user account
            $user = User::where('email', $supplierAccount->email)->first();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'No user account found for this supplier',
                ], 404);
            }

            // Generate a new temporary password (8 chars with letters and numbers)
            $tempPassword = Str::random(4) . rand(1000, 9999);

            // Update user's password
            $user->password = Hash::make($tempPassword);
            $user->save();

            // Send credentials email
            $loginUrl = url('/login');
            
            Mail::to($supplierAccount->email)->send(new AccountCredentialsNotification(
                $supplierAccount->company_name,
                $supplierAccount->email,
                $tempPassword,
                'Supplier',
                $loginUrl
            ));
            
            Log::info("Credentials resent to supplier {$supplierAccount->email} with new temporary password");

            return response()->json([
                'success' => true,
                'message' => 'New credentials email sent to supplier. They will need to use the new password.',
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to resend credentials to supplier {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send credentials: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send notifications for all existing pending supplier accounts
     * This is useful for testing or to catch up on notifications for existing data
     */
    public function notifyPendingSuppliers()
    {
        try {
            $pendingSuppliers = SupplierAccount::where('status', 'pending')->get();
            
            if ($pendingSuppliers->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No pending supplier accounts found.',
                    'count' => 0,
                ]);
            }

            $adminUsers = User::where('role', 'regex', '/^admin$/i')->get();
            $notificationCount = 0;
            $emailCount = 0;

            foreach ($pendingSuppliers as $supplier) {
                // Create in-app notification
                try {
                    UserNotification::createStatusNotification(
                        'admin',
                        'Supplier Account Pending Approval',
                        "A new supplier account '{$supplier->company_name}' requires your approval.",
                        [
                            'supplier_account_id' => (string)($supplier->_id ?? $supplier->id),
                            'company_name' => $supplier->company_name,
                            'contact_person' => $supplier->contact_person,
                            'email' => $supplier->email,
                            'status' => 'pending',
                        ],
                        'tpu'
                    );
                    $notificationCount++;
                } catch (\Exception $e) {
                    Log::error("Failed to create notification for supplier {$supplier->company_name}: " . $e->getMessage());
                }

                // Send email to all admins
                $createdAt = $supplier->created_at ? $supplier->created_at->format('F j, Y \a\t g:i A') : now()->format('F j, Y \a\t g:i A');
                
                foreach ($adminUsers as $admin) {
                    if ($admin->email) {
                        try {
                            Mail::to($admin->email)->send(new PendingSupplierApproval(
                                $supplier->company_name,
                                $supplier->contact_person ?? 'N/A',
                                $supplier->email ?? 'N/A',
                                $supplier->phone ?? 'N/A',
                                $supplier->address ?? 'N/A',
                                $createdAt
                            ));
                            $emailCount++;
                            Log::info("Pending supplier email sent to admin {$admin->email} for {$supplier->company_name}");
                        } catch (\Exception $e) {
                            Log::error("Failed to send email to {$admin->email}: " . $e->getMessage());
                        }
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Notifications sent for {$pendingSuppliers->count()} pending suppliers",
                'notifications_created' => $notificationCount,
                'emails_sent' => $emailCount,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to notify pending suppliers: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send notifications: ' . $e->getMessage(),
            ], 500);
        }
    }
}
