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
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('ingredient_name');
            $table->string('category');
            $table->string('unit');
            $table->foreignId('primary_supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            $table->string('brand')->nullable();
            $table->string('storage_type')->nullable();
            $table->integer('shelf_life')->nullable(); // in days
            $table->integer('reorder_level')->nullable()->default(0);
            $table->integer('maximum_stock')->nullable()->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
