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
        $query = Convocatoria::with(['creator', 'confirmaciones.user'])->withCount([
                'confirmaciones as confirmed_count' => fn ($q) => $q->where('status', 'confirmado'),
                'confirmaciones as porteros_count_agg' => fn ($q) => $q->where('status', 'confirmado')->where('match_role', 'portero'),
                'confirmaciones as jugadores_count_agg' => fn ($q) => $q->where('status', 'confirmado')->where('match_role', '!=', 'portero'),
                'confirmaciones as rejected_count_agg' => fn ($q) => $q->where('status', 'rechazado'),
                'confirmaciones as pending_count_agg' => fn ($q) => $q->where('status', 'pendiente'),
                'confirmaciones as has_teams_agg' => fn ($q) => $q->whereNotNull('team_number'),
            ]);
        if ($request->query('upcoming') === 'true') {
            $query->where('match_date', '>=', now()->toDateString());
        }
        $query->orderBy('match_date', 'asc')->orderBy('match_time', 'asc');
        $perPage = (int) $request->query('per_page', 100);
        return ConvocatoriaResource::collection($query->paginate($perPage));
    }

    public function show($id)
    {
        $convocatoria = Convocatoria::with(['creator', 'confirmaciones.user'])->withCount([
                'confirmaciones as confirmed_count' => fn ($q) => $q->where('status', 'confirmado'),
                'confirmaciones as porteros_count_agg' => fn ($q) => $q->where('status', 'confirmado')->where('match_role', 'portero'),
                'confirmaciones as jugadores_count_agg' => fn ($q) => $q->where('status', 'confirmado')->where('match_role', '!=', 'portero'),
                'confirmaciones as rejected_count_agg' => fn ($q) => $q->where('status', 'rechazado'),
                'confirmaciones as pending_count_agg' => fn ($q) => $q->where('status', 'pendiente'),
                'confirmaciones as has_teams_agg' => fn ($q) => $q->whereNotNull('team_number'),
            ])->findOrFail($id);
        return new ConvocatoriaResource($convocatoria);
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
        $request->validate([
            'match_role' => 'sometimes|in:jugador,portero',
        ]);
        $matchRole = $request->input('match_role', 'jugador');
        
        $user = $request->user();
        if ($user->role === 'member' && $user->status !== 'active') {
            return response()->json(['message' => 'Tu cuenta está inactiva. Solicita la reactivación al administrador para inscribirte nuevamente.', 'inactive' => true], 403);
        }
        if ($user->hasPendingMultas()) {
            return response()->json([
                'message' => 'No puedes unirte. Tienes una multa pendiente que debe ser pagada y aprobada primero.',
                'has_multas' => true,
            ], 403);
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $id, $matchRole) {
            $convocatoria = Convocatoria::where('id', $id)->lockForUpdate()->firstOrFail();

            $numTeams = max(2, (int) ($convocatoria->num_teams ?: 2));
            $maxPorteros = $numTeams;
            $maxJugadores = max(0, (int) $convocatoria->max_players - $maxPorteros);

            // Validate: if requesting portero, check if there is still room
            if ($matchRole === 'portero') {
                $currentPorteros = Confirmacion::where('convocatoria_id', $id)
                    ->where('status', 'confirmado')
                    ->where('match_role', 'portero')
                    ->where('user_id', '!=', $request->user()->id) // exclude self (in case of update)
                    ->count();

                if ($currentPorteros >= $maxPorteros) {
                    return response()->json([
                        'message' => "Ya se completaron los cupos de arquero ({$maxPorteros}/{$maxPorteros}) para esta convocatoria.",
                        'porteros_llenos' => true,
                    ], 422);
                }
            } else {
                // Field player quota check
                $currentJugadores = Confirmacion::where('convocatoria_id', $id)
                    ->where('status', 'confirmado')
                    ->where('match_role', '!=', 'portero')
                    ->where('user_id', '!=', $request->user()->id)
                    ->count();

                if ($currentJugadores >= $maxJugadores) {
                    return response()->json([
                        'message' => "Ya se completaron los cupos de jugadores de campo ({$maxJugadores}/{$maxJugadores}) para esta convocatoria.",
                        'jugadores_llenos' => true,
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
                    'message' => 'Ya se completo el cupo maximo de la convocatoria.',
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

            $confirmation = Confirmacion::updateOrCreate(
                ['convocatoria_id' => $id, 'user_id' => $request->user()->id],
                [
                    'status' => 'confirmado',
                    'match_role' => $matchRole,
                    'confirmed_at' => now(),
                    'notes' => $request->notes,
                    // Preserve the team when confirming again with the same role.
                    'team_number' => ($existingConfirmation && $existingConfirmation->match_role === $matchRole)
                        ? $existingConfirmation->team_number
                        : null,
                    'payment_receipt' => $receiptPath,
                ]
            );

            if ($confirmation->team_number === null) {
                $this->asignarEquipoAutomatico($convocatoria, $confirmation);
            }

            $request->user()->forceFill(['last_convocatoria_at' => now()])->save();

            return response()->json(['message' => 'Inscripción confirmada exitosamente']);
        });
    }


    /**
     * Assign a replacement to a vacant team after the draw without moving existing players.
     */
    private function asignarEquipoAutomatico(Convocatoria $convocatoria, Confirmacion $confirmacion): void
    {
        $convocatoriaId = $convocatoria->id;
        $numTeams = max(2, (int) ($convocatoria->num_teams ?: 2));
        $teamCapacity = (int) ceil($convocatoria->max_players / $numTeams);

        $drawAlreadyDone = Confirmacion::where('convocatoria_id', $convocatoriaId)
            ->where('status', 'confirmado')
            ->whereNotNull('team_number')
            ->exists();

        if (!$drawAlreadyDone) {
            return;
        }

        $teamNumbers = range(1, $numTeams);
        $teamTotals = Confirmacion::where('convocatoria_id', $convocatoriaId)
            ->where('status', 'confirmado')
            ->whereNotNull('team_number')
            ->selectRaw('team_number, COUNT(*) as total')
            ->groupBy('team_number')
            ->pluck('total', 'team_number');

        $availableTeams = array_values(array_filter($teamNumbers, function ($teamNumber) use ($teamTotals, $teamCapacity) {
            return (int) ($teamTotals[$teamNumber] ?? 0) < $teamCapacity;
        }));

        if ($confirmacion->match_role === 'portero') {
            $occupiedGoalkeeperTeams = Confirmacion::where('convocatoria_id', $convocatoriaId)
                ->where('status', 'confirmado')
                ->where('match_role', 'portero')
                ->whereNotNull('team_number')
                ->pluck('team_number')
                ->map(fn ($team) => (int) $team)
                ->all();

            $availableTeams = array_values(array_diff($availableTeams, $occupiedGoalkeeperTeams));
        } else {
            $fieldCounts = Confirmacion::where('convocatoria_id', $convocatoriaId)
                ->where('status', 'confirmado')
                ->where('match_role', 'jugador')
                ->whereNotNull('team_number')
                ->selectRaw('team_number, COUNT(*) as total')
                ->groupBy('team_number')
                ->pluck('total', 'team_number');

            usort($availableTeams, function ($a, $b) use ($fieldCounts) {
                return (int) ($fieldCounts[$a] ?? 0) <=> (int) ($fieldCounts[$b] ?? 0);
            });
        }

        if (empty($availableTeams)) {
            throw \Illuminate\Validation\\ValidationException::withMessages([
                'match_role' => $confirmacion->match_role === 'portero'
                    ? 'No hay equipo con espacio disponible y vacante de arquero.'
                    : 'Todos los equipos alcanzaron su máximo de integrantes.',
            ]);
        }

        $confirmacion->team_number = $availableTeams[0];
        $confirmacion->save();
    }

    public function sortearEquipos($id)
    {
        $convocatoria = Convocatoria::findOrFail($id);
        $numTeams = max(2, (int) ($convocatoria->num_teams ?: 2));

        // Get all confirmed players
        $confirmados = Confirmacion::where('convocatoria_id', $id)
            ->where('status', 'confirmado')
            ->get();

        if ($confirmados->count() < $convocatoria->max_players) {
            return response()->json([
                'message' => "El sorteo solo se puede realizar cuando todos los cupos esten completos ({$confirmados->count()}/{$convocatoria->max_players} confirmados)."
            ], 422);
        }

        // Separate porteros and jugadores
        $porteros = $confirmados->where('match_role', 'portero')->values();
        $jugadores = $confirmados->where('match_role', 'jugador')->values();

        // Shuffle both groups randomly
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

        // Random match pairings and resting team if more than 2 teams
        $teamOrder = range(1, $numTeams);
        shuffle($teamOrder);
        $firstMatchTeamA = $teamOrder[0];
        $firstMatchTeamB = $teamOrder[1];
        $restingTeams = array_slice($teamOrder, 2);

        $drawMeta = [
            'first_match' => [
                'team_a' => $firstMatchTeamA,
                'team_b' => $firstMatchTeamB,
                'resting_teams' => array_values($restingTeams),
            ]
        ];

        try {
            if (\Illuminate\Support\Facades\Schema::hasColumn('convocatorias', 'draw_metadata')) {
                $convocatoria->draw_metadata = $drawMeta;
                $convocatoria->save();
            }
        } catch (\Throwable $e) {}

        \Illuminate\Support\Facades\Cache::forever("convocatoria_{$id}_draw_meta", $drawMeta);

        return response()->json([
            'message' => "Equipos sorteados exitosamente en {$numTeams} equipos.",
            'teams' => $numTeams,
            'first_match' => [
                'team_a' => $firstMatchTeamA,
                'team_b' => $firstMatchTeamB,
                'resting_teams' => array_values($restingTeams),
            ]
        ]);
    }

    public function misConvocatorias(Request $request)
    {
        $userId = $request->user()->id;
        $convocatorias = Convocatoria::whereHas('confirmaciones', function($q) use ($userId) {
            $q->where('user_id', $userId);
        })->with(['confirmaciones' => function($q) use ($userId) {
            $q->where('user_id', $userId);
        }])->withCount([
                'confirmaciones as confirmed_count' => fn ($q) => $q->where('status', 'confirmado'),
                'confirmaciones as porteros_count_agg' => fn ($q) => $q->where('status', 'confirmado')->where('match_role', 'portero'),
                'confirmaciones as jugadores_count_agg' => fn ($q) => $q->where('status', 'confirmado')->where('match_role', '!=', 'portero'),
                'confirmaciones as rejected_count_agg' => fn ($q) => $q->where('status', 'rechazado'),
                'confirmaciones as pending_count_agg' => fn ($q) => $q->where('status', 'pendiente'),
                'confirmaciones as has_teams_agg' => fn ($q) => $q->whereNotNull('team_number'),
            ])->get();
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

        if ($confirmacion->match_role !== $request->match_role) {
            $numTeams = max(2, (int) ($convocatoria->num_teams ?: 2));
            $maxPorteros = $numTeams;
            $maxJugadores = max(0, (int) $convocatoria->max_players - $maxPorteros);

            if ($request->match_role === 'portero') {
                if ($confirmacion->team_number !== null) {
                    $goalkeeperExistsInTeam = $convocatoria->confirmaciones()
                        ->where('status', 'confirmado')
                        ->where('match_role', 'portero')
                        ->where('team_number', $confirmacion->team_number)
                        ->where('user_id', '!=', $userId)
                        ->exists();

                    if ($goalkeeperExistsInTeam) {
                        return response()->json([
                            'message' => "El Equipo {$confirmacion->team_number} ya tiene arquero.",
                        ], 422);
                    }
                }

                $currentPorteros = $convocatoria->confirmaciones()
                    ->where('status', 'confirmado')
                    ->where('match_role', 'portero')
                    ->where('user_id', '!=', $userId)
                    ->count();
                if ($currentPorteros >= $maxPorteros) {
                    return response()->json(['message' => "No se puede cambiar a arquero: cupos completos ({$maxPorteros}/{$maxPorteros})."], 422);
                }
            } else {
                $currentJugadores = $convocatoria->confirmaciones()
                    ->where('status', 'confirmado')
                    ->where('match_role', '!=', 'portero')
                    ->where('user_id', '!=', $userId)
                    ->count();
                if ($currentJugadores >= $maxJugadores) {
                    return response()->json(['message' => "No se puede cambiar a jugador de campo: cupos completos ({$maxJugadores}/{$maxJugadores})."], 422);
                }
            }
        }

        $confirmacion->match_role = $request->match_role;
        $confirmacion->save();

        return response()->json(['message' => 'Rol actualizado correctamente']);
    }

    public function updatePlayerTeam(Request $request, $id, $userId)
    {
        if (!$request->user()->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $convocatoria = Convocatoria::findOrFail($id);
        $numTeams = max(2, (int) ($convocatoria->num_teams ?: 2));

        $request->validate([
            'team_number' => ['nullable', 'integer', 'min:0', 'max:' . $numTeams],
        ]);

        return \Illuminate\Support\\Facades\\DB::transaction(function () use ($request, $convocatoria, $userId, $numTeams) {
            $lockedConvocatoria = Convocatoria::whereKey($convocatoria->id)->lockForUpdate()->firstOrFail();
            $confirmacion = $lockedConvocatoria->confirmaciones()
                ->where('user_id', $userId)
                ->where('status', 'confirmado')
                ->firstOrFail();

            $value = $request->team_number;
            $targetTeam = ($value === 0 || $value === null) ? null : (int) $value;

            if ($targetTeam !== null && $targetTeam !== (int) $confirmacion->team_number) {
                $teamCapacity = (int) ceil($lockedConvocatoria->max_players / $numTeams);
                $currentTeamMembers = $lockedConvocatoria->confirmaciones()
                    ->where('status', 'confirmado')
                    ->where('team_number', $targetTeam)
                    ->where('id', '!=', $confirmacion->id)
                    ->count();

                if ($currentTeamMembers >= $teamCapacity) {
                    return response()->json([
                        'message' => "El Equipo {$targetTeam} ya está completo ({$teamCapacity}/{$teamCapacity}).",
                    ], 422);
                }

                if ($confirmacion->match_role === 'portero') {
                    $goalkeeperExists = $lockedConvocatoria->confirmaciones()
                        ->where('status', 'confirmado')
                        ->where('match_role', 'portero')
                        ->where('team_number', $targetTeam)
                        ->where('id', '!=', $confirmacion->id)
                        ->exists();

                    if ($goalkeeperExists) {
                        return response()->json([
                            'message' => "El Equipo {$targetTeam} ya tiene arquero.",
                        ], 422);
                    }
                }
            }

            $confirmacion->team_number = $targetTeam;
            $confirmacion->save();

            return response()->json([
                'message' => 'Equipo del jugador actualizado exitosamente',
                'team_number' => $confirmacion->team_number
            ]);
        });
    }

    public function resetEquipos($id)
    {
        $convocatoria = Convocatoria::findOrFail($id);
        $convocatoria->confirmaciones()->update(['team_number' => null]);

        try {
            if (\Illuminate\Support\Facades\Schema::hasColumn('convocatorias', 'draw_metadata')) {
                $convocatoria->draw_metadata = null;
                $convocatoria->save();
            }
        } catch (\Throwable $e) {}

        \Illuminate\Support\Facades\Cache::forget("convocatoria_{$id}_draw_meta");

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
            'match_role' => 'required|in:jugador,portero',
        ]);

        $targetUser = \App\Models\User::findOrFail($request->user_id);
        if ($targetUser->role !== 'member' || $targetUser->status !== 'active') {
            return response()->json(['message' => 'Solo se pueden agregar jugadores activos a una convocatoria.'], 422);
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $id, $targetUser) {
            // Serialize additions to prevent two requests from consuming the same vacancy.
            $convocatoria = Convocatoria::where('id', $id)->lockForUpdate()->firstOrFail();

            if ($convocatoria->status !== 'abierta') {
                return response()->json(['message' => 'La convocatoria ya no esta abierta'], 400);
            }

            if ($convocatoria->confirmaciones()->where('user_id', $request->user_id)->exists()) {
                return response()->json(['message' => 'El jugador ya esta confirmado'], 400);
            }

            $numTeams = max(2, (int) ($convocatoria->num_teams ?: 2));
            $maxPorteros = $numTeams;
            $maxJugadores = max(0, (int) $convocatoria->max_players - $maxPorteros);

            if ($request->match_role === 'portero') {
                $currentPorteros = $convocatoria->confirmaciones()
                    ->where('status', 'confirmado')
                    ->where('match_role', 'portero')
                    ->count();

                if ($currentPorteros >= $maxPorteros) {
                    return response()->json(['message' => "Ya se completaron los cupos de arquero ({$maxPorteros}/{$maxPorteros})."], 422);
                }
            } else {
                $currentJugadores = $convocatoria->confirmaciones()
                    ->where('status', 'confirmado')
                    ->where('match_role', 'jugador')
                    ->count();

                if ($currentJugadores >= $maxJugadores) {
                    return response()->json(['message' => "Ya se completaron los cupos de jugadores de campo ({$maxJugadores}/{$maxJugadores})."], 422);
                }
            }

            $currentConfirmados = $convocatoria->confirmaciones()
                ->where('status', 'confirmado')
                ->count();

            if ($currentConfirmados >= $convocatoria->max_players) {
                return response()->json(['message' => 'Ya se completo el cupo maximo de la convocatoria.'], 422);
            }

            $confirmation = $convocatoria->confirmaciones()->create([
                'user_id' => $request->user_id,
                'match_role' => $request->match_role,
                'status' => 'confirmado',
                'notes' => 'Anadido manualmente por administrador',
            ]);

            $this->asignarEquipoAutomatico($convocatoria, $confirmation);
            $targetUser->forceFill(['last_convocatoria_at' => now()])->save();

            return response()->json(['message' => 'Jugador añadido exitosamente']);
        });
    }
}
