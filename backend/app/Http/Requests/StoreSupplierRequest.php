<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => 'required|string|max:255',
            'primary_contact_person' => 'required|string|max:255',
            'email_address' => 'required|email|unique:suppliers,email_address',
            'phone_number' => 'required|string|max:20',
            'street_address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:50',
            'postcode' => 'nullable|string|max:20',
        ];
    }
}
