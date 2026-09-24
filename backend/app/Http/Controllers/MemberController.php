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
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('dni', 'like', "%{$search}%")
                  ->orWhere('nickname', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('limit')) {
            $limit = (int) $request->get('limit');
            return UserResource::collection($query->orderBy('created_at', 'desc')->paginate($limit));
        }

        if ($request->user() && $request->user()->role === 'admin') {
            return UserResource::collection($query->orderBy('created_at', 'desc')->paginate(15));
        }
        return UserResource::collection($query->orderBy('created_at', 'desc')->paginate(15));
    }

    public function show($id)
    {
        return new UserResource(User::findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
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
        $validated['is_approved'] = true; // Auto approve manually added players

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
            'name' => 'sometimes|string|max:255',
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


