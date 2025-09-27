<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            // $table->string('recipe_name');
            // $table->string('category')->nullable();
            // $table->decimal('selling_price', 10, 2);
            // $table->decimal('target_margin', 5, 2)->nullable(); // percentage (e.g., 70.00)
            // $table->integer('monthly_portions')->nullable();
            $table->string('recipe_name');
            $table->decimal('selling_price', 10, 2);
            $table->decimal('target_margin', 5, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recipes');
    }
};
