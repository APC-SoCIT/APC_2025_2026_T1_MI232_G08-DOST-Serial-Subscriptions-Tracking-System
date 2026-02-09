<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Authenticate the user.
     */
    public function authenticate(): void
    {
        if (! Auth::attempt(
            $this->only('email', 'password'),
            $this->boolean('remember')
        )) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        // Check if user is disabled
        $user = Auth::user();
        if ($user && ($user->is_disabled ?? false)) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => 'Your account has been disabled. Please contact the administrator.',
            ]);
        }
    }
}
