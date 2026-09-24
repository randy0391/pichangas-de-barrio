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

        // Si es falta o tardanza, y mandaron un monto mayor a 0, creamos la multa
        // Si ya existe una multa para esta confirmación, la actualizamos o qué?
        // Mejor busquemos si ya tiene multa pendiente para esta convocatoria por esta razón.
        if (in_array($request->attendance, ['falta', 'tardanza']) && $request->amount > 0) {
            $multa = Multa::where('user_id', $confirmacion->user_id)
                          ->where('convocatoria_id', $confirmacion->convocatoria_id)
                          ->first();
            
            if (!$multa) {
                Multa::create([
                    'user_id' => $confirmacion->user_id,
                    'convocatoria_id' => $confirmacion->convocatoria_id,
                    'amount' => $request->amount,
                    'reason' => ucfirst($request->attendance),
                    'status' => 'pendiente'
                ]);
            } else {
                // Si ya existe, solo actualizamos el monto y la razón si sigue pendiente
                if ($multa->status === 'pendiente') {
                    $multa->amount = $request->amount;
                    $multa->reason = ucfirst($request->attendance);
                    $multa->save();
                }
            }
        } elseif ($request->attendance === 'presente') {
            // Si la marcan como presente, borramos multas pendientes asociadas a este partido (en caso haya sido un error)
            Multa::where('user_id', $confirmacion->user_id)
                 ->where('convocatoria_id', $confirmacion->convocatoria_id)
                 ->where('status', 'pendiente')
                 ->delete();
        }

        return response()->json(['message' => 'Asistencia guardada', 'confirmacion' => $confirmacion]);
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
