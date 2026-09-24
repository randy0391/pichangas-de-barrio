const fs = require('fs');
let content = fs.readFileSync('app/Http/Controllers/ConvocatoriaController.php', 'utf8');

const searchStr = `        if ($convocatoria->confirmaciones()->where('user_id', $request->user_id)->exists()) {
            return response()->json(['message' => 'El jugador ya estǭ confirmado'], 400);
        }

        $convocatoria->confirmaciones()->create([`;

const replaceStr = `        if ($convocatoria->confirmaciones()->where('user_id', $request->user_id)->exists()) {
            return response()->json(['message' => 'El jugador ya está confirmado'], 400);
        }

        if ($request->match_role === 'portero') {
            $currentPorteros = $convocatoria->confirmaciones()->where('status', 'confirmado')->where('match_role', 'portero')->count();
            if ($currentPorteros >= $convocatoria->num_teams) {
                return response()->json(['message' => 'Ya se completaron los cupos de portero.'], 422);
            }
        }

        $currentConfirmados = $convocatoria->confirmaciones()->where('status', 'confirmado')->count();
        if ($currentConfirmados >= $convocatoria->max_players) {
            return response()->json(['message' => 'Ya se completó el cupo máximo de jugadores.'], 422);
        }

        $convocatoria->confirmaciones()->create([`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync('app/Http/Controllers/ConvocatoriaController.php', content);
console.log('Done');