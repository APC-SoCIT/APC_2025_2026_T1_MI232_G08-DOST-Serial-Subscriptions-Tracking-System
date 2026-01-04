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

// TPU Routes
Route::get('/dashboard-tpu', function () {
    return Inertia::render('Dashboard_TPU');
})->name('dashboard-tpu');

Route::get('/dashboard-tpu-chat', function () {
    return Inertia::render('Dashboard_TPU_Chat');
})->name('dashboard-tpu-chat');

Route::get('/dashboard-tpu-supplierinfo', function () {
    return Inertia::render('Dashboard_TPU_Supplierinfo');
})->name('dashboard-tpu-supplierinfo');

Route::get('/dashboard-tpu-subscriptiontracking', function () {
    return Inertia::render('Dashboard_TPU_Subscriptiontracking');
})->name('dashboard-tpu-subscriptiontracking');

Route::get('/dashboard-tpu-monitordelivery', function () {
    return Inertia::render('Dashboard_TPU_Monitordelivery');
})->name('dashboard-tpu-monitordelivery');

Route::get('/dashboard-tpu-addserial', function () {
    return Inertia::render('Dashboard_TPU_AddSerial');
})->name('dashboard-tpu-addserial');

// GSPS Routes
Route::get('/dashboard-gsps', function () {
    return Inertia::render('Dashboard_GSPS');
})->name('dashboard-gsps');

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
})->name('dashboard-gsps-chat');



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
