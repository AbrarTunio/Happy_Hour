<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class InvoiceController extends Controller
{
    public function index()
    {
        $invoices = Invoice::with('supplier')->orderBy('invoice_date', 'desc')->get();
        $totalInvoices = $invoices->count();
        $processedCount = $invoices->where('status', 'processed')->count();

        return response()->json([
            'invoices' => $invoices,
            'stats' => [
                'processing_queue' => $invoices->where('status', 'processing')->count(),
                'needs_review' => $invoices->where('status', 'needs review')->count(),
                'approved' => $processedCount,
                'match_rate' => $totalInvoices ? round(($processedCount / $totalInvoices) * 100) : 0
            ]
        ]);
    }

    public function show($id)
    {
        return response()->json(
            Invoice::with('supplier')->findOrFail($id)
        );
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
        $prefix = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $supplier->company_name), 0, 3));

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

        $invoice->update(['status' => 'processing']);

        try {
            $apiKey = env('GEMINI_API_KEY');
            if (!$apiKey) throw new \Exception('Gemini API key missing');

            $filePath = storage_path("app/public/" . $invoice->invoice_file);
            if (!file_exists($filePath)) throw new \Exception("Invoice file not found");

            $imageData = base64_encode(file_get_contents($filePath));
            $mime = mime_content_type($filePath);
            $prompt = file_get_contents(base_path("prompts/invoice_extraction_prompt.txt"));

            $client = new Client();

            $resp = $client->post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey",
                [
                    'json' => [
                        'contents' => [['parts' => [
                            ['text' => $prompt],
                            ['inline_data' => ['mime_type' => $mime, 'data' => $imageData]]
                        ]]],
                        'generationConfig' => ['response_mime_type' => 'application/json']
                    ],
                    'timeout' => 90
                ]
            );

            $raw = json_decode($resp->getBody(), true);
            $jsonTxt = $raw['candidates'][0]['content']['parts'][0]['text'] ?? '';

            if (!str_starts_with(trim($jsonTxt), '{')) {
                $start = strpos($jsonTxt, '{');
                $end = strrpos($jsonTxt, '}');
                if ($start !== false && $end !== false)
                    $jsonTxt = substr($jsonTxt, $start, $end - $start + 1);
            }

            $data = json_decode($jsonTxt, true);
            if (!is_array($data)) throw new \Exception("AI returned malformed JSON");

            // Reject logic
            if (($data['status'] ?? '') === 'rejected') {
                $invoice->update([
                    'status' => 'rejected',
                    'ai_extraction_data' => $data
                ]);

                return response()->json([
                    'message' => $data['invalid_reason'] ?? "Document Rejected",
                    'invoice' => $invoice
                ], 422);
            }

            if (empty($data['orders']) || empty($data['details']['invoice_number'] ?? null)) {
                $data['status'] = 'rejected';
                $data['invalid_reason'] = "Missing invoice structure";

                $invoice->update([
                    'status' => 'rejected',
                    'ai_extraction_data' => $data
                ]);

                return response()->json([
                    'message' => "Invalid Invoice Document",
                    'invoice' => $invoice
                ], 422);
            }

            // Smart validation RAW
            $this->performSmartValidation($data);

            // Save
            $invoice->invoice_number = $data['details']['invoice_number'];
            $invoice->total = $data['totals']['grand_total'] ?? 0;
            $invoice->ai_extraction_data = $data;
            $invoice->status = $data['status'];
            $invoice->save();

            return response()->json([
                'message' => "Invoice processed ({$data['status']})",
                'invoice' => $invoice
            ]);
        } catch (\Exception $e) {
            Log::error("AI ERROR INVOICE {$invoice->id}: " . $e->getMessage());
            $invoice->update(['status' => 'needs review']);

            return response()->json([
                'message' => "AI failed: " . $e->getMessage()
            ], 500);
        }
    }

    /**
     * SMART RAW VALIDATION (NO ROUNDING)
     */
    private function performSmartValidation(&$data)
    {
        $lineCorrect = true;
        $grandCorrect = true;
        $discrepancies = [];
        $sum = 0;

        foreach ($data['orders'] as &$item) {
            $qty = floatval($item['qty']);
            $price = floatval($item['price']);
            $printed = floatval($item['total']);
            $expected = $qty * $price; // RAW

            $item['expected_total'] = $expected;
            $item['calculated_correctly'] = ($printed == $expected);

            if ($printed != $expected) {
                $lineCorrect = false;
                $discrepancies[] = "{$item['description']}: $qty × $price = $expected but shows $printed";
            }

            $sum += $printed;
        }

        $docGrand = floatval($data['totals']['grand_total'] ?? 0);

        if ($sum != $docGrand) {
            $grandCorrect = false;
            $discrepancies[] = "Sum of line totals: $sum but Grand Total shows $docGrand";
        }

        // Store validation
        $data['calculation_validation'] = [
            'line_items_correct' => $lineCorrect,
            'grand_total_correct' => $grandCorrect,
            'sum_of_line_totals' => $sum,
            'document_grand_total' => $docGrand,
            'discrepancies' => $discrepancies
        ];

        $data['status'] = ($lineCorrect && $grandCorrect) ? 'processed' : 'needs review';
    }

    public function updateItems(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'orders' => 'required|array',
            'orders.*.description' => 'nullable|string',
            'orders.*.price' => 'required|numeric|min:0',
            'orders.*.qty' => 'required|numeric|min:0',
        ]);

        $data = $invoice->ai_extraction_data;
        $newOrders = [];
        $grand = 0;

        foreach ($validated['orders'] as $item) {
            $qty = floatval($item['qty']);
            $price = floatval($item['price']);
            $expected = $qty * $price; // RAW

            $newOrders[] = [
                'description' => $item['description'] ?? '',
                'qty' => $qty,
                'price' => $price,
                'total' => $expected,
                'expected_total' => $expected,
                'calculated_correctly' => true
            ];

            $grand += $expected;
        }

        $data['orders'] = $newOrders;
        $data['totals']['grand_total'] = $grand;

        // Validate again after edit
        $this->performSmartValidation($data);

        $invoice->update([
            'ai_extraction_data' => $data,
            'total' => $grand,
            'status' => $data['status']
        ]);

        return response()->json([
            'message' => 'Invoice updated.',
            'invoice' => $invoice
        ]);
    }

    public function destroy($id)
    {
        $invoice = Invoice::findOrFail($id);
        if ($invoice->invoice_file) Storage::disk('public')->delete($invoice->invoice_file);
        $invoice->delete();

        return response()->json(null, 204);
    }
}
