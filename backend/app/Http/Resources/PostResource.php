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
            'featured_image' => \App\Helpers\ImageHelper::getUrl($this->featured_image),
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