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
        // For API requests, check if session is valid
        if ($request->expectsJson() || $request->is('api/*')) {
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session expired. Please log in again.',
                    'session_expired' => true,
                ], 401);
            }
        }

        return $next($request);
    }
}
