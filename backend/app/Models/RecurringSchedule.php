<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecurringSchedule extends Model
{
    use HasFactory;

    protected $table = 'recurring_schedules';

    protected $fillable = [
        'day_of_week',
        'day_name',
        'title',
        'description',
        'match_time',
        'cost_per_player',
        'location',
        'maps_url',
        'max_players',
        'num_teams',
        'is_active',
        'weeks_ahead',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'cost_per_player' => 'decimal:2',
        'max_players' => 'integer',
        'num_teams' => 'integer',
        'is_active' => 'boolean',
        'weeks_ahead' => 'integer',
    ];
}
