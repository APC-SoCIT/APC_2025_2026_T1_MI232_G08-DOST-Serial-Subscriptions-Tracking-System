<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user) {
            $identifier = $user->getAuthIdentifier();
            $currentUser = User::find($identifier);

            if (!$currentUser || ($currentUser->is_disabled ?? false)) {
                Auth::logout();
                if ($request->hasSession()) {
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                }

                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Account disabled. Please contact the administrator.',
                        'account_disabled' => true,
                    ], 401);
                }

                return redirect()->route('login')->with('error', 'Account disabled. Please contact the administrator.');
            }
        }

        return $next($request);
    }
}