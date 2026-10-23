<?php

namespace App\Http\Controllers;

use App\Models\RecurringSchedule;
use App\Services\RecurringConvocatoriaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class RecurringScheduleController extends Controller
{
    public function index()
    {
        try {
            $schedules = RecurringSchedule::orderBy('day_of_week', 'asc')->get();
            if ($schedules->isEmpty()) {
                Artisan::call('migrate', ['--force' => true]);
                $schedules = RecurringSchedule::orderBy('day_of_week', 'asc')->get();
            }
        } catch (\Throwable $e) {
            try {
                Artisan::call('migrate', ['--force' => true]);
                $schedules = RecurringSchedule::orderBy('day_of_week', 'asc')->get();
            } catch (\Throwable $e2) {
                $schedules = collect([
                    [
                        'id' => 1,
                        'day_of_week' => 2,
                        'day_name' => 'Martes',
                        'title' => 'Pichanga de los Martes',
                        'description' => 'Pichanga oficial de los Martes en Pichangas de Barrio FC.',
                        'match_time' => '20:00:00',
                        'cost_per_player' => '15.00',
                        'location' => 'Cancha Sintetica Oficial',
                        'maps_url' => null,
                        'max_players' => 14,
                        'num_teams' => 2,
                        'is_active' => true,
                        'weeks_ahead' => 4,
                    ],
                    [
                        'id' => 2,
                        'day_of_week' => 4,
                        'day_name' => 'Jueves',
                        'title' => 'Pichanga de los Jueves',
                        'description' => 'Pichanga oficial de los Jueves en Pichangas de Barrio FC.',
                        'match_time' => '20:00:00',
                        'cost_per_player' => '15.00',
                        'location' => 'Cancha Sintetica Oficial',
                        'maps_url' => null,
                        'max_players' => 14,
                        'num_teams' => 2,
                        'is_active' => true,
                        'weeks_ahead' => 4,
                    ],
                    [
                        'id' => 3,
                        'day_of_week' => 6,
                        'day_name' => 'Sabado',
                        'title' => 'Pichanga de los Sabados',
                        'description' => 'Pichanga estelar de los Sabados en Pichangas de Barrio FC.',
                        'match_time' => '18:00:00',
                        'cost_per_player' => '18.00',
                        'location' => 'Cancha Sintetica Oficial',
                        'maps_url' => null,
                        'max_players' => 14,
                        'num_teams' => 2,
                        'is_active' => true,
                        'weeks_ahead' => 4,
                    ]
                ]);
            }
        }

        return response()->json([
            'data' => $schedules,
            'summary' => [
                'martes' => collect($schedules)->firstWhere('day_of_week', 2),
                'jueves' => collect($schedules)->firstWhere('day_of_week', 4),
                'sabado' => collect($schedules)->firstWhere('day_of_week', 6),
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
        try {
            $weeks = $request->input('weeks', 4);
            $result = RecurringConvocatoriaService::generateUpcoming((int) $weeks);
            return response()->json($result);
        } catch (\Throwable $e) {
            Artisan::call('migrate', ['--force' => true]);
            $weeks = $request->input('weeks', 4);
            $result = RecurringConvocatoriaService::generateUpcoming((int) $weeks);
            return response()->json($result);
        }
    }
}
