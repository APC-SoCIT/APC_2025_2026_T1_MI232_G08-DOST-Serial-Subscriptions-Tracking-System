<?php

use App\Http\Controllers\ProfileController;
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

Route::get('/dashboard-tpu-supplierinfo', function () {
    return Inertia::render('Dashboard_TPU_Supplierinfo');
})->name('dashboard-tpu-supplierinfo');

Route::get('/dashboard-tpu-subscriptiontracking', function () {
    return Inertia::render('Dashboard_TPU_Subscriptiontracking');
})->name('dashboard-tpu-subscriptiontracking');

Route::get('/dashboard-tpu-monitordelivery', function () {
    return Inertia::render('Dashboard_TPU_Monitordelivery');
})->name('dashboard-tpu-monitordelivery');

Route::get('/dashboard-tpu-received', function () {
    return Inertia::render('Dashboard_TPU_Received');
})->name('dashboard-tpu-received');

Route::get('/dashboard-gsps', function () {
    return Inertia::render('Dashboard_GSPS');
})->name('dashboard-gsps');

Route::get('/dashboard-gsps-supplierinfo', function () {
    return Inertia::render('Dashboard_GSPS_Supplierinfo');
})->name('dashboard-gsps-supplierinfo');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
