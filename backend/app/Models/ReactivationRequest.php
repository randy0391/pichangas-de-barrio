<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReactivationRequest extends Model
{
    protected $fillable = ['user_id', 'status', 'message', 'admin_note', 'reviewed_by', 'reviewed_at'];

    protected $casts = ['reviewed_at' => 'datetime'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
