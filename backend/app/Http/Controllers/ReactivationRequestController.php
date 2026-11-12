<?php

namespace App\Http\Controllers;

use App\Models\ReactivationRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReactivationRequestController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();
        abort_if($user->role !== 'member', 403, 'Solo los jugadores pueden solicitar reactivación.');
        abort_if($user->status === 'active', 422, 'Tu cuenta ya está activa.');

        $validated = $request->validate([
            'message' => 'nullable|string|max:1000',
        ]);

        $pending = ReactivationRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($pending) {
            return response()->json(['message' => 'Ya tienes una solicitud pendiente.', 'request' => $pending], 200);
        }

        $reactivationRequest = ReactivationRequest::create([
            'user_id' => $user->id,
            'message' => $validated['message'] ?? null,
        ]);

        return response()->json([
            'message' => 'Tu solicitud de reactivación fue enviada al administrador.',
            'request' => $reactivationRequest,
        ], 201);
    }

    public function mine(Request $request)
    {
        return response()->json([
            'data' => ReactivationRequest::where('user_id', $request->user()->id)
                ->latest()
                ->limit(10)
                ->get(),
        ]);
    }

    public function index()
    {
        $requests = ReactivationRequest::with(['user:id,nombres,apellido_paterno,apellido_materno,phone,email,created_at,last_convocatoria_at', 'reviewer:id,nombres,apellido_paterno'])
            ->latest()
            ->paginate(20);

        return response()->json($requests);
    }

    public function review(Request $request, $id)
    {
        $validated = $request->validate([
            'decision' => 'required|in:approved,rejected',
            'admin_note' => 'nullable|string|max:1000',
        ]);

        return DB::transaction(function () use ($request, $id, $validated) {
            $reactivationRequest = ReactivationRequest::whereKey($id)->lockForUpdate()->firstOrFail();

            if ($reactivationRequest->status !== 'pending') {
                return response()->json(['message' => 'Esta solicitud ya fue revisada.'], 409);
            }

            $user = User::whereKey($reactivationRequest->user_id)->lockForUpdate()->firstOrFail();

            $reactivationRequest->update([
                'status' => $validated['decision'],
                'admin_note' => $validated['admin_note'] ?? null,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            if ($validated['decision'] === 'approved') {
                $user->forceFill([
                    'status' => 'active',
                    'last_convocatoria_at' => now(),
                ])->save();
            }

            return response()->json([
                'message' => $validated['decision'] === 'approved'
                    ? 'Jugador reactivado correctamente.'
                    : 'Solicitud rechazada.',
                'request' => $reactivationRequest->fresh(['user', 'reviewer']),
            ]);
        });
    }
}
