import React from 'react';
import { Trophy, ShieldCheck, Flame, Star, Award, Zap } from 'lucide-react';
import { User } from '@/types';

interface PlayerAchievementsProps {
  user: Partial<User>;
  participationsCount?: number;
}

interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  color: string;
  badge: string;
}

export const PlayerAchievements: React.FC<PlayerAchievementsProps> = ({
  user,
  participationsCount = 5
}) => {
  const isGk = user.position === 'portero';
  const hasNoFines = !user.has_pending_multas;

  const achievements: Achievement[] = [
    {
      id: 'primera_pichanga',
      name: 'Bautismo Pichanguero',
      desc: 'Participó en su primera convocatoria oficial',
      icon: '⚽',
      unlocked: participationsCount >= 1,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      badge: 'Nivel 1'
    },
    {
      id: 'puntualidad_oro',
      name: 'Puntualidad de Oro',
      desc: 'Cero multas acumuladas y asistencia ejemplar',
      icon: '🛡️',
      unlocked: hasNoFines,
      color: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
      badge: 'Fair Play'
    },
    {
      id: 'fiel_convocado',
      name: 'Pichanguero Fiel',
      desc: 'Más de 5 partidos defendiendo los colores del club',
      icon: '⚡',
      unlocked: participationsCount >= 5,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
      badge: 'Veterano'
    },
    {
      id: 'guardameta_honor',
      name: 'El Muro del Barrio',
      desc: 'Guardián del arco en partidos decisivos',
      icon: '🧤',
      unlocked: isGk,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30',
      badge: isGk ? 'Activo' : 'Especialidad'
    },
    {
      id: 'capitan_honor',
      name: 'Capitán de Barrio',
      desc: 'Liderazgo, compañerismo y respeto en cancha',
      icon: '👑',
      unlocked: participationsCount >= 10,
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30',
      badge: 'Leyenda'
    },
    {
      id: 'goleador_nocturno',
      name: 'Racha Implacable',
      desc: 'Presente en convocatorias nocturnas consecutivas',
      icon: '🔥',
      unlocked: participationsCount >= 3,
      color: 'from-red-500/20 to-rose-500/20 text-rose-400 border-rose-500/30',
      badge: 'En Racha'
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
            <Trophy size={16} />
          </div>
          <div>
            <h3 className="font-black text-base text-white uppercase tracking-tight">
              Insignias & Logros del Jugador
            </h3>
            <p className="text-xs text-slate-400">
              Desbloquea estatus con tu asistencia y fair play
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-lime-400 bg-lime-400/10 border border-lime-400/20 px-3 py-1 rounded-full">
          {achievements.filter(a => a.unlocked).length} / {achievements.length} Desbloqueados
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
              ach.unlocked
                ? `bg-gradient-to-br ${ach.color} shadow-sm`
                : 'bg-slate-950/40 border-slate-800 opacity-40 grayscale'
            }`}
          >
            <div className="text-2xl shrink-0 p-1.5 bg-slate-950/60 rounded-xl border border-white/10">
              {ach.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <h4 className="font-bold text-xs text-white truncate">{ach.name}</h4>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                  {ach.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                {ach.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
