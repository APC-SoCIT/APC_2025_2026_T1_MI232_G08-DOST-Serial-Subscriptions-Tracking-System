<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckUserRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        // Check if user is authenticated
        if (!auth()->check()) {
            return redirect('login');
        }

        $user = auth()->user();

        // Check if user has one of the required roles
        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        // User doesn't have the required role - redirect to their dashboard
        return redirect()->to($this->getRoleDashboard($user));
    }

    /**
     * Get dashboard route for user's role
     */
    private function getRoleDashboard($user)
    {
        $roleName = $user->getRole();
        
        if (!$roleName) {
            return route('dashboard');
        }

        $roleRoutes = [
            'admin' => '/dashboard-admin',
            'supplier' => '/dashboard-supplier',
            'gsps' => '/dashboard-gsps',
            'tpu' => '/dashboard-tpu',
            'inspection' => '/inspection-dashboard',
        ];

        return $roleRoutes[$roleName] ?? route('dashboard');
    }
}
