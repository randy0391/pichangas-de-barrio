import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Camera, Wallet, Shield, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Story {
  id: string;
  label: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  gradient: string;
  ringColor: string;
  actionText: string;
  actionUrl: string;
  bgEmoji: string;
}

const CLUB_STORIES: Story[] = [
  {
    id: 'convocatorias',
    label: 'Pichangas',
    icon: '⚽',
    title: '¡PRÓXIMAS PICHANGAS ACTIVAS!',
    subtitle: 'Martes, Jueves 9:00 PM y Sábados 6:00 AM',
    description: 'Asegura tu cupo con tiempo. Recuerda que los arqueros tienen cupos exclusivos y puedes pagar con tu Billetera Digital.',
    badge: '⚽ PARTIDOS OFICIALES',
    gradient: 'from-emerald-950 via-slate-900 to-lime-950',
    ringColor: 'from-lime-400 to-emerald-500',
    actionText: 'Ver Convocatorias',
    actionUrl: '/convocatorias',
    bgEmoji: '⚽'
  },
  {
    id: 'galeria',
    label: 'Fotos HD',
    icon: '📸',
    title: 'FOTOS OFICIALES DEL CLUB',
    subtitle: 'Álbumes en Alta Definición',
    description: 'Revive las mejores jugadas, atajadas y celebraciones de las pichangas. Descarga tus fotos en Full HD para tus estados.',
    badge: '📸 GALERÍA DEL CLUB',
    gradient: 'from-slate-950 via-slate-900 to-cyan-950',
    ringColor: 'from-cyan-400 to-blue-500',
    actionText: 'Ver Todas las Fotos',
    actionUrl: '/galeria',
    bgEmoji: '📸'
  },
  {
    id: 'mvp',
    label: 'Top Cracks',
    icon: '👑',
    title: 'RANKING & JUGADOR DEL MES',
    subtitle: 'Los más destacados de la cancha',
    description: 'Cada partido suma para tu carta FUT. Mantén una racha de asistencia perfecta y gana insignias especiales de honor.',
    badge: '👑 CRACKS DEL BARRIO',
    gradient: 'from-amber-950 via-slate-900 to-yellow-950',
    ringColor: 'from-amber-400 to-yellow-500',
    actionText: 'Ver Mi Perfil FUT',
    actionUrl: '/perfil',
    bgEmoji: '🏆'
  },
  {
    id: 'billetera',
    label: 'Billetera',
    icon: '💰',
    title: 'BILLETERA DIGITAL INSTANTÁNEA',
    subtitle: 'Recarga fácil con Yape o Plin',
    description: 'Olvídate de buscar efectivo en la cancha. Ten saldo siempre listo para confirmar tu cupo en 1 solo clic.',
    badge: '💰 CERO EFECTIVO',
    gradient: 'from-purple-950 via-slate-900 to-indigo-950',
    ringColor: 'from-purple-400 to-pink-500',
    actionText: 'Ir a Mi Billetera',
    actionUrl: '/billetera',
    bgEmoji: '💳'
  },
  {
    id: 'fairplay',
    label: 'Fair Play',
    icon: '🛡️',
    title: 'CÓDIGO FAIR PLAY & PUNTUALIDAD',
    subtitle: 'Llega 15 min antes al partido',
    description: 'El respeto y la buena vibra son la ley en Pichangas de Barrio FC. Evita multas confirmando con responsabilidad.',
    badge: '🛡️ REGLAMENTO FC',
    gradient: 'from-rose-950 via-slate-900 to-red-950',
    ringColor: 'from-rose-400 to-red-500',
    actionText: 'Ver Mis Multas',
    actionUrl: '/mis-multas',
    bgEmoji: '🤝'
  }
];

export const ClubStoriesBar: React.FC = () => {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  // Auto-advance story timer (5s per story)
  useEffect(() => {
    if (activeStoryIndex === null) {
      setProgress(0);
      return;
    }

    const duration = 5000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (activeStoryIndex < CLUB_STORIES.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [activeStoryIndex]);

  const activeStory = activeStoryIndex !== null ? CLUB_STORIES[activeStoryIndex] : null;

  return (
    <>
      {/* Horizontal Story Bubbles Bar */}
      <div className="w-full overflow-x-auto scrollbar-none py-2 select-none">
        <div className="flex items-center gap-4 sm:gap-6 min-w-max px-1">
          {CLUB_STORIES.map((story, idx) => (
            <button
              key={story.id}
              type="button"
              onClick={() => {
                setActiveStoryIndex(idx);
                setProgress(0);
              }}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              {/* Outer Glowing Gradient Ring */}
              <div className={`p-[2.5px] rounded-full bg-gradient-to-tr ${story.ringColor} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-950 flex items-center justify-center border-2 border-slate-900 text-2xl sm:text-3xl shadow-inner group-hover:bg-slate-900 transition-colors">
                  {story.icon}
                </div>
              </div>

              {/* Story Label */}
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-lime-400 transition-colors">
                {story.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Full-Screen Instagram-like Story Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5">
          <div className={`relative w-full max-w-md h-[80vh] max-h-[680px] rounded-3xl p-6 sm:p-8 bg-gradient-to-b ${activeStory.gradient} border border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
            
            {/* Background Big Watermark */}
            <div className="absolute right-4 bottom-10 text-9xl opacity-10 pointer-events-none select-none">
              {activeStory.bgEmoji}
            </div>

            {/* Segmented Progress Bars */}
            <div className="relative z-10 flex items-center gap-1.5 w-full">
              {CLUB_STORIES.map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: i < activeStoryIndex! ? '100%' : i === activeStoryIndex ? `${progress}%` : '0%'
                    }}
                    className="h-full bg-lime-400 transition-all duration-75"
                  />
                </div>
              ))}
            </div>

            {/* Story Header */}
            <div className="relative z-10 flex items-center justify-between pt-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{activeStory.icon}</span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-lime-400 block">
                    {activeStory.badge}
                  </span>
                  <span className="text-xs font-bold text-white">
                    Pichangas de Barrio FC
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveStoryIndex(null)}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Story Center Body */}
            <div className="relative z-10 my-auto space-y-4 text-center px-2">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-lime-400/10 border-2 border-lime-400/40 flex items-center justify-center text-5xl shadow-2xl shadow-lime-400/10">
                {activeStory.icon}
              </div>

              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight">
                  {activeStory.title}
                </h2>
                <p className="text-xs sm:text-sm font-bold text-lime-400 uppercase tracking-wider">
                  {activeStory.subtitle}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                {activeStory.description}
              </p>
            </div>

            {/* Navigation Tap Zones */}
            <button
              type="button"
              onClick={() => {
                if (activeStoryIndex! > 0) {
                  setActiveStoryIndex(activeStoryIndex! - 1);
                  setProgress(0);
                }
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeStoryIndex! < CLUB_STORIES.length - 1) {
                  setActiveStoryIndex(activeStoryIndex! + 1);
                  setProgress(0);
                } else {
                  setActiveStoryIndex(null);
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors"
            >
              <ChevronRight size={28} />
            </button>

            {/* Bottom Action CTA */}
            <div className="relative z-10 pt-4">
              <Link
                to={activeStory.actionUrl}
                onClick={() => setActiveStoryIndex(null)}
                className="w-full h-12 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-lime-400/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {activeStory.actionText} <ExternalLink size={15} />
              </Link>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
