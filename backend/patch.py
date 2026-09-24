import re

with open('app/Http/Controllers/ConvocatoriaController.php', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"if \(\\->confirmaciones\(\)->where\('user_id', \\->user_id\)->exists\(\)\) \{.*?return response\(\)->json\(\['message' => 'El jugador ya.*?confirmado'\], 400\);\s*\}"

replacement = '''if (\->confirmaciones()->where('user_id', \->user_id)->exists()) {
            return response()->json(['message' => 'El jugador ya está confirmado'], 400);
        }

        if (\->match_role === 'portero') {
            \ = \->confirmaciones()->where('status', 'confirmado')->where('match_role', 'portero')->count();
            if (\ >= \->num_teams) {
                return response()->json(['message' => 'Ya se completaron los cupos de portero.'], 422);
            }
        }

        \ = \->confirmaciones()->where('status', 'confirmado')->count();
        if (\ >= \->max_players) {
            return response()->json(['message' => 'Ya se completó el cupo máximo de jugadores.'], 422);
        }'''

new_content = re.sub(pattern, replacement.replace('\\$', '$'), content, flags=re.DOTALL)

with open('app/Http/Controllers/ConvocatoriaController.php', 'w', encoding='utf-8') as f:
    f.write(new_content)