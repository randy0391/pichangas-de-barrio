<?php

namespace App\Services;

use App\Models\Convocatoria;
use App\Models\RecurringSchedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class RecurringConvocatoriaService
{
    public static function generateUpcoming(?int $weeksAhead = null): array
    {
        $schedules = RecurringSchedule::where('is_active', true)->get();
        if ($schedules->isEmpty()) {
            return [
                'created_count' => 0,
                'message' => 'No hay plantillas de convocatorias recurrentes activas.',
                'created_dates' => []
            ];
        }

        $admin = User::where('role', 'admin')->first();
        $adminId = $admin ? $admin->id : 1;

        $nowLima = Carbon::now('America/Lima');
        $todayLima = $nowLima->copy()->startOfDay();
        $createdCount = 0;
        $createdDates = [];

        foreach ($schedules as $schedule) {
            $weeks = $weeksAhead ?? $schedule->weeks_ahead ?? 4;
            $matchTimeStr = substr($schedule->match_time, 0, 5);

            for ($w = 0; $w <= $weeks; $w++) {
                // Carbon startOfWeek is Monday by default
                $weekStart = $nowLima->copy()->startOfWeek(Carbon::MONDAY)->addWeeks($w);
                // Calculate day of week (1=Monday ... 7=Sunday)
                $targetDate = $weekStart->copy()->addDays($schedule->day_of_week - 1)->startOfDay();

                // If date is before today, skip
                if ($targetDate->lt($todayLima)) {
                    continue;
                }

                // If date is today, check if match time has already passed
                if ($targetDate->equalTo($todayLima)) {
                    $matchDateTime = Carbon::createFromFormat('Y-m-d H:i', $targetDate->toDateString() . ' ' . $matchTimeStr, 'America/Lima');
                    if ($nowLima->gt($matchDateTime)) {
                        continue;
                    }
                }

                // Check if convocatoria already exists on target date
                $exists = Convocatoria::whereDate('match_date', $targetDate->toDateString())->exists();
                if (!$exists) {
                    $conv = Convocatoria::create([
                        'user_id' => $adminId,
                        'title' => $schedule->title,
                        'description' => $schedule->description ?: "Pichanga oficial de {$schedule->day_name}. Costo: S/ " . number_format($schedule->cost_per_player, 2) . ". Cupos limitados.",
                        'location' => $schedule->location ?: 'Cancha Sintetica Oficial',
                        'maps_url' => $schedule->maps_url,
                        'match_date' => $targetDate->toDateString(),
                        'match_time' => $schedule->match_time,
                        'max_players' => $schedule->max_players ?: 14,
                        'num_teams' => $schedule->num_teams ?: 2,
                        'rival' => null,
                        'cost_per_player' => $schedule->cost_per_player,
                        'status' => 'abierta',
                    ]);

                    $createdCount++;
                    $createdDates[] = [
                        'id' => $conv->id,
                        'title' => $conv->title,
                        'date' => $targetDate->toDateString(),
                        'day' => $schedule->day_name,
                        'cost' => $schedule->cost_per_player,
                    ];
                }
            }
        }

        return [
            'created_count' => $createdCount,
            'message' => $createdCount > 0 
                ? "Se generaron {$createdCount} convocatorias automaticamente para las proximas fechas." 
                : "Todas las convocatorias de las proximas semanas ya se encuentran creadas y al dia.",
            'created_dates' => $createdDates
        ];
    }
}
