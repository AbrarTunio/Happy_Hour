<?php

namespace App\Http\Controllers;

use App\Models\Timesheet;
use Illuminate\Http\Request;
use Carbon\Carbon;


class TimeSheetController extends Controller
{
   // changed sheet name
    /**
     * Store a newly created resource in storage. (For Manager's "Add Time Entry" Modal)
     */
    public function store(Request $request)
    {
        // The validation logic is updated to provide a better error message.
        $validated = $request->validate([
            'employee_id' => 'required|exists:teams,id',
            'date' => 'required|date',
            'clock_in' => 'required|date_format:H:i',
            // The 'after:clock_in' rule correctly compares H:i formatted time strings on the same day.
            'clock_out' => 'required|date_format:H:i|after:clock_in',
            'notes' => 'nullable|string',
        ], [
            // This is the custom error message that will be sent to the frontend.
            'clock_out.after' => 'The clock out time must be after the clock in time.'
        ]);

        $timesheet = Timesheet::create([
            'team_id' => $validated['employee_id'],
            'clock_in' => Carbon::parse($validated['date'] . ' ' . $validated['clock_in']),
            'clock_out' => Carbon::parse($validated['date'] . ' ' . $validated['clock_out']),
            'notes' => $validated['notes'],
            'status' => 'completed',
        ]);

        return response()->json($timesheet, 201);
    }

    /**
     * Handle the employee clock-in action.
     */
    public function clockIn(Request $request)
    {
        $validated = $request->validate(['team_id' => 'required|exists:teams,id']);

        // Prevent clocking in if already active
        $existing = Timesheet::where('team_id', $validated['team_id'])->whereIn('status', ['active', 'on_break'])->first();
        if ($existing) {
            return response()->json(['message' => 'Already clocked in.'], 409); // 409 Conflict
        }

        $sheet = Timesheet::create([
            'team_id' => $validated['team_id'],
            'clock_in' => now(),
            'status' => 'active',
        ]);

        return response()->json($sheet, 201);
    }

    /**
     * Handle the employee clock-out action.
     */
    public function clockOut(Request $request)
    {
        $validated = $request->validate(['team_id' => 'required|exists:teams,id']);
        $sheet = Timesheet::where('team_id', $validated['team_id'])->whereIn('status', ['active', 'on_break'])->latest()->firstOrFail();

        $sheet->update([
            'clock_out' => now(),
            'status' => 'completed',
            // If they were on break, end the break automatically
            'break_end' => $sheet->break_start && !$sheet->break_end ? now() : $sheet->break_end,
        ]);
        return response()->json($sheet);
    }

    /**
     * Handle the employee start break action.
     */
    public function startBreak(Request $request)
    {
        $validated = $request->validate(['team_id' => 'required|exists:teams,id']);
        $sheet = Timesheet::where('team_id', $validated['team_id'])->where('status', 'active')->latest()->firstOrFail();

        $sheet->update(['break_start' => now(), 'status' => 'on_break']);
        return response()->json($sheet);
    }

    /**
     * Handle the employee end break action.
     */
    public function endBreak(Request $request)
    {
        $validated = $request->validate(['team_id' => 'required|exists:teams,id']);
        $sheet = Timesheet::where('team_id', $validated['team_id'])->where('status', 'on_break')->latest()->firstOrFail();

        $sheet->update(['break_end' => now(), 'status' => 'active']);
        return response()->json($sheet);
    }

}
