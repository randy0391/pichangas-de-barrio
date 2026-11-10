<?php
namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class MemberController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

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

        if ($request->filled('role')) {
            $query->where('role', $request->get('role'));
        }

        if ($request->filled('position')) {
            $pos = $request->get('position');
            $query->whereRaw("LOWER(COALESCE(position, '')) = ?", [mb_strtolower($pos, 'UTF-8')]);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('is_approved')) {
            $val = $request->get('is_approved');
            if ($val === 'pending' || $val === '0' || $val === 'false') {
                $query->where(function ($q) {
                    $q->where('is_approved', false)
                      ->orWhereNull('is_approved')
                      ->orWhere('is_approved', '0')
                      ->orWhere('is_approved', 'false');
                });
            } else if ($val === 'approved' || $val === '1' || $val === 'true') {
                $query->where(function ($q) {
                    $q->where('is_approved', true)
                      ->orWhere('is_approved', '1')
                      ->orWhere('is_approved', 'true');
                });
            }
        }

        if ($request->boolean('all')) {
            abort_unless($request->user()?->isAdmin(), 403);
            $users = $query->orderBy('nombres', 'asc')->orderBy('apellido_paterno', 'asc')->get();
            return response()->json([
                'data' => UserResource::collection($users),
                'meta' => [
                    'total' => $users->count(),
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => $users->count(),
                ]
            ]);
        }

        // Only allow known sortable columns and directions; never pass raw
        // request values as SQL identifiers.
        $allowedOrderColumns = ['created_at', 'nombres', 'apellido_paterno', 'role', 'status'];
        $orderBy = $request->get('order_by', 'created_at');
        $orderDir = strtolower($request->get('order_dir', 'desc'));

        if ($orderBy === 'name') {
            $query->orderBy('nombres', 'asc')->orderBy('apellido_paterno', 'asc');
        } else {
            $safeOrderBy = in_array($orderBy, $allowedOrderColumns, true) ? $orderBy : 'created_at';
            $safeOrderDir = in_array($orderDir, ['asc', 'desc'], true) ? $orderDir : 'desc';
            $query->orderBy($safeOrderBy, $safeOrderDir);
        }

        if ($request->has('limit')) {
            $limit = max(1, min((int) $request->get('limit'), 100));
            return UserResource::collection($query->paginate($limit));
        }

        return UserResource::collection($query->paginate(15));
    }

    public function stats()
    {
        // Devuelve solo agregados; no carga ni expone los registros de usuarios.
        $stats = User::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins")
            ->selectRaw("SUM(CASE WHEN role = 'member' THEN 1 ELSE 0 END) as jugadores")
            ->selectRaw("SUM(CASE WHEN LOWER(COALESCE(position, '')) = 'portero' THEN 1 ELSE 0 END) as porteros")
            ->selectRaw("SUM(CASE WHEN is_approved IS FALSE OR is_approved IS NULL THEN 1 ELSE 0 END) as pendientes")
            ->selectRaw("SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactivos")
            ->selectRaw("SUM(CASE WHEN status = 'active' AND is_approved IS TRUE THEN 1 ELSE 0 END) as activos")
            ->first();

        return response()->json([
            'stats' => [
                'total' => (int) $stats->total,
                'admins' => (int) $stats->admins,
                'jugadores' => (int) $stats->jugadores,
                'porteros' => (int) $stats->porteros,
                'pendientes' => (int) $stats->pendientes,
                'inactivos' => (int) $stats->inactivos,
                'activos' => (int) $stats->activos,
            ],
        ]);
    }

    public function show($id)
    {
        return new UserResource(User::findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombres' => 'required|string|max:100', 'apellido_paterno' => 'required|string|max:100', 'apellido_materno' => 'required|string|max:100',
            'email' => 'required|string|email|max:255|unique:users',
            'dni' => 'required|string|max:20|unique:users',
            'phone' => 'required|string|max:20|unique:users',
            'position' => 'nullable|string',
            'jersey_number' => 'nullable|integer',
            'role' => 'nullable|in:admin,member',
            'status' => 'nullable|in:active,inactive',
            'birth_date' => 'nullable|date',
            'blood_type' => 'nullable|string|max:10',
            'nickname' => 'nullable|string|max:50',
        ]);

        if (empty($validated['position'])) $validated['position'] = null;
        if (empty($validated['jersey_number'])) $validated['jersey_number'] = null;
        $validated['password'] = \Illuminate\Support\Facades\Hash::make($validated['dni']);
        $validated['is_approved'] = 'true'; // Auto approve manually added players

        try {
            $user = User::create($validated + ['last_convocatoria_at' => now()]);
            return new UserResource($user);
        } catch (\Exception $e) {
            report($e);
            return response()->json(['message' => 'No se pudo crear el jugador. Inténtalo nuevamente.'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $validated = $request->validate([
            'nombres' => 'sometimes|string|max:100', 'apellido_paterno' => 'sometimes|string|max:100', 'apellido_materno' => 'sometimes|string|max:100',
            'email' => 'sometimes|string|email|max:255|unique:users,email,'.$id,
            'dni' => 'sometimes|string|max:20|unique:users,dni,'.$id,
            'phone' => 'sometimes|string|max:20|unique:users,phone,'.$id,
            'position' => 'nullable|string',
            'jersey_number' => 'nullable|integer',
            'role' => 'sometimes|in:admin,member',
            'status' => 'sometimes|in:active,inactive',
            'is_approved' => 'sometimes|boolean',
            'birth_date' => 'nullable|date',
            'blood_type' => 'nullable|string|max:10',
            'nickname' => 'nullable|string|max:50',
        ]);

        // La contraseña del jugador se mantiene sincronizada con su DNI.
        if (isset($validated['dni']) && $validated['dni'] !== $user->dni) {
            $validated['password'] = Hash::make($validated['dni']);
        }
        if (isset($validated['status']) && $validated['status'] === 'active' && $user->status !== 'active') {\n            $validated['last_convocatoria_at'] = now();\n        }\n        if (isset($validated['is_approved'])) {
            $validated['is_approved'] = $validated['is_approved'] ? 'true' : 'false';
        }
        if (isset($validated['position']) && empty($validated['position'])) $validated['position'] = null;
        if (isset($validated['jersey_number']) && empty($validated['jersey_number'])) $validated['jersey_number'] = null;
        $user->update($validated);
        return new UserResource($user);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->noContent();
    }
}



