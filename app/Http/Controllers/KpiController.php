<?php

namespace App\Http\Controllers;

use App\Models\Kpi;
use Illuminate\Http\Request;

class KpiController extends Controller
{
    /**
     * Display a listing of all KPIs.
     */
    public function index()
    {
        // Return all KPIs, ordered by the most recently created
        return Kpi::with('aiInsight')->latest()->get();
    }

    /**
     * Store a newly created KPI in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'ai_insight_id' => 'required|exists:ai_insights,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'baseline_value' => 'required|numeric',
            'target_value' => 'required|numeric',
            'unit' => 'required|string|max:50',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'milestones' => 'nullable|array',
            'milestones.*.name' => 'required_with:milestones|string',
            'milestones.*.target_date' => 'required_with:milestones|date',
            'milestones.*.target_value' => 'nullable|numeric',
        ]);

        // Prevent creating a duplicate KPI for the same insight
        $existingKpi = Kpi::where('ai_insight_id', $validated['ai_insight_id'])->first();
        if ($existingKpi) {
            return response()->json(['message' => 'A KPI for this insight already exists.'], 409);
        }

        $kpi = Kpi::create($validated);

        return response()->json($kpi->load('aiInsight'), 201);
    }

}
