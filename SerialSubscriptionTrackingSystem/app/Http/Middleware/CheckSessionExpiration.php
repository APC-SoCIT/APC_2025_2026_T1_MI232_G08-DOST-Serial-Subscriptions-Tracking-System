<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckSessionExpiration
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        $lifetimeSeconds = (int) config('session.lifetime', 120) * 60;
        $lastActivity = $request->session()->get('_last_activity');

        if ($user && $lastActivity && (time() - (int) $lastActivity) >= $lifetimeSeconds) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session expired. Please log in again.',
                    'session_expired' => true,
                ], 401);
            }

            return redirect()->route('login')->with('reason', 'inactivity');
        }

        if ($user) {
            $request->session()->put('_last_activity', time());
        }

        return $next($request);
    }
}
