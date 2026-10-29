<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Convocatoria extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'title', 'description', 'location', 'maps_url', 'match_date', 'match_time', 'max_players', 'num_teams', 'rival', 'cost_per_player', 'status', 'draw_metadata'
    ];

    protected $casts = [
        'match_date' => 'date',
        'match_time' => 'datetime:H:i',
        'cost_per_player' => 'decimal:2',
        'draw_metadata' => 'array',
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
