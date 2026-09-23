<?php
$baseDir = __DIR__;

$resources = [
    'UserResource' => <<<'PHP'
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
            'phone' => $this->phone,
            'position' => $this->position,
            'jersey_number' => $this->jersey_number,
            'avatar' => $this->avatar ? url('storage/' . $this->avatar) : null,
            'bio' => $this->bio,
            'role' => $this->role,
            'status' => $this->status,
            'created_at' => $this->created_at,
        ];
    }
}
PHP,
    'PostResource' => <<<'PHP'
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
            'featured_image' => $this->featured_image ? url('storage/' . $this->featured_image) : null,
            'category' => $this->category,
            'status' => $this->status,
            'published_at' => $this->published_at,
            'author' => new UserResource($this->whenLoaded('author')),
            'created_at' => $this->created_at,
        ];
    }
}
PHP,
    'EventResource' => <<<'PHP'
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
            'creator' => new UserResource($this->whenLoaded('creator')),
            'registrations_count' => $this->registrations_count ?? $this->registrations()->count(),
            'created_at' => $this->created_at,
        ];
    }
}
PHP,
    'ConvocatoriaResource' => <<<'PHP'
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConvocatoriaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'location' => $this->location,
            'match_date' => $this->match_date->format('Y-m-d'),
            'match_time' => $this->match_time->format('H:i'),
            'max_players' => $this->max_players,
            'rival' => $this->rival,
            'status' => $this->status,
            'creator' => new UserResource($this->whenLoaded('creator')),
            'confirmed_count' => $this->confirmaciones()->where('status', 'confirmado')->count(),
            'rejected_count' => $this->confirmaciones()->where('status', 'rechazado')->count(),
            'pending_count' => $this->confirmaciones()->where('status', 'pendiente')->count(),
            'confirmaciones' => ConfirmacionResource::collection($this->whenLoaded('confirmaciones')),
            'created_at' => $this->created_at,
        ];
    }
}
PHP,
    'ConfirmacionResource' => <<<'PHP'
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
            'notes' => $this->notes,
            'confirmed_at' => $this->confirmed_at,
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
PHP,
    'GalleryResource' => <<<'PHP'
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
            'cover_image' => $this->cover_image ? url('storage/' . $this->cover_image) : null,
            'media_count' => $this->media_count ?? $this->media()->count(),
            'media' => MediaResource::collection($this->whenLoaded('media')),
            'created_at' => $this->created_at,
        ];
    }
}
PHP,
    'MediaResource' => <<<'PHP'
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
            'file_path' => url('storage/' . $this->file_path),
            'thumbnail_path' => $this->thumbnail_path ? url('storage/' . $this->thumbnail_path) : null,
            'title' => $this->title,
            'caption' => $this->caption,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
        ];
    }
}
PHP
];

foreach ($resources as $name => $content) {
    file_put_contents("$baseDir/app/Http/Resources/$name.php", $content);
}

echo "Resources created.\n";
