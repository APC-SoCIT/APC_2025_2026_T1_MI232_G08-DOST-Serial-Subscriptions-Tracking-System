<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        if ($user->hasRole('admin')) {
            return redirect()->route('admin.dashboard');
        }

        if ($user->hasRole('inspection')) {
            return redirect()->route('inspection.dashboard');
        }

        if ($user->hasRole('tpu')) {
            return redirect()->route('tpu.dashboard');
        }

        if ($user->hasRole('gsps')) {
            return redirect()->route('gsps.dashboard');
        }

        if ($user->hasRole('supplier')) {
            return redirect()->route('supplier.dashboard');
        }

        abort(403);
    }
}
