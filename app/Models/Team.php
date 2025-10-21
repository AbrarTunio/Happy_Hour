<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone_number',
        'date_of_birth',
        'tax_file_number',
        'home_address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'position',
        'branch',
        'department',
        'employment_type',
        'hourly_rate',
        'start_date',
        'staff_code',
        'status', // <-- ADDED
        'schedule',
    ];

    protected $casts = [
        'schedule' => 'array',
        'date_of_birth' => 'date',
        'start_date' => 'date',
    ];

    public function timesheets()
    {
        return $this->hasMany(Timesheet::class);
    }
}
