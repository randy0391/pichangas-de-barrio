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
        $query = User::with('wallet');

        if ($request->has('search') && $request->get('search') !== '') {
            $search = trim($request->get('search'));
            $query->where(function ($q) use ($search) {
                $q->where(DB::raw("CONCAT_WS(' ', COALESCE(nombres, ''), COALESCE(apellido_paterno, ''), COALESCE(apellido_materno, ''))"), 'like', "%{$search}%")
                  ->orWhere('nombres', 'like', "%{$search}%")
                  ->orWhere('apellido_paterno', 'like', "%{$search}%")
                  ->orWhere('apellido_materno', 'like', "%{$search}%")
                  ->orWhere('nickname', 'like', "%{$search}%")
                  ->orWhere('dni', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = (int)$request->get('per_page', 15);
        $users = $query->orderBy('nombres', 'asc')->paginate($perPage);

        $data = $users->getCollection()->map(function ($u) {
            $wallet = $u->wallet;
            if (!$wallet) {
                $wallet = Wallet::firstOrCreate(['user_id' => $u->id], ['balance' => 0]);
            }
            return [
                'id' => $wallet->id,
                'user_id' => $u->id,
                'balance' => $wallet->balance,
                'user' => [
                    'id' => $u->id,
                    'name' => $u->full_name ?: $u->nombres,
                    'nickname' => $u->nickname,
                    'phone' => $u->phone,
                    'dni' => $u->dni,
                    'role' => $u->role,
                    'avatar' => ImageHelper::getUrl($u->avatar),
                    'is_approved' => (bool)$u->is_approved,
                ],
                'created_at' => $wallet->created_at,
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ]
        ]);
    }

    public function playerTransactions(Request $request, $userId)
    {
        $user = User::findOrFail($userId);
        $wallet = $user->getOrCreateWallet();

        $transactions = WalletTransaction::where('wallet_id', $wallet->id)
            ->with(['approver'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->full_name ?: $user->nombres,
                'nickname' => $user->nickname,
                'phone' => $user->phone,
                'dni' => $user->dni,
                'balance' => $wallet->balance,
            ],
            'transactions' => $transactions->map(function ($tx) {
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
                    'approver_name' => $tx->approver ? ($tx->approver->full_name ?: $tx->approver->nombres) : null,
                    'created_at' => $tx->created_at,
                ];
            }),
        ]);
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
