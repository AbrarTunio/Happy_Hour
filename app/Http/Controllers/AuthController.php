<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['success' => false, 'error' => 'Invalid username or password'], 401);
        }

        // Prevent session fixation
        $request->session()->regenerate();

        $user = Auth::user();

        if ($user->role !== 'admin') {
            Auth::logout();
            return response()->json(['success' => false, 'error' => 'Unauthorized role'], 403);
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
