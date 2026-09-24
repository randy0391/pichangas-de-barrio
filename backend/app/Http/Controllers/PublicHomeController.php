<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Convocatoria;
use App\Models\Confirmacion;

class PublicHomeController extends Controller
{
    public function index()
    {
        // 1. Stats
        $activePlayers = User::where('role', 'member')->where('is_approved', 'true')->count();
        $gamesPlayed = Convocatoria::count();
        $totalConfirmaciones = Confirmacion::where('status', 'confirmado')->count(); // Representando Asistencias o Compromiso
        $canchasAliadas = Convocatoria::distinct('location')->count('location');

        // 2. Próximo Partido (Next Open Match)
        $nextMatch = Convocatoria::where('status', 'abierta')
            ->where('match_date', '>=', now()->toDateString())
            ->orderBy('match_date', 'asc')
            ->orderBy('match_time', 'asc')
            ->first();

        $nextMatchData = null;
        if ($nextMatch) {
            $nextMatchData = [
                'id' => $nextMatch->id,
                'title' => $nextMatch->title,
                'location' => $nextMatch->location,
                'match_date' => $nextMatch->match_date->format('d M'), // e.g., 15 Oct
                'match_time' => $nextMatch->match_time->format('H:i'), // e.g., 20:00
                'confirmed_count' => Confirmacion::where('convocatoria_id', $nextMatch->id)->where('status', 'confirmado')->count(),
                'max_players' => $nextMatch->max_players,
                'rival' => $nextMatch->rival,
            ];
        }

        return response()->json([
            'stats' => [
                'active_players' => $activePlayers,
                'games_played' => $gamesPlayed,
                'total_assists' => $totalConfirmaciones,
                'fields' => max(1, $canchasAliadas) // at least 1
            ],
            'next_match' => $nextMatchData
        ]);
    }
}
