<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\SupplierAccount;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Get user statistics (total, approved/verified, pending/unverified)
     */
    public function stats()
    {
        try {
            // Exclude admin users from statistics
            $totalUsers = User::where('role', '!=', 'admin')->count();
            $approvedUsers = User::where('role', '!=', 'admin')
                ->whereNotNull('email_verified_at')
                ->count();
            $pendingUsers = User::where('role', '!=', 'admin')
                ->whereNull('email_verified_at')
                ->count();

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
     * Get all users (API endpoint) - excludes admin users
     */
    public function index()
    {
        try {
            // Exclude admin users from the list
            $users = User::where('role', '!=', 'admin')->get();
            
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
            $users = User::where('role', '!=', 'admin')->get();
            
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
            $user = User::find($id);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            $user->is_disabled = !($user->is_disabled ?? false);
            $user->save();

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
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'role' => 'required|string',
            'password' => 'required|confirmed|min:6',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'password' => Hash::make($request->password),
        ]);

        return redirect('/dashboard')
            ->with('success', 'User created successfully');
    }
}
