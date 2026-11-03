<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $canViewPrivateData = $viewer && ($viewer->isAdmin() || (int) $viewer->id === (int) $this->id);

        $data = [
            'id' => $this->id,
            'name' => $this->full_name,
            'nombres' => $this->nombres,
            'apellido_paterno' => $this->apellido_paterno,
            'apellido_materno' => $this->apellido_materno,
            'full_name' => $this->full_name,
            'position' => $this->position,
            'jersey_number' => $this->jersey_number,
            'avatar' => \\App\\Helpers\\ImageHelper::getUrl($this->avatar),
            'bio' => $this->bio,
            'nickname' => $this->nickname,
            'role' => $this->role,
            'status' => $this->status,
            'is_approved' => (bool) $this->is_approved,
            'has_pending_multas' => $this->resource instanceof \\App\\Models\\User ? $this->hasPendingMultas() : false,
            'created_at' => $this->created_at,
        ];

        if ($canViewPrivateData) {
            $data += [
                'email' => $this->email,
                'dni' => $this->dni,
                'phone' => $this->phone,
                'birth_date' => $this->birth_date,
                'blood_type' => $this->blood_type,
                'payment_receipt' => \\App\\Helpers\\ImageHelper::getUrl($this->payment_receipt),
            ];
        }

        return $data;
    }
}
