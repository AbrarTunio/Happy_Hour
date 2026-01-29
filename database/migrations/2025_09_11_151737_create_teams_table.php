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
        Schema::create('teams', function (Blueprint $table) {
            $table->id();

            // Personal Info
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone_number')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('tax_file_number')->nullable();
            $table->text('home_address')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();

            // Employment Info
            $table->string('position');
            $table->string('branch');
            $table->string('department'); // <-- WAS MISSING
            $table->string('employment_type');
            $table->decimal('hourly_rate', 10, 2);
            $table->date('start_date')->nullable();
            $table->string('staff_code')->unique()->nullable();

            // Schedule & Status
            $table->json('schedule')->nullable();
            $table->string('status')->default('active'); // active, inactive

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teams');
    }
};
