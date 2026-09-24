const fs = require('fs');
let content = fs.readFileSync('app/Http/Controllers/ConvocatoriaController.php', 'utf8');

const regex = /public function addPlayer\(Request \$request, \$id\)\s*\{[\s\S]*?return response\(\)->json\(\['message' => 'Jugador [^\n]+'\s*\}\s*$/m;
// wait, end of class is } at the end.

const replaceStr = `public function addPlayer(Request $request, $id)
    {
        if (!$request->user()->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'match_role' => 'required|in:jugador,portero'
        ]);

        $convocatoria = Convocatoria::findOrFail($id);

        if ($convocatoria->status !== 'abierta') {
            return response()->json(['message' => 'La convocatoria ya no esta abierta'], 400);
        }

        if ($convocatoria->confirmaciones()->where('user_id', $request->user_id)->exists()) {
            return response()->json(['message' => 'El jugador ya esta confirmado'], 400);
        }

        if ($request->match_role === 'portero') {
            $currentPorteros = $convocatoria->confirmaciones()->where('status', 'confirmado')->where('match_role', 'portero')->count();
            if ($currentPorteros >= $convocatoria->num_teams) {
                return response()->json(['message' => 'Ya se completaron los cupos de portero.'], 422);
            }
        }

        $currentConfirmados = $convocatoria->confirmaciones()->where('status', 'confirmado')->count();
        if ($currentConfirmados >= $convocatoria->max_players) {
            return response()->json(['message' => 'Ya se completo el cupo maximo de jugadores.'], 422);
        }

        $convocatoria->confirmaciones()->create([
            'user_id' => $request->user_id,
            'match_role' => $request->match_role,
            'status' => 'confirmado'
        ]);

        return response()->json(['message' => 'Jugador anadido exitosamente']);
    }
}
`;

content = content.replace(/public function addPlayer\(Request \$request, \$id\)[\s\S]+/, replaceStr);
fs.writeFileSync('app/Http/Controllers/ConvocatoriaController.php', content);
console.log('Done');