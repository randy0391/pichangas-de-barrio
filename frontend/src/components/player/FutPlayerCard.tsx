import React, { useRef, useState } from 'react';
import { User } from '@/types';
import { Download, Share2, Sparkles, Trophy, Award } from 'lucide-react';
import { toast } from 'sonner';

interface FutPlayerCardProps {
  user: Partial<User> & { name?: string; role?: string };
  size?: 'sm' | 'md' | 'lg';
  showDownload?: boolean;
  className?: string;
  theme?: 'gold' | 'neon' | 'titanium';
}

export const FutPlayerCard: React.FC<FutPlayerCardProps> = ({
  user,
  size = 'md',
  showDownload = true,
  className = '',
  theme = 'gold'
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  // Handle 3D tilt on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  // Derive display values
  const posKey = (user.position || 'medio').toLowerCase();
  const isGoalkeeper = posKey === 'portero' || posKey === 'arquero';
  const posCode = isGoalkeeper ? 'POR' : posKey === 'defensa' ? 'DEF' : posKey === 'delantero' ? 'DEL' : 'MED';
  
  // Calculate a realistic rating between 85 and 93
  const hash = (user.id || 1) * 31 + (user.name?.length || 5);
  const rating = 86 + (hash % 8);

  // Position-specific attributes
  const stats = isGoalkeeper
    ? [
        { label: 'EST', name: 'Estirada', val: 87 + (hash % 6) },
        { label: 'PAR', name: 'Paradas', val: 89 + ((hash * 2) % 5) },
        { label: 'SAQ', name: 'Saque', val: 83 + ((hash * 3) % 7) },
        { label: 'REF', name: 'Reflejos', val: 91 + (hash % 4) },
        { label: 'VEL', name: 'Velocidad', val: 72 + (hash % 9) },
        { label: 'POS', name: 'Posicion', val: 88 + ((hash * 4) % 6) },
      ]
    : posCode === 'DEL'
    ? [
        { label: 'RIT', name: 'Ritmo', val: 89 + (hash % 6) },
        { label: 'TIR', name: 'Tiro', val: 92 + ((hash * 2) % 4) },
        { label: 'PAS', name: 'Pase', val: 82 + ((hash * 3) % 7) },
        { label: 'REG', name: 'Regate', val: 88 + (hash % 6) },
        { label: 'DEF', name: 'Defensa', val: 56 + (hash % 8) },
        { label: 'FIS', name: 'Fisico', val: 84 + ((hash * 4) % 7) },
      ]
    : posCode === 'DEF'
    ? [
        { label: 'RIT', name: 'Ritmo', val: 83 + (hash % 6) },
        { label: 'TIR', name: 'Tiro', val: 68 + ((hash * 2) % 8) },
        { label: 'PAS', name: 'Pase', val: 81 + ((hash * 3) % 6) },
        { label: 'REG', name: 'Regate', val: 79 + (hash % 7) },
        { label: 'DEF', name: 'Defensa', val: 93 + ((hash * 4) % 5) },
        { label: 'FIS', name: 'Fisico', val: 90 + (hash % 6) },
      ]
    : [
        { label: 'RIT', name: 'Ritmo', val: 85 + (hash % 6) },
        { label: 'TIR', name: 'Tiro', val: 83 + ((hash * 2) % 6) },
        { label: 'PAS', name: 'Pase', val: 92 + ((hash * 3) % 5) },
        { label: 'REG', name: 'Regate', val: 88 + (hash % 6) },
        { label: 'DEF', name: 'Defensa', val: 78 + (hash % 7) },
        { label: 'FIS', name: 'Fisico', val: 86 + ((hash * 4) % 6) },
      ];

  const displayName = (user.name || user.nombres || 'Pichanguero').split(' ')[0].toUpperCase();
  const nickname = user.nickname ? `"${user.nickname.toUpperCase()}"` : null;

  // Dimensions
  const dimClasses = {
    sm: 'w-[200px] h-[310px] text-[10px]',
    md: 'w-[260px] h-[400px] text-xs',
    lg: 'w-[320px] h-[490px] text-sm'
  }[size];

  // Theme styling
  const themeStyles = {
    gold: {
      cardBg: 'from-amber-400 via-amber-600 to-yellow-700',
      innerBg: 'from-slate-950 via-amber-950/60 to-slate-950',
      accentColor: 'text-amber-400',
      borderGlow: 'border-amber-400/60 shadow-[0_0_35px_rgba(245,158,11,0.35)]',
      badgeBg: 'bg-amber-400 text-slate-950',
      textGlow: 'text-amber-300 drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]'
    },
    neon: {
      cardBg: 'from-lime-400 via-emerald-600 to-teal-800',
      innerBg: 'from-slate-950 via-emerald-950/60 to-slate-950',
      accentColor: 'text-lime-400',
      borderGlow: 'border-lime-400/60 shadow-[0_0_35px_rgba(163,230,53,0.35)]',
      badgeBg: 'bg-lime-400 text-slate-950',
      textGlow: 'text-lime-300 drop-shadow-[0_2px_8px_rgba(163,230,53,0.8)]'
    },
    titanium: {
      cardBg: 'from-slate-300 via-slate-500 to-slate-800',
      innerBg: 'from-slate-950 via-slate-900 to-slate-950',
      accentColor: 'text-cyan-400',
      borderGlow: 'border-cyan-400/60 shadow-[0_0_35px_rgba(34,211,238,0.35)]',
      badgeBg: 'bg-cyan-400 text-slate-950',
      textGlow: 'text-cyan-300 drop-shadow-[0_2px_8px_rgba(34,211,238,0.8)]'
    }
  }[theme];

  // Export card as PNG using Canvas
  const handleDownloadCard = async () => {
    toast.loading('Generando tu Carta FUT en alta resolución...', { id: 'fut-download' });
    try {
      const canvas = document.createElement('canvas');
      const scale = 2; // retina 2x
      const width = 600;
      const height = 920;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      ctx.scale(scale, scale);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Card Shield Border
      ctx.strokeStyle = theme === 'gold' ? '#f59e0b' : theme === 'neon' ? '#84cc16' : '#06b6d4';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // Decorative inner border
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // Top info: Rating & Position
      ctx.fillStyle = theme === 'gold' ? '#fbbf24' : theme === 'neon' ? '#a3e635' : '#22d3ee';
      ctx.font = 'bold 72px sans-serif';
      ctx.fillText(String(rating), 60, 110);

      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(posCode, 60, 160);

      ctx.font = '32px sans-serif';
      ctx.fillText('🇵🇪', 60, 210);

      // Club initials
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PB FC', 60, 255);

      // Draw Avatar if available or initial
      const photoSize = 240;
      const photoX = width - photoSize - 60;
      const photoY = 70;

      if (user.avatar) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = user.avatar;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          ctx.save();
          ctx.beginPath();
          ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, photoX, photoY, photoSize, photoSize);
          ctx.restore();
          ctx.strokeStyle = ctx.fillStyle = theme === 'gold' ? '#f59e0b' : '#84cc16';
          ctx.lineWidth = 4;
          ctx.stroke();
        } catch {
          // fallback circle
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 96px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText((user.name || 'J')[0].toUpperCase(), photoX + photoSize / 2, photoY + photoSize / 2 + 35);
          ctx.textAlign = 'start';
        }
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 96px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((user.name || 'J')[0].toUpperCase(), photoX + photoSize / 2, photoY + photoSize / 2 + 35);
        ctx.textAlign = 'start';
      }

      // Jersey number badge if present
      if (user.jersey_number) {
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(width - 70, photoY + photoSize - 10, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = theme === 'gold' ? '#f59e0b' : '#84cc16';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`#${user.jersey_number}`, width - 70, photoY + photoSize - 2);
        ctx.textAlign = 'start';
      }

      // Player Name
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px sans-serif';
      ctx.fillText(displayName, width / 2, 380);

      if (nickname) {
        ctx.fillStyle = theme === 'gold' ? '#fbbf24' : theme === 'neon' ? '#a3e635' : '#22d3ee';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(nickname, width / 2, 420);
      }

      // Divider line
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 450);
      ctx.lineTo(width - 80, 450);
      ctx.stroke();

      // Stats 2 columns x 3 rows
      ctx.textAlign = 'start';
      const col1X = 110;
      const col2X = 350;
      const startY = 510;
      const lineGap = 65;

      stats.forEach((s, idx) => {
        const isCol1 = idx < 3;
        const x = isCol1 ? col1X : col2X;
        const y = startY + (idx % 3) * lineGap;

        // Stat value
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px sans-serif';
        ctx.fillText(String(s.val), x, y);

        // Stat label
        ctx.fillStyle = theme === 'gold' ? '#fbbf24' : theme === 'neon' ? '#a3e635' : '#22d3ee';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(s.label, x + 65, y);
      });

      // Bottom Crest
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('⚽ PICHANGAS DE BARRIO FC · EDICION OFICIAL ⚽', width / 2, 780);

      // Download trigger
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `FUT-${displayName}-PichangasFC.png`;
      a.click();

      toast.success('¡Carta FUT descargada con éxito!', { id: 'fut-download' });
    } catch (err) {
      console.error(err);
      toast.error('No se pudo generar la imagen', { id: 'fut-download' });
    }
  };

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {/* 3D Perspective Card Container */}
      <div 
        style={{ perspective: '1200px' }}
        className="relative group cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={cardRef}
          style={{
            transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
            transition: 'transform 0.15s ease-out'
          }}
          className={`relative ${dimClasses} rounded-[2rem] p-1 bg-gradient-to-br ${themeStyles.cardBg} ${themeStyles.borderGlow} transition-shadow duration-300 overflow-hidden flex flex-col`}
        >
          {/* Holographic Prismatic Sheen */}
          <div
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, rgba(255,255,255,0) 65%)`
            }}
            className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-200"
          />

          {/* Inner Card Body */}
          <div className={`relative w-full h-full rounded-[1.85rem] bg-gradient-to-b ${themeStyles.innerBg} p-4 sm:p-5 flex flex-col justify-between overflow-hidden border border-white/10`}>
            
            {/* Background Texture & Crest watermark */}
            <div className="absolute right-0 top-1/4 -translate-y-1/2 opacity-10 pointer-events-none text-9xl">
              ⚽
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            {/* Top Row: OVR, Position, Flag, Club */}
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex flex-col items-center">
                <span className={`font-black text-3xl sm:text-4xl tracking-tighter ${themeStyles.textGlow}`}>
                  {rating}
                </span>
                <span className={`font-black text-xs sm:text-sm uppercase tracking-wider ${themeStyles.accentColor} mt-0.5`}>
                  {posCode}
                </span>
                <div className="w-5 h-[1px] bg-white/20 my-1" />
                <span className="text-sm sm:text-base" title="Perú">🇵🇪</span>
                <span className="text-[9px] font-mono font-bold text-white/70 uppercase mt-0.5">PBFC</span>
              </div>

              {/* Player Avatar */}
              <div className="relative flex-1 flex justify-center items-center">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-white/20 bg-slate-900 shadow-2xl group-hover:scale-105 transition-transform">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white font-black text-3xl sm:text-4xl">
                      {(user.name || 'J')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Jersey number chip */}
                {user.jersey_number && (
                  <span className={`absolute -bottom-1 right-2 sm:right-6 w-7 h-7 ${themeStyles.badgeBg} font-mono font-black text-xs rounded-full flex items-center justify-center shadow-lg border-2 border-slate-950`}>
                    #{user.jersey_number}
                  </span>
                )}
              </div>
            </div>

            {/* Middle Section: Player Name & Nickname */}
            <div className="relative z-10 text-center my-2">
              <h3 className="font-black text-lg sm:text-xl text-white uppercase tracking-tight truncate drop-shadow-md">
                {displayName}
              </h3>
              {nickname ? (
                <p className={`text-[10px] sm:text-xs font-bold ${themeStyles.accentColor} italic tracking-wider truncate`}>
                  {nickname}
                </p>
              ) : (
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Pichangas de Barrio FC
                </p>
              )}
              
              {/* Divider */}
              <div className="w-3/4 mx-auto h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent my-2" />
            </div>

            {/* Bottom Section: 6 Stats Grid */}
            <div className="relative z-10 grid grid-cols-2 gap-x-4 gap-y-1 sm:gap-y-1.5 px-2 py-1 text-center bg-slate-900/40 rounded-xl border border-white/5 backdrop-blur-sm">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center justify-center gap-2">
                  <span className="font-black text-xs sm:text-sm text-white font-mono">
                    {s.val}
                  </span>
                  <span className={`font-bold text-[9px] sm:text-[10px] ${themeStyles.accentColor} uppercase tracking-wider`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Card Footer Banner */}
            <div className="relative z-10 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400 pt-2 border-t border-white/10 mt-1">
              <span className="flex items-center gap-1 text-amber-400">
                <Trophy size={11} /> OFICIAL
              </span>
              <span className="text-white/60">★ ★ ★ ★ ★</span>
              <span>2026 FC</span>
            </div>

          </div>
        </div>
      </div>

      {/* Action Download / Share Bar */}
      {showDownload && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCard}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 border border-lime-400/40 hover:border-lime-400 text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95"
            title="Descargar carta para compartir en WhatsApp o Instagram"
          >
            <Download size={13} /> Descargar Carta (PNG)
          </button>
        </div>
      )}
    </div>
  );
};
