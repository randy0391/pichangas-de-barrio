<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConfirmacionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'convocatoria_id' => $this->convocatoria_id,
            'status' => $this->status,
            'match_role' => $this->match_role,
            'team_number' => $this->team_number,
            'notes' => $this->notes,
            'confirmed_at' => $this->confirmed_at,
            'payment_receipt' => $this->payment_receipt ? url('storage/' . $this->payment_receipt) : null,
            'attendance' => $this->attendance,
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}