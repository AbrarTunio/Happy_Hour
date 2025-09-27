<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Team;

class TeamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        Team::firstOrCreate(
            ['email' => 'sarah.j@company.com'],
            [
                'first_name' => 'Sarah',
                'last_name' => 'Johnson',
                'position' => 'Store Manager',
                'employment_type' => 'Full-Time',
                'hourly_rate' => 28.50,
                'branch' => 'Sydney CBD',
            ]
        );
        Team::firstOrCreate(
            ['email' => 'michael.c@company.com'],
            [
                'first_name' => 'Michael',
                'last_name' => 'Chen',
                'position' => 'Barista',
                'employment_type' => 'Part-Time',
                'hourly_rate' => 22.75,
                'branch' => 'Melbourne Central',
            ]
        );
    }
}
