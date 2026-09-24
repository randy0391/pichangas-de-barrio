<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Multa extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'convocatoria_id',
        'amount',
        'reason',
        'status',
        'payment_receipt',
        'admin_notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function convocatoria()
    {
        return $this->belongsTo(Convocatoria::class);
    }
}
