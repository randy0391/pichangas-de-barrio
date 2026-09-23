<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'location' => $this->location,
            'event_date' => $this->event_date->format('Y-m-d'),
            'event_time' => $this->event_time->format('H:i'),
            'cover_image' => $this->cover_image ? url('storage/' . $this->cover_image) : null,
            'status' => $this->status,
            'max_participants' => $this->max_participants,
            'creator' => new UserResource($this->whenLoaded('creator')),
            'registrations' => $this->whenLoaded('registrations'),
            'registrations_count' => $this->registrations_count ?? $this->registrations()->count(),
            'created_at' => $this->created_at,
        ];
    }
}