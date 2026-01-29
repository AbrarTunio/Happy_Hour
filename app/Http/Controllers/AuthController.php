<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Validate Input
        $credentials = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // 2. Attempt Login (This sets a session cookie)
        if (Auth::attempt(['username' => $credentials['username'], 'password' => $credentials['password']])) {

            $user = Auth::user();

            // 3. Check Role
            if ($user->role !== 'admin') {
                Auth::logout();
                return response()->json(['success' => false, 'error' => 'Unauthorized role'], 403);
            }

            // 4. Return success and user data
            return response()->json([
                'success' => true,
                'user' => $user
            ]);
        }

        // Fail Case
        return response()->json([
            'success' => false,
            'error' => 'Invalid username or password'
        ], 401);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        return response()->json(['success' => true]);
    }
}
