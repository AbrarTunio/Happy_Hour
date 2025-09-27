<?php
// app/Http/Requests/UpdateIngredientRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIngredientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $ingredientId = $this->route('ingredient')->id;

        return [
            // Ensure the name is unique, but ignore the current ingredient's name
            'ingredient_name' => ['required', 'string', 'max:255', Rule::unique('ingredients')->ignore($ingredientId)],
            'category' => 'required|string|max:100',
            'unit' => 'required|string|max:20',
            'current_price' => 'required|numeric|min:0',
            'primary_supplier_id' => 'nullable|exists:suppliers,id',
            'brand' => 'nullable|string|max:255',
            'storage_type' => 'nullable|string|max:100',
            'shelf_life' => 'nullable|integer|min:0',
            'allergens' => 'nullable|array',
            'reorder_level' => 'nullable|integer|min:0',
            'maximum_stock' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
        ];
    }
}
