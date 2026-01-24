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

        $roleRoutes = [
            'admin' => 'admin.dashboard',
            'supplier' => 'supplier.dashboard',
            'gsps' => 'dashboard-gsps',
            'tpu' => 'dashboard-tpu',
            'inspection' => 'inspection.dashboard',
        ];

        foreach ($roleRoutes as $role => $routeName) {
            if ($user->hasRole($role)) {
                return route($routeName);
            }
        }

        return route('dashboard'); // fallback
    }

}
