import React, { useRef, useState } from 'react';
import { User } from '@/types';
import { Download, Sparkles, Trophy } from 'lucide-react';
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

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

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
  
  // Calculate a realistic rating between 86 and 93
  const hash = (user.id || 1) * 31 + (user.name?.length || 5);
  const rating = 87 + (hash % 7);

  // Position-specific attributes
  const stats = isGoalkeeper
    ? [
        { label: 'EST', name: 'Estirada', val: 88 + (hash % 5) },
        { label: 'PAR', name: 'Paradas', val: 90 + ((hash * 2) % 4) },
        { label: 'SAQ', name: 'Saque', val: 84 + ((hash * 3) % 6) },
        { label: 'REF', name: 'Reflejos', val: 92 + (hash % 4) },
        { label: 'VEL', name: 'Velocidad', val: 75 + (hash % 8) },
        { label: 'POS', name: 'Posición', val: 89 + ((hash * 4) % 5) },
      ]
    : posCode === 'DEL'
    ? [
        { label: 'RIT', name: 'Ritmo', val: 90 + (hash % 5) },
        { label: 'TIR', name: 'Tiro', val: 93 + ((hash * 2) % 4) },
        { label: 'PAS', name: 'Pase', val: 84 + ((hash * 3) % 6) },
        { label: 'REG', name: 'Regate', val: 89 + (hash % 5) },
        { label: 'DEF', name: 'Defensa', val: 58 + (hash % 7) },
        { label: 'FIS', name: 'Físico', val: 86 + ((hash * 4) % 6) },
      ]
    : posCode === 'DEF'
    ? [
        { label: 'RIT', name: 'Ritmo', val: 84 + (hash % 5) },
        { label: 'TIR', name: 'Tiro', val: 70 + ((hash * 2) % 6) },
        { label: 'PAS', name: 'Pase', val: 82 + ((hash * 3) % 5) },
        { label: 'REG', name: 'Regate', val: 80 + (hash % 6) },
        { label: 'DEF', name: 'Defensa', val: 93 + ((hash * 4) % 4) },
        { label: 'FIS', name: 'Físico', val: 91 + (hash % 5) },
      ]
    : [
        { label: 'RIT', name: 'Ritmo', val: 87 + (hash % 5) },
        { label: 'TIR', name: 'Tiro', val: 85 + ((hash * 2) % 5) },
        { label: 'PAS', name: 'Pase', val: 92 + ((hash * 3) % 5) },
        { label: 'REG', name: 'Regate', val: 89 + (hash % 5) },
        { label: 'DEF', name: 'Defensa', val: 80 + (hash % 6) },
        { label: 'FIS', name: 'Físico', val: 88 + ((hash * 4) % 5) },
      ];

  const displayName = (user.name || user.nombres || 'PICHANGUERO').split(' ')[0].toUpperCase();
  const nickname = user.nickname ? `"${user.nickname.toUpperCase()}"` : null;

  // Dimensions
  const dimClasses = {
    sm: 'w-[230px] h-[350px] text-[10px]',
    md: 'w-[280px] h-[430px] text-xs',
    lg: 'w-[320px] h-[490px] text-sm'
  }[size];

  // Theme styling
  const themeStyles = {
    gold: {
      outerBorder: 'from-amber-300 via-yellow-500 to-amber-700',
      innerBg: 'from-[#1a1202] via-[#241a06] to-[#0c0902]',
      accentColor: 'text-amber-400',
      badgeBg: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950',
      textGlow: 'text-amber-300 drop-shadow-[0_2px_10px_rgba(251,191,36,0.8)]',
      borderGlow: 'shadow-[0_0_35px_rgba(245,158,11,0.4)]'
    },
    neon: {
      outerBorder: 'from-lime-300 via-emerald-500 to-teal-700',
      innerBg: 'from-[#02180e] via-[#042416] to-[#020d08]',
      accentColor: 'text-lime-400',
      badgeBg: 'bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950',
      textGlow: 'text-lime-300 drop-shadow-[0_2px_10px_rgba(163,230,53,0.8)]',
      borderGlow: 'shadow-[0_0_35px_rgba(163,230,53,0.4)]'
    },
    titanium: {
      outerBorder: 'from-cyan-300 via-blue-500 to-indigo-700',
      innerBg: 'from-[#04121d] via-[#061a29] to-[#020a10]',
      accentColor: 'text-cyan-400',
      badgeBg: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950',
      textGlow: 'text-cyan-300 drop-shadow-[0_2px_10px_rgba(34,211,238,0.8)]',
      borderGlow: 'shadow-[0_0_35px_rgba(34,211,238,0.4)]'
    }
  }[theme];

  // Export card as PNG using Canvas
  const handleDownloadCard = async () => {
    toast.loading('Generando tu Carta FUT en HD...', { id: 'fut-download' });
    try {
      const canvas = document.createElement('canvas');
      const scale = 2; // retina 2x
      const width = 640;
      const height = 960;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      ctx.scale(scale, scale);

      // Card Shield Path Function
      const drawShieldPath = (inset: number) => {
        const x = inset;
        const y = inset;
        const w = width - inset * 2;
        const h = height - inset * 2;
        const r = 24;

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h * 0.85);
        ctx.lineTo(x + w / 2, y + h);
        ctx.lineTo(x, y + h * 0.85);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };

      // 1. Draw Outer Gold Metallic Border
      const goldGrad = ctx.createLinearGradient(0, 0, width, height);
      goldGrad.addColorStop(0, '#fde047');
      goldGrad.addColorStop(0.3, '#ca8a04');
      goldGrad.addColorStop(0.7, '#eab308');
      goldGrad.addColorStop(1, '#854d0e');
      ctx.fillStyle = goldGrad;
      drawShieldPath(10);
      ctx.fill();

      // 2. Draw Inner Dark Card Body
      const bodyGrad = ctx.createLinearGradient(0, 0, width, height);
      bodyGrad.addColorStop(0, '#1c1303');
      bodyGrad.addColorStop(0.5, '#2b1c04');
      bodyGrad.addColorStop(1, '#0c0801');
      ctx.fillStyle = bodyGrad;
      drawShieldPath(18);
      ctx.fill();

      // Subtle Gold Inner Line
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.4)';
      ctx.lineWidth = 2;
      drawShieldPath(24);
      ctx.stroke();

      // 3. Top Left: OVR, Position, Flag, Club Logo
      ctx.fillStyle = '#fde047';
      ctx.font = '900 84px sans-serif';
      ctx.fillText(String(rating), 60, 130);

      ctx.font = '900 40px sans-serif';
      ctx.fillText(posCode, 62, 185);

      ctx.font = '36px sans-serif';
      ctx.fillText('🇵🇪', 62, 235);

      // Draw official club logo
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = '/logo.jpg';
        await new Promise((resolve) => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve; // fallback gracefully if missing
        });
        ctx.save();
        ctx.beginPath();
        ctx.arc(80, 290, 24, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, 56, 266, 48, 48);
        ctx.restore();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.stroke();
      } catch {
        // Fallback PBFC
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('PBFC', 60, 295);
      }

      // 4. Center Right: Player Photo Frame
      const photoSize = 270;
      const photoX = width - photoSize - 60;
      const photoY = 65;

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
          ctx.clip();
          ctx.drawImage(img, photoX, photoY, photoSize, photoSize);
          ctx.restore();

          // Border around photo
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
          ctx.stroke();
        } catch {
          ctx.fillStyle = '#261b07';
          ctx.beginPath();
          ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fde047';
          ctx.font = '900 110px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText((user.name || 'J')[0].toUpperCase(), photoX + photoSize / 2, photoY + photoSize / 2 + 38);
          ctx.textAlign = 'start';
        }
      } else {
        ctx.fillStyle = '#261b07';
        ctx.beginPath();
        ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.font = '900 110px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((user.name || 'J')[0].toUpperCase(), photoX + photoSize / 2, photoY + photoSize / 2 + 38);
        ctx.textAlign = 'start';
      }

      // Dorsal Badge
      if (user.jersey_number) {
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(photoX + photoSize - 20, photoY + photoSize - 20, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f0a02';
        ctx.font = '900 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`#${user.jersey_number}`, photoX + photoSize - 20, photoY + photoSize - 10);
        ctx.textAlign = 'start';
      }

      // 5. Player Name & Nickname
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 52px sans-serif';
      ctx.fillText(displayName, width / 2, 420);

      if (nickname) {
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold italic 28px sans-serif';
        ctx.fillText(nickname, width / 2, 465);
      }

      // Gold Divider Line
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(90, 495);
      ctx.lineTo(width - 90, 495);
      ctx.stroke();

      // 6. Stats Grid (2 Columns x 3 Rows)
      ctx.textAlign = 'start';
      const col1X = 120;
      const col2X = 370;
      const startY = 560;
      const gapY = 68;

      stats.forEach((s, idx) => {
        const isCol1 = idx < 3;
        const x = isCol1 ? col1X : col2X;
        const y = startY + (idx % 3) * gapY;

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 38px monospace';
        ctx.fillText(String(s.val), x, y);

        ctx.fillStyle = '#fde047';
        ctx.font = '900 32px sans-serif';
        ctx.fillText(s.label, x + 72, y);
      });

      // 7. Shield Bottom Crest
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ca8a04';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('⚽ PICHANGAS DE BARRIO FC · EDICION OFICIAL ⚽', width / 2, 825);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('★ ★ ★ ★ ★', width / 2, 860);

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
            transition: 'transform 0.15s ease-out',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 86%, 50% 100%, 0% 86%)'
          }}
          className={`relative ${dimClasses} p-[3px] bg-gradient-to-br ${themeStyles.outerBorder} ${themeStyles.borderGlow} transition-shadow duration-300 overflow-hidden flex flex-col shadow-2xl`}
        >
          {/* Holographic Prismatic Sheen */}
          <div
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, rgba(255,255,255,0) 65%)`
            }}
            className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-200"
          />

          {/* Inner Card Body */}
          <div 
            style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 86%, 50% 100%, 0% 86%)' }}
            className={`relative w-full h-full bg-gradient-to-b ${themeStyles.innerBg} p-4 sm:p-5 flex flex-col justify-between overflow-hidden border border-white/10`}
          >
            {/* Background Texture & Watermark */}
            <div className="absolute right-0 top-1/3 -translate-y-1/2 opacity-10 pointer-events-none text-9xl">
              ⚽
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            {/* Top Row: OVR, Position, Flag, Club Crest */}
            <div className="relative z-10 flex items-start justify-between">
              
              {/* Stack on Left */}
              <div className="flex flex-col items-center">
                <span className={`font-black text-3xl sm:text-4xl tracking-tighter ${themeStyles.textGlow}`}>
                  {rating}
                </span>
                <span className={`font-black text-xs sm:text-sm uppercase tracking-wider ${themeStyles.accentColor} -mt-0.5`}>
                  {posCode}
                </span>
                <div className="w-5 h-[1.5px] bg-amber-400/30 my-1" />
                <span className="text-base sm:text-lg" title="Perú">🇵🇪</span>
                
                {/* Official Logo Crest */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-amber-400/60 shadow-md mt-1">
                  <img src="/logo.jpg" alt="PBFC" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Player Portrait on Right */}
              <div className="relative flex-1 flex justify-center items-center pl-2">
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-amber-400/60 bg-slate-900 shadow-2xl group-hover:scale-105 transition-transform">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-950 to-slate-950 text-amber-400 font-black text-4xl sm:text-5xl">
                      {(user.name || 'J')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Jersey number chip */}
                {user.jersey_number && (
                  <span className={`absolute -bottom-1 right-2 sm:right-4 w-7 h-7 ${themeStyles.badgeBg} font-mono font-black text-xs rounded-full flex items-center justify-center shadow-lg border-2 border-slate-950`}>
                    #{user.jersey_number}
                  </span>
                )}
              </div>
            </div>

            {/* Middle Section: Player Name & Nickname */}
            <div className="relative z-10 text-center my-1">
              <h3 className="font-black text-xl sm:text-2xl text-white uppercase tracking-tight truncate drop-shadow-md">
                {displayName}
              </h3>
              {nickname ? (
                <p className={`text-xs sm:text-sm font-black ${themeStyles.accentColor} italic tracking-wider truncate`}>
                  {nickname}
                </p>
              ) : (
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Pichangas de Barrio FC
                </p>
              )}
              
              {/* Divider */}
              <div className="w-4/5 mx-auto h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent my-1.5" />
            </div>

            {/* Bottom Section: 6 Stats Grid */}
            <div className="relative z-10 grid grid-cols-2 gap-x-4 gap-y-1 sm:gap-y-1.5 px-3 py-1.5 text-center bg-black/40 rounded-xl border border-amber-400/20 backdrop-blur-sm">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center justify-center gap-2">
                  <span className="font-black text-sm sm:text-base text-white font-mono">
                    {s.val}
                  </span>
                  <span className={`font-black text-[10px] sm:text-xs ${themeStyles.accentColor} uppercase tracking-wider`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Card Footer Banner */}
            <div className="relative z-10 flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-widest text-amber-400/80 pt-1 pb-3">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Trophy size={12} /> PICHANGAS DE BARRIO FC
              </div>
              <span className="text-white/50 text-[9px] tracking-widest">★ ★ ★ ★ ★</span>
            </div>

          </div>
        </div>
      </div>

      {/* Action Download / Share Bar */}
      {showDownload && (
        <div className="mt-4 flex items-center justify-center w-full">
          <button
            type="button"
            onClick={handleDownloadCard}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-400/20 transition-all active:scale-95 cursor-pointer"
            title="Descargar carta para compartir en WhatsApp o Instagram"
          >
            <Download size={15} /> Descargar Carta (PNG)
          </button>
        </div>
      )}
    </div>
  );
};
