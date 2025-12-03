<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimeSheet extends Model
{
    //
    use HasFactory;

    protected $fillable = [
        'team_id',
        'clock_in',
        'clock_out',
        'break_start',
        'break_end',
        'status',
        'notes',
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

}
