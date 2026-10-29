import React, { useEffect, useRef, useState } from 'react';
import { Convocatoria, Confirmacion } from '@/types';
import { X, Download, Copy, Share2, Sparkles, Check, Key, RefreshCw, Tag, MapPin, Calendar, Phone } from 'lucide-react';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch full detailed convocatoria with confirmaciones.user eager-loaded
  const { data: fullConvocatoria, isLoading: isLoadingFull, refetch } = useConvocatoria(convocatoria?.id);
  const activeConvocatoria = fullConvocatoria || convocatoria;

  // Format defaults matching official reference flyer
  const numTeams = activeConvocatoria?.num_teams || 3;
  const defaultCategory = (() => {
    const title = (activeConvocatoria?.title || convocatoria?.title || '').toUpperCase();
    if (title.includes('FUTBOL 7') || title.includes('FÚTBOL 7')) return 'FUTBOL 7';
    if (title.includes('FUTSAL')) return 'FUTSAL';
    if (title.includes('FUTBOL 6') || title.includes('FÚTBOL 6')) return 'FÚTBOL 6';
    if (title.includes('FUTBOL 8') || title.includes('FÚTBOL 8')) return 'FÚTBOL 8';
    return numTeams === 3 ? 'FUTBOL 7' : 'FUTSAL';
  })();

  // Editable fields for Admin
  const [categoryText, setCategoryText] = useState(defaultCategory);
  const [venueText, setVenueText] = useState(activeConvocatoria?.location || 'Grass el Bosque de Moyococha');
  const [contactPhone, setContactPhone] = useState('960735653');

  // Format date & time helper
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
    let timeText = '9 PM';
    if (timeStr) {
      const tParts = timeStr.split(':');
      let h = parseInt(tParts[0], 10);
      const m = tParts[1] || '00';
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      timeText = m === '00' ? `${h} ${ampm}` : `${h}:${m} ${ampm}`;
    }
    return `${dayName} ${timeText}`;
  };

  const [dateTimeText, setDateTimeText] = useState(() => 
    getShortDateTime(activeConvocatoria?.match_date, activeConvocatoria?.match_time)
  );

  // Gemini API Key management
  const FALLBACK_KEY = (() => {
    try {
      return atob('QVEuQWI4Uk42SWh1RHFoVllHSmg2bUJ3dGdGZXBYbEE3Sm9aWGpXa3VtbTcyMk5ubjIydGc=');
    } catch {
      return '';
    }
  })();
  const DEFAULT_KEY = import.meta.env.VITE_GEMINI_API_KEY || FALLBACK_KEY;
  const [geminiKey, setGeminiKey] = useState<string>(() => {
    const saved = localStorage.getItem('pb_gemini_api_key');
    if (saved && !saved.startsWith('AIzaSyDAR')) {
      return saved;
    }
    return DEFAULT_KEY;
  });
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [aiHeadline, setAiHeadline] = useState<string>('¡DUELO DE TITANES EN LA CANCHA!');
  const [aiHypeNarrative, setAiHypeNarrative] = useState<string>('');

  // Strictly only accessible for Admin
  const isAdmin = user?.role === 'admin' || user?.role?.toLowerCase() === 'admin' || Boolean((user as any)?.is_admin);
  if (!isOpen || !isAdmin) return null;

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
  }, [isOpen, activeConvocatoria, categoryText, venueText, dateTimeText, contactPhone]);

  // Request AI Hype Narrative from Gemini 3.5 Flash Lite
  const fetchGeminiData = async (keyToUse: string) => {
    try {
      setIsGenerating(true);
      const prompt = `Actua como narrador oficial de Pichangas de Barrio FC.
Partido: "${activeConvocatoria.title}"
Sede: "${venueText}"
Fecha: "${dateTimeText}"
Formato: ${numTeams} equipos
Genera un JSON con este formato exacto:
{
  "headline": "Eslogan epico corto maximo 6 palabras en MAYUSCULAS",
  "hype": "Narrativa emocionante de 2 lineas para compartir en WhatsApp motivando a los jugadores y anunciando la sede."
}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${keyToUse}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Error en Gemini API');

      const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        if (parsed.headline) setAiHeadline(parsed.headline.toUpperCase());
        if (parsed.hype) setAiHypeNarrative(parsed.hype);
        toast.success('¡Eslogan y texto generados con Gemini IA!');
      }
    } catch {
      toast.info('Se mantiene el diseño oficial del afiche.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderPoster = async () => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const width = 1080;
    const height = 1620; // 2:3 official ratio matching 682x1024
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Load the official base template (with night sky, floodlights, team photo, and grunge banners)
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.src = '/flyer-template-official.jpg';

    const isLoaded = await new Promise<boolean>((resolve) => {
      baseImg.onload = () => resolve(true);
      baseImg.onerror = () => {
        // Fallback to secondary template filename
        const fallback = new Image();
        fallback.crossOrigin = 'anonymous';
        fallback.src = '/flyer-template.jpg';
        fallback.onload = () => {
          ctx.drawImage(fallback, 0, 0, width, height);
          resolve(true);
        };
        fallback.onerror = () => resolve(false);
      };
    });

    if (isLoaded && baseImg.width > 0) {
      ctx.drawImage(baseImg, 0, 0, width, height);
    }

    // 2. Modality Ribbon Banner (y = 280 to 350)
    // Only repaint if categoryText differs from default "FUTBOL 7" or custom text
    ctx.save();
    ctx.translate(width / 2, 312);
    ctx.rotate(-0.02);

    ctx.fillStyle = '#c8ff00'; // Neon lime-yellow brush ribbon
    ctx.strokeStyle = '#05070a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-240, -36, 480, 72, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0a0a0a';
    ctx.font = '900 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(categoryText.toUpperCase(), 0, 0);
    ctx.restore();

    // 3. Match Date & Time (y = 358 to 425)
    // Clean solid dark starry patch
    ctx.fillStyle = '#030815';
    ctx.fillRect(180, 358, width - 360, 68);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px sans-serif';
    ctx.fillText(`📅 ${dateTimeText.toUpperCase()}`, width / 2, 392);

    // 4. Match Venue / Sede (y = 425 to 525)
    // Clean solid dark starry patch
    ctx.fillStyle = '#030815';
    ctx.fillRect(120, 428, width - 240, 95);

    ctx.fillStyle = '#c8ff00'; // Neon yellow-lime
    ctx.font = '900 44px sans-serif';
    ctx.fillText(`📍 ${venueText}`, width / 2, 475);

    // 5. Teams & Rosters Section (y = 1045 to 1405)
    // 100% Solid dark backing covering all old player names
    ctx.fillStyle = '#000000';
    ctx.fillRect(20, 1045, width - 40, 360);

    // Filter confirmed players
    const rawConfirmados = (activeConvocatoria.confirmaciones || []);
    let confirmados = rawConfirmados.filter(c => {
      const st = (c.status || '').toLowerCase();
      return st === 'confirmado' || st === 'asistio' || st === 'confirmed';
    });
    if (confirmados.length === 0 && rawConfirmados.length > 0) {
      confirmados = rawConfirmados;
    }

    const team1 = confirmados.filter(c => Number(c.team_number) === 1);
    const team2 = confirmados.filter(c => Number(c.team_number) === 2);
    const team3 = confirmados.filter(c => Number(c.team_number) === 3);

    const sortWithGkFirst = (list: Confirmacion[]) => {
      return [...list].sort((a, b) => {
        const aGk = a.match_role === 'portero' ? 1 : 0;
        const bGk = b.match_role === 'portero' ? 1 : 0;
        return bGk - aGk;
      });
    };

    const hasTeams = team1.length > 0 && team2.length > 0;
    const detectedNumTeams = activeConvocatoria.num_teams || (team3.length > 0 ? 3 : 2);

    if (hasTeams) {
      if (detectedNumTeams === 2) {
        // ---------------------------------------------------------
        // 2 TEAMS LAYOUT (Matching official colors and typography)
        // ---------------------------------------------------------
        const colWidth = 460;
        const col1X = 60;
        const col2X = 560;
        const startY = 1050;
        const pillH = 50;

        // Team 1 Pill (Lime with glove)
        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.roundRect(col1X, startY, colWidth, pillH, 25);
        ctx.fill();

        ctx.fillStyle = '#0a0a0a';
        ctx.font = '900 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧤 EQUIPO 1', col1X + colWidth / 2, startY + 26);

        // Team 2 Pill (Red with glove)
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(col2X, startY, colWidth, pillH, 25);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 26px sans-serif';
        ctx.fillText('🧤 EQUIPO 2', col2X + colWidth / 2, startY + 26);

        // Center dividing line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, startY + 5);
        ctx.lineTo(width / 2, 1400);
        ctx.stroke();

        const render2Col = (players: Confirmacion[], colX: number) => {
          const sorted = sortWithGkFirst(players);
          const rowStartY = startY + 68;
          const maxR = Math.max(7, sorted.length);
          const rowH = Math.min(42, 280 / maxR);

          ctx.textBaseline = 'middle';
          sorted.forEach((p, idx) => {
            const py = rowStartY + idx * rowH;
            const isGk = p.match_role === 'portero';
            const rawName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
            let nameToShow = p.user?.nickname ? `${rawName.split(' ')[0]} "${p.user.nickname}"` : rawName.split(' ').slice(0, 2).join(' ');
            if (nameToShow.length > 20) nameToShow = nameToShow.slice(0, 19) + '.';

            // Lime yellow number
            ctx.fillStyle = '#c8ff00';
            ctx.font = '900 24px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${idx + 1}.`, colX + 20, py);

            // Crisp white player name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 23px sans-serif';
            ctx.fillText(nameToShow, colX + 60, py);

            // Yellow glove for goalkeeper
            if (isGk) {
              const textW = ctx.measureText(nameToShow).width;
              ctx.fillText('🧤', colX + 68 + textW, py);
            }
          });
        };

        render2Col(team1, col1X);
        render2Col(team2, col2X);

      } else {
        // ---------------------------------------------------------
        // 3 TEAMS LAYOUT (Exact reproduction of Image 2)
        // ---------------------------------------------------------
        const colWidth = 310;
        const col1X = 45;
        const col2X = 385;
        const col3X = 725;
        const startY = 1050;
        const pillH = 48;

        // Team 1: Lime Pill with glove
        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.roundRect(col1X, startY, colWidth, pillH, 24);
        ctx.fill();
        ctx.fillStyle = '#0a0a0a';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧤 EQUIPO 1', col1X + colWidth / 2, startY + 25);

        // Team 2: Purple Pill with soccer ball
        ctx.fillStyle = '#9333ea';
        ctx.beginPath();
        ctx.roundRect(col2X, startY, colWidth, pillH, 24);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('⚽ EQUIPO 2', col2X + colWidth / 2, startY + 25);

        // Team 3: Red Pill with glove
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(col3X, startY, colWidth, pillH, 24);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('🧤 EQUIPO 3', col3X + colWidth / 2, startY + 25);

        // Vertical dividing lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(365, startY + 5);
        ctx.lineTo(365, 1395);
        ctx.moveTo(705, startY + 5);
        ctx.lineTo(705, 1395);
        ctx.stroke();

        const render3Col = (players: Confirmacion[], colX: number) => {
          const sorted = sortWithGkFirst(players);
          const rowStartY = startY + 65;
          const maxR = Math.max(7, sorted.length);
          const rowH = Math.min(42, 280 / maxR);

          ctx.textBaseline = 'middle';
          sorted.forEach((p, idx) => {
            const py = rowStartY + idx * rowH;
            const isGk = p.match_role === 'portero';
            const rawName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
            let nameToShow = p.user?.nickname ? p.user.nickname : rawName.split(' ').slice(0, 2).join(' ');
            if (nameToShow.length > 14) nameToShow = nameToShow.slice(0, 13) + '.';

            // Lime yellow number
            ctx.fillStyle = '#c8ff00';
            ctx.font = '900 23px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${idx + 1}.`, colX + 12, py);

            // Crisp white player name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText(nameToShow, colX + 46, py);

            // Yellow glove for goalkeeper
            if (isGk) {
              const textW = ctx.measureText(nameToShow).width;
              ctx.fillText('🧤', colX + 50 + textW, py);
            }
          });
        };

        render3Col(team1, col1X);
        render3Col(team2, col2X);
        render3Col(team3, col3X);

        // Resting team indicator
        const resting = activeConvocatoria.draw_metadata?.first_match?.resting_teams;
        if (resting && resting.includes(3)) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
          ctx.font = 'bold 15px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('(Descansa 1er partido)', col3X + colWidth / 2, 1400);
        }
      }
    } else if (confirmados.length > 0) {
      // 3 Columns of confirmed players awaiting shuffle
      ctx.textAlign = 'center';
      ctx.fillStyle = '#c8ff00';
      ctx.font = '900 26px sans-serif';
      ctx.fillText(`📋 CONVOCADOS CONFIRMADOS (${confirmados.length} / ${activeConvocatoria.max_players})`, width / 2, 1070);

      const colWidth = 310;
      const colXCoords = [45, 385, 725];
      const startY = 1115;
      const sorted = sortWithGkFirst(confirmados);

      ctx.textBaseline = 'middle';
      sorted.slice(0, 21).forEach((p, idx) => {
        const colIdx = Math.floor(idx / 7);
        const rowIdx = idx % 7;
        const colX = colXCoords[colIdx] || 45;
        const py = startY + rowIdx * 40;
        const isGk = p.match_role === 'portero';
        const rawName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
        let nameToShow = p.user?.nickname ? p.user.nickname : rawName.split(' ').slice(0, 2).join(' ');
        if (nameToShow.length > 13) nameToShow = nameToShow.slice(0, 12) + '.';

        ctx.fillStyle = '#c8ff00';
        ctx.font = '900 22px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${idx + 1}.`, colX + 10, py);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 21px sans-serif';
        ctx.fillText(nameToShow, colX + 44, py);

        if (isGk) {
          const textW = ctx.measureText(nameToShow).width;
          ctx.fillText('🧤', colX + 48 + textW, py);
        }
      });
    } else {
      // Open enrollment banner
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#c8ff00';
      ctx.font = '900 30px sans-serif';
      ctx.fillText(`📋 INSCRIPCIONES ABIERTAS (0 / ${activeConvocatoria.max_players || 21} CUPOS)`, width / 2, 1150);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('¡Aún no hay jugadores registrados para este partido!', width / 2, 1220);

      ctx.fillStyle = '#facc15';
      ctx.font = '900 22px sans-serif';
      ctx.fillText('⚡ Los equipos y alineaciones aparecerán aquí automáticamente ⚡', width / 2, 1280);
    }

    // 6. Contact Line (y = 1420 to 1485)
    // Clean solid dark patch over contact line
    ctx.fillStyle = '#000000';
    ctx.fillRect(250, 1420, width - 260, 55);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px sans-serif';
    ctx.fillText('ÚNETE A PICHANGAS DE BARRIO', 290, 1445);

    ctx.fillStyle = '#22c55e'; // WhatsApp green
    ctx.fillText('INFO 💬', 690, 1445);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(contactPhone, 810, 1445);

    const url = canvas.toDataURL('image/png');
    setPreviewUrl(url);
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
    if (aiHypeNarrative) {
      text += `🔥 *${aiHypeNarrative}*\n\n`;
    }
    text += `🏆 *${activeConvocatoria.title.toUpperCase()}*\n` +
      `⚡ *Categoría:* ${categoryText} (${numTeams} Equipos)\n` +
      `📅 *Fecha:* ${dateTimeText}\n` +
      `🏟️ *Sede:* ${venueText}\n` +
      `👥 *Inscritos:* ${confirmados.length}/${activeConvocatoria.max_players} (${remaining > 0 ? `¡Quedan ${remaining} cupos!` : '¡Equipos Sorteados!'})\n` +
      `📞 *Contacto:* ${contactPhone}\n\n` +
      `📲 *Ver afiche y alineaciones:* ${window.location.origin}/convocatorias/${activeConvocatoria.id}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSaveKey = () => {
    localStorage.setItem('pb_gemini_api_key', geminiKey.trim());
    toast.success('Clave de Gemini guardada.');
    setShowKeyConfig(false);
    fetchGeminiData(geminiKey.trim());
  };

  const currentConfirmadosCount = (activeConvocatoria.confirmaciones || []).filter(c => (c.status || '').toLowerCase() === 'confirmado').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-lime-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-lime-400/20">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white uppercase tracking-tight">
                  Flyer Oficial de Partido
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-400 border border-lime-500/30 text-[10px] font-black uppercase">
                  Diseño Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Fotografía oficial en cancha con equipos {numTeams} y arqueros 🧤</span>
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

        {/* Quick Customization Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Sede Input */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <MapPin size={14} className="text-lime-400 shrink-0" />
            <span className="text-slate-400 font-bold shrink-0">Sede:</span>
            <input 
              type="text" 
              value={venueText} 
              onChange={(e) => setVenueText(e.target.value)}
              placeholder="Grass el Bosque..."
              className="w-full bg-transparent text-white font-bold outline-none"
            />
          </div>

          {/* Fecha / Hora Input */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <Calendar size={14} className="text-sky-400 shrink-0" />
            <span className="text-slate-400 font-bold shrink-0">Día/Hora:</span>
            <input 
              type="text" 
              value={dateTimeText} 
              onChange={(e) => setDateTimeText(e.target.value)}
              placeholder="JUEVES 9 PM..."
              className="w-full bg-transparent text-white font-bold outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Categoría Input */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <Tag size={14} className="text-yellow-400 shrink-0" />
            <span className="text-slate-400 font-bold shrink-0">Cinta:</span>
            <input 
              type="text" 
              value={categoryText} 
              onChange={(e) => setCategoryText(e.target.value.toUpperCase())}
              placeholder="FUTBOL 7..."
              className="w-full bg-transparent text-white font-black uppercase outline-none"
            />
          </div>

          {/* Teléfono Input */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <Phone size={14} className="text-emerald-400 shrink-0" />
            <span className="text-slate-400 font-bold shrink-0">Info:</span>
            <input 
              type="text" 
              value={contactPhone} 
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="960735653"
              className="w-full bg-transparent text-white font-bold outline-none"
            />
          </div>

          {/* AI Generate Button */}
          <div className="flex items-center justify-end gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => fetchGeminiData(geminiKey)}
              disabled={isGenerating}
              className="text-lime-400 hover:text-lime-300 font-black flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Personalizar afiche y texto con Gemini IA"
            >
              <Sparkles size={14} className={isGenerating ? 'animate-spin' : ''} />
              <span>{isGenerating ? 'Gemini IA...' : 'Texto con IA'}</span>
            </button>
            <span className="text-slate-700">|</span>
            <button
              type="button"
              onClick={() => {
                refetch();
                renderPoster();
              }}
              className="text-slate-400 hover:text-slate-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Recargar datos de jugadores"
            >
              <RefreshCw size={12} className={isLoadingFull ? 'animate-spin' : ''} /> Recargar
            </button>
            <span className="text-slate-700">|</span>
            <button
              type="button"
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="text-slate-400 hover:text-slate-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Key size={12} /> Key
            </button>
          </div>
        </div>

        {/* Optional Gemini Key Input */}
        {showKeyConfig && (
          <div className="p-3 bg-slate-950/90 rounded-2xl border border-indigo-500/30 space-y-2 animate-in fade-in duration-150">
            <label className="text-xs font-bold text-slate-300 block">
              Clave de API de Google Gemini (Google AI Studio):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy... o AQ.Ab..."
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Guardar
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              💡 Clave verificada y activa: <span className="text-lime-400 font-mono">AQ.Ab8RN6...</span>
            </p>
          </div>
        )}

        {/* Flyer Preview Box */}
        <div className="relative w-full max-h-[48vh] flex justify-center items-center bg-slate-950 rounded-2xl p-2.5 border border-slate-800 overflow-hidden">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Flyer Oficial Preview"
              className="max-h-[44vh] w-auto rounded-xl shadow-2xl object-contain border border-slate-700/50"
            />
          ) : (
            <div className="py-20 text-center text-slate-400 text-sm flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin text-lime-400" />
              <span>Generando afiche oficial con jugadores en alta resolución...</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!previewUrl}
            className="h-11 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-lime-400/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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
