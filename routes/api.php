<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\IngredientController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TimesheetController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Supplier Routes
Route::post('suppliers/abn-lookup', [SupplierController::class, 'abnLookup']);
Route::apiResource('suppliers', SupplierController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

// Ingredient Routes
Route::apiResource('ingredients', IngredientController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

// Invoice Routes
Route::post('invoices/{invoice}/process-ai', [InvoiceController::class, 'processWithAI']); // <<< --- ADD THIS NEW ROUTE

Route::apiResource('invoices', InvoiceController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

// Recipe Routes
Route::apiResource('recipes', RecipeController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

// Staff / Team Routes
Route::get('/teams/{team}/timesheets', [TeamController::class, 'getRecentTimesheets']);

Route::post('/teams/login-by-code', [TeamController::class, 'loginByCode']);
Route::get('/teams/{team}/status', [TeamController::class, 'status']); // Get a team member's current clock-in status
Route::apiResource('teams', TeamController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
Route::patch('/teams/{team}/status', [TeamController::class, 'updateStatus']);

Route::post('/staff/register', [TeamController::class, 'register']); // <-- ADD THIS NEW ROUTE

// Timesheet Routes
Route::post('/timesheets/clock-in', [TimesheetController::class, 'clockIn']);
Route::post('/timesheets/clock-out', [TimesheetController::class, 'clockOut']);
Route::post('/timesheets/take-break', [TimesheetController::class, 'startBreak']);
Route::post('/timesheets/end-break', [TimesheetController::class, 'endBreak']);
Route::apiResource('timesheets', TimesheetController::class)->only(['store']); // For manager's manual entry
