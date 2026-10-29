import React, { useState } from 'react';
import { Convocatoria, Confirmacion } from '@/types';
import { PauseCircle, Smartphone, Monitor } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface TacticalPitchProps {
  convocatoria: Convocatoria;
  onSelectPlayer?: (confirmacion: Confirmacion) => void;
  onSwapTeam?: (userId: number, targetTeam: number) => void;
  isAdmin?: boolean;
}

interface TacticalPlayer {
  player: Confirmacion;
  tacticalRole: 'POR' | 'DEF' | 'MED' | 'DEL';
  roleLabel: string;
  x: number;
  y: number;
}

export const TacticalPitch: React.FC<TacticalPitchProps> = ({
  convocatoria,
  onSelectPlayer,
}) => {
  const { user } = useAuthStore();
  const [hoveredPlayer, setHoveredPlayer] = useState<Confirmacion | null>(null);

  // Auto-detect mobile to default to vertical pitch so players never overlap
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'vertical';
    }
    return 'horizontal';
  });

  const confirmados = (convocatoria.confirmaciones || []).filter(c => c.status === 'confirmado');
  
  // Collect all distinct assigned team numbers
  const teamNumbers = Array.from(
    new Set(confirmados.map(c => c.team_number).filter(Boolean) as number[])
  ).sort((a, b) => a - b);

  // Strictly respect the randomized draw pairings saved in convocatoria.draw_metadata
  const drawnA = convocatoria.draw_metadata?.first_match?.team_a;
  const drawnB = convocatoria.draw_metadata?.first_match?.team_b;
  const teamA = drawnA && teamNumbers.includes(drawnA) ? drawnA : (teamNumbers[0] || 1);
  const teamB = drawnB && teamNumbers.includes(drawnB) ? drawnB : (teamNumbers[1] || 2);
  
  // Resting teams determined strictly by the random draw
  const restingTeams = convocatoria.draw_metadata?.first_match?.resting_teams?.filter(t => teamNumbers.includes(t)) 
    ?? teamNumbers.filter(t => t !== teamA && t !== teamB);

  // Filter players for each side of the match
  const team1 = confirmados.filter(c => c.team_number === teamA);
  const team2 = confirmados.filter(c => c.team_number === teamB);

  /**
   * Layout each team in a strict 3-1-2 formation:
   * 1 Goalkeeper (POR)
   * 3 Defenders (DEF: Izquierdo, Central, Derecho)
   * 1 Midfielder (MED: Pivote central)
   * 2 Forwards (DEL: Izquierdo, Derecho)
   */
  const layoutTeam312 = (
    teamPlayers: Confirmacion[], 
    isTeamA: boolean, 
    mode: 'horizontal' | 'vertical'
  ): TacticalPlayer[] => {
    if (teamPlayers.length === 0) return [];

    // 1. Separate Goalkeeper (GK)
    let gk = teamPlayers.find(p => p.match_role === 'portero');
    if (!gk) {
      gk = teamPlayers.find(p => (p.user?.position || '').toLowerCase().includes('portero') || (p.user?.position || '').toLowerCase().includes('arquero')) || teamPlayers[0];
    }
    const outfield = teamPlayers.filter(p => p.id !== gk!.id);

    // 2. Partition outfield into 3 DEF, 1 MED, 2 DEL
    const defPref: Confirmacion[] = [];
    const medPref: Confirmacion[] = [];
    const delPref: Confirmacion[] = [];
    const others: Confirmacion[] = [];

    outfield.forEach(p => {
      const pos = (p.user?.position || '').toLowerCase();
      if (pos.includes('def') || pos.includes('lateral') || pos.includes('central')) {
        defPref.push(p);
      } else if (pos.includes('del') || pos.includes('punta') || pos.includes('extremo')) {
        delPref.push(p);
      } else if (pos.includes('med') || pos.includes('volante')) {
        medPref.push(p);
      } else {
        others.push(p);
      }
    });

    const defs: Confirmacion[] = [];
    const meds: Confirmacion[] = [];
    const dels: Confirmacion[] = [];

    while (defs.length < 3 && defPref.length > 0) defs.push(defPref.shift()!);
    while (meds.length < 1 && medPref.length > 0) meds.push(medPref.shift()!);
    while (dels.length < 2 && delPref.length > 0) dels.push(delPref.shift()!);

    const remaining = [...defPref, ...medPref, ...delPref, ...others];
    while (defs.length < 3 && remaining.length > 0) defs.push(remaining.shift()!);
    while (meds.length < 1 && remaining.length > 0) meds.push(remaining.shift()!);
    while (dels.length < 2 && remaining.length > 0) dels.push(remaining.shift()!);
    while (remaining.length > 0) {
      if (meds.length <= dels.length) meds.push(remaining.shift()!);
      else dels.push(remaining.shift()!);
    }

    const result: TacticalPlayer[] = [];

    if (mode === 'horizontal') {
      // Horizontal mode: Left side (Team A) vs Right side (Team B)
      if (isTeamA) {
        // Team A (Left)
        result.push({ player: gk, tacticalRole: 'POR', roleLabel: 'POR', x: 8, y: 50 });
        const defY = [22, 50, 78];
        defs.forEach((p, i) => result.push({ player: p, tacticalRole: 'DEF', roleLabel: 'DEF', x: 21, y: defY[i] ?? 50 }));
        meds.forEach((p) => result.push({ player: p, tacticalRole: 'MED', roleLabel: 'MED', x: 33, y: 50 }));
        const delY = [35, 65];
        dels.forEach((p, i) => result.push({ player: p, tacticalRole: 'DEL', roleLabel: 'DEL', x: 44, y: delY[i] ?? 50 }));
      } else {
        // Team B (Right)
        result.push({ player: gk, tacticalRole: 'POR', roleLabel: 'POR', x: 92, y: 50 });
        const defY = [22, 50, 78];
        defs.forEach((p, i) => result.push({ player: p, tacticalRole: 'DEF', roleLabel: 'DEF', x: 79, y: defY[i] ?? 50 }));
        meds.forEach((p) => result.push({ player: p, tacticalRole: 'MED', roleLabel: 'MED', x: 67, y: 50 }));
        const delY = [35, 65];
        dels.forEach((p, i) => result.push({ player: p, tacticalRole: 'DEL', roleLabel: 'DEL', x: 56, y: delY[i] ?? 50 }));
      }
    } else {
      // Vertical mode (Mobile): Team B at TOP (attacks down), Team A at BOTTOM (attacks up)
      if (isTeamA) {
        // Team A (Bottom half)
        result.push({ player: gk, tacticalRole: 'POR', roleLabel: 'POR', x: 50, y: 92 });
        const defX = [22, 50, 78];
        defs.forEach((p, i) => result.push({ player: p, tacticalRole: 'DEF', roleLabel: 'DEF', x: defX[i] ?? 50, y: 77 }));
        meds.forEach((p) => result.push({ player: p, tacticalRole: 'MED', roleLabel: 'MED', x: 50, y: 64 }));
        const delX = [34, 66];
        dels.forEach((p, i) => result.push({ player: p, tacticalRole: 'DEL', roleLabel: 'DEL', x: delX[i] ?? 50, y: 53 }));
      } else {
        // Team B (Top half)
        result.push({ player: gk, tacticalRole: 'POR', roleLabel: 'POR', x: 50, y: 8 });
        const defX = [22, 50, 78];
        defs.forEach((p, i) => result.push({ player: p, tacticalRole: 'DEF', roleLabel: 'DEF', x: defX[i] ?? 50, y: 23 }));
        meds.forEach((p) => result.push({ player: p, tacticalRole: 'MED', roleLabel: 'MED', x: 50, y: 36 }));
        const delX = [34, 66];
        dels.forEach((p, i) => result.push({ player: p, tacticalRole: 'DEL', roleLabel: 'DEL', x: delX[i] ?? 50, y: 47 }));
      }
    }

    return result;
  };

  const team1Positions = layoutTeam312(team1, true, orientation);
  const team2Positions = layoutTeam312(team2, false, orientation);

  const teamColors: Record<number, { label: string; text: string; border: string; bg: string; ring: string }> = {
    1: { label: 'Equipo 1', text: 'text-cyan-300', border: 'border-cyan-400/50', bg: 'bg-cyan-500/10', ring: 'ring-cyan-400 shadow-cyan-400/40' },
    2: { label: 'Equipo 2', text: 'text-lime-400', border: 'border-lime-400/50', bg: 'bg-lime-500/10', ring: 'ring-lime-400 shadow-lime-400/40' },
    3: { label: 'Equipo 3', text: 'text-amber-400', border: 'border-amber-400/50', bg: 'bg-amber-500/10', ring: 'ring-amber-400 shadow-amber-400/40' },
    4: { label: 'Equipo 4', text: 'text-purple-400', border: 'border-purple-400/50', bg: 'bg-purple-500/10', ring: 'ring-purple-400 shadow-purple-400/40' },
  };

  const colorA = teamColors[teamA] || teamColors[1];
  const colorB = teamColors[teamB] || teamColors[2];

  return (
    <div className="w-full space-y-4 select-none">
      
      {/* Top Banner: Matchup & Orientation Toggle (NO Team Selector buttons!) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-lime-400 text-slate-950 flex items-center justify-center text-xl font-black shadow-md shadow-lime-400/20 shrink-0">
            ⚽
          </div>
          <div>
            <h3 className="font-black text-base uppercase tracking-tight text-white flex items-center gap-2">
              Alineación Oficial (Formación 3-1-2)
            </h3>
            <p className="text-xs text-slate-400">
              {teamNumbers.length > 2 
                ? `1er Partido Sorteado: ${colorA.label} vs ${colorB.label}` 
                : `${colorA.label} vs ${colorB.label}`}
            </p>
          </div>
        </div>

        {/* Orientation Switcher: Vertical (Mobile-friendly) vs Horizontal */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setOrientation('vertical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              orientation === 'vertical'
                ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Vista vertical ideal para celulares"
          >
            <Smartphone size={14} /> Vista Móvil (Vertical)
          </button>
          <button
            type="button"
            onClick={() => setOrientation('horizontal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              orientation === 'horizontal'
                ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Vista horizontal clásica"
          >
            <Monitor size={14} /> Cancha Completa
          </button>
        </div>
      </div>

      {/* Triangular Resting Banner (Descanso de primer turno generado aleatoriamente) */}
      {restingTeams.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400/40 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-black shrink-0 shadow-md">
              <PauseCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-300">
                ⏸️ Sorteo Aleatorio de Turnos: Descansa en este partido
              </p>
              <p className="text-sm font-black text-white">
                {restingTeams.map(t => (teamColors[t]?.label || `Equipo ${t}`)).join(', ')} — Espera en banca al ganador del 1er partido
              </p>
            </div>
          </div>

          <span className="text-[11px] font-black text-amber-400 bg-amber-400/15 border border-amber-400/30 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            En Banca / Turno 1
          </span>
        </div>
      )}

      {/* Synthetic Grass Pitch Container */}
      <div 
        className={`relative w-full rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 ${
          orientation === 'vertical' 
            ? 'h-[640px] sm:h-[680px]' 
            : 'aspect-[16/9] min-h-[420px] sm:min-h-[500px]'
        }`}
      >
        
        {/* Synthetic Turf Stripes */}
        <div 
          className={`absolute inset-0 opacity-40 ${
            orientation === 'vertical'
              ? 'bg-[repeating-linear-gradient(180deg,transparent,transparent_55px,rgba(0,0,0,0.18)_55px,rgba(0,0,0,0.18)_110px)]'
              : 'bg-[repeating-linear-gradient(90deg,transparent,transparent_60px,rgba(0,0,0,0.18)_60px,rgba(0,0,0,0.18)_120px)]'
          }`} 
        />

        {/* Stadium Floodlights */}
        <div className="absolute top-0 left-0 w-44 h-44 bg-radial from-white/20 via-lime-400/10 to-transparent blur-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-44 h-44 bg-radial from-white/20 via-lime-400/10 to-transparent blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-radial from-white/20 via-lime-400/10 to-transparent blur-xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-44 h-44 bg-radial from-white/20 via-lime-400/10 to-transparent blur-xl pointer-events-none" />

        {/* Pitch Chalk Lines (SVG adapted to orientation with valid viewBox coordinates) */}
        {orientation === 'vertical' ? (
          /* VERTICAL SVG LINES (viewBox 0 0 600 900) */
          <svg viewBox="0 0 600 900" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" fill="none">
            <rect x="24" y="27" width="552" height="846" rx="15" />
            <line x1="24" y1="450" x2="576" y2="450" />
            <circle cx="300" cy="450" r="80" />
            <circle cx="300" cy="450" r="4" fill="rgba(255,255,255,0.7)" />
            
            {/* Top Penalty Area (Team B) */}
            <rect x="132" y="27" width="336" height="150" />
            <rect x="216" y="27" width="168" height="60" />
            <circle cx="300" cy="115" r="3" fill="rgba(255,255,255,0.7)" />
            <path d="M 252 177 A 80 80 0 0 0 348 177" />

            {/* Bottom Penalty Area (Team A) */}
            <rect x="132" y="723" width="336" height="150" />
            <rect x="216" y="813" width="168" height="60" />
            <circle cx="300" cy="785" r="3" fill="rgba(255,255,255,0.7)" />
            <path d="M 252 723 A 80 80 0 0 1 348 723" />

            {/* Corner Arcs */}
            <path d="M 24 53 A 26 26 0 0 0 50 27" />
            <path d="M 576 53 A 26 26 0 0 1 550 27" />
            <path d="M 24 847 A 26 26 0 0 1 50 873" />
            <path d="M 576 847 A 26 26 0 0 0 550 873" />
          </svg>
        ) : (
          /* HORIZONTAL SVG LINES (viewBox 0 0 1000 600) */
          <svg viewBox="0 0 1000 600" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" fill="none">
            <rect x="30" y="24" width="940" height="552" rx="15" />
            <line x1="500" y1="24" x2="500" y2="576" />
            <circle cx="500" cy="300" r="90" />
            <circle cx="500" cy="300" r="4" fill="rgba(255,255,255,0.7)" />
            
            {/* Left Penalty Area */}
            <rect x="30" y="132" width="150" height="336" />
            <rect x="30" y="216" width="60" height="168" />
            <circle cx="120" cy="300" r="3" fill="rgba(255,255,255,0.7)" />
            <path d="M 180 252 A 80 80 0 0 1 180 348" />

            {/* Right Penalty Area */}
            <rect x="820" y="132" width="150" height="336" />
            <rect x="910" y="216" width="60" height="168" />
            <circle cx="880" cy="300" r="3" fill="rgba(255,255,255,0.7)" />
            <path d="M 820 252 A 80 80 0 0 0 820 348" />

            {/* Corner Arcs */}
            <path d="M 30 50 A 26 26 0 0 0 56 24" />
            <path d="M 970 50 A 26 26 0 0 1 944 24" />
            <path d="M 30 550 A 26 26 0 0 1 56 576" />
            <path d="M 970 550 A 26 26 0 0 0 944 576" />
          </svg>
        )}

        {/* Center Official Crest Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="text-center flex flex-col items-center">
            <img src="/logo.jpg" alt="Logo" className="w-16 h-16 rounded-full border border-white/40 shadow-xl mb-1 object-cover" />
            <p className="text-white font-black tracking-widest text-[10px] uppercase">
              PICHANGAS DE BARRIO FC
            </p>
          </div>
        </div>

        {/* Team Badges on Pitch */}
        {orientation === 'vertical' ? (
          <>
            <div className={`absolute top-4 left-4 bg-slate-950/90 border ${colorB.border} ${colorB.text} px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg pointer-events-none`}>
              🟢 {colorB.label} ({team2.length})
            </div>
            <div className={`absolute bottom-4 right-4 bg-slate-950/90 border ${colorA.border} ${colorA.text} px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg pointer-events-none`}>
              ⚪ {colorA.label} ({team1.length})
            </div>
          </>
        ) : (
          <>
            <div className={`absolute left-[14%] top-5 bg-slate-950/90 border ${colorA.border} ${colorA.text} px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg pointer-events-none`}>
              ⚪ {colorA.label} ({team1.length})
            </div>
            <div className={`absolute right-[14%] top-5 bg-slate-950/90 border ${colorB.border} ${colorB.text} px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg pointer-events-none`}>
              🟢 {colorB.label} ({team2.length})
            </div>
          </>
        )}

        {/* Player Pins on Field (3-1-2 Formation) */}
        {[...team1Positions, ...team2Positions].map(({ player, tacticalRole, roleLabel, x, y }) => {
          const isGoalkeeper = tacticalRole === 'POR';
          const isMe = player.user?.id === user?.id;
          const pName = player.user?.name || player.user?.nombres || 'Jugador';
          const shortName = (player.user?.nickname || pName.split(' ')[0]).toUpperCase();
          const pTeamNum = player.team_number || 1;
          const colorObj = teamColors[pTeamNum] || teamColors[1];

          const ringColor = isGoalkeeper 
            ? 'ring-amber-400 shadow-amber-400/50 bg-amber-500' 
            : `${colorObj.ring} bg-slate-900`;

          return (
            <div
              key={player.id}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              className="absolute z-20 group cursor-pointer"
              onMouseEnter={() => setHoveredPlayer(player)}
              onMouseLeave={() => setHoveredPlayer(null)}
              onClick={() => onSelectPlayer && onSelectPlayer(player)}
            >
              {isMe && (
                <div className="absolute -inset-1.5 rounded-full bg-lime-400 animate-ping opacity-60" />
              )}

              {/* Pin Circle with Photo or Initials */}
              <div className={`relative w-8 h-8 sm:w-11 sm:h-11 rounded-full ring-2 sm:ring-4 ${ringColor} shadow-xl flex items-center justify-center transition-all duration-200 group-hover:scale-125 overflow-hidden`}>
                {player.user?.avatar ? (
                  <img src={player.user.avatar} alt={pName} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-xs sm:text-sm text-white">
                    {isGoalkeeper ? '🧤' : shortName.charAt(0)}
                  </span>
                )}

                {/* Jersey number mini badge */}
                {player.user?.jersey_number && (
                  <span className="absolute bottom-0 right-0 bg-slate-950 text-white font-mono font-black text-[8px] sm:text-[9px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border border-white/30">
                    {player.user.jersey_number}
                  </span>
                )}
              </div>

              {/* Player Name & Role Pill (Always legible, never overlapping in 3-1-2) */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 whitespace-nowrap bg-slate-950/95 text-white text-[9px] sm:text-xs font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-md border border-white/20 shadow-md group-hover:bg-lime-400 group-hover:text-slate-950 transition-colors flex items-center gap-1">
                <span className={`text-[8px] sm:text-[9px] font-mono px-1 py-0.2 rounded ${isGoalkeeper ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                  {roleLabel}
                </span>
                <span>{shortName}</span>
              </div>

              {/* Interactive Tooltip on hover */}
              {hoveredPlayer?.id === player.id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-950/95 border border-lime-400/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md z-30 pointer-events-auto space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{isGoalkeeper ? '🧤' : '⚽'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-xs text-white truncate">{pName}</p>
                      {player.user?.nickname && (
                        <p className="text-[10px] text-lime-400 font-bold truncate">"{player.user.nickname}"</p>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-300 space-y-0.5 border-t border-slate-800 pt-1">
                    <p>Posición: <strong className="text-white uppercase">{player.user?.position || player.match_role}</strong> ({roleLabel})</p>
                    {player.user?.jersey_number && <p>Dorsal: <strong className="text-white font-mono">#{player.user.jersey_number}</strong></p>}
                    <p>Equipo: <strong className={colorObj.text}>{colorObj.label}</strong></p>
                  </div>

                  <p className="text-[9px] text-amber-400 font-bold pt-1 text-center border-t border-slate-800">
                    ✨ Clic para abrir Carta FUT 3D
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resting Team Bench Cards (if triangular) - Display ONLY, no switcher buttons */}
      {restingTeams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {restingTeams.map(restNum => {
            const restPlayers = confirmados.filter(c => c.team_number === restNum);
            const colorR = teamColors[restNum] || teamColors[3];

            return (
              <div 
                key={restNum}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                      {restNum}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white uppercase">{colorR.label} (En Banca)</h4>
                      <p className="text-[11px] text-slate-400">Descansa 1er turno · {restPlayers.length} jugadores</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Espera Turno
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {restPlayers.map(p => {
                    const isGk = p.match_role === 'portero';
                    const pName = p.user?.name || 'Jugador';
                    return (
                      <div
                        key={p.id}
                        onClick={() => onSelectPlayer && onSelectPlayer(p)}
                        className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-amber-400 transition-colors"
                      >
                        <span className="text-sm">{isGk ? '🧤' : '⚽'}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{pName.split(' ')[0]}</p>
                          <span className="text-[9px] text-slate-400 uppercase">{p.user?.position || p.match_role}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
