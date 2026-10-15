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

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'location' => $this->location,
            'maps_url' => $this->maps_url,
            'match_date' => $this->match_date->format('Y-m-d'),
            'match_time' => $this->match_time->format('H:i'),
            'max_players' => $this->max_players,
            'num_teams' => $this->num_teams,
            'rival' => $this->rival,
            'cost_per_player' => $this->cost_per_player ?? 0,
            'status' => $dynamicStatus,
            'creator' => new UserResource($this->whenLoaded('creator')),
            'confirmed_count' => $this->confirmaciones()->where('status', 'confirmado')->count(),
            'rejected_count' => $this->confirmaciones()->where('status', 'rechazado')->count(),
            'pending_count' => $this->confirmaciones()->where('status', 'pendiente')->count(),
            'porteros_count' => $this->confirmaciones()->where('status', 'confirmado')->where('match_role', 'portero')->count(),
            'confirmaciones' => ConfirmacionResource::collection($this->whenLoaded('confirmaciones')),
            'has_teams' => $this->confirmaciones()->whereNotNull('team_number')->exists(),
            'created_at' => $this->created_at,
        ];
    }
}
