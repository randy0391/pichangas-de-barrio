<?php
namespace App\Http\Controllers;

use App\Http\Requests\StoreConvocatoriaRequest;
use App\Http\Requests\UpdateConvocatoriaRequest;
use App\Http\Resources\ConvocatoriaResource;
use App\Models\Confirmacion;
use App\Models\Convocatoria;
use Illuminate\Http\Request;

class ConvocatoriaController extends Controller
{
    public function index(Request $request)
    {
        $query = Convocatoria::with('creator');
        if ($request->query('upcoming') === 'true') {
            $query->where('match_date', '>=', now()->toDateString());
        }
        $query->orderBy('match_date', 'asc')->orderBy('match_time', 'asc');
        $perPage = (int) $request->query('per_page', 100);
        return ConvocatoriaResource::collection($query->paginate($perPage));
    }

    public function show($id)
    {
        return new ConvocatoriaResource(Convocatoria::with(['creator', 'confirmaciones.user'])->findOrFail($id));
    }

    public function store(StoreConvocatoriaRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        return new ConvocatoriaResource(Convocatoria::create($data));
    }

    public function update(UpdateConvocatoriaRequest $request, $id)
    {
        $convocatoria = Convocatoria::findOrFail($id);
        $convocatoria->update($request->validated());
        return new ConvocatoriaResource($convocatoria);
    }

    public function destroy($id)
    {
        Convocatoria::findOrFail($id)->delete();
        return response()->noContent();
    }

