<?php

use App\Http\Controllers\ProfileController;
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

// Default dashboard (fallback)
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Role-based dashboards
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/admin-dashboard', fn () => Inertia::render('Dashboard_Admin'))
        ->middleware('role:admin')
        ->name('admin.dashboard');

    Route::get('/dashboard-tpu', fn () => Inertia::render('Dashboard_TPU'))
        ->middleware('role:tpu')
        ->name('tpu.dashboard');

    // Add other roles here as needed
    // Route::get('/dashboard-supplier', fn () => Inertia::render('Dashboard_Supplier'))
    //     ->middleware('role:supplier')
    //     ->name('supplier.dashboard');
});

// Authenticated profile routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Auth routes (login, register, etc.)
require __DIR__.'/auth.php';
