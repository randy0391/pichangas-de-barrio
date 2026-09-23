<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConvocatoriaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'location' => $this->location,
            'match_date' => $this->match_date->format('Y-m-d'),
            'match_time' => $this->match_time->format('H:i'),
            'max_players' => $this->max_players,
            'num_teams' => $this->num_teams,
            'rival' => $this->rival,
            'status' => $this->status,
            'creator' => new UserResource($this->whenLoaded('creator')),
            'confirmed_count' => $this->confirmaciones()->where('status', 'confirmado')->count(),
            'rejected_count' => $this->confirmaciones()->where('status', 'rechazado')->count(),
            'pending_count' => $this->confirmaciones()->where('status', 'pendiente')->count(),
            'porteros_count' => $this->confirmaciones()->where('status', 'confirmado')->where('match_role', 'portero')->count(),
            'confirmaciones' => ConfirmacionResource::collection($this->whenLoaded('confirmaciones')),
            'created_at' => $this->created_at,
        ];
    }
}