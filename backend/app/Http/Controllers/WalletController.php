<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Helpers\ImageHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function myWallet(Request $request)
    {
        $wallet = $request->user()->getOrCreateWallet();
        
        $transactions = $wallet->transactions()->paginate(20);

        return response()->json([
            'wallet' => [
                'id' => $wallet->id,
                'balance' => $wallet->balance,
            ],
            'transactions' => $transactions->through(function ($tx) {
                return [
                    'id' => $tx->id,
                    'type' => $tx->type,
                    'amount' => $tx->amount,
                    'balance_after' => $tx->balance_after,
                    'description' => $tx->description,
                    'reference_type' => $tx->reference_type,
                    'reference_id' => $tx->reference_id,
                    'receipt_path' => $tx->receipt_path ? ImageHelper::getUrl($tx->receipt_path) : null,
                    'status' => $tx->status,
                    'created_at' => $tx->created_at,
                ];
            }),
        ]);
    }

    public function requestRecharge(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1|max:1000',
            'receipt' => 'required|file|image|max:10240',
        ]);

        $wallet = $request->user()->getOrCreateWallet();

        $disk = config('filesystems.default', 'public');
        $path = $request->file('receipt')->store('wallet_receipts', $disk);

        $tx = $wallet->requestRecharge(
            $request->amount,
            $path,
            'Recarga via Yape/Plin (S/ ' . number_format($request->amount, 2) . ')'
        );

        return response()->json([
            'message' => 'Solicitud de recarga enviada. El administrador revisara el comprobante pronto.',
            'transaction' => $tx,
        ]);
    }

    public function adminListPending(Request $request)
    {
        $transactions = WalletTransaction::where('status', 'pendiente')
            ->where('type', 'recarga')
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($transactions->through(function ($tx) {
            return [
                'id' => $tx->id,
                'user_id' => $tx->user_id,
                'user' => $tx->user ? [
                    'id' => $tx->user->id,
                    'name' => $tx->user->full_name ?: $tx->user->nombres,
                    'phone' => $tx->user->phone,
                    'dni' => $tx->user->dni,
                ] : null,
                'type' => $tx->type,
                'amount' => $tx->amount,
                'balance_after' => $tx->balance_after,
                'description' => $tx->description,
                'receipt_path' => $tx->receipt_path ? ImageHelper::getUrl($tx->receipt_path) : null,
                'status' => $tx->status,
                'created_at' => $tx->created_at,
            ];
        }));
    }

    public function adminListAll(Request $request)
    {
        // Ensure all users have a wallet record
        $users = User::all();
        foreach ($users as $u) {
            $u->getOrCreateWallet();
        }

        $wallets = Wallet::with('user')
            ->orderBy('balance', 'desc')
            ->paginate(50);

        return response()->json($wallets->through(function ($w) {
            return [
                'id' => $w->id,
                'user_id' => $w->user_id,
                'balance' => $w->balance,
                'user' => $w->user ? [
                    'id' => $w->user->id,
                    'name' => $w->user->full_name ?: $w->user->nombres,
                    'phone' => $w->user->phone,
                    'dni' => $w->user->dni,
                ] : null,
                'created_at' => $w->created_at,
            ];
        }));
    }

    public function approveRecharge(Request $request, $id)
    {
        $tx = WalletTransaction::findOrFail($id);

        if ($tx->status !== 'pendiente') {
            return response()->json(['message' => 'Esta transaccion ya no esta pendiente.'], 400);
        }

        return DB::transaction(function () use ($tx, $request) {
            $wallet = Wallet::where('id', $tx->wallet_id)->lockForUpdate()->firstOrFail();

            $newBalance = $wallet->balance + $tx->amount;
            $wallet->balance = $newBalance;
            $wallet->save();

            $tx->status = 'aprobado';
            $tx->balance_after = $newBalance;
            $tx->approved_by = $request->user()->id;
            $tx->approved_at = now();
            $tx->save();

            return response()->json([
                'message' => 'Recarga aprobada. Saldo acreditado exitosamente.',
                'balance' => $newBalance,
            ]);
        });
    }

    public function rejectRecharge(Request $request, $id)
    {
        $tx = WalletTransaction::findOrFail($id);

        if ($tx->status !== 'pendiente') {
            return response()->json(['message' => 'Esta transaccion ya no esta pendiente.'], 400);
        }

        $tx->status = 'rechazado';
        $tx->approved_by = $request->user()->id;
        $tx->approved_at = now();
        $tx->save();

        return response()->json([
            'message' => 'Recarga rechazada.',
        ]);
    }

    public function adminAdjust(Request $request, $userId)
    {
        $request->validate([
            'amount' => 'required|numeric',
            'description' => 'required|string|max:255',
        ]);

        $user = User::findOrFail($userId);
        $wallet = $user->getOrCreateWallet();

        $tx = $wallet->adjust($request->amount, $request->description, $request->user()->id);

        return response()->json([
            'message' => 'Saldo ajustado correctamente.',
            'balance' => $wallet->balance,
            'transaction' => $tx,
        ]);
    }
}
