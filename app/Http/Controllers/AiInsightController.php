<?php

namespace App\Http\Controllers;

use App\Models\AiInsight;
use App\Models\Supplier;
use App\Models\Recipe;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiInsightController extends Controller
{
    /**
     * Display a listing of all AI insights.
     */
    public function index()
    {
        return AiInsight::with(['kpi', 'insightable'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Generates insights for ALL suppliers, recipes, and ingredients in the database.
     */
    public function generateAll()
    {
        // Clear all old insights before starting the new generation process.
        AiInsight::truncate();

        $insightsGenerated = 0;
        $errorLog = [];

        // --- 1. Process ALL Suppliers ---
        $suppliers = Supplier::with(['invoices', 'ingredients'])->get();
        foreach ($suppliers as $supplier) {
            try {
                if ($this->generateForSupplier($supplier)) {
                    $insightsGenerated++;
                }
            } catch (\Exception $e) {
                $errorLog[] = "Supplier ID {$supplier->id}: " . $e->getMessage();
                Log::error("Insight generation crashed for Supplier ID {$supplier->id}: " . $e->getMessage());
            }
        }

        // --- 2. Process ALL Recipes ---
        $recipes = Recipe::with('ingredients.latestPrice')->get();
        foreach ($recipes as $recipe) {
            try {
                if ($this->generateForRecipe($recipe)) {
                    $insightsGenerated++;
                }
            } catch (\Exception $e) {
                $errorLog[] = "Recipe ID {$recipe->id}: " . $e->getMessage();
                Log::error("Insight generation crashed for Recipe ID {$recipe->id}: " . $e->getMessage());
            }
        }

        // --- 3. Process ALL Ingredients ---
        $ingredients = Ingredient::with(['supplier', 'priceHistory' => fn($q) => $q->take(10), 'recipes'])->get();
        foreach ($ingredients as $ingredient) {
            try {
                if ($this->generateForIngredient($ingredient)) {
                    $insightsGenerated++;
                }
            } catch (\Exception $e) {
                $errorLog[] = "Ingredient ID {$ingredient->id}: " . $e->getMessage();
                Log::error("Insight generation crashed for Ingredient ID {$ingredient->id}: " . $e->getMessage());
            }
        }

        // Check if any insights were generated at all.
        if ($insightsGenerated === 0) {
            $errorMessage = "No insights could be generated. This might be due to a lack of data or an API connection issue. Check server logs for details.";
            if (!empty($errorLog)) {
                $errorMessage .= "\n\nError Details:\n- " . implode("\n- ", $errorLog);
            }
            return response()->json(['message' => $errorMessage], 422);
        }

        return response()->json(['message' => 'Insight generation process completed successfully for ' . $insightsGenerated . ' items.']);
    }
    public function show($id)
    {
        return AiInsight::with(['kpi', 'insightable'])->findOrFail($id);
    }

    private function generateForSupplier(Supplier $supplier): bool
    {
        // Skip suppliers with no data to analyze.
        if ($supplier->invoices->isEmpty() && $supplier->ingredients->isEmpty()) {
            return false;
        }
        $data = [
            'name' => $supplier->company_name,
            'total_spend_mtd' => (float)$supplier->invoices->sum('total'),
            'invoice_count' => $supplier->invoices->count(),
            'ingredients_supplied_count' => $supplier->ingredients->count(),
            'top_ingredients' => $supplier->ingredients->take(5)->pluck('ingredient_name')->toArray(),
        ];
        $payload = ['dataType' => 'Supplier', 'data' => $data];
        $insightData = $this->callMasterInsightEngine($payload);
        if ($insightData) {
            $supplier->insight()->create(['data' => $insightData]);
            return true;
        }
        return false;
    }

    private function generateForRecipe(Recipe $recipe): bool
    {
        // Skip recipes with no ingredients.
        if ($recipe->ingredients->isEmpty()) {
            return false;
        }
        $data = [
            'name' => $recipe->recipe_name,
            'selling_price' => (float)$recipe->selling_price,
            'total_cost' => (float)$recipe->cost,
            'actual_margin_percent' => (float)number_format($recipe->margin, 1),
            'ingredients' => $recipe->ingredients->map(function ($ing) use ($recipe) {
                $cost = $ing->pivot->quantity * ($ing->current_price ?? 0);
                return [
                    'name' => $ing->ingredient_name,
                    'cost' => (float)number_format($cost, 2),
                    'percentage_of_total' => $recipe->cost > 0 ? (float)number_format(($cost / $recipe->cost) * 100, 1) : 0,
                ];
            })->sortByDesc('percentage_of_total')->values()->toArray(),
        ];
        $payload = ['dataType' => 'Recipe', 'data' => $data];
        $insightData = $this->callMasterInsightEngine($payload);
        if ($insightData) {
            $recipe->insight()->create(['data' => $insightData]);
            return true;
        }
        return false;
    }

    private function generateForIngredient(Ingredient $ingredient): bool
    {
        // Skip ingredients with no price history to analyze.
        if ($ingredient->priceHistory->isEmpty()) {
            return false;
        }
        $mostImpactedRecipeData = null;
        if ($ingredient->recipes->isNotEmpty()) {
            $mostImpactedRecipe = $ingredient->recipes->sortByDesc(function ($recipe) use ($ingredient) {
                return $recipe->cost > 0 ? (($ingredient->current_price * $recipe->pivot->quantity) / $recipe->cost) : 0;
            })->first();

            if ($mostImpactedRecipe) {
                $mostImpactedRecipeData = [
                    'name' => $mostImpactedRecipe->recipe_name,
                    'ingredient_cost_percentage' => $mostImpactedRecipe->cost > 0 ? round((($ingredient->current_price * $mostImpactedRecipe->pivot->quantity) / $mostImpactedRecipe->cost) * 100, 1) : 0
                ];
            }
        }
        $data = [
            'name' => $ingredient->ingredient_name,
            'current_price' => (float)$ingredient->current_price,
            'unit' => $ingredient->unit,
            'supplier' => $ingredient->supplier->company_name ?? 'N/A',
            'price_history_recent' => $ingredient->priceHistory->map(fn($log) => ['date' => $log->log_date->toDateString(), 'price' => (float)$log->price]),
            'most_impacted_recipe' => $mostImpactedRecipeData,
        ];
        $payload = ['dataType' => 'Ingredient', 'data' => $data];
        $insightData = $this->callMasterInsightEngine($payload);
        if ($insightData) {
            $ingredient->insight()->create(['data' => $insightData]);
            return true;
        }
        return false;
    }

    private function callMasterInsightEngine(array $payload)
    {
        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            Log::error('CRITICAL: Gemini API key is not configured in .env file.');
            return null;
        }
        $promptTemplate = file_get_contents(base_path('prompts/master_insight_engine_prompt.txt'));
        $fullPrompt = $promptTemplate . "\n" . json_encode($payload, JSON_PRETTY_PRINT);

        $response = Http::timeout(90)->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={$apiKey}", [
            'contents' => [['parts' => [['text' => $fullPrompt]]]],
            'generationConfig' => ['response_mime_type' => 'application/json'],
        ]);

        if ($response->failed()) {
            $errorBody = $response->json();
            $errorMessage = $errorBody['error']['message'] ?? 'The AI service returned an unknown error. Check laravel.log.';
            Log::error('Gemini Master Engine API Error', ['status' => $response->status(), 'response' => $response->body()]);
            throw new \Exception("AI Service Error: " . $errorMessage);
        }

        $result = $response->json();
        if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            Log::error('Invalid Gemini Master Engine API Response Structure', ['response' => $result]);
            throw new \Exception('The AI service returned an unexpected data structure.');
        }

        $insightsJson = trim($result['candidates'][0]['content']['parts'][0]['text']);
        $insights = json_decode($insightsJson, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('Invalid JSON from Gemini Master Engine', ['json' => $insightsJson, 'error' => json_last_error_msg()]);
            throw new \Exception('The AI service returned malformed JSON that could not be parsed.');
        }

        return $insights;
    }
}
