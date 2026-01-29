<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Roster extends Model
{
    protected $fillable = [
        'week_start',
        'day',
        'start_time',
        'end_time',
        'target',
        'assigned_staff'
    ];

    protected $casts = [
        'assigned_staff' => 'array',
        'week_start' => 'date'
    ];
}
