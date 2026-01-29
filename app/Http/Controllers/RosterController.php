<?php

namespace App\Http\Controllers;

use App\Models\Roster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RosterController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['week_start' => 'required|date']);

        return Roster::where('week_start', $request->week_start)->get();
    }

    public function save(Request $request)
    {
        $validated = $request->validate([
            'week_start' => 'required|date',
            'shifts' => 'required|array',
            'shifts.*.day' => 'required|string',
            'shifts.*.startTime' => 'required',
            'shifts.*.endTime' => 'required',
            'shifts.*.target' => 'required|integer',
            'shifts.*.assignedStaff' => 'array'
        ]);

        return DB::transaction(function () use ($validated) {
            // Remove old roster for this week to overwrite
            Roster::where('week_start', $validated['week_start'])->delete();

            foreach ($validated['shifts'] as $shift) {
                Roster::create([
                    'week_start'     => $validated['week_start'],
                    'day'            => $shift['day'],
                    'start_time'     => $shift['startTime'],
                    'end_time'       => $shift['endTime'],
                    'target'         => $shift['target'],
                    'assigned_staff' => $shift['assignedStaff'],
                ]);
            }

            return response()->json(['message' => 'Roster saved successfully']);
        });
    }
}
