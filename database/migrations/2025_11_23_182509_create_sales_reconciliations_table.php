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
        Schema::create('sales_reconciliations', function (Blueprint $table) {
            $table->id();
            $table->string('branch');
            $table->date('date');
            $table->string('status')->default('pending');

            $table->string('receipt_file_path')->nullable();
            $table->decimal('total_sales_from_receipt', 10, 2)->nullable();

            $table->json('recipe_breakdown')->nullable();

            $table->decimal('total_breakdown_sales', 10, 2)->nullable();
            $table->decimal('total_cogs', 10, 2)->nullable();
            $table->decimal('variance', 10, 2)->nullable();
            // $table->unique(['branch', 'date']);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_reconciliations');
    }
};
