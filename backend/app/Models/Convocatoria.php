<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Convocatoria extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'title', 'description', 'location', 'match_date', 'match_time', 'max_players', 'num_teams', 'rival', 'status'
    ];

    protected $casts = [
        'match_date' => 'date',
        'match_time' => 'datetime:H:i',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function confirmaciones()
    {
        return $this->hasMany(Confirmacion::class);
    }
}