    public function confirmar(Request $request, $id)
    {
        $matchRole = $request->input('match_role', 'jugador');
        
        $user = $request->user();
        if ($user->hasPendingMultas()) {
            return response()->json([
                'message' => 'No puedes unirte. Tienes una multa pendiente que debe ser pagada y aprobada primero.',
                'has_multas' => true,
            ], 403);
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $id, $matchRole) {
            $convocatoria = Convocatoria::where('id', $id)->lockForUpdate()->firstOrFail();

            // Validate: if requesting portero, check if there's still room
            if ($matchRole === 'portero') {
                $currentPorteros = Confirmacion::where('convocatoria_id', $id)
                    ->where('status', 'confirmado')
                    ->where('match_role', 'portero')
                    ->where('user_id', '!=', $request->user()->id) // exclude self (in case of update)
                    ->count();

                if ($currentPorteros >= $convocatoria->num_teams) {
                    return response()->json([
                        'message' => 'Ya se completaron los cupos de portero para esta convocatoria.',
                        'porteros_llenos' => true,
                    ], 422);
                }
            }

            // Check max_players limit
            $currentConfirmados = Confirmacion::where('convocatoria_id', $id)
                ->where('status', 'confirmado')
                ->where('user_id', '!=', $request->user()->id)
                ->count();

            if ($currentConfirmados >= $convocatoria->max_players) {
                return response()->json([
                    'message' => 'Ya se completo el cupo maximo de jugadores.',
                    'cupo_lleno' => true,
                ], 422);
            }

            // Check if already confirmed (avoid double charging if just switching roles)
            $existingConfirmation = Confirmacion::where('convocatoria_id', $id)
                ->where('user_id', $request->user()->id)
                ->where('status', 'confirmado')
                ->first();

            $cost = floatval($convocatoria->cost_per_player ?? 0);
            $userWallet = null;

            if ($cost > 0 && !$existingConfirmation) {
                $userWallet = $request->user()->getOrCreateWallet();
                if ($userWallet->balance < $cost) {
                    return response()->json([
                        'message' => 'Saldo insuficiente en tu Billetera Digital. El costo es S/ ' . number_format($cost, 2) . ' y tu saldo disponible es S/ ' . number_format($userWallet->balance, 2) . '. Recarga tu billetera.',
                        'insufficient_balance' => true,
                        'required' => $cost,
                        'balance' => $userWallet->balance,
                    ], 400);
                }
            }

            $request->validate([
                'payment_receipt' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
            ]);

            $receiptPath = null;
            if ($request->hasFile('payment_receipt')) {
                $receiptPath = $request->file('payment_receipt')->store('convocatorias_receipts', config('filesystems.default', 'public'));
            }

            // Deduct from wallet if cost applies and not previously confirmed
            if ($cost > 0 && $userWallet && !$existingConfirmation) {
                $userWallet->withdraw(
                    $cost,
                    'Pago convocatoria: ' . $convocatoria->title,
                    'convocatoria',
                    $convocatoria->id
                );
            }

            Confirmacion::updateOrCreate(
                ['convocatoria_id' => $id, 'user_id' => $request->user()->id],
                [
                    'status' => 'confirmado',
                    'match_role' => $matchRole,
                    'confirmed_at' => now(),
                    'notes' => $request->notes,
                    'team_number' => null, // reset team assignment on re-confirm
                    'payment_receipt' => $receiptPath,
                ]
            );

            return response()->json(['message' => 'Asistencia confirmada exitosamente']);
        });
    }


    public function sortearEquipos($id)
    {
        $convocatoria = Convocatoria::findOrFail($id);
        $numTeams = $convocatoria->num_teams;

        // Get all confirmed players
        $confirmados = Confirmacion::where('convocatoria_id', $id)
            ->where('status', 'confirmado')
            ->get();

        if ($confirmados->isEmpty()) {
            return response()->json(['message' => 'No hay jugadores confirmados para sortear.'], 422);
        }

        // Separate porteros and jugadores
        $porteros = $confirmados->where('match_role', 'portero')->values();
        $jugadores = $confirmados->where('match_role', 'jugador')->values();

        // Shuffle both groups
        $porteros = $porteros->shuffle();
        $jugadores = $jugadores->shuffle();

        // Assign 1 portero per team (round-robin if not enough porteros)
        $teamIndex = 0;
        foreach ($porteros as $portero) {
            if ($teamIndex < $numTeams) {
                $portero->team_number = $teamIndex + 1;
                $portero->save();
                $teamIndex++;
            } else {
                // Extra porteros become jugadores assigned normally
                $jugadores->push($portero);
            }
        }

        // Shuffle jugadores again after potentially adding extra porteros
        $jugadores = $jugadores->shuffle();

        // Distribute jugadores evenly across teams (round-robin)
        $teamIndex = 0;
        foreach ($jugadores as $jugador) {
            $jugador->team_number = ($teamIndex % $numTeams) + 1;
            $jugador->save();
            $teamIndex++;
        }

        return response()->json([
            'message' => "Equipos sorteados exitosamente en {$numTeams} equipos.",
            'teams' => $numTeams,
        ]);
    }

    public function misConvocatorias(Request $request)
    {
        $userId = $request->user()->id;
        $convocatorias = Convocatoria::whereHas('confirmaciones', function($q) use ($userId) {
            $q->where('user_id', $userId);
        })->with(['confirmaciones' => function($q) use ($userId) {
            $q->where('user_id', $userId);
        }])->get();
        return ConvocatoriaResource::collection($convocatorias);
    }

        public function updatePlayerRole(Request $request, $id, $userId)
    {
        if (!$request->user()->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate([
            'match_role' => 'required|in:jugador,portero'
        ]);

        $convocatoria = Convocatoria::findOrFail($id);
        $confirmacion = $convocatoria->confirmaciones()->where('user_id', $userId)->firstOrFail();

        $confirmacion->match_role = $request->match_role;
        $confirmacion->save();

        return response()->json(['message' => 'Rol actualizado correctamente']);
    }

    public function updatePlayerTeam(Request $request, $id, $userId)
    {
        if (!$request->user()->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate([
            'team_number' => 'nullable|integer|min:0|max:10'
        ]);

        $convocatoria = Convocatoria::findOrFail($id);
        $confirmacion = $convocatoria->confirmaciones()->where('user_id', $userId)->firstOrFail();

        $val = $request->team_number;
        $confirmacion->team_number = ($val === 0 || $val === null) ? null : (int) $val;
        $confirmacion->save();

        return response()->json([
            'message' => 'Equipo del jugador actualizado exitosamente',
            'team_number' => $confirmacion->team_number
        ]);
    }

    public function resetEquipos($id)
    {
        $convocatoria = Convocatoria::findOrFail($id);
        $convocatoria->confirmaciones()->update(['team_number' => null]);

        return response()->json(['message' => 'Equipos reiniciados exitosamente']);
    }

    public function removeConfirmacion($id, $userId)
    {
        $convocatoria = Convocatoria::findOrFail($id);
        $confirmacion = Confirmacion::where('convocatoria_id', $id)->where('user_id', $userId)->first();

        if ($confirmacion) {
            // Solo devolver saldo si hubo un descuento previo de billetera para esta convocatoria
            $deductedAmount = abs((float) \App\Models\WalletTransaction::where('user_id', $userId)
                ->where('reference_type', 'convocatoria')
                ->where('reference_id', $convocatoria->id)
                ->where('type', 'descuento')
                ->where('status', 'aprobado')
                ->sum('amount'));

            $refundedAmount = (float) \App\Models\WalletTransaction::where('user_id', $userId)
                ->where('reference_type', 'convocatoria')
                ->where('reference_id', $convocatoria->id)
                ->where('type', 'devolucion')
                ->where('status', 'aprobado')
                ->sum('amount');

            $refundableAmount = max(0, $deductedAmount - $refundedAmount);

            if ($refundableAmount > 0) {
                $targetUser = \App\Models\User::find($userId);
                if ($targetUser) {
                    $wallet = $targetUser->getOrCreateWallet();
                    $wallet->refund(
                        $refundableAmount,
                        'Devolucion por cancelacion en convocatoria: ' . $convocatoria->title,
                        'convocatoria',
                        $convocatoria->id
                    );
                }
            }

            $confirmacion->delete();

            $msg = $refundableAmount > 0
                ? 'Reserva eliminada y saldo devuelto a su billetera (S/ ' . number_format($refundableAmount, 2) . ')'
                : 'Reserva eliminada. No se realizo devolucion ya que el jugador no tuvo descuento de saldo previo.';

            return response()->json([
                'message' => $msg,
                'refunded' => $refundableAmount > 0,
                'refunded_amount' => $refundableAmount,
            ]);
        }

        return response()->json(['message' => 'No se encontro la confirmacion del jugador'], 404);
    }

    public function addPlayer(Request $request, $id)
    {
        if (!$request->user()->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'match_role' => 'required|in:jugador,portero'
        ]);

        $convocatoria = Convocatoria::findOrFail($id);

        if ($convocatoria->status !== 'abierta') {
            return response()->json(['message' => 'La convocatoria ya no esta abierta'], 400);
        }

        if ($convocatoria->confirmaciones()->where('user_id', $request->user_id)->exists()) {
            return response()->json(['message' => 'El jugador ya esta confirmado'], 400);
        }

        if ($request->match_role === 'portero') {
            $currentPorteros = $convocatoria->confirmaciones()->where('status', 'confirmado')->where('match_role', 'portero')->count();
            if ($currentPorteros >= $convocatoria->num_teams) {
                return response()->json(['message' => 'Ya se completaron los cupos de portero.'], 422);
            }
        }

        $currentConfirmados = $convocatoria->confirmaciones()->where('status', 'confirmado')->count();
        if ($currentConfirmados >= $convocatoria->max_players) {
            return response()->json(['message' => 'Ya se completo el cupo maximo de jugadores.'], 422);
        }

        $convocatoria->confirmaciones()->create([
            'user_id' => $request->user_id,
            'match_role' => $request->match_role,
            'status' => 'confirmado',
            'notes' => 'Anadido manualmente por administrador'
        ]);

        return response()->json(['message' => 'Jugador anadido exitosamente']);
    }
}
