<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiInsight extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * We ONLY need to list 'data' here, because the polymorphic keys
     * 'insightable_id' and 'insightable_type' are handled automatically
     * by the relationship methods (like create, save, updateOrCreate).
     *
     * @var array<int, string>
     */
    protected $fillable = ['data']; // THIS IS THE FIX

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'data' => 'array',
    ];

    /**
     * Get the parent insightable model (supplier, recipe, or ingredient).
     */
    public function insightable()
    {
        return $this->morphTo();
    }
    public function kpi()
    {
        // Assumes one insight can only create one KPI
        return $this->hasOne(Kpi::class);
    }
}
