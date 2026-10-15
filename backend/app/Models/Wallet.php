<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'balance',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(WalletTransaction::class)->orderBy('created_at', 'desc');
    }

    public function requestRecharge($amount, $receiptPath, $description = 'Recarga via Yape/Plin')
    {
        return $this->transactions()->create([
            'user_id' => $this->user_id,
            'type' => 'recarga',
            'amount' => $amount,
            'balance_after' => $this->balance, // balance unchanged until approved
            'description' => $description,
            'receipt_path' => $receiptPath,
            'status' => 'pendiente',
        ]);
    }

    public function withdraw($amount, $description, $referenceType = null, $referenceId = null)
    {
        $newBalance = $this->balance - $amount;
        $this->balance = $newBalance;
        $this->save();

        return $this->transactions()->create([
            'user_id' => $this->user_id,
            'type' => 'descuento',
            'amount' => -$amount,
            'balance_after' => $newBalance,
            'description' => $description,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'status' => 'aprobado',
            'approved_at' => now(),
        ]);
    }

    public function refund($amount, $description, $referenceType = null, $referenceId = null)
    {
        $newBalance = $this->balance + $amount;
        $this->balance = $newBalance;
        $this->save();

        return $this->transactions()->create([
            'user_id' => $this->user_id,
            'type' => 'devolucion',
            'amount' => $amount,
            'balance_after' => $newBalance,
            'description' => $description,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'status' => 'aprobado',
            'approved_at' => now(),
        ]);
    }

    public function adjust($amount, $description, $adminId = null)
    {
        $newBalance = $this->balance + $amount;
        $this->balance = $newBalance;
        $this->save();

        return $this->transactions()->create([
            'user_id' => $this->user_id,
            'type' => 'ajuste',
            'amount' => $amount,
            'balance_after' => $newBalance,
            'description' => $description,
            'reference_type' => 'manual',
            'status' => 'aprobado',
            'approved_by' => $adminId,
            'approved_at' => now(),
        ]);
    }
}
