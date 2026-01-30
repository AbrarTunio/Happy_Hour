<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => 'required|string', // Ensure this matches your DB column name
            'password' => 'required|string',
        ]);

        // 1. Attempt login
        if (!Auth::attempt(['username' => $credentials['username'], 'password' => $credentials['password']])) {
            return response()->json(['success' => false, 'error' => 'Invalid username or password'], 401);
        }

        $user = Auth::user();

        // 2. Check Role (Safely)
        if (!$user || $user->role !== 'admin') {
            Auth::logout();
            return response()->json(['success' => false, 'error' => 'Unauthorized role'], 403);
        }

        // 3. Session Regeneration (Wrapped in try-catch to prevent 500 if session driver fails)
        try {
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }
        } catch (\Exception $e) {
            // Silently continue if session fails, or log it
        }

        return response()->json([
            'success' => true,
            'user' => $user,
        ]);
    }


    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['success' => true]);
    }

    public function checkAuth()
    {
        if (!Auth::check()) {
            return response()->json(['success' => false], 401);
        }

        return response()->json([
            'success' => true,
            'user' => Auth::user(),
        ]);
    }
}
