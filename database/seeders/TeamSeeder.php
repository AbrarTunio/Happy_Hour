<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Team;
use Carbon\Carbon;

class TeamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Team::truncate();

        // --- Store Manager ---
        Team::create([
            'first_name' => 'Sarah',
            'last_name' => 'Johnson',
            'email' => 'manager@onlymetric.com',
            'phone_number' => '0412345678',
            'date_of_birth' => '1988-05-12',
            'tax_file_number' => '123456789',
            'home_address' => '123 George Street, Sydney NSW',
            'emergency_contact_name' => 'Mark Johnson',
            'emergency_contact_phone' => '0498765432',

            'position' => 'Store Manager',
            'branch' => 'Sydney CBD',
            'department' => 'Management',
            'employment_type' => 'Full-Time',
            'hourly_rate' => 35.50,
            'start_date' => Carbon::now()->subYears(3),
            'staff_code' => '1234',

            'schedule' => [
                'monday'    => ['active' => true, 'start' => '09:00', 'end' => '17:00'],
                'tuesday'   => ['active' => true, 'start' => '09:00', 'end' => '17:00'],
                'wednesday' => ['active' => true, 'start' => '09:00', 'end' => '17:00'],
                'thursday'  => ['active' => true, 'start' => '09:00', 'end' => '17:00'],
                'friday'    => ['active' => true, 'start' => '09:00', 'end' => '17:00'],
                'saturday'  => ['active' => false, 'start' => '', 'end' => ''],
                'sunday'    => ['active' => false, 'start' => '', 'end' => ''],
            ],

            'status' => 'active',
        ]);

        // --- Head Barista ---
        Team::create([
            'first_name' => 'Eric',
            'last_name' => 'Foreman',
            'email' => 'barista@onlymetric.com',
            'phone_number' => '0422112233',
            'date_of_birth' => '1992-09-22',
            'tax_file_number' => '987654321',
            'home_address' => '45 Collins Street, Melbourne VIC',
            'emergency_contact_name' => 'Anna Foreman',
            'emergency_contact_phone' => '0488112233',

            'position' => 'Head Barista',
            'branch' => 'Melbourne Central',
            'department' => 'Cafe Operations',
            'employment_type' => 'Full-Time',
            'hourly_rate' => 28.75,
            'start_date' => Carbon::now()->subYears(2),
            'staff_code' => '5678',

            'schedule' => [
                'monday'    => ['active' => false, 'start' => '', 'end' => ''],
                'tuesday'   => ['active' => true, 'start' => '07:00', 'end' => '15:00'],
                'wednesday' => ['active' => true, 'start' => '07:00', 'end' => '15:00'],
                'thursday'  => ['active' => true, 'start' => '07:00', 'end' => '15:00'],
                'friday'    => ['active' => true, 'start' => '07:00', 'end' => '15:00'],
                'saturday'  => ['active' => true, 'start' => '08:00', 'end' => '16:00'],
                'sunday'    => ['active' => false, 'start' => '', 'end' => ''],
            ],

            'status' => 'active',
        ]);

        // --- Kitchen Staff ---
        Team::create([
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'staff@onlymetric.com',
            'phone_number' => '0433556677',
            'date_of_birth' => '1998-03-14',
            'tax_file_number' => '456789123',
            'home_address' => '78 Pitt Street, Sydney NSW',
            'emergency_contact_name' => 'John Doe',
            'emergency_contact_phone' => '0400111222',

            'position' => 'Kitchen Staff',
            'branch' => 'Sydney CBD',
            'department' => 'Kitchen',
            'employment_type' => 'Part-Time',
            'hourly_rate' => 24.50,
            'start_date' => Carbon::now()->subMonths(10),
            'staff_code' => '9012',

            'schedule' => [
                'monday'    => ['active' => true, 'start' => '10:00', 'end' => '15:00'],
                'tuesday'   => ['active' => false, 'start' => '', 'end' => ''],
                'wednesday' => ['active' => true, 'start' => '10:00', 'end' => '15:00'],
                'thursday'  => ['active' => false, 'start' => '', 'end' => ''],
                'friday'    => ['active' => true, 'start' => '10:00', 'end' => '18:00'],
                'saturday'  => ['active' => false, 'start' => '', 'end' => ''],
                'sunday'    => ['active' => false, 'start' => '', 'end' => ''],
            ],

            'status' => 'active',
        ]);
    }
}
