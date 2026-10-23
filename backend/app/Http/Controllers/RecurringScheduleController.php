<?php

namespace App\Http\Controllers;

use App\Models\RecurringSchedule;
use App\Services\RecurringConvocatoriaService;
use Illuminate\Http\Request;

class RecurringScheduleController extends Controller
{
    public function index()
    {
        $schedules = RecurringSchedule::orderBy('day_of_week', 'asc')->get();
        return response()->json([
            'data' => $schedules,
            'summary' => [
                'martes' => $schedules->firstWhere('day_of_week', 2),
                'jueves' => $schedules->firstWhere('day_of_week', 4),
                'sabado' => $schedules->firstWhere('day_of_week', 6),
            ]
        ]);
    }

    public function update(Request $request, $id)
    {
        $schedule = RecurringSchedule::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string',
            'match_time' => 'sometimes|required',
            'cost_per_player' => 'sometimes|required|numeric|min:0',
            'location' => 'sometimes|required|string|max:190',
            'maps_url' => 'nullable|string|max:255',
            'max_players' => 'sometimes|required|integer|min:4|max:50',
            'num_teams' => 'sometimes|required|integer|min:2|max:6',
            'is_active' => 'sometimes|required|boolean',
            'weeks_ahead' => 'sometimes|required|integer|min:1|max:12',
        ]);

        $schedule->update($validated);

        return response()->json([
            'message' => "Horario de {$schedule->day_name} actualizado exitosamente",
            'data' => $schedule
        ]);
    }

    public function generate(Request $request)
    {
        $weeks = $request->input('weeks', 4);
        $result = RecurringConvocatoriaService::generateUpcoming((int) $weeks);

        return response()->json($result);
    }
}
