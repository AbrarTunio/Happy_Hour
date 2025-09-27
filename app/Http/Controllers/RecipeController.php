<?php

namespace App\Http\Controllers;

use App\Models\Recipe;
use App\Http\Requests\StoreRecipeRequest;
use Illuminate\Support\Facades\DB;

class RecipeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Recipe::with('ingredients')->get();
    }

    /**
     * Display the specified resource.
     * Handles GET /api/recipes/{id}
     */
    public function show($id)
    {
        $recipe = Recipe::with('ingredients')->findOrFail($id);
        return response()->json($recipe);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreRecipeRequest $request)
    {
        $validated = $request->validated();

        $recipe = null;

        DB::transaction(function () use ($validated, &$recipe) {
            $recipe = Recipe::create([
                'recipe_name' => $validated['recipe_name'],
                'selling_price' => $validated['selling_price'],
                'target_margin' => $validated['target_margin'] ?? null,
            ]);

            $ingredientsToSync = [];
            foreach ($validated['ingredients'] as $ingredient) {
                $ingredientsToSync[$ingredient['id']] = ['quantity' => $ingredient['quantity']];
            }

            $recipe->ingredients()->sync($ingredientsToSync);
        });

        return response()->json($recipe->load('ingredients'), 201);
    }
}
