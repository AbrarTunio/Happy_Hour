<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\IngredientPriceHistory;
use App\Http\Requests\StoreIngredientRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

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
    public function generateInsights(Ingredient $ingredient)
    {
        // Caching logic remains the same
        if ($ingredient->ai_insights && $ingredient->ai_insights_updated_at && Carbon::parse($ingredient->ai_insights_updated_at)->isAfter(now()->subDay())) {
            return response()->json($ingredient->ai_insights);
        }

        try {
            // 1. Gather Data for the AI Prompt
            $ingredient->load(['supplier', 'priceHistory' => fn($query) => $query->orderBy('log_date', 'desc')->take(10), 'recipes']);

            // --- DEFINITIVE FIX: Gracefully handle ingredients with no recipes ---
            $mostImpactedRecipeData = null;
            if ($ingredient->recipes->isNotEmpty()) {
                $mostImpactedRecipe = $ingredient->recipes->sortByDesc(function ($recipe) use ($ingredient) {
                    $recipeCost = $recipe->cost; // Uses the accessor from the Recipe model
                    if ($recipeCost > 0) {
                        $ingredientCostInRecipe = $ingredient->current_price * $recipe->pivot->quantity;
                        return $ingredientCostInRecipe / $recipeCost;
                    }
                    return 0;
                })->first();

                // Check if a most impacted recipe was actually found
                if ($mostImpactedRecipe) {
                    $recipeCost = $mostImpactedRecipe->cost;
                    $ingredientCost = $ingredient->current_price * $mostImpactedRecipe->pivot->quantity;
                    $mostImpactedRecipeData = [
                        'name' => $mostImpactedRecipe->recipe_name,
                        'ingredient_cost_percentage' => $recipeCost > 0 ? round(($ingredientCost / $recipeCost) * 100, 1) : 0
                    ];
                }
            }

            // 2. Format the final data object for the prompt
            $promptData = [
                'ingredient_name' => $ingredient->ingredient_name,
                'current_price' => (float)$ingredient->current_price,
                'price_history_90_days' => $ingredient->priceHistory->map(fn($log) => [
                    'date' => Carbon::parse($log->log_date)->toDateString(),
                    'price' => (float)$log->price
                ]),
                'most_impacted_recipe' => $mostImpactedRecipeData, // This will be null if no recipes use the ingredient
            ];

            // 3. Call the AI Service
            $apiKey = env('GEMINI_API_KEY');
            if (!$apiKey) {
                throw new \Exception('Gemini API key is not configured.');
            }

            $promptTemplate = file_get_contents(base_path('prompts/ai_ingredient_insights_prompt.txt'));
            $fullPrompt = $promptTemplate . "\n" . json_encode($promptData, JSON_PRETTY_PRINT);

            $response = Http::timeout(60)->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                'contents' => [['parts' => [['text' => $fullPrompt]]]],
                'generationConfig' => ['response_mime_type' => 'application/json'],
            ]);

            if ($response->failed()) {
                Log::error('Gemini API Error for Ingredient Insight', ['response' => $response->body()]);
                throw new \Exception('Failed to get a valid response from the AI model. Status: ' . $response->status());
            }

            $result = $response->json();
            $insightsJson = trim($result['candidates'][0]['content']['parts'][0]['text']);
            $insights = json_decode($insightsJson, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Invalid JSON from Gemini for ingredient insights', ['json' => $insightsJson]);
                throw new \Exception('AI returned invalid JSON. Error: ' . json_last_error_msg());
            }

            // 4. Cache and Return the Response
            $ingredient->ai_insights = $insights;
            $ingredient->ai_insights_updated_at = now();
            $ingredient->save();

            return response()->json($insights);
        } catch (\Exception $e) {
            Log::error("Ingredient Insight Generation Failed for ID {$ingredient->id}: " . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine());
            return response()->json(['message' => "Failed to generate AI insights: " . $e->getMessage()], 500);
        }
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
    /**
     * Update the specified resource in storage.
     */
    public function update(StoreIngredientRequest $request, $id)
    {
        $validated = $request->validated();
        $ingredient = Ingredient::findOrFail($id);
        DB::transaction(function () use ($validated, $ingredient) {
            $ingredient->update([
                'ingredient_name' => $validated['ingredient_name'],
                'category' => $validated['category'],
                'unit' => $validated['unit'],
                'primary_supplier_id' => $validated['primary_supplier_id'],
                'brand' => $validated['brand'],
                'storage_type' => $validated['storage_type'],
                'shelf_life' => $validated['shelf_life'],
                'reorder_level' => $validated['reorder_level'],
                'maximum_stock' => $validated['maximum_stock'],
                'notes' => $validated['notes'],
            ]);

            // Check if the price has changed
            $latestPriceEntry = $ingredient->latestPrice;
            if (!$latestPriceEntry || $latestPriceEntry->price != $validated['current_price']) {
                IngredientPriceHistory::create([
                    'ingredient_id' => $ingredient->id,
                    'price' => $validated['current_price'],
                    'log_date' => now(),
                ]);
            }
        });
        return response()->json($ingredient);
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $ingredient = Ingredient::findOrFail($id);
        $ingredient->delete();
        return response()->json(null, 204);
    }
}
