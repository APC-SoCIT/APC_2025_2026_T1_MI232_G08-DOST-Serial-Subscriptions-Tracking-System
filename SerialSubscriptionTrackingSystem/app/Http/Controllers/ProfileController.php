<?php
 
namespace App\Http\Controllers;
 
use App\Http\Requests\ProfileUpdateRequest;
use App\Models\SupplierAccount;
use App\Services\AuditLogService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
 
class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('ProfilePage', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }
 
    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $oldValues = $user->only(['name', 'email']);
        $nameChanged = $request->validated('name') !== $oldValues['name'];
        $emailChanged = $request->validated('email') !== $oldValues['email'];
 
        $user->fill($request->validated());
 
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }
 
        $user->save();
 
        // Keep the linked SupplierAccount record's name/email in sync.
        // SupplierAccount stores its own separate copy of company_name and
        // email (only ever set once, at account approval), so without this
        // a supplier's profile changes would silently stop showing up in
        // List of Suppliers, GSPS Supplier Info, and TPU Active Suppliers.
        if ($user->role === 'supplier' && ($nameChanged || $emailChanged)) {
            $userId = (string) ($user->_id ?? $user->id);
            $supplierAccount = SupplierAccount::where('user_id', $userId)->first();
            if ($supplierAccount) {
                if ($nameChanged) {
                    $supplierAccount->company_name = $user->name;
                }
                if ($emailChanged) {
                    $supplierAccount->email = $user->email;
                }
                $supplierAccount->save();
            }
        }
 
        // Log profile update
        AuditLogService::logUpdate($user, $oldValues, "User '{$user->name}' updated their profile");
 
        return Redirect::route('profile.edit');
    }
 
}