<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id' => 'required|exists:suppliers,id',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'invoice_file' => 'required|file|mimes:pdf,jpg,png|max:2048', // 2MB max
            // Note: We assume total and invoice number are extracted on the backend,
            // but for this example, we'll make them optional from the frontend.
            'total' => 'nullable|numeric|min:0',
            'invoice_number' => 'nullable|string|unique:invoices,invoice_number'
        ];
    }
}
