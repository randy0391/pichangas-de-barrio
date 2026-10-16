<?php

namespace App\Http\Controllers;

use App\Models\Confirmacion;
use App\Models\Multa;
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

        $confirmaciones = Confirmacion::with(['user', 'convocatoria'])
            ->whereHas('convocatoria', function($q) {
                // only matches that have finished or are closed, or maybe all
            })
            ->orderBy('id', 'desc')
            ->get();

        $report = $confirmaciones->map(function ($c) {
            $date = '';
            if ($c->convocatoria && $c->convocatoria->match_date) {
                // Try to format it if it's a date object or string
                try {
                    $date = \Carbon\Carbon::parse($c->convocatoria->match_date)->format('d/m/Y');
                } catch (\Exception $e) {
                    $date = $c->convocatoria->match_date;
                }
            }

            return [
                'user_name' => $c->user->name ?? 'Desconocido',
                'convocatoria_title' => $c->convocatoria->title ?? 'Sin título',
                'match_date' => $date,
                'attendance' => $c->attendance ?? 'pendiente'
            ];
        });

        return response()->json($report);
    }
}
