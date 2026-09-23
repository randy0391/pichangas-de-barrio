<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Confirmacion extends Model
{
    use HasFactory;
    protected $table = 'confirmaciones';

    protected $fillable = [
        'convocatoria_id', 'user_id', 'status', 'match_role', 'team_number', 'notes', 'confirmed_at', 'payment_receipt'
    ];

    protected $casts = [
        'confirmed_at' => 'datetime',
    ];

    public function convocatoria()
    {
        return $this->belongsTo(Convocatoria::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}