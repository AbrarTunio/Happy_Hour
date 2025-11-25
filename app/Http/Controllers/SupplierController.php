<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB; // <-- Import the DB facade
use Carbon\Carbon;


class SupplierController extends Controller
{
    public function index()
    {
        return Supplier::withCount('invoices')
            ->withSum('invoices', 'total') // This calculates the sum of the 'total' column on the invoices table
            ->orderBy('company_name')
            ->get();
    }

    public function show($id)
    {
        return Supplier::with(['ingredients', 'invoices'])->findOrFail($id);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255|unique:suppliers',
            'primary_contact_person' => 'required|string|max:255',
            'email_address' => 'required|email|max:255',
            'phone_number' => 'required|string|max:50',
            'abn' => 'nullable|string|max:20',
            'street_address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:50',
            'postcode' => 'nullable|string|max:20',
            'entity_type' => 'nullable|string|max:255',
            'entity_status' => 'nullable|string|max:100',
            'product_categories' => 'nullable|array',
        ]);

        $supplier = Supplier::create($validated);


        return response()->json($supplier, 201);
    }


    /**
     * Handles the ABN lookup request from the frontend.
     */
    public function abnLookup(Request $request)
    {
        $validated = $request->validate(['abn' => 'required|string']);
        $abn = preg_replace('/\s+/', '', $validated['abn']);
        $guid = env('ABN_LOOKUP_GUID');

        if (!$guid) {
            Log::error('ABN Lookup GUID is not configured in .env file.');
            return response()->json(['message' => 'ABN Lookup service is not configured.'], 500);
        }

        $apiUrl = "https://abr.business.gov.au/json/AbnDetails.aspx";

        try {
            $response = Http::timeout(10)->get($apiUrl, [
                'abn' => $abn,
                'guid' => $guid,
                'callback' => 'jsonpCallback'
            ]);

            if ($response->failed()) {
                return response()->json(['message' => 'Could not connect to the ABN Lookup service.'], 503);
            }

            $responseBody = $response->body();
            if (!preg_match('/^jsonpCallback\((.*)\)$/s', $responseBody, $matches)) {
                throw new \Exception('Invalid JSONP response format from ABN service.');
            }
            $jsonString = $matches[1];
            $data = json_decode($jsonString, true);

            if (isset($data['Message']) && !empty($data['Message'])) {
                return response()->json(['message' => $data['Message']], 404);
            }

            if ($data === null) {
                throw new \Exception('Failed to decode JSON from ABN service response.');
            }

            // --- NEW: Smart Address Parsing Logic ---
            $addressComponents = [
                'street_address' => '',
                'city' => '',
                'state' => '',
                'postcode' => ''
            ];
            $formattedAddress = 'N/A';

            // Case 1: Full physical address is available
            if (isset($data['MainBusinessPhysicalAddress']['StateCode'])) {
                $physicalAddress = $data['MainBusinessPhysicalAddress'];
                $addressComponents['street_address'] = trim($physicalAddress['AddressLine1'] ?? '');
                $addressComponents['city'] = trim($physicalAddress['Suburb'] ?? '');
                $addressComponents['state'] = trim($physicalAddress['StateCode'] ?? '');
                $addressComponents['postcode'] = trim($physicalAddress['Postcode'] ?? '');

                $formattedAddress = implode(', ', array_filter([$addressComponents['street_address'], $addressComponents['city'], $addressComponents['state'] . ' ' . $addressComponents['postcode']]));
            }
            // Case 2: Only State and Postcode are available (like for Procal Dairies)
            elseif (isset($data['AddressState']) && isset($data['AddressPostcode'])) {
                $addressComponents['state'] = trim($data['AddressState']);
                $addressComponents['postcode'] = trim($data['AddressPostcode']);
                $formattedAddress = $addressComponents['state'] . ' ' . $addressComponents['postcode'];
            }

            $entityType = $data['EntityTypeName'] ?? 'N/A';

            $formattedData = [
                'business_name' => $data['EntityName'] ?? 'N/A',
                'entity_type'   => $entityType,
                'status'        => $data['AbnStatus'] ?? 'N/A',
                'formatted_address' => $formattedAddress,      // For display on step 1
                'address_components' => $addressComponents,   // For pre-filling step 3
            ];

            return response()->json($formattedData);
        } catch (\Exception $e) {
            Log::error('ABN Lookup Exception: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred during ABN lookup.'], 500);
        }
    }

    public function destroy($id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->delete();
        return response()->json(null, 204);
    }
}
