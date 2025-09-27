<?php

use Illuminate\Support\Facades\Route;

// Catch-all for SPA frontend, but exclude /api and Laravel internal routes
Route::get('/{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '^(?!api|sanctum|storage).*$');
