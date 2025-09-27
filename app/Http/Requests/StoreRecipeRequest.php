<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRecipeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recipe_name' => 'required|string|max:255|unique:recipes,recipe_name',
            'selling_price' => 'required|numeric|min:0',
            'target_margin' => 'nullable|numeric|min:0|max:100',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.id' => 'required|exists:ingredients,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.01',
        ];
    }
}
