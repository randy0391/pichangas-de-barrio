<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'file_path' => request()->getSchemeAndHttpHost() . '/storage/' . $this->file_path,
            'thumbnail_path' => $this->thumbnail_path ? request()->getSchemeAndHttpHost() . '/storage/' . $this->thumbnail_path : null,
            'title' => $this->title,
            'caption' => $this->caption,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
        ];
    }
}