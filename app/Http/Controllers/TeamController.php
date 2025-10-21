<?php

namespace App\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Your sorting logic is correct.
        return Team::with('timesheets')->orderBy('created_at', 'desc')->get();
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $teamMember = Team::findOrFail($id);
        return response()->json($teamMember);
    }

    /**
     * Get the current clock-in status for a team member.
     */
    public function status(Team $team)
    {
        $activeSheet = $team->timesheets()
            ->whereIn('status', ['active', 'on_break'])
            ->latest() // Get the most recent active sheet
            ->first();

        return response()->json($activeSheet);
    }

    /**
     * Authenticate a team member using their staff code.
     */
    public function loginByCode(Request $request)
    {
        $validated = $request->validate(['staff_code' => 'required|string']);

        $teamMember = Team::where('staff_code', $validated['staff_code'])->first();

        if (!$teamMember) {
            return response()->json(['message' => 'Invalid staff code.'], 404);
        }

        if ($teamMember->status !== 'active') {
            return response()->json(['message' => 'Your account is inactive. Please contact a manager.'], 403); // 403 Forbidden
        }

        return response()->json($teamMember);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:teams,email',
            'phone_number' => 'nullable|string',
            'date_of_birth' => 'nullable|date',
            'tax_file_number' => 'nullable|string',
            'home_address' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string',
            'emergency_contact_phone' => 'nullable|string',
            'position' => 'required|string',
            'branch' => 'required|string',
            'department' => 'required|string',
            'employment_type' => 'required|string',
            'hourly_rate' => 'required|numeric|min:0',
            'start_date' => 'nullable|date',
            'staff_code' => 'required|string|unique:teams,staff_code',
            'schedule' => 'nullable|array',
        ]);

        // --- CHANGE: Force status to 'inactive' on creation ---
        $validated['status'] = 'inactive';

        $teamMember = Team::create($validated);
        return response()->json($teamMember, 201);
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $teamMember = Team::findOrFail($id);
        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:teams,email,' . $teamMember->id,
            'phone_number' => 'nullable|string',
            'date_of_birth' => 'nullable|date',
            'tax_file_number' => 'nullable|string',
            'home_address' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string',
            'emergency_contact_phone' => 'nullable|string',
            'position' => 'sometimes|required|string',
            'branch' => 'sometimes|required|string',
            'department' => 'sometimes|required|string',
            'employment_type' => 'sometimes|required|string',
            'hourly_rate' => 'sometimes|required|numeric|min:0',
            'start_date' => 'nullable|date',
            'staff_code' => 'sometimes|required|string|unique:teams,staff_code,' . $teamMember->id,
            'schedule' => 'nullable|array',
        ]);

        $teamMember->update($validated);
        return response()->json($teamMember);
    }

    /**
     * Update just the status of a team member.
     */
    public function updateStatus(Request $request, Team $team)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:active,inactive',
        ]);

        $team->update(['status' => $validated['status']]);

        return response()->json($team);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $teamMember = Team::findOrFail($id);
        $teamMember->delete();
        return response()->json(null, 204);
    }
    public function getRecentTimesheets(Team $team)
    {
        $timesheets = $team->timesheets()
            ->latest('clock_in')
            ->take(5)
            ->get();

        return response()->json($timesheets);
    }
    public function register(Request $request)
    {
        $validated = $request->validate([
            // Personal
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:teams,email',
            'phone_number' => 'required|string|max:50',
            'date_of_birth' => 'required|date',
            'home_address' => 'required|string',
            'emergency_contact_name' => 'required|string|max:255',
            'emergency_contact_phone' => 'required|string|max:50',
            // Employment
            'position' => 'required|string|max:255',
            'branch' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'employment_type' => 'required|string|max:50',
            'start_date' => 'required|date',
            // Security
            'staff_code' => 'required|string|min:4|max:10|unique:teams,staff_code|confirmed',
        ]);

        // Manually set status to 'inactive' and default hourly rate to 0
        $validated['status'] = 'inactive';
        $validated['hourly_rate'] = 0.00;

        $team = Team::create($validated);

        return response()->json([
            'message' => 'Your registration has been submitted. A manager will review your details and activate your account shortly.'
        ], 201);
    }
}
