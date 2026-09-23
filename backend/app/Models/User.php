<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'dni',
        'phone',
        'position',
        'jersey_number',
        'avatar',
        'bio',
        'password',
        'role',
        'status',
        'is_approved',
        'payment_receipt',
        'birth_date',
        'blood_type',
        'nickname'
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function events()
    {
        return $this->hasMany(Event::class);
    }

    public function eventRegistrations()
    {
        return $this->hasMany(EventRegistration::class);
    }

    public function convocatorias()
    {
        return $this->hasMany(Convocatoria::class);
    }

    public function confirmaciones()
    {
        return $this->hasMany(Confirmacion::class);
    }

    public function galleries()
    {
        return $this->hasMany(Gallery::class);
    }

    public function media()
    {
        return $this->hasMany(Media::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}