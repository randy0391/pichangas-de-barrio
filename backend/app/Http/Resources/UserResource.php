<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'dni' => $this->dni,
            'phone' => $this->phone,
            'position' => $this->position,
            'jersey_number' => $this->jersey_number,
            'avatar' => \App\Helpers\ImageHelper::getUrl($this->avatar),
            'bio' => $this->bio,
            'birth_date' => $this->birth_date,
            'blood_type' => $this->blood_type,
            'nickname' => $this->nickname,
            'role' => $this->role,
            'status' => $this->status,
            'is_approved' => (bool) $this->is_approved,
            'payment_receipt' => \App\Helpers\ImageHelper::getUrl($this->payment_receipt),
            'created_at' => $this->created_at,
        ];
    }
}