<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    use HasFactory;
    protected $fillable = ['recipe_name', 'selling_price', 'target_margin'];
    protected $appends = ['cost', 'margin'];

    public function ingredients()
    {
        // Assumes your pivot table is named 'ingredient_recipe'
        return $this->belongsToMany(Ingredient::class, 'ingredient_recipe')->withPivot('quantity');
    }
    public function insight()
    {
        // A model can have one polymorphic insight record.
        return $this->morphOne(AiInsight::class, 'insightable');
    }
    protected function cost(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->relationLoaded('ingredients')) {
                    $this->load('ingredients.latestPrice');
                }

                return $this->ingredients->sum(function ($ingredient) {
                    // FIX: Use null coalescing operator (?? 0) to prevent crash if price is missing
                    return $ingredient->pivot->quantity * ($ingredient->current_price ?? 0);
                });
            }
        );
    }

    protected function margin(): Attribute
    {
        return Attribute::make(
            get: function () {
                $cost = $this->cost;
                if ($this->selling_price > 0) {
                    return (($this->selling_price - $cost) / $this->selling_price) * 100;
                }
                return 0;
            }
        );
    }


}
