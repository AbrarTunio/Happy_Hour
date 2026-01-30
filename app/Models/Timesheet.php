<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Timesheet extends Model
{
    use HasFactory;


    protected $fillable = [
        'team_id',
        'clock_in',
        'clock_out',
        'break_start',
        'break_end',
        'status',
        'notes',
        'entry_type',
    ];

    protected $casts = [
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
        'break_start' => 'datetime',
        'break_end' => 'datetime',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }
    /**
     * Get clock_in time in a specific timezone
     */
    public function getClockInInTimezone($timezone)
    {
        return $this->clock_in ? Carbon::parse($this->clock_in)->setTimezone($timezone) : null;
    }

    /**
     * Get clock_out time in a specific timezone
     */
    public function getClockOutInTimezone($timezone)
    {
        return $this->clock_out ? Carbon::parse($this->clock_out)->setTimezone($timezone) : null;
    }

    /**
     * Calculate hours worked
     */
    public function getHoursWorked()
    {
        if (!$this->clock_in || !$this->clock_out) {
            return 0;
        }

        $start = Carbon::parse($this->clock_in);
        $end = Carbon::parse($this->clock_out);

        return $end->diffInHours($start);
    }
}
