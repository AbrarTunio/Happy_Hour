<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreIngredientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // The unique rule is removed from ingredient_name to allow updates
            'ingredient_name' => 'required|string|max:255',
            'category' => 'required|string',
            'unit' => 'required|string',
            'current_price' => 'required|numeric|min:0',
            'primary_supplier_id' => 'required|exists:suppliers,id',
            'brand' => 'nullable|string',
            'storage_type' => 'nullable|string',
            'shelf_life' => 'nullable|integer|min:0',
            'reorder_level' => 'nullable|integer|min:0',
            'maximum_stock' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
        ];
    }
}
