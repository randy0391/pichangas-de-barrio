<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    use HasFactory;

    protected $fillable = [
        'gallery_id', 'post_id', 'user_id', 'type', 'file_path', 'thumbnail_path', 'title', 'caption', 'sort_order'
    ];

    public function gallery()
    {
        return $this->belongsTo(Gallery::class);
    }

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}