<?php
namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

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

        $orderBy = $request->get('order_by', 'created_at');
        $orderDir = $request->get('order_dir', 'desc');

        if ($orderBy === 'name') {
            $query->orderBy('nombres', 'asc')->orderBy('apellido_paterno', 'asc');
        } else {
            $query->orderBy($orderBy, $orderDir);
        }

        if ($request->has('limit')) {
            $limit = min((int) $request->get('limit'), 1000);
            return UserResource::collection($query->paginate($limit));
        }

        return UserResource::collection($query->paginate(15));
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
            $user = User::create($validated);
            return new UserResource($user);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
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

        if (isset($validated['dni']) && $validated['dni'] !== $user->dni) {
            if (empty($validated['position'])) $validated['position'] = null;
        if (empty($validated['jersey_number'])) $validated['jersey_number'] = null;
        $validated['password'] = \Illuminate\Support\Facades\Hash::make($validated['dni']); // Update password if DNI changes
        }

        if (isset($validated['is_approved'])) {
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



