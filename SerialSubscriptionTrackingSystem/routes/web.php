<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\SupplierAccountController;
use App\Http\Controllers\SubscriptionController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'auth' => null,
    ]);
});


// Public welcome page
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/account-approval', function () {
    return Inertia::render('AccountApproval');
});

Route::get('/list-of-supplier', function () {
    return Inertia::render('ListofSupplier');
});

//Default dashboard (fallback)
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Admin dashboard
Route::get('/dashboard-admin', function () {
    return Inertia::render('Dashboard_Admin');
})->middleware(['auth', 'verified', 'role:admin'])->name('admin.dashboard');

// TPU Routes - Main dashboard without role middleware, sub-routes with middleware
Route::get('/dashboard-tpu', function () {
    return Inertia::render('Dashboard_TPU');
})->middleware(['auth', 'verified'])->name('tpu.dashboard');



Route::get('/dashboard-tpu-chat', function () {
        return Inertia::render('Dashboard_TPU_Chat');
    })->middleware(['auth'])->name('dashboard-tpu-chat');

Route::get('/dashboard-tpu-supplierinfo', function () {
        $approvedSuppliers = \App\Models\SupplierAccount::approved()->get();
        return Inertia::render('Dashboard_TPU_Supplierinfo', [
            'approvedSuppliers' => $approvedSuppliers,
        ]);
    })->name('dashboard-tpu-supplierinfo');

Route::get('/dashboard-tpu-subscriptiontracking', function () {
        $approvedSuppliers = \App\Models\SupplierAccount::approved()->get();
        return Inertia::render('Dashboard_TPU_Subscriptiontracking', [
            'approvedSuppliers' => $approvedSuppliers,
        ]);
    })->name('dashboard-tpu-subscriptiontracking');

Route::get('/dashboard-tpu-monitordelivery', function () {
        return Inertia::render('Dashboard_TPU_Monitordelivery');
    })->name('dashboard-tpu-monitordelivery');

Route::get('/dashboard-tpu-addserial', function () {
        return Inertia::render('Dashboard_TPU_AddSerial');
    })->name('dashboard-tpu-addserial');

Route::get('/dashboard-tpu-addaccount', function () {
        return Inertia::render('Dashboard_TPU_Addaccount');
    })->middleware(['auth'])->name('dashboard-tpu-addaccount');


// GSPS Routes - Main dashboard without role middleware, sub-routes with middleware
Route::get('/dashboard-gsps', function () {
    return Inertia::render('Dashboard_GSPS');
})->middleware(['auth', 'verified'])->name('gsps.dashboard');


Route::get('/dashboard-gsps-supplierinfo', function () {
        return Inertia::render('Dashboard_GSPS_Supplierinfo');
    })->name('dashboard-gsps-supplierinfo');

Route::get('/dashboard-gsps-deliverystatus', function () {
        return Inertia::render('Dashboard_GSPS_Deliverystatus');
    })->name('dashboard-gsps-deliverystatus');

Route::get('/dashboard-gsps-inspectionstatus', function () {
        return Inertia::render('Dashboard_GSPS_Inspectionstatus');
    })->name('dashboard-gsps-inspectionstatus');

Route::get('/dashboard-gsps-chat', function () {
        return Inertia::render('Dashboard_GSPS_Chat');
    })->middleware(['auth'])->name('dashboard-gsps-chat');



Route::get('/dashboard-supplier', function () {
    return Inertia::render('Dashboard_Supplier');
})->middleware(['auth', 'verified'])->name('supplier.dashboard');


Route::get('/dashboard-supplier-listofserial', function () {
        return Inertia::render('Dashboard_Supplier_ListofSerial');
    })->name('dashboard-supplier-listofserial');

Route::get('/dashboard-supplier-late', function () {
        return Inertia::render('Dashboard_Supplier_Late');
    })->name('dashboard-supplier-late');

Route::get('/dashboard-supplier-undelivered', function () {
        return Inertia::render('Dashboard_Supplier_Undelivered');
    })->name('dashboard-supplier-undelivered');

Route::get('/dashboard-supplier-delivered', function () {
        return Inertia::render('Dashboard_Supplier_Delivered');
    })->name('dashboard-supplier-delivered');

