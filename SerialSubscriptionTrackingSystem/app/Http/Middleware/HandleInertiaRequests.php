<?php

namespace App\Http\Middleware;

use Inertia\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Defines the props shared by default with Inertia responses.
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        
        // Calculate session expiration time
        $sessionLifetime = Config::get('session.lifetime', 120); // in minutes
        $sessionExpiresAt = null;
        
        if ($user && $request->session()->has('_token')) {
            // Session expiration timestamp (current time + remaining session time)
            $lastActivity = $request->session()->get('_last_activity', time());
            $sessionExpiresAt = ($lastActivity + ($sessionLifetime * 60)) * 1000; // Convert to milliseconds for JS
            
            // Update last activity
            $request->session()->put('_last_activity', time());
        }
        
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ] : null,
            ],
            'session' => [
                'lifetime' => $sessionLifetime,
                'expires_at' => $sessionExpiresAt,
            ],
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}
