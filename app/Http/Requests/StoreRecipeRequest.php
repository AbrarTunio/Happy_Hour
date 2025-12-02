<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule; // Import Rule

class StoreRecipeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Handle both direct ID or Model Instance if using Route Model Binding
        $recipe = $this->route('recipe');
        $recipeId = $recipe ? (is_numeric($recipe) ? $recipe : $recipe->id) : null;
        return [
            'recipe_name' => [
                'required',
                'string',
                'max:255',
                // Correctly ignore the current recipe ID
                Rule::unique('recipes', 'recipe_name')->ignore($recipeId),
            ],
            'selling_price' => 'required|numeric|min:0',
            'target_margin' => 'nullable|numeric|min:0|max:100',

            // Ensure 'ingredients' is present and is an array
            'ingredients' => 'present|array',

            // Validate each item inside the ingredients array
            'ingredients.*.id' => 'required|integer|exists:ingredients,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.001', // Allow small quantities
        ];
    }
}
