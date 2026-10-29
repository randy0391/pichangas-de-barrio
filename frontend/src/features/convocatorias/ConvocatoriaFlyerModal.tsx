import React, { useEffect, useRef, useState } from 'react';
import { Convocatoria, Confirmacion } from '@/types';
import { X, Download, Copy, Share2, Sparkles, Check, Key, RefreshCw, Tag, Users } from 'lucide-react';
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

  // Always fetch detailed convocatoria with confirmaciones.user eager-loaded
  const { data: fullConvocatoria, isLoading: isLoadingFull, refetch } = useConvocatoria(convocatoria?.id);
  const activeConvocatoria = fullConvocatoria || convocatoria;

  // Modality/Category banner text (defaults to FUTSAL or detected modality)
  const defaultCategory = (() => {
    const title = (activeConvocatoria?.title || convocatoria?.title || '').toUpperCase();
    if (title.includes('FUTSAL')) return 'FUTSAL';
    if (title.includes('FUTBOL 7') || title.includes('FÚTBOL 7')) return 'FÚTBOL 7';
    if (title.includes('FUTBOL 6') || title.includes('FÚTBOL 6')) return 'FÚTBOL 6';
    if (title.includes('FUTBOL 8') || title.includes('FÚTBOL 8')) return 'FÚTBOL 8';
    return 'FUTSAL';
  })();
  const [categoryText, setCategoryText] = useState(defaultCategory);

  // Gemini API Key management (Environment variable with encoded fallback)
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
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  // Strictly only accessible for Admin (with case-insensitive fallback)
  const isAdmin = user?.role === 'admin' || user?.role?.toLowerCase() === 'admin' || Boolean((user as any)?.is_admin);
  if (!isOpen || !isAdmin) return null;

  useEffect(() => {
    if (isOpen && activeConvocatoria) {
      renderPoster(aiHeadline);
    }
  }, [isOpen, activeConvocatoria, categoryText, aiHeadline]);

  // Request AI Hype Headline from Gemini API
  const fetchGeminiHype = async (keyToUse: string): Promise<string> => {
    try {
      setAiStatus('Consultando a Gemini AI...');
      const prompt = `Actua como narrador deportivo oficial de Pichangas de Barrio FC. Genera UN SOLO eslogan epico, corto y motivador (maximo 6 palabras en MAYUSCULAS, sin comillas ni emojis) para el partido: "${activeConvocatoria.title}". Responde unicamente con el texto del eslogan.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyToUse}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setAiStatus('Eslogan oficial activo.');
        return '¡DUELO DE TITANES EN LA CANCHA!';
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.replace(/["\n]/g, '');
      if (text) {
        setAiStatus('¡Eslogan generado por Gemini AI!');
        return text.toUpperCase();
      }
      return '¡DUELO DE TITANES EN LA CANCHA!';
    } catch {
      setAiStatus('Eslogan oficial activo.');
      return '¡DUELO DE TITANES EN LA CANCHA!';
    }
  };

  const handleRegenerateWithGemini = async () => {
    setIsGenerating(true);
    let headline = aiHeadline;
    if (geminiKey) {
      headline = await fetchGeminiHype(geminiKey);
      setAiHeadline(headline);
    }
    await renderPoster(headline);
    setIsGenerating(false);
  };

  // Helper to format Date and Time
  const formatMatchDateTime = (dateStr?: string, timeStr?: string) => {
    let dayNameStr = 'MIÉRCOLES';
    let fullDateStr = '';
    if (dateStr) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
        dayNameStr = days[d.getDay()] || 'MIÉRCOLES';
        const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];
        fullDateStr = `${dayNameStr} ${day} ${months[month]}`;
      }
    }

    let formattedTime = '10:00 P. M.';
    if (timeStr) {
      const tParts = timeStr.split(':');
      let h = parseInt(tParts[0], 10);
      const m = tParts[1] || '00';
      const ampm = h >= 12 ? 'P. M.' : 'A. M.';
      h = h % 12 || 12;
      formattedTime = `${h}:${m} ${ampm}`;
    }

    return { dayNameStr, fullDateStr, formattedTime };
  };

  const renderPoster = async (headline: string) => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const width = 1080;
    const height = 1620; // 2:3 aspect ratio matching official reference flyer
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Try to load the official Club Flyer Template Asset
    const templateImg = new Image();
    templateImg.crossOrigin = 'anonymous';
    templateImg.src = '/flyer-template.jpg';

    const isTemplateLoaded = await new Promise<boolean>((resolve) => {
      templateImg.onload = () => resolve(true);
      templateImg.onerror = () => resolve(false);
    });

    if (isTemplateLoaded) {
      // Draw official template background
      ctx.drawImage(templateImg, 0, 0, width, height);
    } else {
      // Procedural athletic arena background fallback
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#020617');
      bg.addColorStop(0.3, '#064e3b');
      bg.addColorStop(0.7, '#022c22');
      bg.addColorStop(1, '#020617');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Top Floodlights
      const drawLight = (x: number, y: number) => {
        const rad = ctx.createRadialGradient(x, y, 10, x, y, 240);
        rad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        rad.addColorStop(0.3, 'rgba(200, 255, 0, 0.4)');
        rad.addColorStop(1, 'transparent');
        ctx.fillStyle = rad;
        ctx.fillRect(x - 240, y - 240, 480, 480);
      };
      drawLight(120, 80);
      drawLight(width - 120, 80);

      // Title Brush fallback
      ctx.textAlign = 'center';
      ctx.fillStyle = '#c8ff00';
      ctx.font = '900 82px sans-serif';
      ctx.fillText('PICHANGAS', width / 2, 140);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('DE BARRIO', width / 2, 225);
    }

    // 2. Yellow Modality Ribbon Banner (y = 295 to 370)
    ctx.save();
    ctx.translate(width / 2, 335);
    ctx.rotate(-0.02); // energetic -1.1 deg slant

    // Yellow brush tape backing
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#05070a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-230, -38, 460, 76, 12);
    ctx.fill();
    ctx.stroke();

    // Modality Text
    ctx.fillStyle = '#0a0a0a';
    ctx.font = '900 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(categoryText.toUpperCase(), 0, 0);
    ctx.restore();

    // 3. Match Details Box (Date, Time, Venue)
    const { dayNameStr, formattedTime } = formatMatchDateTime(activeConvocatoria.match_date, activeConvocatoria.match_time);
    const venueName = (activeConvocatoria.location || 'JOHN ANDREWS').toUpperCase();

    // 100% Solid opaque backing to completely eliminate background template text bleed-through
    ctx.fillStyle = '#040711';
    ctx.beginPath();
    ctx.roundRect(75, 380, width - 150, 148, 24);
    ctx.fill();

    // Stylized dark container over y = 385 to 525
    const infoGrad = ctx.createLinearGradient(0, 385, 0, 525);
    infoGrad.addColorStop(0, '#0a1426');
    infoGrad.addColorStop(1, '#050914');
    ctx.fillStyle = infoGrad;
    ctx.strokeStyle = 'rgba(200, 255, 0, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(80, 385, width - 160, 140, 24);
    ctx.fill();
    ctx.stroke();

    // Line 1: Day of Week & Time
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px sans-serif';
    ctx.fillText(`📅 ${dayNameStr}   |   🕒 ${formattedTime}`, width / 2, 428);

    // Line 2: Venue
    ctx.fillStyle = '#c8ff00'; // Neon lime
    ctx.font = '900 44px sans-serif';
    ctx.fillText(`📍 ${venueName}`, width / 2, 484);

    // AI Slogan if available
    if (headline && headline !== '¡DUELO DE TITANES EN LA CANCHA!') {
      ctx.fillStyle = '#fde047';
      ctx.font = '900 20px sans-serif';
      ctx.fillText(`⚡ ${headline.length > 42 ? headline.slice(0, 42) + '...' : headline} ⚡`, width / 2, 370);
    }

    // 4. Teams & Rosters Section (y = 1025 to 1425)
    // 100% Solid opaque backing spanning x=15 to width-30 to cover all old template names completely
    ctx.fillStyle = '#04070d';
    ctx.fillRect(15, 1025, width - 30, 400);

    const rosterGrad = ctx.createLinearGradient(0, 1030, 0, 1420);
    rosterGrad.addColorStop(0, '#06090f');
    rosterGrad.addColorStop(0.5, '#030508');
    rosterGrad.addColorStop(1, '#06090f');
    ctx.fillStyle = rosterGrad;
    ctx.fillRect(30, 1030, width - 60, 390);

    // Glowing Neon Lime divider line on top of rosters
    ctx.strokeStyle = '#c8ff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, 1030);
    ctx.lineTo(width - 40, 1030);
    ctx.stroke();

    // Filter confirmed players
    const rawConfirmados = (activeConvocatoria.confirmaciones || []);
    let confirmados = rawConfirmados.filter(c => {
      const st = (c.status || '').toLowerCase();
      return st === 'confirmado' || st === 'asistio' || st === 'confirmed';
    });
    // Fallback: if no players marked with 'confirmado', use all active enrollments
    if (confirmados.length === 0 && rawConfirmados.length > 0) {
      confirmados = rawConfirmados;
    }

    const team1 = confirmados.filter(c => Number(c.team_number) === 1);
    const team2 = confirmados.filter(c => Number(c.team_number) === 2);
    const team3 = confirmados.filter(c => Number(c.team_number) === 3);

    // Sort helper: Portero always at index 0 (#1)
    const sortWithGkFirst = (list: Confirmacion[]) => {
      return [...list].sort((a, b) => {
        const aGk = a.match_role === 'portero' ? 1 : 0;
        const bGk = b.match_role === 'portero' ? 1 : 0;
        return bGk - aGk;
      });
    };

    const hasTeams = team1.length > 0 && team2.length > 0;
    const numTeams = activeConvocatoria.num_teams || (team3.length > 0 ? 3 : 2);

    if (hasTeams) {
      if (numTeams === 3 || team3.length > 0) {
        // 3-COLUMN LAYOUT (Matching official flyer reference)
        const colWidth = 310;
        const col1X = 45;
        const col2X = 385;
        const col3X = 725;
        const pillY = 1045;
        const pillH = 48;

        // Column 1: EQUIPO 1 (Red)
        const redGrad = ctx.createLinearGradient(col1X, pillY, col1X + colWidth, pillY);
        redGrad.addColorStop(0, '#dc2626');
        redGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = redGrad;
        ctx.beginPath();
        ctx.roundRect(col1X, pillY, colWidth, pillH, 24);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏆 EQUIPO 1', col1X + colWidth / 2, pillY + pillH / 2);

        // Column 2: EQUIPO 2 (Lime)
        const limeGrad = ctx.createLinearGradient(col2X, pillY, col2X + colWidth, pillY);
        limeGrad.addColorStop(0, '#84cc16');
        limeGrad.addColorStop(1, '#4d7c0f');
        ctx.fillStyle = limeGrad;
        ctx.beginPath();
        ctx.roundRect(col2X, pillY, colWidth, pillH, 24);
        ctx.fill();

        ctx.fillStyle = '#0a0a0a';
        ctx.font = '900 24px sans-serif';
        ctx.fillText('🏆 EQUIPO 2', col2X + colWidth / 2, pillY + pillH / 2);

        // Column 3: EQUIPO 3 (White)
        const whiteGrad = ctx.createLinearGradient(col3X, pillY, col3X + colWidth, pillY);
        whiteGrad.addColorStop(0, '#ffffff');
        whiteGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = whiteGrad;
        ctx.beginPath();
        ctx.roundRect(col3X, pillY, colWidth, pillH, 24);
        ctx.fill();

        ctx.fillStyle = '#0a0a0a';
        ctx.font = '900 24px sans-serif';
        ctx.fillText('🏆 EQUIPO 3', col3X + colWidth / 2, pillY + pillH / 2);

        // Vertical dividing lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(365, 1050);
        ctx.lineTo(365, 1400);
        ctx.moveTo(705, 1050);
        ctx.lineTo(705, 1400);
        ctx.stroke();

        // Draw Player Lists
        const renderColumnPlayers = (players: Confirmacion[], colX: number, accentColor: string) => {
          const sorted = sortWithGkFirst(players);
          const maxRows = Math.max(7, sorted.length);
          const rowH = Math.min(42, 280 / maxRows);
          const startY = 1125;

          ctx.textBaseline = 'middle';
          sorted.forEach((p, idx) => {
            const py = startY + idx * rowH;
            const isGk = p.match_role === 'portero';
            const rawName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
            let nameToShow = p.user?.nickname ? p.user.nickname : rawName.split(' ').slice(0, 2).join(' ');
            if (nameToShow.length > 14) nameToShow = nameToShow.slice(0, 13) + '.';

            // Colored number
            ctx.fillStyle = accentColor;
            ctx.font = '900 23px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${idx + 1}.`, colX + 12, py);

            // White name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText(nameToShow, colX + 46, py);

            // Yellow Glove for Goalkeeper
            if (isGk) {
              const textW = ctx.measureText(nameToShow).width;
              ctx.fillText('🧤', colX + 50 + textW, py);
            }
          });
        };

        renderColumnPlayers(team1, col1X, '#ef4444');
        renderColumnPlayers(team2, col2X, '#84cc16');
        renderColumnPlayers(team3, col3X, '#ffffff');

        // Check resting team in draw_metadata
        const resting = activeConvocatoria.draw_metadata?.first_match?.resting_teams;
        if (resting && resting.includes(3)) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('(Descansa 1er partido)', col3X + colWidth / 2, 1410);
        }

      } else {
        // 2-COLUMN LAYOUT
        const colWidth = 460;
        const col1X = 60;
        const col2X = 560;
        const pillY = 1045;
        const pillH = 50;

        // Column 1: EQUIPO 1 (Red)
        const redGrad = ctx.createLinearGradient(col1X, pillY, col1X + colWidth, pillY);
        redGrad.addColorStop(0, '#dc2626');
        redGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = redGrad;
        ctx.beginPath();
        ctx.roundRect(col1X, pillY, colWidth, pillH, 25);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏆 EQUIPO 1', col1X + colWidth / 2, pillY + pillH / 2);

        // Column 2: EQUIPO 2 (Lime)
        const limeGrad = ctx.createLinearGradient(col2X, pillY, col2X + colWidth, pillY);
        limeGrad.addColorStop(0, '#84cc16');
        limeGrad.addColorStop(1, '#4d7c0f');
        ctx.fillStyle = limeGrad;
        ctx.beginPath();
        ctx.roundRect(col2X, pillY, colWidth, pillH, 25);
        ctx.fill();

        ctx.fillStyle = '#0a0a0a';
        ctx.font = '900 26px sans-serif';
        ctx.fillText('🏆 EQUIPO 2', col2X + colWidth / 2, pillY + pillH / 2);

        // Vertical divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(530, 1050);
        ctx.lineTo(530, 1400);
        ctx.stroke();

        const render2ColPlayers = (players: Confirmacion[], colX: number, accentColor: string) => {
          const sorted = sortWithGkFirst(players);
          const maxRows = Math.max(7, sorted.length);
          const rowH = Math.min(42, 280 / maxRows);
          const startY = 1125;

          ctx.textBaseline = 'middle';
          sorted.forEach((p, idx) => {
            const py = startY + idx * rowH;
            const isGk = p.match_role === 'portero';
            const rawName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
            let nameToShow = p.user?.nickname ? `${rawName.split(' ')[0]} "${p.user.nickname}"` : rawName.split(' ').slice(0, 2).join(' ');
            if (nameToShow.length > 20) nameToShow = nameToShow.slice(0, 19) + '.';

            ctx.fillStyle = accentColor;
            ctx.font = '900 24px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${idx + 1}.`, colX + 24, py);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 23px sans-serif';
            ctx.fillText(nameToShow, colX + 64, py);

            if (isGk) {
              const textW = ctx.measureText(nameToShow).width;
              ctx.fillText('🧤', colX + 70 + textW, py);
            }
          });
        };

        render2ColPlayers(team1, col1X, '#ef4444');
        render2ColPlayers(team2, col2X, '#84cc16');
      }
    } else if (confirmados.length > 0) {
      // Teams not sorted yet, but players are confirmed: List all confirmed players across 3 columns
      ctx.textAlign = 'center';
      ctx.fillStyle = '#c8ff00';
      ctx.font = '900 28px sans-serif';
      ctx.fillText(`📋 CONVOCADOS CONFIRMADOS (${confirmados.length} / ${activeConvocatoria.max_players})`, width / 2, 1065);

      const colWidth = 310;
      const colXCoords = [55, 385, 715];
      const startY = 1115;
      const sorted = sortWithGkFirst(confirmados);

      ctx.textBaseline = 'middle';
      sorted.slice(0, 21).forEach((p, idx) => {
        const colIdx = Math.floor(idx / 7);
        const rowIdx = idx % 7;
        const colX = colXCoords[colIdx] || 55;
        const py = startY + rowIdx * 42;
        const isGk = p.match_role === 'portero';
        const rawName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
        let nameToShow = p.user?.nickname ? p.user.nickname : rawName.split(' ').slice(0, 2).join(' ');
        if (nameToShow.length > 13) nameToShow = nameToShow.slice(0, 12) + '.';

        ctx.fillStyle = isGk ? '#f59e0b' : '#c8ff00';
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
      // Zero players confirmed yet - Render clear status banner
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#c8ff00';
      ctx.font = '900 32px sans-serif';
      ctx.fillText(`📋 INSCRIPCIONES ABIERTAS (0 / ${activeConvocatoria.max_players || 21} CUPOS)`, width / 2, 1100);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('¡Aún no hay jugadores registrados para este partido!', width / 2, 1170);

      ctx.fillStyle = '#facc15';
      ctx.font = '900 22px sans-serif';
      ctx.fillText('⚡ Los jugadores y equipos sorteados aparecerán aquí automáticamente ⚡', width / 2, 1230);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('Asegura tu cupo en la web: pichangasdebarrio.com', width / 2, 1290);
    }

    // 5. Subtle Footer Brand Line
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('pichangasdebarrio.com · Pichangas de Barrio FC', width / 2, 1595);

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

    const text = `⚽ *CONVOCATORIA OFICIAL - PICHANGAS DE BARRIO FC* ⚽\n\n` +
      `🔥 *${activeConvocatoria.title.toUpperCase()}*\n` +
      `🏆 *Categoría:* ${categoryText}\n` +
      `📅 *Fecha:* ${activeConvocatoria.match_date}\n` +
      `⏰ *Hora:* ${activeConvocatoria.match_time?.slice(0, 5)} hrs\n` +
      `🏟️ *Sede:* ${activeConvocatoria.location}\n` +
      `👥 *Inscritos:* ${confirmados.length}/${activeConvocatoria.max_players} (${remaining > 0 ? `¡Quedan ${remaining} cupos!` : '¡Equipos Sorteados!'})\n\n` +
      `📲 *Ver lista completa:* ${window.location.origin}/convocatorias/${activeConvocatoria.id}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSaveKey = () => {
    localStorage.setItem('pb_gemini_api_key', geminiKey.trim());
    toast.success('Clave de Gemini guardada.');
    setShowKeyConfig(false);
    handleRegenerateWithGemini();
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
                  Flyer Oficial para WhatsApp
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase">
                  Solo Administrador
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Póster oficial con arqueros 🧤 y equipos sorteados</span>
                <span className="text-lime-400 font-bold flex items-center gap-1">
                  <Users size={12} /> {currentConfirmadosCount}/{activeConvocatoria.max_players || 21}
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

        {/* Quick Customization Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <Tag size={14} className="text-yellow-400 shrink-0" />
            <span className="text-slate-400 font-bold shrink-0">Cinta:</span>
            <input 
              type="text" 
              value={categoryText} 
              onChange={(e) => setCategoryText(e.target.value.toUpperCase())}
              placeholder="FUTSAL / FÚTBOL 7..."
              className="w-full bg-transparent text-white font-black uppercase outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={handleRegenerateWithGemini}
              disabled={isGenerating}
              className="text-lime-400 hover:text-lime-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Regenerar eslogan con IA"
            >
              <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} />
              <span>{isGenerating ? 'Generando...' : 'Eslogan Gemini IA'}</span>
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={() => {
                refetch();
                renderPoster(aiHeadline);
              }}
              className="text-slate-400 hover:text-slate-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Recargar datos frescos de jugadores"
            >
              <RefreshCw size={12} className={isLoadingFull ? 'animate-spin' : ''} /> Recargar
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="text-slate-400 hover:text-slate-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Key size={12} /> API Key
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
                placeholder="AIzaSy..."
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
              💡 Puedes usar la clave oficial predeterminada o ingresar la tuya desde <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-lime-400 underline">aistudio.google.com</a>.
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
              <span>Generando póster oficial en alta resolución con jugadores...</span>
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
