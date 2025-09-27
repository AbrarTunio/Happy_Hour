<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Ingredient;
use App\Models\IngredientPriceLog;

class IngredientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $eggs = Ingredient::firstOrCreate(['ingredient_name' => 'Eggs'], ['unit' => 'each']);
        IngredientPriceLog::create(['ingredient_id' => $eggs->id, 'supplier_id' => 2, 'price' => 0.40, 'log_date' => now()->subDays(5)]);
        IngredientPriceLog::create(['ingredient_id' => $eggs->id, 'supplier_id' => 2, 'price' => 0.45, 'log_date' => now()]);

        $avocados = Ingredient::firstOrCreate(['ingredient_name' => 'Avocados'], ['unit' => 'each']);
        IngredientPriceLog::create(['ingredient_id' => $avocados->id, 'supplier_id' => 2, 'price' => 3.50, 'log_date' => now()->subDays(3)]);
        IngredientPriceLog::create(['ingredient_id' => $avocados->id, 'supplier_id' => 2, 'price' => 3.20, 'log_date' => now()]);
    }
}
