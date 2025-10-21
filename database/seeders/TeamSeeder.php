<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Team; // <-- Import the Team model

class TeamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This will populate the 'teams' table with sample data.
     */
    public function run(): void
    {
        // Using truncate() is efficient for resetting the table.
        // It clears all existing records and resets the auto-incrementing ID.
        Team::truncate();

        // --- Create the Manager ---
        Team::create([
            'first_name' => 'Sarah',
            'last_name' => 'Johnson',
            'email' => 'manager@onlymetric.com',
            'staff_code' => '1234', // Login code for the manager
            'position' => 'Store Manager',
            'employment_type' => 'Full-Time',
            'hourly_rate' => 35.50,
            'branch' => 'Sydney CBD',
            'schedule' => [
                'monday' => ['active' => true, 'start' => '09:00', 'end' => '17:00'],
                'tuesday' => ['active' => true, 'start' => '09:00', 'end' => '17:00'],
                'wednesday' => ['active' => true, 'start' => '09:00', 'end' => '17:00'],
                'thursday' => ['active' => true, 'start' => '09:00', 'end' => '17:00'],
                'friday' => ['active' => true, 'start' => '09:00', 'end' => '17:00'],
                'saturday' => ['active' => false, 'start' => '', 'end' => ''],
                'sunday' => ['active' => false, 'start' => '', 'end' => ''],
            ]
        ]);

        // --- Create the Barista ---
        Team::create([
            'first_name' => 'Eric',
            'last_name' => 'Foreman',
            'email' => 'barista@onlymetric.com',
            'staff_code' => '5678', // Login code for the barista
            'position' => 'Head Barista',
            'employment_type' => 'Full-Time',
            'hourly_rate' => 28.75,
            'branch' => 'Melbourne Central',
            'schedule' => [
                'monday' => ['active' => false, 'start' => '', 'end' => ''],
                'tuesday' => ['active' => true, 'start' => '07:00', 'end' => '15:00'],
                'wednesday' => ['active' => true, 'start' => '07:00', 'end' => '15:00'],
                'thursday' => ['active' => true, 'start' => '07:00', 'end' => '15:00'],
                'friday' => ['active' => true, 'start' => '07:00', 'end' => '15:00'],
                'saturday' => ['active' => true, 'start' => '08:00', 'end' => '16:00'],
                'sunday' => ['active' => false, 'start' => '', 'end' => ''],
            ]
        ]);

        // --- Create General Staff ---
        Team::create([
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'staff@onlymetric.com',
            'staff_code' => '9012', // Login code for general staff
            'position' => 'Kitchen Staff',
            'employment_type' => 'Part-Time',
            'hourly_rate' => 24.50,
            'branch' => 'Sydney CBD',
            'schedule' => [
                'monday' => ['active' => true, 'start' => '10:00', 'end' => '15:00'],
                'tuesday' => ['active' => false, 'start' => '', 'end' => ''],
                'wednesday' => ['active' => true, 'start' => '10:00', 'end' => '15:00'],
                'thursday' => ['active' => false, 'start' => '', 'end' => ''],
                'friday' => ['active' => true, 'start' => '10:00', 'end' => '18:00'],
                'saturday' => ['active' => false, 'start' => '', 'end' => ''],
                'sunday' => ['active' => false, 'start' => '', 'end' => ''],
            ]
        ]);
    }
}
