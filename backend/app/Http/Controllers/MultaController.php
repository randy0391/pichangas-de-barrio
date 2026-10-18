<?php

namespace App\Http\Controllers;

use App\Models\Multa;
use Illuminate\Http\Request;
use App\Helpers\ImageHelper;

class MultaController extends Controller
{
    public function index(Request $request)
    {
        $query = Multa::with(['user', 'convocatoria'])->orderBy('created_at', 'desc');

        if (!$request->user()->isAdmin()) {
            // Non-admin players see only their own multas
            $query->where('user_id', $request->user()->id);
        }

        $multas = $query->paginate(100);

        return response()->json($multas->through(function ($multa) {
            $user = $multa->user;
            return [
                'id' => $multa->id,
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->full_name ?: trim("{$user->nombres} {$user->apellido_paterno} {$user->apellido_materno}"),
                    'full_name' => $user->full_name ?: trim("{$user->nombres} {$user->apellido_paterno} {$user->apellido_materno}"),
                    'nombres' => $user->nombres,
                    'apellido_paterno' => $user->apellido_paterno,
                    'apellido_materno' => $user->apellido_materno,
                    'nickname' => $user->nickname,
                    'avatar' => ImageHelper::getUrl($user->avatar),
                    'phone' => $user->phone,
                    'dni' => $user->dni,
                    'jersey_number' => $user->jersey_number,
                    'position' => $user->position,
                ] : null,
                'convocatoria' => $multa->convocatoria ? [
                    'id' => $multa->convocatoria->id,
                    'title' => $multa->convocatoria->title,
                    'match_date' => $multa->convocatoria->match_date ? $multa->convocatoria->match_date->format('Y-m-d') : null,
                    'match_time' => $multa->convocatoria->match_time ? $multa->convocatoria->match_time->format('H:i') : null,
                    'location' => $multa->convocatoria->location,
                ] : null,
                'amount' => $multa->amount,
                'reason' => $multa->reason,
                'status' => $multa->status,
                'payment_receipt' => ImageHelper::getUrl($multa->payment_receipt),
                'admin_notes' => $multa->admin_notes,
                'created_at' => $multa->created_at ? $multa->created_at->toISOString() : null,
                'updated_at' => $multa->updated_at ? $multa->updated_at->toISOString() : null,
            ];
        }));
    }

    public function uploadReceipt(Request $request, $id)
    {
        $multa = Multa::findOrFail($id);

        if ($multa->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'receipt' => 'required|image|max:10240', // 10MB max
        ]);

        if ($request->hasFile('receipt')) {
            $disk = config('filesystems.default', 'public');
            $path = $request->file('receipt')->store('multas', $disk);
            
            $multa->payment_receipt = $path;
            $multa->status = 'en_revision';
            $multa->save();
        }

        return response()->json([
            'message' => 'Comprobante subido correctamente',
            'multa' => $multa
        ]);
    }

    public function approve(Request $request, $id)
    {
        if (!$request->user()->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $multa = Multa::findOrFail($id);
        $multa->status = 'pagada';
        if ($request->has('notes')) {
            $multa->admin_notes = $request->input('notes');
        }
        $multa->save();

        return response()->json(['message' => 'Multa aprobada']);
    }

    public function reject(Request $request, $id)
    {
        if (!$request->user()->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $multa = Multa::findOrFail($id);
        $multa->status = 'pendiente';
        if ($request->has('notes')) {
            $multa->admin_notes = $request->input('notes');
        }
        $multa->payment_receipt = null; // Clear receipt
        $multa->save();

        return response()->json(['message' => 'Multa rechazada']);
    }

    public function destroy(Request $request, $id)
    {
        if (!$request->user()->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $multa = Multa::findOrFail($id);
        $multa->delete();

        return response()->json(['message' => 'Multa eliminada']);
    }
}
