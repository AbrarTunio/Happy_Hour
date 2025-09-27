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
        'home_address',
        'position',
        'employment_type',
        'hourly_rate',
        'start_date',
        'branch',
        'schedule',
        // 'permissions',
        // 'kpis'
    ];

    protected $casts = [
        'schedule' => 'array',
        'permissions' => 'array',
        'kpis' => 'array',
    ];

    public function timesheets()
    {
        return $this->hasMany(Timesheet::class);
    }
}
