<?php
namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $receiptPath = null;
        if ($request->hasFile('payment_receipt')) {
            $receiptPath = $request->file('payment_receipt')->store('receipts', env('FILESYSTEM_DISK', 'public'));
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'dni' => $request->dni,
            'password' => Hash::make($request->dni), // DNI is the password
            'phone' => $request->phone,
            'position' => $request->position,
            'birth_date' => $request->birth_date,
            'payment_receipt' => $receiptPath,
            'is_approved' => false,
        ]);
        
        return response()->json([
            'message' => 'Registro exitoso, pendiente de aprobación.',
            'user' => new UserResource($user),
        ]);
    }

    public function login(LoginRequest $request)
    {
        if (!Auth::attempt(['phone' => $request->phone, 'password' => $request->password])) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }
        
        $user = Auth::user();
        
        if (!$user->is_approved) {
            Auth::guard('web')->logout();
            return response()->json(['message' => 'Tu cuenta está pendiente de verificación de pago por parte del administrador.'], 403);
        }

        return response()->json([
            'user' => new UserResource($user),
            'token' => $user->createToken('auth')->plainTextToken,
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();
        
        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }
        
        Auth::guard('web')->logout();
        
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    public function user(Request $request)
    {
        return new UserResource($request->user());
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $request->user()->id,
            'phone' => 'nullable|string|max:20',
            'position' => 'nullable|in:portero,defensa,medio,delantero',
            'jersey_number' => 'nullable|integer|min:1|max:99',
            'bio' => 'nullable|string|max:500',
            'birth_date' => 'nullable|date',
            'blood_type' => 'nullable|string|max:10',
            'nickname' => 'nullable|string|max:50',
        ]);

        $user = $request->user();
        $user->update($request->only(['name', 'email', 'phone', 'position', 'jersey_number', 'bio', 'birth_date', 'blood_type', 'nickname']));

        return new UserResource($user->fresh());
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,webp|max:5120',
        ]);

        $user = $request->user();

        // Eliminar avatar anterior si existe
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', env('FILESYSTEM_DISK', 'public'));
        $user->update(['avatar' => $path]);

        return new UserResource($user->fresh());
    }
}