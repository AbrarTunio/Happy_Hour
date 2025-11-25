<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kpi extends Model
{
    use HasFactory;

    protected $fillable = [
        'ai_insight_id',
        'title',
        'description',
        'baseline_value',
        'target_value',
        'start_date',
        'end_date',
        'milestones',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'milestones' => 'array', // Automatically encodes/decodes the JSON
    ];

    /**
     * Get the AI Insight that this KPI originated from.
     */
    public function aiInsight()
    {
        return $this->belongsTo(AiInsight::class);
    }
}
