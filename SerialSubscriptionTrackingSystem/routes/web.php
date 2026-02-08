<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\SupplierAccountController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


// Public welcome page
Route::get('/', function () {
    return redirect()->route('login');
});

//Default dashboard (fallback) - redirects to role-specific dashboard
Route::get('/dashboard', function () {
    $user = auth()->user();
    if (!$user) {
        return redirect()->route('login');
    }
    
    $roleRoutes = [
        'admin' => '/dashboard-admin',
        'supplier' => '/dashboard-supplier',
        'gsps' => '/dashboard-gsps',
        'tpu' => '/dashboard-tpu',
        'inspection' => '/inspection-dashboard',
    ];
    
    $role = $user->role ?? null;
    if ($role && isset($roleRoutes[$role])) {
        return redirect($roleRoutes[$role]);
    }
    
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// ===================== ADMIN ROUTES =====================
Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/dashboard-admin', function () {
        return Inertia::render('Dashboard_Admin');
    })->name('admin.dashboard');
    
    Route::get('/account-approval', function () {
        return Inertia::render('AccountApproval');
    })->name('admin.account-approval');
    
    Route::get('/list-of-supplier', function () {
        return Inertia::render('ListofSupplier');
    })->name('admin.suppliers');
    
    Route::get('/list-of-user', function () {
        return Inertia::render('ListofUser');
    })->name('admin.users');
});

// ===================== TPU ROUTES =====================
Route::middleware(['auth', 'verified', 'role:tpu'])->group(function () {
    Route::get('/dashboard-tpu', function () {
        return Inertia::render('Dashboard_TPU');
    })->name('tpu.dashboard');
    
    Route::get('/dashboard-tpu-chat', function () {
        return Inertia::render('Dashboard_TPU_Chat');
    })->name('tpu.chat');
    
    Route::get('/dashboard-tpu-supplierinfo', function () {
        $approvedSuppliers = \App\Models\SupplierAccount::approved()->get();
        return Inertia::render('Dashboard_TPU_Supplierinfo', [
            'approvedSuppliers' => $approvedSuppliers,
        ]);
    })->name('tpu.supplierinfo');
    
    Route::get('/dashboard-tpu-subscriptiontracking', function () {
        $approvedSuppliers = \App\Models\SupplierAccount::approved()->get();
        return Inertia::render('Dashboard_TPU_Subscriptiontracking', [
            'approvedSuppliers' => $approvedSuppliers,
        ]);
    })->name('tpu.subscriptiontracking');
    
    Route::get('/dashboard-tpu-monitordelivery', function () {
        return Inertia::render('Dashboard_TPU_Monitordelivery');
    })->name('tpu.monitordelivery');
    
    Route::get('/dashboard-tpu-addserial', function () {
        return Inertia::render('Dashboard_TPU_AddSerial');
    })->name('tpu.addserial');
    
    Route::get('/dashboard-tpu-addaccount', function () {
        return Inertia::render('Dashboard_TPU_Addaccount');
    })->name('tpu.addaccount');
});

// ===================== GSPS ROUTES =====================
Route::middleware(['auth', 'verified', 'role:gsps'])->group(function () {
    Route::get('/dashboard-gsps', function () {
        return Inertia::render('Dashboard_GSPS');
    })->name('gsps.dashboard');
    
    Route::get('/dashboard-gsps-supplierinfo', function () {
        return Inertia::render('Dashboard_GSPS_Supplierinfo');
    })->name('gsps.supplierinfo');
    
    Route::get('/dashboard-gsps-deliverystatus', function () {
        return Inertia::render('Dashboard_GSPS_Deliverystatus');
    })->name('gsps.deliverystatus');
    
    Route::get('/dashboard-gsps-inspectionstatus', function () {
        return Inertia::render('Dashboard_GSPS_Inspectionstatus');
    })->name('gsps.inspectionstatus');
    
    Route::get('/dashboard-gsps-chat', function () {
        return Inertia::render('Dashboard_GSPS_Chat');
    })->name('gsps.chat');
});

// ===================== SUPPLIER ROUTES =====================
Route::middleware(['auth', 'verified', 'role:supplier'])->group(function () {
    Route::get('/dashboard-supplier', function () {
        return Inertia::render('Dashboard_Supplier');
    })->name('supplier.dashboard');
    
    Route::get('/dashboard-supplier-listofserial', function () {
        return Inertia::render('Dashboard_Supplier_ListofSerial');
    })->name('supplier.listofserial');
    
    Route::get('/dashboard-supplier-late', function () {
        return Inertia::render('Dashboard_Supplier_Late');
    })->name('supplier.late');
    
    Route::get('/dashboard-supplier-undelivered', function () {
        return Inertia::render('Dashboard_Supplier_Undelivered');
    })->name('supplier.undelivered');
    
    Route::get('/dashboard-supplier-delivered', function () {
        return Inertia::render('Dashboard_Supplier_Delivered');
    })->name('supplier.delivered');
    
    Route::get('/dashboard-supplier-chat', function () {
        return Inertia::render('Dashboard_Supplier_Chat');
    })->name('supplier.chat');
});

// ===================== INSPECTION ROUTES =====================
Route::middleware(['auth', 'verified', 'role:inspection'])->group(function () {
    Route::get('/inspection-dashboard', fn () => Inertia::render('Dashboard_Inspection'))->name('inspection.dashboard');
    Route::get('/inspection-date', fn () => Inertia::render('View_by_date'))->name('inspection.date');
    Route::get('/inspection-serials', fn () => Inertia::render('ListofSerials'))->name('inspection.serials');
    Route::get('/inspection-chat', fn () => Inertia::render('Dashboard_Inspection_Chat'))->name('inspection.chat');
});

