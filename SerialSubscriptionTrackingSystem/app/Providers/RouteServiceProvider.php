<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    public const HOME = '/dashboard'; // fallback path

    public function boot(): void
    {
        $this->routes(function () {
            Route::middleware('web')
                ->group(base_path('routes/web.php'));

            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));
        });
    }

    public static function home()
    {
        $user = auth()->user();

        if (!$user) {
            return route('dashboard');
        }

        // Redirect based on email pattern
        $email = strtolower($user->email);

        if (strpos($email, 'admin') !== false) {
            return route('admin.dashboard');
        } elseif (strpos($email, 'supplier') !== false) {
            return route('supplier.dashboard');
        } elseif (strpos($email, 'gsps') !== false) {
            return route('gsps.dashboard');
        } elseif (strpos($email, 'tpu') !== false) {
            return route('tpu.dashboard');
        } elseif (strpos($email, 'inspection') !== false) {
            return route('inspection.dashboard');
        }

        return route('dashboard'); // fallback
    }

}
