<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IngredientPriceLog extends Model
{
    use HasFactory;
    protected $fillable = ['ingredient_id', 'supplier_id', 'price', 'log_date'];
}
