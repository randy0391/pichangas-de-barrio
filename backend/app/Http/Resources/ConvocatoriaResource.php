<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class ConvocatoriaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $dynamicStatus = $this->status;
        
        // Si la fecha y hora ya pasaron, la mostramos como finalizada en vez de abierta
        $matchDateOnly = Carbon::parse($this->match_date->format('Y-m-d'), 'America/Lima')->endOfDay();
        if ($dynamicStatus === 'abierta' && now()->timezone('America/Lima')->gt($matchDateOnly)) {
            $dynamicStatus = 'finalizada';
        }

        $authUser = $request->user();
        $confirmacionesLoaded = $this->relationLoaded('confirmaciones');
        $myConfirmacion = null;
        if ($authUser) {
            $myConfirmacion = $confirmacionesLoaded
                ? $this->confirmaciones->firstWhere('user_id', $authUser->id)
                : $this->confirmaciones()->where('user_id', $authUser->id)->first();
        }

        // Prefer precomputed aggregate columns to avoid one query per metric and convocatoria.
        $countConfirmaciones = function (string $attribute, string $status, ?string $role = null) use ($confirmacionesLoaded): int {
            if ($this->getAttribute($attribute) !== null) {
                return (int) $this->getAttribute($attribute);
            }

            if ($confirmacionesLoaded) {
                $items = $this->confirmaciones->where('status', $status);
                if ($role === 'portero') {
                    $items = $items->where('match_role', 'portero');
                } elseif ($role === 'jugador') {
                    $items = $items->filter(fn ($item) => $item->match_role !== null && $item->match_role !== 'portero');
                }
                return $items->count();
            }

            $query = $this->confirmaciones()->where('status', $status);
            if ($role === 'portero') {
                $query->where('match_role', 'portero');
            } elseif ($role === 'jugador') {
                $query->where('match_role', '!=', 'portero');
            }
            return $query->count();
        };

        $numTeams = max(2, (int) ($this->num_teams ?: 2));
        $confirmedCount = $countConfirmaciones('confirmed_count', 'confirmado');
        $spotsRemaining = max(0, $this->max_players - $confirmedCount);
        $porterosCount = $countConfirmaciones('porteros_count_agg', 'confirmado', 'portero');
        $jugadoresCount = $countConfirmaciones('jugadores_count_agg', 'confirmado', 'jugador');
        $maxPorteros = $numTeams;
        $maxJugadores = max(0, (int) $this->max_players - $maxPorteros);
        $porterosRemaining = max(0, $maxPorteros - $porterosCount);
        $jugadoresRemaining = max(0, $maxJugadores - $jugadoresCount);
        $isPorterosFull = $porterosCount >= $maxPorteros;
        $isJugadoresFull = $jugadoresCount >= $maxJugadores;

        $hasTeams = $this->getAttribute('has_teams_agg') !== null
            ? (int) $this->getAttribute('has_teams_agg') > 0
            : ($confirmacionesLoaded
                ? $this->confirmaciones->contains(fn ($item) => $item->team_number !== null)
                : $this->confirmaciones()->whereNotNull('team_number')->exists());
        $drawMetadata = $this->draw_metadata ?: \Illuminate\Support\Facades\Cache::get("convocatoria_{$this->id}_draw_meta");
        if (!$drawMetadata && $numTeams > 2 && $hasTeams) {
            $drawMetadata = [
                'first_match' => [
                    'team_a' => 1,
                    'team_b' => 2,
                    'resting_teams' => array_values(range(3, $numTeams)),
                ]
            ];
        }

        $dayNames = [
            0 => 'Domingo',
            1 => 'Lunes',
            2 => 'Martes',
            3 => 'Miercoles',
            4 => 'Jueves',
            5 => 'Viernes',
            6 => 'Sabado',
            7 => 'Domingo'
        ];
        $carbonDate = Carbon::parse($this->match_date->format('Y-m-d'));
        $dayName = $dayNames[$carbonDate->dayOfWeek] ?? '';

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'location' => $this->location,
            'maps_url' => $this->maps_url,
            'match_date' => $this->match_date->format('Y-m-d'),
            'match_time' => $this->match_time->format('H:i'),
            'day_name' => $dayName,
            'max_players' => $this->max_players,
            'num_teams' => $numTeams,
            'max_porteros' => $maxPorteros,
            'max_jugadores' => $maxJugadores,
            'rival' => $this->rival,
            'cost_per_player' => $this->cost_per_player ?? 0,
            'status' => $dynamicStatus,
            'creator' => new UserResource($this->whenLoaded('creator')),
            'confirmed_count' => $confirmedCount,
            'spots_remaining' => $spotsRemaining,
            'porteros_count' => $porterosCount,
            'jugadores_count' => $jugadoresCount,
            'porteros_remaining' => $porterosRemaining,
            'jugadores_remaining' => $jugadoresRemaining,
            'is_full' => $confirmedCount >= $this->max_players,
            'is_porteros_full' => $isPorterosFull,
            'is_jugadores_full' => $isJugadoresFull,
            'is_user_confirmed' => $myConfirmacion ? ($myConfirmacion->status === 'confirmado') : false,
            'user_match_role' => $myConfirmacion ? $myConfirmacion->match_role : null,
            'rejected_count' => $countConfirmaciones('rejected_count_agg', 'rechazado'),
            'pending_count' => $countConfirmaciones('pending_count_agg', 'pendiente'),
            'confirmaciones' => ConfirmacionResource::collection($this->whenLoaded('confirmaciones')),
            'has_teams' => $hasTeams,
            'draw_metadata' => $drawMetadata,
            'created_at' => $this->created_at,
        ];
    }
}
