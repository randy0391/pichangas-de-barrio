<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'content' => $this->content,
            'featured_image' => $this->featured_image ? (str_starts_with($this->featured_image, 'http') ? $this->featured_image : \Illuminate\Support\Facades\Storage::disk(env('FILESYSTEM_DISK', 'public'))->url($this->featured_image)) : null,
            'category' => $this->category,
            'status' => $this->status,
            'link' => $this->link,
            'link_title' => $this->link_title,
            'link_description' => $this->link_description,
            'link_image' => $this->link_image,
            'published_at' => $this->published_at,
            'author' => new UserResource($this->whenLoaded('author')),
            'created_at' => $this->created_at,
        ];
    }
}