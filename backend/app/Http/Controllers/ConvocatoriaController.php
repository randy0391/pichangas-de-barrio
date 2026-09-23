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
        $query->orderBy('match_date', 'asc');
        return ConvocatoriaResource::collection($query->paginate(12));
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
                    'message' => 'Ya se completó el cupo máximo de jugadores.',
                    'cupo_lleno' => true,
                ], 422);
            }

            $request->validate([
                'payment_receipt' => 'required|file|mimes:jpeg,png,jpg,pdf|max:5120',
            ]);

            $receiptPath = null;
            if ($request->hasFile('payment_receipt')) {
                $receiptPath = $request->file('payment_receipt')->store('convocatorias_receipts', env('FILESYSTEM_DISK', 'public'));
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

            return response()->json(['message' => 'Asistencia confirmada']);
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

    public function removeConfirmacion($id, $userId)
    {
        Confirmacion::where('convocatoria_id', $id)->where('user_id', $userId)->delete();
        return response()->json(['message' => 'Reserva eliminada correctamente']);
    }
}