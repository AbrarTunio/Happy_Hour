<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IngredientPriceHistory extends Model
{
    use HasFactory;

    // --- THE FIX IS HERE ---
    // Explicitly tell Laravel the table name is singular, matching the migration.
    protected $table = 'ingredient_price_history';

    protected $fillable = ['ingredient_id', 'price', 'log_date'];
}
