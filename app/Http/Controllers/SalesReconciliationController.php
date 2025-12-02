<?php

namespace App\Http\Controllers;

use App\Models\SalesReconciliation;
use App\Models\Recipe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SalesReconciliationController extends Controller
{
    public function getDashboardData(Request $request)
    {
        $validated = $request->validate(['branch' => 'required|string']);
        $reconciliationsMTD = SalesReconciliation::where('branch', $validated['branch'])
            ->where('date', '>=', Carbon::now()->startOfMonth())
            ->get();

        $avgSales = $reconciliationsMTD->avg('total_sales_from_receipt');
        $avgVariance = $reconciliationsMTD->avg('variance');

        return response()->json([
            'total_sales_mtd' => $reconciliationsMTD->sum('total_sales_from_receipt'),
            'avg_variance_percent' => $avgSales > 0 ? ($avgVariance / $avgSales) * 100 : 0,
            'pending_reconciliations' => SalesReconciliation::where('status', 'pending')->where('branch', $validated['branch'])->count(),
            'needs_review_reconciliations' => SalesReconciliation::where('status', 'needs_review')->where('branch', $validated['branch'])->count(),
        ]);
    }

    public function getForDate(Request $request)
    {
        $validated = $request->validate([
            'branch' => 'required|string',
            'date' => 'required|date'
        ]);

        $reconciliation = SalesReconciliation::where('branch', $validated['branch'])
            ->where('date', $validated['date'])
            ->whereIn('status', ['pending', 'needs_review', 'rejected']) // Include rejected to allow retry
            ->latest()
            ->first();

        if (!$reconciliation) {
            $reconciliation = SalesReconciliation::create([
                'branch' => $validated['branch'],
                'date' => $validated['date'],
                'status' => 'pending'
            ]);
        }

        return response()->json($reconciliation);
    }

    public function uploadReceipt(Request $request, SalesReconciliation $reconciliation)
    {
        $validated = $request->validate(['receipt' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120']);

        $path = $request->file('receipt')->store('receipts', 'public');

        // Reset Data for Fresh Start
        $reconciliation->receipt_file_path = $path;
        $reconciliation->recipe_breakdown = null;
        $reconciliation->total_breakdown_sales = 0;
        $reconciliation->total_cogs = 0;
        $reconciliation->variance = 0;
        $reconciliation->status = 'pending';
        $reconciliation->save();

        try {
            $apiKey = env('GEMINI_API_KEY');
            if (!$apiKey) throw new \Exception('Gemini API key not configured.');

            $filePath = storage_path('app/public/' . $path);
            $imageData = base64_encode(file_get_contents($filePath));
            $mimeType = mime_content_type($filePath);
            $prompt = file_get_contents(base_path('prompts/z_read_extraction_prompt.txt'));

            $response = Http::timeout(60)->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={$apiKey}", [
                'contents' => [['parts' => [['text' => $prompt], ['inline_data' => ['mime_type' => $mimeType, 'data' => $imageData]]]]],
                'generationConfig' => ['response_mime_type' => 'application/json']
            ]);

            $result = $response->json();
            if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                throw new \Exception('Invalid response from AI model.');
            }

            $jsonResponse = trim($result['candidates'][0]['content']['parts'][0]['text']);
            $jsonResponse = str_replace(['```json', '```'], '', $jsonResponse);

            $data = json_decode($jsonResponse, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('AI returned malformed JSON.');
            }

            // --- SMART CHECK: IS IT A VALID SALES RECEIPT? ---
            $isValid = $data['is_valid_sales_receipt'] ?? false;
            $totalSales = floatval($data['total_sales'] ?? 0);

            if ($isValid === false || $totalSales <= 0) {
                $reconciliation->status = 'rejected'; // Mark as rejected
                $reconciliation->total_sales_from_receipt = 0;
                $reconciliation->variance = 0;
                $reconciliation->save();

                // RETURN THE SPECIFIC ERROR MESSAGE REQUESTED
                return response()->json([
                    'message' => 'The file you have provided is not a sales receipt.',
                    'reconciliation' => $reconciliation
                ], 422);
            }

            $reconciliation->total_sales_from_receipt = $totalSales;
            $reconciliation->variance = $totalSales; // Initial variance = total sales
            $reconciliation->save();

            return response()->json($reconciliation);
        } catch (\Exception $e) {
            Log::error("Z-Read AI Extraction Failed: " . $e->getMessage());
            return response()->json(['message' => 'AI Processing failed. Please check the file.'], 500);
        }
    }

    public function updateBreakdown(Request $request, SalesReconciliation $reconciliation)
    {
        $validated = $request->validate([
            'items' => 'present|array',
            'items.*.recipe_id' => 'required|exists:recipes,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.actual_price' => 'required|numeric|min:0',
        ]);

        $recipeIds = collect($validated['items'])->pluck('recipe_id');
        $recipes = Recipe::with('ingredients.latestPrice')->whereIn('id', $recipeIds)->get()->keyBy('id');

        $totalBreakdownSales = 0;
        $totalCogs = 0;
        $breakdown = [];

        foreach ($validated['items'] as $item) {
            $recipe = $recipes->get($item['recipe_id']);
            if ($recipe) {
                $unitCogs = $recipe->ingredients->sum(function ($ingredient) {
                    $qtyInRecipe = $ingredient->pivot->quantity;
                    $currentPrice = $ingredient->latestPrice->price ?? 0;
                    return $qtyInRecipe * $currentPrice;
                });

                $totalItemCogs = $unitCogs * $item['quantity'];
                $totalItemSales = $item['actual_price'] * $item['quantity'];

                $totalCogs += $totalItemCogs;
                $totalBreakdownSales += $totalItemSales;

                $breakdown[] = [
                    'recipe_id' => $recipe->id,
                    'name' => $recipe->recipe_name,
                    'quantity' => $item['quantity'],
                    'actual_price' => $item['actual_price'],
                    'unit_cogs' => round($unitCogs, 2),
                    'total_cogs' => round($totalItemCogs, 2),
                    'total_sale' => $totalItemSales,
                ];
            }
        }

        $variance = $reconciliation->total_sales_from_receipt - $totalBreakdownSales;

        // --- CHECK 2: PREVENT NEGATIVE VARIANCE ---
        if ($variance < -0.05) {
            return response()->json([
                'message' => 'Error: Total Breakdown Sales cannot exceed Receipt Total.',
                'current_breakdown_total' => $totalBreakdownSales,
                'receipt_total' => $reconciliation->total_sales_from_receipt
            ], 422);
        }

        $reconciliation->recipe_breakdown = $breakdown;
        $reconciliation->total_breakdown_sales = $totalBreakdownSales;
        $reconciliation->total_cogs = $totalCogs;
        $reconciliation->variance = $variance;

        if ($reconciliation->status === 'pending') {
            $variancePercentage = $reconciliation->total_sales_from_receipt > 0
                ? abs($reconciliation->variance) / $reconciliation->total_sales_from_receipt
                : 1;
            $reconciliation->status = $variancePercentage > 0.02 ? 'needs_review' : 'pending';
        }

        $reconciliation->save();

        return response()->json($reconciliation);
    }

    public function confirmAndClose(Request $request, SalesReconciliation $reconciliation)
    {
        $reconciliation->status = 'reconciled';
        $reconciliation->save();
        return response()->json($reconciliation);
    }

    public function flagForReview(Request $request, SalesReconciliation $reconciliation)
    {
        $reconciliation->status = 'needs_review';
        $reconciliation->save();
        return response()->json($reconciliation);
    }

    public function getHistory(Request $request)
    {
        $validated = $request->validate(['branch' => 'required|string']);
        $history = SalesReconciliation::where('branch', $validated['branch'])
            ->whereNotNull('total_sales_from_receipt')
            ->orderBy('date', 'desc')
            ->orderBy('updated_at', 'desc')
            ->take(50)
            ->get();
        return response()->json($history);
    }
}
