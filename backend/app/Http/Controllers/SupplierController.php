<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index()
    {
        return Supplier::all();
    }

    public function show($id)
    {
        // FIX: Eager-load the 'invoices' relationship along with ingredients
        $supplier = Supplier::with(['ingredients', 'invoices'])->findOrFail($id);

        // Manually construct the detailed response the frontend expects
        $response = [
            // Include all original supplier attributes
            'id' => $supplier->id,
            'company_name' => $supplier->company_name,
            'ingredients' => $supplier->ingredients,

            // Mock the performance data as before
            'performance' => [
                'overall_rating' => 4.8,
                'total_orders' => 24,
                'on_time_delivery' => 96,
                'quality_rating' => 4.9,
            ],
            // Mock the financial data as before
            'financials' => [
                'monthly_spend' => 2840.50,
                'last_order_date' => '2025-08-05',
                'supplier_type' => 'Premium',
            ],

            // --- DYNAMIC ORDER HISTORY IS HERE ---
            // Map over the REAL invoices to create the order history array.
            'order_history' => $supplier->invoices->map(function ($invoice) {
                return [
                    'id' => $invoice->invoice_number, // Use invoice_number as the Order ID
                    'date' => $invoice->invoice_date,
                    'items' => rand(2, 10), // Mock item count since it's not on the invoice model
                    'status' => ucfirst($invoice->status), // Capitalize status for display
                    'total' => $invoice->total,
                ];
            }),
        ];

        return response()->json($response);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'email_address' => 'required|email|unique:suppliers,email_address',
            'abn' => 'nullable|string|max:20|unique:suppliers,abn',
            'primary_contact_person' => 'required|string',
            'phone_number' => 'required|string',
            'street_address' => 'nullable|string',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'postcode' => 'nullable|string',
            'entity_type' => 'nullable|string',
            'entity_status' => 'nullable|string',
            'product_categories' => 'nullable|array',
        ]);

        $supplier = Supplier::create($validated);
        return response()->json($supplier, 201);
    }
    public function abnLookup(Request $request)
    {
        $request->validate(['abn' => 'required|string']);
        $abn = preg_replace('/[\s-]+/', '', $request->input('abn'));

        $abnData = [
            '12345678901' => ['business_name' => 'Sydney Fresh Foods Pty Ltd', 'entity_type' => 'Australian Private Company', 'status' => 'Active', 'address' => '45 Market Street, Sydney, NSW 2000'],
            '98765432109' => ['business_name' => 'Melbourne Coffee Roasters', 'entity_type' => 'Australian Public Company', 'status' => 'Active', 'address' => '101 Collins Street, Melbourne, VIC 3000'],
            '55555555555' => ['business_name' => 'Inactive Business', 'entity_type' => 'Sole Trader', 'status' => 'Cancelled', 'address' => '123 Fake Street, Adelaide, SA 5000']
        ];

        if (array_key_exists($abn, $abnData)) {
            $data = $abnData[$abn];
            if ($data['status'] !== 'Active') {
                return response()->json(['message' => "This business is inactive (Status: {$data['status']})."], 404);
            }
            return response()->json($data);
        }

        return response()->json(['message' => 'No business found with this ABN. You can still continue by entering details manually.'], 404);
    }
}