// ===================== AUTHENTICATED ROUTES (ALL ROLES) =====================
Route::middleware(['auth'])->group(function () {
    // Profile routes - available to all authenticated users
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Chat routes - available to all authenticated users
    Route::get('/api/chats', [ChatController::class, 'index'])->name('chats.index');
    Route::get('/api/users/available', [ChatController::class, 'getAvailableUsers'])->name('users.available');
    Route::get('/api/chats/{chat}/messages', [ChatController::class, 'getMessages'])->name('chats.messages');
    Route::post('/api/chats/get-or-create', [ChatController::class, 'getOrCreateChat'])->name('chats.getOrCreate');
    Route::post('/api/chats/{chat}/messages', [ChatController::class, 'storeMessage'])->name('messages.store');
    Route::get('/api/chats/{message}/download', [ChatController::class, 'downloadAttachment'])->name('file.download');
    Route::put('/api/messages/{messageId}', [ChatController::class, 'updateMessage'])->name('messages.update');
    Route::delete('/api/messages/{messageId}', [ChatController::class, 'deleteMessage'])->name('messages.delete');
});

// ===================== ADMIN-ONLY API ROUTES =====================
Route::middleware(['auth', 'role:admin'])->group(function () {
    // User Management API Routes - Admin only
    Route::prefix('api/users')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('users.index');
        Route::get('/stats', [UserController::class, 'stats'])->name('users.stats');
        Route::delete('/{id}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::put('/{id}/role', [UserController::class, 'updateRole'])->name('users.updateRole');
        Route::put('/{id}/toggle-disable', [UserController::class, 'toggleDisable'])->name('users.toggleDisable');
    });

    // Supplier Account Approval - Admin only
    Route::post('/api/supplier-accounts/{id}/approve', [SupplierAccountController::class, 'approve'])->name('supplier-accounts.approve');
    Route::post('/api/supplier-accounts/{id}/reject', [SupplierAccountController::class, 'reject'])->name('supplier-accounts.reject');
});

// ===================== ADMIN + TPU API ROUTES =====================
Route::middleware(['auth', 'role:admin,tpu'])->group(function () {
    // Supplier Account Management - Admin and TPU can view
    Route::prefix('api/supplier-accounts')->group(function () {
        Route::get('/', [SupplierAccountController::class, 'index'])->name('supplier-accounts.index');
        Route::get('/pending', [SupplierAccountController::class, 'pending'])->name('supplier-accounts.pending');
        Route::get('/approved', [SupplierAccountController::class, 'approved'])->name('supplier-accounts.approved');
        Route::get('/stats', [SupplierAccountController::class, 'stats'])->name('supplier-accounts.stats');
        Route::get('/{id}', [SupplierAccountController::class, 'show'])->name('supplier-accounts.show');
    });
    
    // Supplier account creation - TPU can create new supplier accounts
    Route::post('/api/supplier-accounts', [SupplierAccountController::class, 'store'])->name('supplier-accounts.store');
});

// ===================== TPU + GSPS + INSPECTION API ROUTES =====================
Route::middleware(['auth', 'role:admin,tpu,gsps,inspection'])->group(function () {
    // Subscription viewing - multiple roles can view
    Route::prefix('api/subscriptions')->group(function () {
        Route::get('/', [SubscriptionController::class, 'index'])->name('subscriptions.index');
        Route::get('/stats', [SubscriptionController::class, 'stats'])->name('subscriptions.stats');
        Route::get('/supplier-serials', [SubscriptionController::class, 'getSupplierSerials'])->name('subscriptions.supplierSerials');
        Route::get('/delivery-serials', [SubscriptionController::class, 'getDeliverySerials'])->name('subscriptions.deliverySerials');
        Route::get('/{id}', [SubscriptionController::class, 'show'])->name('subscriptions.show');
    });
});

// ===================== TPU-ONLY API ROUTES =====================
Route::middleware(['auth', 'role:tpu'])->group(function () {
    // Subscription management - TPU only can create/edit/delete
    Route::prefix('api/subscriptions')->group(function () {
        Route::post('/', [SubscriptionController::class, 'store'])->name('subscriptions.store');
        Route::put('/{id}', [SubscriptionController::class, 'update'])->name('subscriptions.update');
        Route::delete('/{id}', [SubscriptionController::class, 'destroy'])->name('subscriptions.destroy');
        Route::post('/{id}/serials', [SubscriptionController::class, 'addSerial'])->name('subscriptions.addSerial');
        Route::post('/{id}/transactions', [SubscriptionController::class, 'addTransaction'])->name('subscriptions.addTransaction');
    });
});

// ===================== TPU + GSPS UPDATE ROUTES =====================
Route::middleware(['auth', 'role:tpu,gsps'])->group(function () {
    // Serial status updates - TPU and GSPS can update
    Route::put('/api/subscriptions/{id}/serial-status', [SubscriptionController::class, 'updateSerialStatus'])->name('subscriptions.updateSerialStatus');
    Route::put('/api/subscriptions/{id}/serial-received', [SubscriptionController::class, 'markSerialReceived'])->name('subscriptions.markSerialReceived');
});

require __DIR__.'/auth.php';
