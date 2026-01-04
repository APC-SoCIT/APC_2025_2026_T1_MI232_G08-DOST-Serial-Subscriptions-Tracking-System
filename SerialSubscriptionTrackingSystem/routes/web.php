<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ChatController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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


Route::get('/dashboard-supplier', function () {
    return Inertia::render('Dashboard_Supplier');
})->name('dashboard-supplier');

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
})->name('dashboard-supplier-chat');


Route::get('/dashboard-tpu', fn () => Inertia::render('Dashboard_TPU'))
    ->middleware('role:tpu')
    ->name('tpu.dashboard');

Route::get('/inspection-dashboard', fn () => Inertia::render('Dashboard_Inspection'));

Route::get('/inspection-date', fn () => Inertia::render('View_by_date'));

Route::get('/inspection-serials', fn () => Inertia::render('ListofSerials'));

    


// Authenticated profile routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Chat routes
    Route::get('/api/chats', [ChatController::class, 'index'])->name('chats.index');
    Route::get('/api/chats/{chat}/messages', [ChatController::class, 'getMessages'])->name('chats.messages');
    Route::post('/api/chats/get-or-create', [ChatController::class, 'getOrCreateChat'])->name('chats.getOrCreate');
    Route::post('/api/chats/{chat}/messages', [ChatController::class, 'storeMessage'])->name('messages.store');
});

// Auth routes (login, register, etc.)
require __DIR__.'/auth.php';
