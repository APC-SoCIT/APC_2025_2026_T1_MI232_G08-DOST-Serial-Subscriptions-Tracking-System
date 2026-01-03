<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ChatController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/dashboard-tpu', function () {
    return Inertia::render('Dashboard_TPU');
})->name('dashboard-tpu');

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

require __DIR__.'/auth.php';
