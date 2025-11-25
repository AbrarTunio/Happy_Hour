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
        Schema::create('kpis', function (Blueprint $table) {
            $table->id();
             // This links the KPI back to the AI Insight that generated it
            $table->foreignId('ai_insight_id')->nullable()->constrained('ai_insights')->onDelete('set null');

            $table->string('title');
            $table->text('description')->nullable();

            $table->decimal('baseline_value', 10, 2);
            $table->decimal('target_value', 10, 2);


            $table->date('start_date');
            $table->date('end_date');

            // This will store the list of milestones as a JSON array
            $table->json('milestones')->nullable();

            $table->string('status')->default('active'); // e.g., active, completed, archived
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kpis');
    }
};
