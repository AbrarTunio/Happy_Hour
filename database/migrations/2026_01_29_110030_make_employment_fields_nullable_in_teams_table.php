<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->string('position')->nullable()->change();
            $table->string('branch')->nullable()->change();
            $table->string('department')->nullable()->change();
            $table->string('employment_type')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->string('position')->nullable(false)->change();
            $table->string('branch')->nullable(false)->change();
            $table->string('department')->nullable(false)->change();
            $table->string('employment_type')->nullable(false)->change();
        });
    }
};
