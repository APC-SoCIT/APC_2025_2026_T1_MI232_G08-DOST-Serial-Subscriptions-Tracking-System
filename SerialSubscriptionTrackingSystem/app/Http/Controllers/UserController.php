<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\SupplierAccount;
use App\Models\Subscription;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class UserController extends Controller
{
    /**
     * Get user statistics (total, approved/verified, pending/unverified)
     */
    public function stats()
    {
        try {
            // Include all users in statistics (including admin)
            $totalUsers = User::count();
            $approvedUsers = User::whereNotNull('email_verified_at')->count();
            $pendingUsers = User::whereNull('email_verified_at')->count();

            return response()->json([
                'success' => true,
                'stats' => [
                    'total' => $totalUsers,
                    'approved' => $approvedUsers,
                    'pending' => $pendingUsers,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user statistics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all users (API endpoint) - includes all users
     */
    public function index()
    {
        try {
            // Include all users (including admin)
            $users = User::all();
            
            // Fix existing supplier users that don't have email_verified_at set
            // This is a data migration fix for suppliers approved before the bug fix
            foreach ($users as $user) {
                if ($user->role === 'supplier' && !$user->email_verified_at) {
                    // Check if this supplier account is approved
                    $supplierAccount = SupplierAccount::where('email', $user->email)
                        ->where('status', 'approved')
                        ->first();
                    
                    if ($supplierAccount) {
                        // Mark user as verified since they were approved by admin
                        $user->email_verified_at = $supplierAccount->approved_at ?? now();
                        $user->save();
                    }
                }
            }
            
            // Refresh the users collection after updates
            $users = User::all();
            
            return response()->json([
                'success' => true,
                'users' => $users->map(function ($user) {
                    return [
                        'id' => $user->_id ?? $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role ?? 'N/A',
                        'created_at' => $user->created_at,
                        'email_verified_at' => $user->email_verified_at,
                        'is_disabled' => $user->is_disabled ?? false,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a user
     */
    public function destroy($id)
    {
        try {
            $user = User::find($id);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            if (($user->role ?? null) === 'supplier') {
                $userId = $user->_id ?? $user->id;
                $userEmail = $user->email;
                $userName = $user->name;
                
                // Delete all subscriptions/serials assigned to this supplier
                Subscription::where('supplier_id', $userId)
                    ->orWhere('supplier_name', $userName)
                    ->delete();
                
                // Delete supplier account
                SupplierAccount::where('user_id', $userId)
                    ->orWhere('email', $userEmail)
                    ->delete();
            }

            $user->delete();

            // Log user deletion
            AuditLogService::log(
                'delete',
                User::class,
                $userId ?? null,
                "User '{$userName}' deleted by admin"
            );

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update user role
     */
    public function updateRole(Request $request, $id)
    {
        try {
            $request->validate([
                'role' => 'required|string',
            ]);

            $user = User::find($id);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            $user->role = $request->role;
            $user->save();

            // Log role update
            AuditLogService::log(
                'update',
                User::class,
                $user->_id ?? $user->id,
                "User '{$user->name}' role changed to '{$request->role}'",
                ['role' => $user->getOriginal('role')],
                ['role' => $request->role]
            );

            return response()->json([
                'success' => true,
                'message' => 'User role updated successfully',
                'user' => $user,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user role: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Toggle user disabled status
     */
    public function toggleDisable($id)
    {
        try {
            // Prevent admin from disabling their own account
            $currentUser = auth()->user();
            $currentUserId = $currentUser->_id ?? $currentUser->id;
            
            if ($currentUserId == $id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot disable your own account',
                ], 403);
            }
            
            $user = User::find($id);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            $user->is_disabled = !($user->is_disabled ?? false);
            $user->save();

            // Log enable/disable action
            $action = $user->is_disabled ? 'disabled' : 'enabled';
            AuditLogService::log(
                'update',
                User::class,
                $user->_id ?? $user->id,
                "User '{$user->name}' {$action} by admin",
                ['is_disabled' => !$user->is_disabled],
                ['is_disabled' => $user->is_disabled]
            );

            return response()->json([
                'success' => true,
                'message' => $user->is_disabled ? 'User disabled successfully' : 'User enabled successfully',
                'is_disabled' => $user->is_disabled,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle user status: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function create()
    {
        return Inertia::render('Admin/AddUser');
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users',
                'role' => 'required|string|in:tpu,gsps,inspection,admin',
                'password' => 'required|confirmed|min:8|regex:/^(?=.*[a-zA-Z])(?=.*[0-9])/',
            ], [
                'password.regex' => 'Password must contain both letters and numbers',
            ]);

            // Store the plain password before hashing for email
            $plainPassword = $request->password;

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'role' => strtolower($request->role),
                'password' => Hash::make($request->password),
                'email_verified_at' => now(), // Auto-verify admin-created accounts
                'is_disabled' => false, // Explicitly enable new accounts for notifications
            ]);

            // Send welcome email with credentials to the new user
            try {
                $roleDisplay = match(strtolower($user->role)) {
                    'tpu' => 'TPU Officer',
                    'gsps' => 'GSPS Officer',
                    'inspection' => 'Inspection Officer',
                    'admin' => 'Administrator',
                    default => ucfirst($user->role),
                };

                Mail::to($user->email)->send(new \App\Mail\AccountCredentialsNotification(
                    $user->name,
                    $user->email,
                    $plainPassword,
                    $roleDisplay,
                    url('/login')
                ));

                Log::info("Account credentials email sent to new user {$user->email} with role {$user->role}");
            } catch (\Exception $emailError) {
                Log::error("Failed to send account credentials email to {$user->email}: " . $emailError->getMessage());
                // Don't fail the account creation if email fails
            }

            // Log user creation
            AuditLogService::logCreate($user, "User '{$user->name}' created by admin with role '{$user->role}'");

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'user' => $user,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Resend credentials email to an existing user with a new temporary password
     * This is useful for existing users who were created before the email feature
     */
    public function resendCredentials($id)
    {
        try {
            $user = User::find($id);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            // Generate a new temporary password (8 chars with letters and numbers)
            $tempPassword = Str::random(4) . rand(1000, 9999);

            // Update user's password
            $user->password = Hash::make($tempPassword);
            $user->save();

            // Send credentials email
            $loginUrl = url('/login');
            $roleDisplay = strtoupper($user->role ?? 'User');
            
            Mail::to($user->email)->send(new AccountCredentialsNotification(
                $user->name,
                $user->email,
                $tempPassword,
                $roleDisplay,
                $loginUrl
            ));
            
            Log::info("Credentials resent to {$user->email} with new temporary password");

            return response()->json([
                'success' => true,
                'message' => 'New credentials email sent successfully. User will need to use the new password.',
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to resend credentials to user {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send credentials: ' . $e->getMessage(),
            ], 500);
        }
    }
}
