<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rosters', function (Blueprint $table) {
            $table->id();
            $table->date('week_start'); // Monday of that week
            $table->string('day');       // MON, TUE, etc.
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('target')->default(6);
            $table->json('assigned_staff'); // Stores array of staff IDs
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rosters');
    }
};