Route::get('/dashboard-supplier-chat', function () {
        return Inertia::render('Dashboard_Supplier_Chat');
    })->middleware(['auth'])->name('dashboard-supplier-chat');




// Inspection Routes - Main dashboard without role middleware, sub-routes with middleware
Route::get('/inspection-dashboard', fn () => Inertia::render('Dashboard_Inspection'))->middleware(['auth', 'verified'])->name('inspection.dashboard');


Route::get('/inspection-date', fn () => Inertia::render('View_by_date'))->name('inspection.date');

Route::get('/inspection-serials', fn () => Inertia::render('ListofSerials'))->name('inspection.serials');

Route::get('/inspection-chat', fn () => Inertia::render('Dashboard_Inspection_Chat'))->middleware(['auth'])->name('inspection.chat');

    


// Authenticated profile routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Supplier Account Management API Routes
    Route::prefix('api/supplier-accounts')->group(function () {
        Route::get('/', [SupplierAccountController::class, 'index'])->name('supplier-accounts.index');
        Route::get('/pending', [SupplierAccountController::class, 'pending'])->name('supplier-accounts.pending');
        Route::get('/approved', [SupplierAccountController::class, 'approved'])->name('supplier-accounts.approved');
        Route::get('/stats', [SupplierAccountController::class, 'stats'])->name('supplier-accounts.stats');
        Route::post('/', [SupplierAccountController::class, 'store'])->name('supplier-accounts.store');
        Route::get('/{id}', [SupplierAccountController::class, 'show'])->name('supplier-accounts.show');
        Route::post('/{id}/approve', [SupplierAccountController::class, 'approve'])->name('supplier-accounts.approve');
        Route::post('/{id}/reject', [SupplierAccountController::class, 'reject'])->name('supplier-accounts.reject');
    });

    // Subscription Management API Routes
    Route::prefix('api/subscriptions')->group(function () {
        Route::get('/', [SubscriptionController::class, 'index'])->name('subscriptions.index');
        Route::get('/stats', [SubscriptionController::class, 'stats'])->name('subscriptions.stats');
        Route::get('/supplier-serials', [SubscriptionController::class, 'getSupplierSerials'])->name('subscriptions.supplierSerials');
        Route::get('/delivery-serials', [SubscriptionController::class, 'getDeliverySerials'])->name('subscriptions.deliverySerials');
        Route::post('/', [SubscriptionController::class, 'store'])->name('subscriptions.store');
        Route::get('/{id}', [SubscriptionController::class, 'show'])->name('subscriptions.show');
        Route::put('/{id}', [SubscriptionController::class, 'update'])->name('subscriptions.update');
        Route::delete('/{id}', [SubscriptionController::class, 'destroy'])->name('subscriptions.destroy');
        Route::post('/{id}/serials', [SubscriptionController::class, 'addSerial'])->name('subscriptions.addSerial');
        Route::post('/{id}/transactions', [SubscriptionController::class, 'addTransaction'])->name('subscriptions.addTransaction');
        Route::put('/{id}/serial-status', [SubscriptionController::class, 'updateSerialStatus'])->name('subscriptions.updateSerialStatus');
        Route::put('/{id}/serial-received', [SubscriptionController::class, 'markSerialReceived'])->name('subscriptions.markSerialReceived');
    });

    // Chat routes
    Route::get('/api/chats', [ChatController::class, 'index'])->name('chats.index');
    Route::get('/api/users/available', [ChatController::class, 'getAvailableUsers'])->name('users.available');
    Route::get('/api/chats/{chat}/messages', [ChatController::class, 'getMessages'])->name('chats.messages');
    Route::post('/api/chats/get-or-create', [ChatController::class, 'getOrCreateChat'])->name('chats.getOrCreate');
    Route::post('/api/chats/{chat}/messages', [ChatController::class, 'storeMessage'])->name('messages.store');
    Route::get('/api/chats/{message}/download', [ChatController::class, 'downloadAttachment'])->name('file.download');
    Route::put('/api/messages/{messageId}', [ChatController::class, 'updateMessage'])->name('messages.update');
    Route::delete('/api/messages/{messageId}', [ChatController::class, 'deleteMessage'])->name('messages.delete');
});

require __DIR__.'/auth.php';
// Auth routes (login, register, etc.)
