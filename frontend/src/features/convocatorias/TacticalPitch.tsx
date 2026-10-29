import React, { useState } from 'react';
import { Convocatoria, Confirmacion } from '@/types';
import { Shield, Sparkles, ArrowRightLeft, Users, Trophy } from 'lucide-react';
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
  const hasTeams = confirmados.some(c => c.team_number !== null);

  // Group by teams
  const team1 = confirmados.filter(c => c.team_number === 1);
  const team2 = confirmados.filter(c => c.team_number === 2);
  const unassigned = confirmados.filter(c => !c.team_number);

  // Helper to place players in tactical formations on a half pitch
  // Team 1 defends Left (0% - 48%), attacks Right. Team 2 defends Right (52% - 100%), attacks Left.
  const calculatePosition = (
    player: Confirmacion,
    index: number,
    totalInRole: number,
    isTeam1: boolean
  ) => {
    const role = (player.match_role || 'jugador').toLowerCase();
    const pos = (player.user?.position || '').toLowerCase();

    if (role === 'portero') {
      return {
        x: isTeam1 ? 7 : 93,
        y: 50
      };
    }

    // Determine tactical band
    let band: 'def' | 'med' | 'del' = 'med';
    if (pos.includes('defensa') || pos.includes('lateral') || pos.includes('central')) {
      band = 'def';
    } else if (pos.includes('delantero') || pos.includes('punta') || pos.includes('extremo')) {
      band = 'del';
    }

    // Y distribution
    const ySpacing = 70 / (totalInRole + 1 || 2);
    const y = 15 + (index + 1) * ySpacing;

    let x = 50;
    if (isTeam1) {
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

  // Organize team into roles for spacing
  const layoutTeam = (teamPlayers: Confirmacion[], isTeam1: boolean) => {
    const gks = teamPlayers.filter(p => p.match_role === 'portero');
    const defs = teamPlayers.filter(p => p.match_role !== 'portero' && (p.user?.position || '').toLowerCase().includes('def'));
    const dels = teamPlayers.filter(p => p.match_role !== 'portero' && (p.user?.position || '').toLowerCase().includes('del'));
    const meds = teamPlayers.filter(p => p.match_role !== 'portero' && !defs.includes(p) && !dels.includes(p));

    const list: { player: Confirmacion; x: number; y: number }[] = [];

    gks.forEach((p, idx) => list.push({ player: p, ...calculatePosition(p, idx, gks.length, isTeam1) }));
    defs.forEach((p, idx) => list.push({ player: p, ...calculatePosition(p, idx, defs.length, isTeam1) }));
    meds.forEach((p, idx) => list.push({ player: p, ...calculatePosition(p, idx, meds.length, isTeam1) }));
    dels.forEach((p, idx) => list.push({ player: p, ...calculatePosition(p, idx, dels.length, isTeam1) }));

    return list;
  };

  const team1Positions = layoutTeam(team1, true);
  const team2Positions = layoutTeam(team2, false);

  // If no teams are drawn yet, place players in full pitch warmup formation
  const unassignedPositions = confirmados.map((p, idx) => {
    const cols = 5;
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const x = 12 + col * 19;
    const y = 20 + row * 24;
    return { player: p, x, y };
  });

  return (
    <div className="w-full space-y-4 select-none">
      {/* Top Banner & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-lime-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-lime-400/20">
            ⚽
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-wider text-white">
              Cancha Táctica Interactiva
            </h3>
            <p className="text-xs text-slate-400">
              {hasTeams 
                ? 'Alineación de Equipos: Equipo Blanco vs Equipo Verde' 
                : `${confirmados.length} jugadores convocados en cancha`}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> 🧤 Portero
          </span>
          <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-400"></span> ⚽ Jugador de Campo
          </span>
          {hasTeams && (
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> ⚪ Eq. 1 vs 🟢 Eq. 2
            </span>
          )}
        </div>
      </div>

      {/* Synthetic Grass Pitch Container */}
      <div className="relative w-full aspect-[16/9] min-h-[380px] sm:min-h-[460px] rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950">
        
        {/* Synthetic Turf Stripes */}
        <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(90deg,transparent,transparent_60px,rgba(0,0,0,0.18)_60px,rgba(0,0,0,0.18)_120px)]" />

        {/* Corner Floodlights (Stadium lighting effects) */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-radial from-white/20 via-lime-400/10 to-transparent blur-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-radial from-white/20 via-lime-400/10 to-transparent blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-radial from-white/20 via-lime-400/10 to-transparent blur-xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-radial from-white/20 via-lime-400/10 to-transparent blur-xl pointer-events-none" />

        {/* Pitch Chalk Lines (SVG for crisp lines) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none">
          {/* Outer Boundary */}
          <rect x="3%" y="4%" width="94%" height="92%" rx="10" />

          {/* Halfway Line */}
          <line x1="50%" y1="4%" x2="50%" y2="96%" />

          {/* Center Circle & Spot */}
          <circle cx="50%" cy="50%" r="9%" />
          <circle cx="50%" cy="50%" r="3" fill="rgba(255,255,255,0.6)" />

          {/* Left Penalty Area (Team 1) */}
          <rect x="3%" y="22%" width="15%" height="56%" />
          <rect x="3%" y="36%" width="6%" height="28%" />
          <circle cx="12%" cy="50%" r="2" fill="rgba(255,255,255,0.6)" />
          {/* Left Penalty Arc */}
          <path d="M 18% 42% A 8% 8% 0 0 1 18% 58%" />

          {/* Right Penalty Area (Team 2) */}
          <rect x="82%" y="22%" width="15%" height="56%" />
          <rect x="91%" y="36%" width="6%" height="28%" />
          <circle cx="88%" cy="50%" r="2" fill="rgba(255,255,255,0.6)" />
          {/* Right Penalty Arc */}
          <path d="M 82% 42% A 8% 8% 0 0 0 82% 58%" />

          {/* Corner Arcs */}
          <path d="M 3% 7% A 3% 3% 0 0 0 5% 4%" />
          <path d="M 97% 7% A 3% 3% 0 0 1 95% 4%" />
          <path d="M 3% 93% A 3% 3% 0 0 1 5% 96%" />
          <path d="M 97% 93% A 3% 3% 0 0 0 95% 96%" />
        </svg>

        {/* Center Watermark Logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
          <div className="text-center">
            <span className="text-7xl">⚽</span>
            <p className="text-white font-black tracking-widest text-xs uppercase mt-2">
              PICHANGAS DE BARRIO FC
            </p>
          </div>
        </div>

        {/* Team Badges on Pitch (if sorted) */}
        {hasTeams && (
          <>
            <div className="absolute left-[18%] top-6 bg-slate-950/80 border border-cyan-400/50 text-cyan-300 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg pointer-events-none">
              ⚪ EQUIPO 1 ({team1.length})
            </div>
            <div className="absolute right-[18%] top-6 bg-slate-950/80 border border-lime-400/50 text-lime-400 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg pointer-events-none">
              🟢 EQUIPO 2 ({team2.length})
            </div>
          </>
        )}

        {/* Player Pins */}
        {(hasTeams ? [...team1Positions, ...team2Positions] : unassignedPositions).map(({ player, x, y }) => {
          const isGoalkeeper = player.match_role === 'portero';
          const isMe = player.user?.id === user?.id;
          const pName = player.user?.name || player.user?.nombres || 'Jugador';
          const shortName = (player.user?.nickname || pName.split(' ')[0]).toUpperCase();
          const teamNum = player.team_number || 1;

          // Team color ring
          const ringColor = isGoalkeeper 
            ? 'ring-amber-400 shadow-amber-400/40 bg-amber-500' 
            : teamNum === 1
            ? 'ring-cyan-400 shadow-cyan-400/40 bg-slate-900'
            : 'ring-lime-400 shadow-lime-400/40 bg-slate-900';

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
              {/* Outer Pulse if it's the logged-in user */}
              {isMe && (
                <div className="absolute -inset-1 rounded-full bg-lime-400 animate-ping opacity-50" />
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

                {/* Jersey number badge */}
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
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-950/95 border border-lime-400/50 rounded-xl p-3 shadow-2xl backdrop-blur-md z-30 pointer-events-auto space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
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
                    {hasTeams && <p>Equipo: <strong className="text-cyan-400">Equipo {player.team_number}</strong></p>}
                  </div>

                  {isAdmin && hasTeams && onSwapTeam && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const target = player.team_number === 1 ? 2 : 1;
                        onSwapTeam(player.user.id, target);
                      }}
                      className="w-full mt-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-lime-400 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 border border-slate-700"
                    >
                      <ArrowRightLeft size={11} /> Mover al Equipo {player.team_number === 1 ? 2 : 1}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
