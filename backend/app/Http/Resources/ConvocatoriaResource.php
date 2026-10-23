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
        $myConfirmacion = $authUser 
            ? $this->confirmaciones()->where('user_id', $authUser->id)->first() 
            : null;

        $confirmedCount = $this->confirmaciones()->where('status', 'confirmado')->count();
        $spotsRemaining = max(0, $this->max_players - $confirmedCount);

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
            'num_teams' => $this->num_teams,
            'rival' => $this->rival,
            'cost_per_player' => $this->cost_per_player ?? 0,
            'status' => $dynamicStatus,
            'creator' => new UserResource($this->whenLoaded('creator')),
            'confirmed_count' => $confirmedCount,
            'spots_remaining' => $spotsRemaining,
            'is_full' => $confirmedCount >= $this->max_players,
            'is_user_confirmed' => $myConfirmacion ? ($myConfirmacion->status === 'confirmado') : false,
            'user_match_role' => $myConfirmacion ? $myConfirmacion->match_role : null,
            'rejected_count' => $this->confirmaciones()->where('status', 'rechazado')->count(),
            'pending_count' => $this->confirmaciones()->where('status', 'pendiente')->count(),
            'porteros_count' => $this->confirmaciones()->where('status', 'confirmado')->where('match_role', 'portero')->count(),
            'confirmaciones' => ConfirmacionResource::collection($this->whenLoaded('confirmaciones')),
            'has_teams' => $this->confirmaciones()->whereNotNull('team_number')->exists(),
            'created_at' => $this->created_at,
        ];
    }
}
