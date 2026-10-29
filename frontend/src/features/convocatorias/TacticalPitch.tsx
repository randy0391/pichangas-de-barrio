import React, { useState } from 'react';
import { Convocatoria, Confirmacion } from '@/types';
import { Shield, Sparkles, ArrowRightLeft, Users, Trophy, PauseCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface TacticalPitchProps {
  convocatoria: Convocatoria;
  onSelectPlayer?: (confirmacion: Confirmacion) => void;
  onSwapTeam?: (userId: number, targetTeam: number) => void;
  isAdmin?: boolean;
}

export const TacticalPitch: React.FC<TacticalPitchProps> = ({
  convocatoria,
  onSelectPlayer,
  onSwapTeam,
  isAdmin = false
}) => {
  const { user } = useAuthStore();
  const [hoveredPlayer, setHoveredPlayer] = useState<Confirmacion | null>(null);

  const confirmados = (convocatoria.confirmaciones || []).filter(c => c.status === 'confirmado');
  
  // Collect all distinct assigned team numbers
  const teamNumbers = Array.from(
    new Set(confirmados.map(c => c.team_number).filter(Boolean) as number[])
  ).sort((a, b) => a - b);

  // For multi-team triangular (3+ teams), track which two teams are currently active on pitch
  const [activeTeams, setActiveTeams] = useState<[number, number]>(() => {
    return [teamNumbers[0] || 1, teamNumbers[1] || 2];
  });

  const [teamA, teamB] = activeTeams;
  const restingTeams = teamNumbers.filter(t => t !== teamA && t !== teamB);

  // Filter players for each side of the pitch
  const team1 = confirmados.filter(c => c.team_number === teamA);
  const team2 = confirmados.filter(c => c.team_number === teamB);

  // Helper to place players in tactical formations on a half pitch
  const calculatePosition = (
    player: Confirmacion,
    index: number,
    totalInRole: number,
    isLeftTeam: boolean
  ) => {
    const role = (player.match_role || 'jugador').toLowerCase();
    const pos = (player.user?.position || '').toLowerCase();

    if (role === 'portero') {
      return {
        x: isLeftTeam ? 7 : 93,
        y: 50
      };
    }

    let band: 'def' | 'med' | 'del' = 'med';
    if (pos.includes('defensa') || pos.includes('lateral') || pos.includes('central')) {
      band = 'def';
    } else if (pos.includes('delantero') || pos.includes('punta') || pos.includes('extremo')) {
      band = 'del';
    }

    const ySpacing = 70 / (totalInRole + 1 || 2);
    const y = 15 + (index + 1) * ySpacing;

    let x = 50;
    if (isLeftTeam) {
      if (band === 'def') x = 20;
      else if (band === 'med') x = 32;
      else x = 44;
    } else {
      if (band === 'def') x = 80;
      else if (band === 'med') x = 68;
      else x = 56;
    }

    return { x, y };
  };

  const layoutTeam = (teamPlayers: Confirmacion[], isLeftTeam: boolean) => {
    const gks = teamPlayers.filter(p => p.match_role === 'portero');
    const defs = teamPlayers.filter(p => p.match_role !== 'portero' && (p.user?.position || '').toLowerCase().includes('def'));
    const dels = teamPlayers.filter(p => p.match_role !== 'portero' && (p.user?.position || '').toLowerCase().includes('del'));
    const meds = teamPlayers.filter(p => p.match_role !== 'portero' && !defs.includes(p) && !dels.includes(p));

    const list: { player: Confirmacion; x: number; y: number }[] = [];

    gks.forEach((p, idx) => list.push({ player: p, ...calculatePosition(p, idx, gks.length, isLeftTeam) }));
    defs.forEach((p, idx) => list.push({ player: p, ...calculatePosition(p, idx, defs.length, isLeftTeam) }));
    meds.forEach((p, idx) => list.push({ player: p, ...calculatePosition(p, idx, meds.length, isLeftTeam) }));
    dels.forEach((p, idx) => list.push({ player: p, ...calculatePosition(p, idx, dels.length, isLeftTeam) }));

    return list;
  };

  const team1Positions = layoutTeam(team1, true);
  const team2Positions = layoutTeam(team2, false);

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
      
      {/* Top Banner & Matchup Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-lime-400 text-slate-950 flex items-center justify-center text-xl font-black shadow-md shadow-lime-400/20">
            ⚽
          </div>
          <div>
            <h3 className="font-black text-base uppercase tracking-tight text-white flex items-center gap-2">
              Alineación Oficial en Cancha
            </h3>
            <p className="text-xs text-slate-400">
              {teamNumbers.length > 2 
                ? `Torneo Triangular (${teamNumbers.length} equipos sorteados)` 
                : 'Encuentro Oficial: Equipo 1 vs Equipo 2'}
            </p>
          </div>
        </div>

        {/* Triangular Match Selector if more than 2 teams */}
        {teamNumbers.length > 2 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Ver Partido:</span>
            {teamNumbers.map((t1, i) =>
              teamNumbers.slice(i + 1).map(t2 => {
                const isActive = (teamA === t1 && teamB === t2) || (teamA === t2 && teamB === t1);
                return (
                  <button
                    key={`${t1}-${t2}`}
                    type="button"
                    onClick={() => setActiveTeams([t1, t2])}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      isActive 
                        ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/20' 
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Eq {t1} vs Eq {t2}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Triangular Resting Banner (Descanso de primer turno) */}
      {restingTeams.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400/40 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-lg font-black shrink-0">
              <PauseCircle size={22} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-300">
                ⏸️ Sorteo de Turnos: Descansa en este partido
              </p>
              <p className="text-sm font-black text-white">
                {restingTeams.map(t => `Equipo ${t}`).join(', ')} (Espera al ganador del 1er partido)
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full uppercase tracking-wider">
            En Banca / Esperando turno
          </span>
        </div>
      )}

      {/* Synthetic Grass Pitch Container */}
      <div className="relative w-full aspect-[16/9] min-h-[400px] sm:min-h-[480px] rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950">
        
        {/* Synthetic Turf Stripes */}
        <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(90deg,transparent,transparent_60px,rgba(0,0,0,0.18)_60px,rgba(0,0,0,0.18)_120px)]" />

        {/* Stadium Corner Floodlights */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-radial from-white/20 via-lime-400/10 to-transparent blur-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-radial from-white/20 via-lime-400/10 to-transparent blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-radial from-white/20 via-lime-400/10 to-transparent blur-xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-radial from-white/20 via-lime-400/10 to-transparent blur-xl pointer-events-none" />

        {/* Pitch Chalk Lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none">
          <rect x="3%" y="4%" width="94%" height="92%" rx="10" />
          <line x1="50%" y1="4%" x2="50%" y2="96%" />
          <circle cx="50%" cy="50%" r="9%" />
          <circle cx="50%" cy="50%" r="3" fill="rgba(255,255,255,0.6)" />
          {/* Left Penalty Area */}
          <rect x="3%" y="22%" width="15%" height="56%" />
          <rect x="3%" y="36%" width="6%" height="28%" />
          <circle cx="12%" cy="50%" r="2" fill="rgba(255,255,255,0.6)" />
          <path d="M 18% 42% A 8% 8% 0 0 1 18% 58%" />
          {/* Right Penalty Area */}
          <rect x="82%" y="22%" width="15%" height="56%" />
          <rect x="91%" y="36%" width="6%" height="28%" />
          <circle cx="88%" cy="50%" r="2" fill="rgba(255,255,255,0.6)" />
          <path d="M 82% 42% A 8% 8% 0 0 0 82% 58%" />
          {/* Corner Arcs */}
          <path d="M 3% 7% A 3% 3% 0 0 0 5% 4%" />
          <path d="M 97% 7% A 3% 3% 0 0 1 95% 4%" />
          <path d="M 3% 93% A 3% 3% 0 0 1 5% 96%" />
          <path d="M 97% 93% A 3% 3% 0 0 0 95% 96%" />
        </svg>

        {/* Center Official Crest Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="text-center flex flex-col items-center">
            <img src="/logo.jpg" alt="Logo" className="w-16 h-16 rounded-full border border-white/40 shadow-xl mb-1 object-cover" />
            <p className="text-white font-black tracking-widest text-[11px] uppercase">
              PICHANGAS DE BARRIO FC
            </p>
          </div>
        </div>

        {/* Team Badges on Pitch */}
        <div className={`absolute left-[16%] top-6 bg-slate-950/85 border ${colorA.border} ${colorA.text} px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg pointer-events-none`}>
          ⚪ {colorA.label} ({team1.length})
        </div>
        <div className={`absolute right-[16%] top-6 bg-slate-950/85 border ${colorB.border} ${colorB.text} px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg pointer-events-none`}>
          🟢 {colorB.label} ({team2.length})
        </div>

        {/* Player Pins on Field */}
        {[...team1Positions, ...team2Positions].map(({ player, x, y }) => {
          const isGoalkeeper = player.match_role === 'portero';
          const isMe = player.user?.id === user?.id;
          const pName = player.user?.name || player.user?.nombres || 'Jugador';
          const shortName = (player.user?.nickname || pName.split(' ')[0]).toUpperCase();
          const pTeamNum = player.team_number || 1;
          const colorObj = teamColors[pTeamNum] || teamColors[1];

          const ringColor = isGoalkeeper 
            ? 'ring-amber-400 shadow-amber-400/40 bg-amber-500' 
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
                <div className="absolute -inset-1 rounded-full bg-lime-400 animate-ping opacity-60" />
              )}

              {/* Pin Circle */}
              <div className={`relative w-9 h-9 sm:w-11 sm:h-11 rounded-full ring-2 sm:ring-4 ${ringColor} shadow-xl flex items-center justify-center transition-all duration-200 group-hover:scale-125 overflow-hidden`}>
                {player.user?.avatar ? (
                  <img src={player.user.avatar} alt={pName} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-xs sm:text-sm text-white">
                    {isGoalkeeper ? '🧤' : shortName.charAt(0)}
                  </span>
                )}

                {player.user?.jersey_number && (
                  <span className="absolute bottom-0 right-0 bg-slate-950 text-white font-mono font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white/30">
                    {player.user.jersey_number}
                  </span>
                )}
              </div>

              {/* Player Name Pill */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap bg-slate-950/90 text-white text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-md border border-white/20 shadow-md group-hover:bg-lime-400 group-hover:text-slate-950 transition-colors">
                {shortName}
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
                    <p>Posición: <strong className="text-white uppercase">{player.user?.position || player.match_role}</strong></p>
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

      {/* Resting Team Bench Cards (if triangular) */}
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
                      <p className="text-[11px] text-slate-400">Descansando · {restPlayers.length} jugadores</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTeams([teamA, restNum])}
                    className="text-xs font-black uppercase text-lime-400 hover:text-lime-300 transition-colors"
                  >
                    Poner en Cancha →
                  </button>
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
