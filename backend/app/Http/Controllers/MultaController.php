<?php

namespace App\Http\Controllers;

use App\Models\Multa;
use Illuminate\Http\Request;
use App\Helpers\ImageHelper;

class MultaController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()->isAdmin()) {
            // Admins see all multas
            $multas = Multa::with(['user', 'convocatoria'])->orderBy('created_at', 'desc')->get();
        } else {
            // Users see their own multas
            $multas = Multa::with(['convocatoria'])->where('user_id', $request->user()->id)->orderBy('created_at', 'desc')->get();
        }

        return response()->json($multas->map(function ($multa) {
            return [
                'id' => $multa->id,
                'user' => $multa->user,
                'convocatoria' => $multa->convocatoria,
                'amount' => $multa->amount,
                'reason' => $multa->reason,
                'status' => $multa->status,
                'payment_receipt' => ImageHelper::getUrl($multa->payment_receipt),
                'admin_notes' => $multa->admin_notes,
                'created_at' => $multa->created_at,
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
            $disk = env('FILESYSTEM_DISK', 'public');
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
}
