<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    use HasFactory;
    protected $fillable = ['ingredient_name', 'category', 'unit', 'primary_supplier_id', 'brand', 'storage_type', 'shelf_life', 'reorder_level', 'maximum_stock', 'notes'];

    // FIX: Add monthly_usage to the appends array
    protected $appends = ['current_price', 'seven_day_change', 'monthly_usage'];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'primary_supplier_id');
    }

    public function priceHistory()
    {
        return $this->hasMany(IngredientPriceHistory::class)->orderBy('log_date', 'desc');
    }

    public function latestPrice()
    {
        return $this->hasOne(IngredientPriceHistory::class)->latestOfMany('log_date');
    }

    public function recipes()
    {
        return $this->belongsToMany(Recipe::class, 'ingredient_recipe')->withPivot('quantity');
    }

    // --- NEW: Add a monthly_usage accessor ---
    // This will calculate and append the monthly usage to the API response.
    protected function monthlyUsage(): Attribute
    {
        // In a real app, this would be calculated from orders. For now, we mock it.
        return Attribute::make(get: fn() => rand(50, 250));
    }

    protected function currentPrice(): Attribute
    {
        return Attribute::make(get: fn() => $this->latestPrice?->price);
    }

    protected function sevenDayChange(): Attribute
    {
        return Attribute::make(get: function () {
            $this->loadMissing('priceHistory');
            $prices = $this->priceHistory;
            if ($prices->count() < 2) {
                return null;
            }
            $latest = $prices[0]->price;
            $previous = $prices[1]->price;
            if ($previous == 0) return $latest > 0 ? 100 : 0;
            return round((($latest - $previous) / $previous) * 100);
        });
    }
}
