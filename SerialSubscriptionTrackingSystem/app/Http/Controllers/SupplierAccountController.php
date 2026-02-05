<?php

namespace App\Http\Controllers;

use App\Models\SupplierAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        return response()->json([
            'accounts' => $accounts,
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
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
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

        // Create actual user account for the supplier
        // Password will be hashed by User model's cast
        $user = User::create([
            'name' => $supplierAccount->company_name, // Use company name as display name
            'email' => $supplierAccount->email,
            'password' => $supplierAccount->getRawPassword(), // Raw password, will be hashed by User model
            'role' => 'supplier',
        ]);

        // Link supplier account to user
        // Update supplier account status
        $supplierAccount->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
            'user_id' => $user->_id ?? $user->id,
        ]);

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
}
