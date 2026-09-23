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
            'avatar' => $this->avatar ? (str_starts_with($this->avatar, 'http') ? $this->avatar : \Illuminate\Support\Facades\Storage::disk(env('FILESYSTEM_DISK', 'public'))->url($this->avatar)) : null,
            'bio' => $this->bio,
            'birth_date' => $this->birth_date,
            'blood_type' => $this->blood_type,
            'nickname' => $this->nickname,
            'role' => $this->role,
            'status' => $this->status,
            'is_approved' => (bool) $this->is_approved,
            'payment_receipt' => $this->payment_receipt ? (str_starts_with($this->payment_receipt, 'http') ? $this->payment_receipt : \Illuminate\Support\Facades\Storage::disk(env('FILESYSTEM_DISK', 'public'))->url($this->payment_receipt)) : null,
            'created_at' => $this->created_at,
        ];
    }
}