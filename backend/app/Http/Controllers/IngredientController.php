<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\IngredientPriceHistory;
use App\Http\Requests\StoreIngredientRequest;
use Illuminate\Support\Facades\DB;

class IngredientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Ingredient::with(['supplier', 'latestPrice'])->get();
    }

    /**
     * Display the specified resource.
     * Handles GET /api/ingredients/{id}
     */
    public function show($id)
    {
        // Eager load relationships needed for the detail page.
        $ingredient = Ingredient::with(['supplier', 'recipes', 'priceHistory'])->findOrFail($id);
        return response()->json($ingredient);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreIngredientRequest $request)
    {
        $validated = $request->validated();

        $ingredient = null;
        DB::transaction(function () use ($validated, &$ingredient) {
            $ingredient = Ingredient::updateOrCreate(
                ['ingredient_name' => $validated['ingredient_name']],
                [
                    'category' => $validated['category'],
                    'unit' => $validated['unit'],
                    'primary_supplier_id' => $validated['primary_supplier_id'],
                    'brand' => $validated['brand'],
                    'storage_type' => $validated['storage_type'],
                    'shelf_life' => $validated['shelf_life'],
                    'reorder_level' => $validated['reorder_level'],
                    'maximum_stock' => $validated['maximum_stock'],
                    'notes' => $validated['notes'],
                ]
            );

            IngredientPriceHistory::create([
                'ingredient_id' => $ingredient->id,
                'price' => $validated['current_price'],
                'log_date' => now(),
            ]);
        });

        return response()->json($ingredient, 201);
    }
}
