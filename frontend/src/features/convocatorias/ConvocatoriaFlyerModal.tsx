import React, { useEffect, useRef, useState } from 'react';
import { Convocatoria, Confirmacion } from '@/types';
import { X, Download, Copy, Share2, Sparkles, Check, RefreshCw, Tag, MapPin, Calendar, Phone } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useConvocatoria } from '@/hooks/useConvocatorias';
import { toast } from 'sonner';

interface ConvocatoriaFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  convocatoria: Convocatoria;
}

export const ConvocatoriaFlyerModal: React.FC<ConvocatoriaFlyerModalProps> = ({
  isOpen,
  onClose,
  convocatoria
}) => {
  const { user } = useAuthStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch detailed fresh data with confirmaciones.user eager-loaded
  const { data: fullConvocatoria, isLoading: isLoadingFull, refetch } = useConvocatoria(convocatoria?.id);
  const activeConvocatoria = fullConvocatoria || convocatoria;

  // Format defaults
  const numTeams = activeConvocatoria?.num_teams || 2;
  const defaultCategory = (() => {
    const title = (activeConvocatoria?.title || convocatoria?.title || '').toUpperCase();
    if (title.includes('FUTBOL 7') || title.includes('FÚTBOL 7')) return 'FÚTBOL 7';
    if (title.includes('FUTSAL')) return 'FUTSAL';
    if (title.includes('FUTBOL 6') || title.includes('FÚTBOL 6')) return 'FÚTBOL 6';
    if (title.includes('FUTBOL 8') || title.includes('FÚTBOL 8')) return 'FÚTBOL 8';
    return numTeams === 3 ? 'FÚTBOL 7' : 'FUTSAL';
  })();

  // Editable fields for Admin
  const [categoryText, setCategoryText] = useState(defaultCategory);
  const [venueText, setVenueText] = useState(activeConvocatoria?.location || 'Grass el Bosque de Moyococha');
  const [contactPhone, setContactPhone] = useState('960735653');

  // Format short date & time
  const getShortDateTime = (dateStr?: string, timeStr?: string) => {
    let dayName = 'JUEVES';
    if (dateStr) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
        dayName = days[d.getDay()] || 'JUEVES';
      }
    }
    let timeText = '9:00 PM';
    if (timeStr) {
      const tParts = timeStr.split(':');
      let h = parseInt(tParts[0], 10);
      const m = tParts[1] || '00';
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      timeText = `${h}:${m} ${ampm}`;
    }
    return `${dayName} · ${timeText}`;
  };

  const [dateTimeText, setDateTimeText] = useState(() => 
    getShortDateTime(activeConvocatoria?.match_date, activeConvocatoria?.match_time)
  );

  const [headlineText, setHeadlineText] = useState('EL BARRIO SE JUEGA EN LA CANCHA');

  // Strictly only accessible for Admin
  const isAdmin = user?.role === 'admin' || user?.role?.toLowerCase() === 'admin' || Boolean((user as any)?.is_admin);
  useEffect(() => {
    if (activeConvocatoria?.location) {
      setVenueText(activeConvocatoria.location);
    }
    if (activeConvocatoria?.match_date) {
      setDateTimeText(getShortDateTime(activeConvocatoria.match_date, activeConvocatoria.match_time));
    }
  }, [activeConvocatoria?.location, activeConvocatoria?.match_date, activeConvocatoria?.match_time]);

  useEffect(() => {
    if (isOpen && activeConvocatoria) {
      renderPoster();
    }
  }, [isOpen, activeConvocatoria, categoryText, venueText, dateTimeText, contactPhone, headlineText]);

  const renderPoster = async () => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const width = 1080;
    const rawPlayers = activeConvocatoria.confirmaciones || [];
    const players = rawPlayers.filter((item) => ['confirmado', 'asistio', 'confirmed'].includes((item.status || '').toLowerCase()));
    const teamCount = Math.max(2, Math.min(6, Number(activeConvocatoria.num_teams) || 2));
    const hasTeams = players.some((player) => Number(player.team_number) > 0);
    const teams = Array.from({ length: teamCount }, (_, index) => ({
      number: index + 1,
      players: players.filter((player) => Number(player.team_number) === index + 1)
        .sort((a, b) => Number(b.match_role === 'portero') - Number(a.match_role === 'portero'))
    }));
    const columns = teamCount === 3 || teamCount > 4 ? 3 : 2;
    const gap = 20;
    const margin = 46;
    const cardWidth = (width - margin * 2 - gap * (columns - 1)) / columns;
    const maxRoster = Math.max(1, ...teams.map((team) => team.players.length));
    const rowHeight = Math.max(42, Math.min(60, Math.floor(680 / maxRoster)));
    const cardHeight = 76 + maxRoster * rowHeight + 18;
    const gridRows = Math.ceil(teamCount / columns);
    const teamsTop = 545;
    const footerTop = teamsTop + gridRows * cardHeight + (gridRows - 1) * gap + 28;
    const height = Math.max(1500, footerTop + 145);

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loadImage = (src: string): Promise<HTMLImageElement | null> => new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
    const avatarUrls: string[] = Array.from(new Set<string>(players.flatMap((player): string[] => {
      const avatar = player.user?.avatar;
      return typeof avatar === 'string' && avatar.length > 0 ? [avatar] : [];
    })));
    const loadedImages = await Promise.all([loadImage('/logo.jpg'), ...avatarUrls.map((url) => loadImage(url))]);
    const logoImage = loadedImages[0];
    const avatarMap = new Map<string, HTMLImageElement>();
    avatarUrls.forEach((url, index) => {
      const image = loadedImages[index + 1];
      if (image) avatarMap.set(url, image);
    });

    const roundRect = (x: number, y: number, w: number, h: number, radius: number) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
    };
    const fitText = (value: string, maxWidth: number, font: string) => {
      ctx.font = font;
      let result = value;
      while (result.length > 3 && ctx.measureText(result).width > maxWidth) result = result.slice(0, -2) + '…';
      return result;
    };
    const drawAvatar = (player: Confirmacion, x: number, y: number, radius: number, accent: string) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();
      const avatar = player.user?.avatar ? avatarMap.get(player.user.avatar) : null;
      if (avatar) {
        const scale = Math.max((radius * 2) / avatar.width, (radius * 2) / avatar.height);
        ctx.drawImage(avatar, x - avatar.width * scale / 2, y - avatar.height * scale / 2, avatar.width * scale, avatar.height * scale);
      } else {
        ctx.fillStyle = '#17263a';
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(x, y - radius * 0.18, radius * 0.29, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x, y + radius * 0.62, radius * 0.58, radius * 0.43, 0, Math.PI, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    };

    // Identidad visual oficial: magenta, cian y verde lima.
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#080d1b');
    bg.addColorStop(0.55, '#111c30');
    bg.addColorStop(1, '#050914');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    const drawGlow = (x: number, y: number, radius: number, color: string) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(5,9,20,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    };
    drawGlow(60, 100, 390, 'rgba(240,0,145,.20)');
    drawGlow(width - 60, 390, 430, 'rgba(0,201,232,.16)');
    const brandBar = ctx.createLinearGradient(0, 0, width, 0);
    brandBar.addColorStop(0, '#F00091');
    brandBar.addColorStop(0.52, '#00C9E8');
    brandBar.addColorStop(1, '#A5E900');
    ctx.fillStyle = brandBar;
    ctx.fillRect(0, 0, width, 14);

    // Logo original, sin alteraciones.
    if (logoImage) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(125, 130, 73, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.arc(125, 130, 67, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImage, 58, 63, 134, 134);
      ctx.restore();
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 56px sans-serif';
    ctx.fillText('PICHANGAS', 225, 112);
    ctx.fillStyle = '#00C9E8';
    ctx.font = '900 42px sans-serif';
    ctx.fillText('DE BARRIO FC', 228, 162);
    ctx.fillStyle = '#aab7ca';
    ctx.font = '700 18px sans-serif';
    ctx.fillText('FÚTBOL • AMISTAD • BARRIO', 230, 198);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#F00091';
    roundRect(80, 245, width - 160, 54, 18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px sans-serif';
    ctx.fillText(fitText('CONVOCATORIA OFICIAL • ' + categoryText.toUpperCase() + ' • ' + teamCount + ' EQUIPOS', width - 180, '900 24px sans-serif'), width / 2, 280);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 50px sans-serif';
    ctx.fillText(fitText((activeConvocatoria.title || 'PICHANGA DE BARRIO').toUpperCase(), width - 130, '900 50px sans-serif'), width / 2, 365);
    ctx.fillStyle = '#A5E900';
    ctx.font = '900 26px sans-serif';
    ctx.fillText(fitText(headlineText.toUpperCase(), width - 160, '900 26px sans-serif'), width / 2, 414);

    const infoY = 450;
    const infoGap = 18;
    const infoWidth = (width - 112 - infoGap) / 2;
    [
      { x: 56, label: 'FECHA Y HORA', value: dateTimeText, color: '#00C9E8' },
      { x: 56 + infoWidth + infoGap, label: 'LUGAR DEL ENCUENTRO', value: venueText, color: '#F00091' }
    ].forEach((item) => {
      ctx.fillStyle = 'rgba(255,255,255,.07)';
      ctx.strokeStyle = 'rgba(255,255,255,.16)';
      ctx.lineWidth = 2;
      roundRect(item.x, infoY, infoWidth, 70, 16);
      ctx.fill();
      ctx.stroke();
      ctx.textAlign = 'left';
      ctx.fillStyle = item.color;
      ctx.font = '800 15px sans-serif';
      ctx.fillText(item.label, item.x + 18, infoY + 25);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 21px sans-serif';
      ctx.fillText(fitText(item.value.toUpperCase(), infoWidth - 36, '800 21px sans-serif'), item.x + 18, infoY + 53);
    });

    if (hasTeams) {
      const accents = ['#F00091', '#00C9E8', '#A5E900', '#f59e0b', '#a78bfa', '#fb7185'];
      teams.forEach((team, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = margin + col * (cardWidth + gap);
        const y = teamsTop + row * (cardHeight + gap);
        const accent = accents[index % accents.length];
        ctx.fillStyle = 'rgba(10,18,33,.95)';
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5;
        roundRect(x, y, cardWidth, cardHeight, 22);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = accent;
        roundRect(x + 12, y + 12, cardWidth - 24, 54, 14);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.fillStyle = index === 2 || index === 4 ? '#07111e' : '#ffffff';
        ctx.font = '900 24px sans-serif';
        ctx.fillText('EQUIPO ' + team.number, x + cardWidth / 2, y + 47);

        if (team.players.length === 0) {
          ctx.fillStyle = '#9aa8bc';
          ctx.font = '700 18px sans-serif';
          ctx.fillText('Sin jugadores asignados', x + cardWidth / 2, y + 112);
        }
        team.players.forEach((player, playerIndex) => {
          const rowY = y + 66 + playerIndex * rowHeight;
          const radius = Math.min(22, Math.max(16, rowHeight * 0.34));
          const centerY = rowY + rowHeight / 2;
          const isGoalkeeper = player.match_role === 'portero';
          ctx.fillStyle = isGoalkeeper ? 'rgba(245,158,11,.14)' : 'rgba(255,255,255,.035)';
          roundRect(x + 12, rowY + 3, cardWidth - 24, rowHeight - 6, 10);
          ctx.fill();
          drawAvatar(player, x + 38, centerY, radius, isGoalkeeper ? '#f59e0b' : accent);
          const fullName = player.user?.full_name || player.user?.name ||
            ((player.user?.nombres || '') + ' ' + (player.user?.apellido_paterno || '')).trim() || 'Jugador';
          const displayName = player.user?.nickname ? fullName.split(' ')[0] + ' "' + player.user.nickname + '"' : fullName;
          const maxWidth = cardWidth - 105 - (isGoalkeeper ? 48 : 0);
          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          ctx.font = '800 18px sans-serif';
          ctx.fillText(fitText(displayName, maxWidth, '800 18px sans-serif'), x + 72, centerY + 6);
          if (isGoalkeeper) {
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fbbf24';
            ctx.font = '900 11px sans-serif';
            ctx.fillText('ARQUERO', x + cardWidth - 20, centerY + 5);
          }
        });
      });
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      ctx.strokeStyle = 'rgba(0,201,232,.55)';
      ctx.lineWidth = 2;
      roundRect(90, teamsTop + 25, width - 180, 190, 24);
      ctx.fill();
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00C9E8';
      ctx.font = '900 34px sans-serif';
      ctx.fillText('EQUIPOS POR SORTEAR', width / 2, teamsTop + 95);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 23px sans-serif';
      ctx.fillText(players.length + ' jugadores confirmados', width / 2, teamsTop + 145);
      ctx.fillStyle = '#aab7ca';
      ctx.font = '500 19px sans-serif';
      ctx.fillText('Las alineaciones aparecerán aquí después del sorteo.', width / 2, teamsTop + 180);
    }

    const footerY = height - 105;
    ctx.fillStyle = brandBar;
    roundRect(56, footerY, width - 112, 3, 2);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px sans-serif';
    ctx.fillText('PICHANGAS DE BARRIO FC', width / 2, footerY + 42);
    ctx.fillStyle = '#aab7ca';
    ctx.font = '600 16px sans-serif';
    ctx.fillText('JUEGA CON RESPETO • DISFRUTA EL FÚTBOL', width / 2, footerY + 70);

    setPreviewUrl(canvas.toDataURL('image/png'));
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `Flyer-PichangasDeBarrio-${activeConvocatoria.match_date}.png`;
    a.click();
    toast.success('¡Flyer descargado en alta definición!');
  };

  const handleCopyImage = async () => {
    if (!previewUrl) return;
    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      toast.success('¡Flyer copiado! Pégalo con Ctrl+V en WhatsApp Web');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('No se pudo copiar automáticamente. Usa el botón "Descargar Flyer (HD)".');
    }
  };

  const handleShareWhatsApp = () => {
    const rawConfirmados = (activeConvocatoria.confirmaciones || []);
    const confirmados = rawConfirmados.filter(c => (c.status || '').toLowerCase() === 'confirmado');
    const remaining = Math.max(0, activeConvocatoria.max_players - confirmados.length);

    let text = `⚽ *CONVOCATORIA OFICIAL - PICHANGAS DE BARRIO FC* ⚽\n\n`;
    text += `🏆 *${activeConvocatoria.title.toUpperCase()}*\n` +
      `⚡ *Categoría:* ${categoryText} (${numTeams} Equipos)\n` +
      `📅 *Fecha:* ${dateTimeText}\n` +
      `🏟️ *Sede:* ${venueText}\n` +
      `👥 *Inscritos:* ${confirmados.length}/${activeConvocatoria.max_players} (${remaining > 0 ? `¡Quedan ${remaining} cupos!` : '¡Equipos Sorteados!'})\n` +
      `📞 *Contacto:* ${contactPhone}\n\n` +
      `📲 *Ver afiche y alineaciones:* ${window.location.origin}/convocatorias/${activeConvocatoria.id}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const currentConfirmadosCount = (activeConvocatoria.confirmaciones || []).filter(c => (c.status || '').toLowerCase() === 'confirmado').length;

  if (!isOpen || !isAdmin) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden overscroll-contain animate-in fade-in duration-200">
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-6xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden min-h-0">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F00091] to-[#00C9E8] text-white flex items-center justify-center font-black shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white uppercase tracking-tight">
                  Diseñador de flyer oficial
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 text-[10px] font-black uppercase">PDB FC</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>Plantilla propia • {numTeams} equipos • fotos de jugadores</span>
                <span className="text-lime-400 font-bold">
                  ({currentConfirmadosCount}/{activeConvocatoria.max_players || 21} Convocados)
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-3">
        {/* Quick Customization Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 min-w-0">
            <MapPin size={14} className="text-[#F00091] shrink-0" /><span className="text-slate-400 font-bold shrink-0">Lugar:</span>
            <input type="text" value={venueText} onChange={(e) => setVenueText(e.target.value)} placeholder="Lugar del encuentro" className="w-full min-w-0 bg-transparent text-white font-bold outline-none" />
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 min-w-0">
            <Calendar size={14} className="text-cyan-400 shrink-0" /><span className="text-slate-400 font-bold shrink-0">Fecha:</span>
            <input type="text" value={dateTimeText} onChange={(e) => setDateTimeText(e.target.value)} placeholder="Día y hora" className="w-full min-w-0 bg-transparent text-white font-bold outline-none" />
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 min-w-0">
            <Tag size={14} className="text-lime-400 shrink-0" /><span className="text-slate-400 font-bold shrink-0">Modalidad:</span>
            <input type="text" value={categoryText} onChange={(e) => setCategoryText(e.target.value.toUpperCase())} placeholder="FÚTBOL 7" className="w-full min-w-0 bg-transparent text-white font-black uppercase outline-none" />
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 min-w-0">
            <Sparkles size={14} className="text-[#F00091] shrink-0" /><span className="text-slate-400 font-bold shrink-0">Frase:</span>
            <input type="text" value={headlineText} onChange={(e) => setHeadlineText(e.target.value.toUpperCase())} placeholder="Frase principal" className="w-full min-w-0 bg-transparent text-white font-bold outline-none" />
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 min-w-0">
            <Phone size={14} className="text-emerald-400 shrink-0" /><span className="text-slate-400 font-bold shrink-0">Info:</span>
            <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Teléfono de contacto" className="w-full min-w-0 bg-transparent text-white font-bold outline-none" />
          </div>
          <button type="button" onClick={() => { refetch(); }} className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-cyan-300 font-bold hover:bg-cyan-400/15 transition-colors">
            <RefreshCw size={14} className={isLoadingFull ? 'animate-spin' : ''} /> Actualizar jugadores
          </button>
        </div>

        {/* Flyer Preview Box */}
        <div className="relative w-full min-h-[220px] max-h-[42dvh] sm:max-h-[48dvh] lg:max-h-[min(58dvh,680px)] flex justify-center items-center bg-[#070d19] rounded-xl p-2 border border-slate-800 overflow-auto">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Flyer Oficial Preview"
              className="max-h-[40dvh] sm:max-h-[46dvh] lg:max-h-[min(56dvh,650px)] w-auto max-w-full rounded-lg shadow-2xl object-contain border border-slate-700/50"
            />
          ) : (
            <div className="py-20 text-center text-slate-400 text-sm flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin text-lime-400" />
              <span>Preparando el diseño oficial y las fotos de los jugadores...</span>
            </div>
          )}
        </div>

        </div>
        {/* Action Buttons */}
        <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 sm:px-4 sm:py-3 border-t border-slate-800 bg-slate-950/70">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!previewUrl}
            className="h-11 bg-[#A5E900] hover:bg-[#b7ff1a] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-lime-400/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Download size={15} /> Descargar Flyer (HD)
          </button>

          <button
            type="button"
            onClick={handleCopyImage}
            disabled={!previewUrl}
            className="h-11 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-400/30 hover:border-cyan-400 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            {copied ? '¡Copiado!' : 'Copiar Imagen'}
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Share2 size={15} /> Enviar a WhatsApp
          </button>
        </div>

      </div>
    </div>
  );
};
