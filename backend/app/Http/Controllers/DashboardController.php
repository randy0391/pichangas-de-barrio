<?php
namespace App\Http\Controllers;

use App\Http\Resources\ConvocatoriaResource;
use App\Http\Resources\EventResource;
use App\Http\Resources\ConfirmacionResource;
use App\Http\Resources\PostResource;
use App\Models\Confirmacion;
use App\Models\Convocatoria;
use App\Models\Event;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function userDashboard(Request $request)
    {
        $user = $request->user();

        // Próximas convocatorias abiertas
        $upcomingConvocatorias = Convocatoria::where('status', 'abierta')
            ->where('match_date', '>=', now()->toDateString())
            ->with('creator')
            ->orderBy('match_date')
            ->take(5)
            ->get();

        // Eventos próximos donde el usuario está registrado
        $myEvents = Event::where('status', 'proximo')
            ->whereHas('registrations', function ($q) use ($user) {
                $q->where('user_id', $user->id)->where('status', 'registrado');
            })
            ->orderBy('event_date')
            ->take(5)
            ->get();

        // Mis confirmaciones recientes
        $myConfirmations = Confirmacion::where('user_id', $user->id)
            ->with('convocatoria')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'upcoming_convocatorias' => ConvocatoriaResource::collection($upcomingConvocatorias),
            'my_events' => EventResource::collection($myEvents),
            'my_confirmations' => ConfirmacionResource::collection($myConfirmations),
            'stats' => [
                'total_participations' => $user->confirmaciones()->where('status', 'confirmado')->count(),
                'upcoming_convocatorias_count' => Convocatoria::where('status', 'abierta')->count(),
                'upcoming_events_count' => Event::where('status', 'proximo')->count(),
                'registered_events' => $user->eventRegistrations()->where('status', 'registrado')->count(),
            ],
        ]);
    }

    public function adminDashboard()
    {
        // Estadísticas generales
        $stats = [
            'total_members' => User::where('role', 'member')->count(),
            'total_admins' => User::where('role', 'admin')->count(),
            'active_convocatorias' => Convocatoria::where('status', 'abierta')->count(),
            'total_convocatorias' => Convocatoria::count(),
            'total_events' => Event::count(),
            'upcoming_events' => Event::where('status', 'proximo')->count(),
            'total_posts' => Post::count(),
            'published_posts' => Post::where('status', 'publicado')->count(),
        ];

        // Últimas convocatorias con stats de confirmación
        $recentConvocatorias = Convocatoria::with('creator')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Confirmaciones recientes
        $recentConfirmations = Confirmacion::with(['user', 'convocatoria'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        // Últimos miembros registrados
        $recentMembers = User::where('role', 'member')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return response()->json([
            'stats' => $stats,
            'recent_convocatorias' => ConvocatoriaResource::collection($recentConvocatorias),
            'recent_confirmations' => ConfirmacionResource::collection($recentConfirmations),
            'recent_members' => $recentMembers->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'position' => $u->position,
                'created_at' => $u->created_at,
            ]),
        ]);
    }
}