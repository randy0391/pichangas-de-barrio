<?php

namespace App\Http\Controllers;

use App\Models\Confirmacion;
use App\Models\Multa;
use App\Models\Convocatoria;
use App\Helpers\ImageHelper;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function mark(Request $request, $id)
    {
        if (!$request->user()->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate([
            'attendance' => 'required|in:presente,tardanza,falta',
            'amount' => 'nullable|numeric|min:0'
        ]);

        $confirmacion = Confirmacion::findOrFail($id);
        $confirmacion->attendance = $request->attendance;
        $confirmacion->save();

        $amount = $request->amount;
        if ($request->attendance === 'tardanza' && ($amount === null || $amount === '' || (float)$amount <= 0)) {
            $amount = 3.00;
        } elseif ($request->attendance === 'falta' && ($amount === null || $amount === '' || (float)$amount <= 0)) {
            $amount = 30.00;
        }
        $amount = (float)$amount;

        // Si es falta o tardanza, y mandaron un monto mayor a 0, creamos la multa
        if (in_array($request->attendance, ['falta', 'tardanza']) && $amount > 0) {
            $multa = Multa::where('user_id', $confirmacion->user_id)
                          ->where('convocatoria_id', $confirmacion->convocatoria_id)
                          ->first();
            
            if (!$multa) {
                Multa::create([
                    'user_id' => $confirmacion->user_id,
                    'convocatoria_id' => $confirmacion->convocatoria_id,
                    'amount' => $amount,
                    'reason' => ucfirst($request->attendance),
                    'status' => 'pendiente'
                ]);
            } else {
                // Si ya existe, solo actualizamos el monto y la razon si sigue pendiente
                if ($multa->status === 'pendiente') {
                    $multa->amount = $amount;
                    $multa->reason = ucfirst($request->attendance);
                    $multa->save();
                }
            }
        } elseif ($request->attendance === 'presente') {
            // Si la marcan como presente, borramos multas pendientes asociadas a este partido
            Multa::where('user_id', $confirmacion->user_id)
                 ->where('convocatoria_id', $confirmacion->convocatoria_id)
                 ->where('status', 'pendiente')
                 ->delete();
        }

        return response()->json(['message' => 'Asistencia guardada', 'confirmacion' => $confirmacion]);
    }

    public function batchMark(Request $request, $id)
    {
        if (!$request->user()->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate([
            'attendances' => 'required|array',
            'attendances.*.confirmacion_id' => 'required|integer',
            'attendances.*.attendance' => 'required|in:presente,tardanza,falta,pendiente',
            'attendances.*.amount' => 'nullable|numeric|min:0'
        ]);

        $convocatoria = \App\Models\Convocatoria::findOrFail($id);

        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $convocatoria) {
            foreach ($request->attendances as $item) {
                $confirmacion = Confirmacion::where('id', $item['confirmacion_id'])
                    ->where('convocatoria_id', $convocatoria->id)
                    ->first();

                if (!$confirmacion) continue;

                $confirmacion->attendance = $item['attendance'];
                $confirmacion->save();

                $amount = isset($item['amount']) && $item['amount'] !== '' ? (float)$item['amount'] : 0;

                // Predeterminar montos si es tardanza o falta
                if ($item['attendance'] === 'tardanza' && $amount <= 0) {
                    $amount = 3.00;
                } elseif ($item['attendance'] === 'falta' && $amount <= 0) {
                    $amount = 30.00;
                }

                if (in_array($item['attendance'], ['falta', 'tardanza']) && $amount > 0) {
                    $multa = Multa::where('user_id', $confirmacion->user_id)
                                  ->where('convocatoria_id', $convocatoria->id)
                                  ->first();

                    if (!$multa) {
                        Multa::create([
                            'user_id' => $confirmacion->user_id,
                            'convocatoria_id' => $convocatoria->id,
                            'amount' => $amount,
                            'reason' => ucfirst($item['attendance']),
                            'status' => 'pendiente'
                        ]);
                    } else {
                        if ($multa->status === 'pendiente') {
                            $multa->amount = $amount;
                            $multa->reason = ucfirst($item['attendance']);
                            $multa->save();
                        }
                    }
                } elseif ($item['attendance'] === 'presente' || $item['attendance'] === 'pendiente') {
                    // Si se marca presente o se desmarca, se eliminan multas pendientes de este partido
                    Multa::where('user_id', $confirmacion->user_id)
                         ->where('convocatoria_id', $convocatoria->id)
                         ->where('status', 'pendiente')
                         ->delete();
                }
            }
        });

        return response()->json(['message' => 'Asistencias guardadas exitosamente']);
    }

    public function report(Request $request)
    {
        if (!$request->user()->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $query = Confirmacion::with(['user', 'convocatoria'])
            ->whereHas('convocatoria')
            ->orderBy('id', 'desc');

        if ($request->filled('convocatoria_id')) {
            $query->where('convocatoria_id', $request->get('convocatoria_id'));
        }

        if ($request->filled('attendance')) {
            $att = $request->get('attendance');
            if ($att === 'sin_marcar' || $att === 'pendiente') {
                $query->where(function ($q) {
                    $q->whereNull('attendance')
                      ->orWhere('attendance', 'pendiente')
                      ->orWhere('attendance', '');
                });
            } else {
                $query->where('attendance', $att);
            }
        }

        if ($request->filled('search')) {
            $search = trim($request->get('search'));
            $lower = mb_strtolower($search, 'UTF-8');
            $query->where(function ($q) use ($lower) {
                $q->whereHas('user', function ($uq) use ($lower) {
                    $uq->whereRaw("LOWER(COALESCE(nombres, '')) LIKE ?", ["%{$lower}%"])
                       ->orWhereRaw("LOWER(COALESCE(apellido_paterno, '')) LIKE ?", ["%{$lower}%"])
                       ->orWhereRaw("LOWER(COALESCE(apellido_materno, '')) LIKE ?", ["%{$lower}%"])
                       ->orWhereRaw("LOWER(COALESCE(nickname, '')) LIKE ?", ["%{$lower}%"])
                       ->orWhereRaw("LOWER(COALESCE(dni, '')) LIKE ?", ["%{$lower}%"])
                       ->orWhereRaw("LOWER(COALESCE(phone, '')) LIKE ?", ["%{$lower}%"]);
                })->orWhereHas('convocatoria', function ($cq) use ($lower) {
                    $cq->whereRaw("LOWER(COALESCE(title, '')) LIKE ?", ["%{$lower}%"])
                       ->orWhereRaw("LOWER(COALESCE(location, '')) LIKE ?", ["%{$lower}%"]);
                });
            });
        }

        $allConfirmaciones = Confirmacion::whereHas('convocatoria')->get();
        $totalCount = $allConfirmaciones->count();
        $presenteCount = $allConfirmaciones->where('attendance', 'presente')->count();
        $tardanzaCount = $allConfirmaciones->where('attendance', 'tardanza')->count();
        $faltaCount = $allConfirmaciones->where('attendance', 'falta')->count();
        $sinMarcarCount = $allConfirmaciones->whereIn('attendance', [null, '', 'pendiente'])->count();

        $confirmaciones = $query->get();

        $report = $confirmaciones->map(function ($c) {
            $date = '';
            if ($c->convocatoria && $c->convocatoria->match_date) {
                try {
                    $date = \Carbon\Carbon::parse($c->convocatoria->match_date)->format('d/m/Y');
                } catch (\Exception $e) {
                    $date = $c->convocatoria->match_date;
                }
            }

            $user = $c->user;
            $userName = 'Jugador';
            $userNickname = null;
            $userPhone = null;
            $userDni = null;
            $userAvatar = null;

            if ($user) {
                $fullName = trim("{$user->nombres} {$user->apellido_paterno} {$user->apellido_materno}");
                $userName = $fullName ?: ($user->name ?: ($user->nickname ?: ($user->dni ? "DNI: {$user->dni}" : 'Jugador')));
                $userNickname = $user->nickname;
                $userPhone = $user->phone;
                $userDni = $user->dni;
                $userAvatar = $user->avatar ? ImageHelper::getUrl($user->avatar) : null;
            }

            return [
                'id' => $c->id,
                'user_id' => $c->user_id,
                'user_name' => $userName,
                'user_nickname' => $userNickname,
                'user_phone' => $userPhone,
                'user_dni' => $userDni,
                'user_avatar' => $userAvatar,
                'match_role' => $c->match_role ?? 'jugador',
                'convocatoria_id' => $c->convocatoria_id,
                'convocatoria_title' => $c->convocatoria->title ?? 'Sin titulo',
                'convocatoria_location' => $c->convocatoria->location ?? '',
                'match_date' => $date,
                'raw_match_date' => $c->convocatoria->match_date ?? '',
                'attendance' => $c->attendance ?: 'pendiente'
            ];
        });

        $convocatoriasList = Convocatoria::select('id', 'title', 'match_date')
            ->orderBy('match_date', 'desc')
            ->get();

        return response()->json([
            'data' => $report,
            'stats' => [
                'total_count' => $totalCount,
                'presente_count' => $presenteCount,
                'tardanza_count' => $tardanzaCount,
                'falta_count' => $faltaCount,
                'sin_marcar_count' => $sinMarcarCount,
                'attendance_rate' => $totalCount > 0 ? round(($presenteCount / $totalCount) * 100, 1) : 0,
            ],
            'convocatorias' => $convocatoriasList
        ]);
    }
}
