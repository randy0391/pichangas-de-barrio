<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'cover_image' => $this->cover_image ? request()->getSchemeAndHttpHost() . '/storage/' . $this->cover_image : null,
            'media_count' => $this->media_count ?? $this->media()->count(),
            'media' => MediaResource::collection($this->whenLoaded('media')),
            'created_at' => $this->created_at,
        ];
    }
}