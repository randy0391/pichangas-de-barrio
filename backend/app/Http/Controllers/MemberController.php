<?php
namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user() && $request->user()->role === 'admin') {
            return UserResource::collection(User::orderBy('created_at', 'desc')->paginate(15));
        }
        return UserResource::collection(User::where('status', 'active')->where('is_approved', true)->orderBy('created_at', 'desc')->paginate(15));
    }

    public function show($id)
    {
        return new UserResource(User::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update($request->only(['role', 'status', 'is_approved']));
        return new UserResource($user);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->noContent();
    }
}