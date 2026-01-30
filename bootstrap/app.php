<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
    //
    // Enable sessions and cookies for the API routes
    $middleware->api(append: [
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
    ]);

    // Fix 405/CORS issues by allowing the API to bypass CSRF
    $middleware->validateCsrfTokens(except: [
        'api/*',
    ]);

    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
