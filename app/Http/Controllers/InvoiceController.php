<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Ingredient;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Models\IngredientPriceHistory;

class InvoiceController extends Controller
{
    public function index()
    {
        return Invoice::with('supplier')->orderBy('invoice_date', 'desc')->get()->map(function ($invoice) {
            if (empty($invoice->status)) {
                $invoice->status = 'uploaded';
            }
            return $invoice;
        });
    }

    public function show($id)
    {
        $invoice = Invoice::with('supplier')->findOrFail($id);
        return response()->json($invoice);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'invoice_file' => 'required|file|mimes:pdf,jpg,png,jpeg|max:4096',
        ]);

        $path = $request->file('invoice_file')->store('invoices', 'public');
        $supplier = Supplier::find($validated['supplier_id']);
        $prefix = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $supplier->company_name), 0, 3));

        $invoice = Invoice::create([
            'supplier_id' => $validated['supplier_id'],
            'invoice_date' => $validated['invoice_date'],
            'due_date' => $validated['due_date'],
            'invoice_file' => $path,
            'invoice_number' => $prefix . '-' . date('Ymd') . '-' . Str::random(4),
            'status' => 'uploaded',
        ]);

        return response()->json($invoice->load('supplier'), 201);
    }

    public function processWithAI(Request $request, Invoice $invoice)
    {
        if ($invoice->status === 'processing') {
            return response()->json(['message' => 'Invoice is currently being processed.'], 409);
        }

        if (!in_array($invoice->status, ['uploaded', 'needs review'])) {
            return response()->json(['message' => 'Invoice has already been processed.'], 409);
        }

        $invoice->status = 'processing';
        $invoice->save();

        try {
            $apiKey = env('GEMINI_API_KEY');
            if (!$apiKey) throw new \Exception('Gemini API key is not configured.');

            $filePath = storage_path('app/public/' . $invoice->invoice_file);
            if (!file_exists($filePath)) throw new \Exception('Invoice file not found on the server.');

            $imageData = base64_encode(file_get_contents($filePath));
            $mimeType = mime_content_type($filePath);
            $prompt = file_get_contents(base_path('prompts/invoice_extraction_prompt.txt'));
            $client = new \GuzzleHttp\Client();

            Log::info("Sending request to Gemini API for invoice {$invoice->id}");

            $response = $client->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                'json' => [
                    'contents' => [['parts' => [['text' => $prompt], ['inline_data' => ['mime_type' => $mimeType, 'data' => $imageData]]]]],
                    'generationConfig' => ['response_mime_type' => 'application/json']
                ],
                'timeout' => 60
            ]);

            $result = json_decode($response->getBody(), true);
            if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                throw new \Exception('No response from AI model');
            }

            $jsonResponse = trim($result['candidates'][0]['content']['parts'][0]['text']);
            Log::info("Raw Gemini response for invoice {$invoice->id}: " . $jsonResponse);

            $extractedData = json_decode($jsonResponse, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('AI returned an invalid data structure. JSON Error: ' . json_last_error_msg());
            }

            if (!isset($extractedData['orders']) || !is_array($extractedData['orders'])) {
                $extractedData['orders'] = [];
            }

            $this->calculateAndValidateTotals($extractedData);
            $this->updateInvoiceFromExtractedData($invoice, $extractedData);

            // This method now automatically creates ingredients and adds status flags.
            $ingredientsAdded = $this->processInvoiceItemsAndCreateIngredients($extractedData, $invoice);

            $invoice->ai_extraction_data = $extractedData;
            $invoice->status = 'processed';
            $invoice->save();

            Log::info("Invoice {$invoice->id} processed successfully. {$ingredientsAdded} new ingredients were created.");

            return response()->json([
                'message' => 'Invoice processed successfully. ' . $ingredientsAdded . ' new ingredients were automatically added.',
                'invoice' => $invoice
            ]);
        } catch (\Exception $e) {
            Log::error("Gemini Processing Error for Invoice ID " . $invoice->id . ": " . $e->getMessage());
            $invoice->status = 'needs review';
            $invoice->save();
            return response()->json(['message' => "AI processing failed: " . $e->getMessage()], 500);
        }
    }

    private function calculateAndValidateTotals(&$extractedData)
    {
        if (empty($extractedData['orders'])) {
            $extractedData['totals'] = ['ex_tax' => 0, 'gst' => 0, 'grand_total' => 0];
            return;
        }
        $calculatedSubtotal = 0;
        $calculatedGST = 0;
        foreach ($extractedData['orders'] as &$item) {
            $quantity = floatval($item['qty'] ?? 1);
            $unitPrice = floatval($item['price'] ?? 0);
            $item['total'] = isset($item['total']) ? floatval($item['total']) : ($quantity * $unitPrice);
            $item['gst'] = floatval($item['gst'] ?? $item['GST'] ?? 0);
            $calculatedSubtotal += $item['total'];
            $calculatedGST += $item['gst'];
        }
        if (!isset($extractedData['totals'])) $extractedData['totals'] = [];
        $extractedData['totals']['ex_tax'] = floatval($extractedData['totals']['ex_tax'] ?? $calculatedSubtotal);
        $extractedData['totals']['gst'] = floatval($extractedData['totals']['gst'] ?? $calculatedGST);
        $extractedData['totals']['grand_total'] = floatval($extractedData['totals']['grand_total'] ?? ($calculatedSubtotal + $calculatedGST));
    }

    private function updateInvoiceFromExtractedData($invoice, $extractedData)
    {
        if (isset($extractedData['details']['invoice_number'])) {
            $invoice->invoice_number = $extractedData['details']['invoice_number'];
        }
        $invoice->total = $extractedData['totals']['grand_total'] ?? $invoice->total;
    }

    private function processInvoiceItemsAndCreateIngredients(&$extractedData, $invoice)
    {
        $ingredientsAdded = 0;
        if (empty($extractedData['orders'])) {
            return $ingredientsAdded;
        }

        foreach ($extractedData['orders'] as &$item) {
            $description = trim($item['description'] ?? '');
            $price = $item['price'] ?? null;

            if (!empty($description)) {
                $existingIngredient = Ingredient::whereRaw('LOWER(ingredient_name) = ?', [strtolower($description)])->first();

                if (!$existingIngredient) {
                    $item['is_new_system'] = true; // Flag for frontend display
                    $unit = strtolower($item['unit'] ?? 'unit');
                    $category = ucfirst($item['category'] ?? 'Uncategorised');

                    $newIngredient = Ingredient::create([
                        'ingredient_name' => $description,
                        'category' => $category,
                        'unit' => $unit,
                        'primary_supplier_id' => $invoice->supplier_id,
                        'current_price' => $price ? round($price, 2) : null,
                    ]);

                    if ($price) {
                        IngredientPriceHistory::create(['ingredient_id' => $newIngredient->id, 'price' => round($price, 2), 'log_date' => now()]);
                    }
                    $ingredientsAdded++;
                } else {
                    $item['is_new_system'] = false; // Flag for frontend display
                    if ($price && $existingIngredient->current_price != round($price, 2)) {
                        $existingIngredient->update(['current_price' => round($price, 2)]);
                        IngredientPriceHistory::create(['ingredient_id' => $existingIngredient->id, 'price' => round($price, 2), 'log_date' => now()]);
                    }
                }
            }
        }
        unset($item);
        return $ingredientsAdded;
    }

    public function destroy($id)
    {
        $invoice = Invoice::findOrFail($id);
        if ($invoice->invoice_file) {
            Storage::disk('public')->delete($invoice->invoice_file);
        }
        $invoice->delete();
        return response()->json(null, 204);
    }
}
