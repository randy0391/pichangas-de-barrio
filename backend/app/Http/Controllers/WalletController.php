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
        
        $transactions = $wallet->transactions()->paginate(30);

        $pendingRecharge = $wallet->transactions()
            ->where('type', 'recarga')
            ->where('status', 'pendiente')
            ->orderBy('id', 'desc')
            ->first();

        $stats = [
            'total_recharged' => (float) $wallet->transactions()->where('type', 'recarga')->where('status', 'aprobado')->sum('amount'),
            'total_spent' => abs((float) $wallet->transactions()->where('type', 'descuento')->where('status', 'aprobado')->sum('amount')),
            'total_refunded' => (float) $wallet->transactions()->where('type', 'devolucion')->where('status', 'aprobado')->sum('amount'),
            'pending_count' => (int) $wallet->transactions()->where('type', 'recarga')->where('status', 'pendiente')->count(),
            'pending_recharge' => $pendingRecharge ? [
                'id' => $pendingRecharge->id,
                'amount' => $pendingRecharge->amount,
                'created_at' => $pendingRecharge->created_at,
                'receipt_path' => $pendingRecharge->receipt_path ? ImageHelper::getUrl($pendingRecharge->receipt_path) : null,
            ] : null,
        ];

        return response()->json([
            'wallet' => [
                'id' => $wallet->id,
                'balance' => $wallet->balance,
            ],
            'stats' => $stats,
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

    public function adminRechargesHistory(Request $request)
    {
        $query = WalletTransaction::where('type', 'recarga')
            ->whereNotNull('receipt_path')
            ->with(['user', 'approver']);

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->get('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->get('end_date'));
        }

        if ($request->filled('status') && in_array($request->get('status'), ['pendiente', 'aprobado', 'rechazado'])) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('search')) {
            $search = trim($request->get('search'));
            $lowerSearch = mb_strtolower($search, 'UTF-8');
            $words = preg_split('/\s+/', $lowerSearch, -1, PREG_SPLIT_NO_EMPTY);

            $query->whereHas('user', function ($uq) use ($lowerSearch, $words) {
                $uq->where(function ($sub) use ($lowerSearch, $words) {
                    $sub->whereRaw("LOWER(COALESCE(dni, '')) LIKE ?", ["%{$lowerSearch}%"])
                        ->orWhereRaw("LOWER(COALESCE(phone, '')) LIKE ?", ["%{$lowerSearch}%"])
                        ->orWhereRaw("LOWER(COALESCE(nickname, '')) LIKE ?", ["%{$lowerSearch}%"]);

                    if (!empty($words)) {
                        $sub->orWhere(function ($wordsSub) use ($words) {
                            foreach ($words as $word) {
                                $wordsSub->whereRaw("LOWER(CONCAT_WS(' ', COALESCE(nombres, ''), COALESCE(apellido_paterno, ''), COALESCE(apellido_materno, ''), COALESCE(nickname, ''))) LIKE ?", ["%{$word}%"]);
                            }
                        });
                    }
                });
            });
        }

        $statsQuery = clone $query;
        $totalApprovedAmount = floatval((clone $statsQuery)->where('status', 'aprobado')->sum('amount'));
        $totalCount = (clone $statsQuery)->count();
        $approvedCount = (clone $statsQuery)->where('status', 'aprobado')->count();
        $pendingCount = (clone $statsQuery)->where('status', 'pendiente')->count();
        $rejectedCount = (clone $statsQuery)->where('status', 'rechazado')->count();

        $perPage = $request->boolean('all') ? 1000 : (int)$request->get('per_page', 15);
        $paginator = $query->orderBy('created_at', 'desc')->paginate($perPage);

        $items = $paginator->getCollection()->map(function ($tx) {
            $u = $tx->user;
            $approver = $tx->approver;
            return [
                'id' => $tx->id,
                'user_id' => $tx->user_id,
                'user' => $u ? [
                    'id' => $u->id,
                    'name' => $u->full_name ?: $u->nombres,
                    'nickname' => $u->nickname,
                    'phone' => $u->phone,
                    'dni' => $u->dni,
                    'avatar' => ImageHelper::getUrl($u->avatar),
                ] : null,
                'type' => $tx->type,
                'amount' => $tx->amount,
                'balance_after' => $tx->balance_after,
                'description' => $tx->description,
                'receipt_path' => $tx->receipt_path ? ImageHelper::getUrl($tx->receipt_path) : null,
                'status' => $tx->status,
                'approved_at' => $tx->approved_at,
                'approver_name' => $approver ? ($approver->full_name ?: $approver->nombres) : null,
                'created_at' => $tx->created_at,
            ];
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'stats' => [
                'total_approved_amount' => $totalApprovedAmount,
                'total_count' => $totalCount,
                'approved_count' => $approvedCount,
                'pending_count' => $pendingCount,
                'rejected_count' => $rejectedCount,
            ]
        ]);
    }

    public function adminListAll(Request $request)
    {
        $query = User::with('wallet');

        if ($request->has('search') && $request->get('search') !== '') {
            $search = trim($request->get('search'));
            $lowerSearch = mb_strtolower($search, 'UTF-8');
            $words = preg_split('/\s+/', $lowerSearch, -1, PREG_SPLIT_NO_EMPTY);

            $query->where(function ($q) use ($lowerSearch, $words) {
                $q->whereRaw("LOWER(COALESCE(dni, '')) LIKE ?", ["%{$lowerSearch}%"])
                  ->orWhereRaw("LOWER(COALESCE(phone, '')) LIKE ?", ["%{$lowerSearch}%"])
                  ->orWhereRaw("LOWER(COALESCE(email, '')) LIKE ?", ["%{$lowerSearch}%"])
                  ->orWhereRaw("LOWER(COALESCE(nickname, '')) LIKE ?", ["%{$lowerSearch}%"]);

                if (!empty($words)) {
                    $q->orWhere(function ($subQ) use ($words) {
                        foreach ($words as $word) {
                            $subQ->whereRaw("LOWER(CONCAT_WS(' ', COALESCE(nombres, ''), COALESCE(apellido_paterno, ''), COALESCE(apellido_materno, ''), COALESCE(nickname, ''))) LIKE ?", ["%{$word}%"]);
                        }
                    });
                }
            });
        }

        if ($request->filled('balance_filter')) {
            $bf = $request->get('balance_filter');
            if ($bf === 'positive') {
                $query->whereHas('wallet', function ($wq) {
                    $wq->where('balance', '>', 0);
                });
            } elseif ($bf === 'zero') {
                $query->where(function ($q) {
                    $q->whereDoesntHave('wallet')
                      ->orWhereHas('wallet', function ($wq) {
                          $wq->where('balance', '<=', 0);
                      });
                });
            } elseif ($bf === 'negative') {
                $query->whereHas('wallet', function ($wq) {
                    $wq->where('balance', '<', 0);
                });
            }
        }

        $perPage = (int)$request->get('per_page', 15);
        $users = $query->orderBy('nombres', 'asc')->paginate($perPage);

        $data = $users->getCollection()->map(function ($u) {
            $wallet = $u->wallet;
            if (!$wallet) {
                $wallet = Wallet::firstOrCreate(['user_id' => $u->id], ['balance' => 0]);
            }

            $uName = $u->full_name ?: trim("{$u->nombres} {$u->apellido_paterno} {$u->apellido_materno}");
            if (empty($uName)) {
                $uName = $u->name ?: ($u->nickname ?: ($u->dni ? "DNI: {$u->dni}" : 'Jugador'));
            }

            return [
                'id' => $wallet->id,
                'user_id' => $u->id,
                'balance' => $wallet->balance,
                'user' => [
                    'id' => $u->id,
                    'name' => $uName,
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

        $totalBalanceCirculation = (float)Wallet::sum('balance');
        $positiveCount = Wallet::where('balance', '>', 0)->count();
        $pendingRechargesCount = WalletTransaction::where('status', 'pendiente')->where('type', 'recarga')->count();
        $totalWallets = User::count();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
            'stats' => [
                'total_balance_circulation' => $totalBalanceCirculation,
                'positive_wallets_count' => $positiveCount,
                'pending_recharges_count' => $pendingRechargesCount,
                'total_wallets_count' => $totalWallets,
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
