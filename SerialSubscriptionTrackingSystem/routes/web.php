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
});

// Auth routes (login, register, etc.)
require __DIR__.'/auth.php';
