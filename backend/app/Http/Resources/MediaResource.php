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
            'file_path' => \App\Helpers\ImageHelper::getUrl($this->file_path),
            'thumbnail_path' => \App\Helpers\ImageHelper::getUrl($this->thumbnail_path),
            'title' => $this->title,
            'caption' => $this->caption,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
        ];
    }
}