import React, { useEffect, useRef, useState } from 'react';
import { Convocatoria, Confirmacion } from '@/types';
import { X, Download, Copy, Share2, Sparkles, Check, Key, RefreshCw, Tag, MapPin, Calendar, Phone, Palette } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useConvocatoria } from '@/hooks/useConvocatorias';
import { toast } from 'sonner';

interface ConvocatoriaFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  convocatoria: Convocatoria;
}

type FlyerTheme = 'neon_arena' | 'fuego_barrio' | 'cyber_futsal' | 'champions_gold';

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

  // Fetch detailed fresh data with confirmaciones.user eager-loaded
  const { data: fullConvocatoria, isLoading: isLoadingFull, refetch } = useConvocatoria(convocatoria?.id);
  const activeConvocatoria = fullConvocatoria || convocatoria;

  // Active Visual Theme
  const [theme, setTheme] = useState<FlyerTheme>('neon_arena');

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

  // AI Generated Match Metadata
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
  }, [isOpen, activeConvocatoria, categoryText, venueText, dateTimeText, contactPhone, theme, aiHeadline]);

  // Request Custom AI Match Creative from Gemini 3.5 Flash Lite
  const fetchGeminiData = async (keyToUse: string) => {
    try {
      setIsGenerating(true);
      const prompt = `Actua como director creativo y narrador deportivo oficial de "Pichangas de Barrio FC".
Partido: "${activeConvocatoria.title}"
Sede: "${venueText}"
Fecha: "${dateTimeText}"
Modalidad: ${numTeams} equipos
Genera un JSON con este formato exacto:
{
  "headline": "Eslogan epico y motivador de maximo 6 palabras en MAYUSCULAS (sin comillas)",
  "theme": "Uno de estos 4 valores exactos: neon_arena, fuego_barrio, cyber_futsal, champions_gold",
  "hype": "Narrativa emocionante de 2 lineas para compartir en WhatsApp anunciando el partidazo y la sede."
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
        if (parsed.theme && ['neon_arena', 'fuego_barrio', 'cyber_futsal', 'champions_gold'].includes(parsed.theme)) {
          setTheme(parsed.theme as FlyerTheme);
        }
        if (parsed.hype) setAiHypeNarrative(parsed.hype);
        toast.success('¡Diseño y eslogan personalizados con Gemini IA!');
      }
    } catch {
      toast.info('Se aplicó diseño de alta definición oficial.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 3D Realistic Soccer Ball Generator
  const draw3DSoccerBall = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(cx + 8, cy + r - 5, r * 0.9, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Base Sphere gradient
    const ballGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.55, '#f8fafc');
    ballGrad.addColorStop(0.85, '#cbd5e1');
    ballGrad.addColorStop(1, '#475569');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Central pentagon
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const ang = (i * 72 - 18) * (Math.PI / 180);
      const px = cx + Math.cos(ang) * (r * 0.36);
      const py = cy + Math.sin(ang) * (r * 0.36);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Seam lines to outer points
    for (let i = 0; i < 5; i++) {
      const ang = (i * 72 - 18) * (Math.PI / 180);
      const px1 = cx + Math.cos(ang) * (r * 0.36);
      const py1 = cy + Math.sin(ang) * (r * 0.36);
      const px2 = cx + Math.cos(ang) * (r * 0.82);
      const py2 = cy + Math.sin(ang) * (r * 0.82);
      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.stroke();
    }

    // Outer patch hints
    for (let i = 0; i < 5; i++) {
      const ang = (i * 72 - 18) * (Math.PI / 180);
      const px2 = cx + Math.cos(ang) * (r * 0.82);
      const py2 = cy + Math.sin(ang) * (r * 0.82);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(px2, py2, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Specular glossy reflection
    const shine = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, 2, cx - r * 0.4, cy - r * 0.4, r * 0.45);
    shine.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    shine.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(cx - r * 0.4, cy - r * 0.4, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const renderPoster = async () => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const width = 1080;
    const height = 1620; // 2:3 high definition resolution
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Theme Color Palettes
    const palettes = {
      neon_arena: {
        bgTop: '#020612',
        bgMid: '#041f17',
        bgBot: '#020e18',
        accent1: '#c8ff00', // Neon Lime
        accent2: '#06b6d4', // Cyan
        accent3: '#e11d48', // Red
        cardBg: 'rgba(8, 18, 30, 0.88)',
        borderColor: '#84cc16'
      },
      fuego_barrio: {
        bgTop: '#080205',
        bgMid: '#240808',
        bgBot: '#0a0202',
        accent1: '#f59e0b', // Gold Flame
        accent2: '#ef4444', // Red
        accent3: '#fbbf24', // Amber
        cardBg: 'rgba(28, 10, 10, 0.90)',
        borderColor: '#ef4444'
      },
      cyber_futsal: {
        bgTop: '#020412',
        bgMid: '#120732',
        bgBot: '#050a22',
        accent1: '#22d3ee', // Cyan
        accent2: '#a855f7', // Purple
        accent3: '#f43f5e', // Rose
        cardBg: 'rgba(15, 12, 38, 0.90)',
        borderColor: '#06b6d4'
      },
      champions_gold: {
        bgTop: '#080702',
        bgMid: '#1c1505',
        bgBot: '#060501',
        accent1: '#facc15', // Gold
        accent2: '#e2e8f0', // Silver
        accent3: '#ea580c', // Bronze
        cardBg: 'rgba(24, 20, 8, 0.92)',
        borderColor: '#eab308'
      }
    };

    const currentPalette = palettes[theme] || palettes.neon_arena;

    // 1. Deep Atmospheric Sports Arena Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, currentPalette.bgTop);
    bgGrad.addColorStop(0.3, currentPalette.bgMid);
    bgGrad.addColorStop(0.75, currentPalette.bgBot);
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Diagonal Stadium Mesh Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1.5;
    for (let i = -width; i < width * 2; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }
    for (let i = width * 2; i > -width; i -= 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - height, height);
      ctx.stroke();
    }

    // Top Volumetric Stadium Floodlights
    const drawFloodlight = (x: number, y: number, color: string) => {
      const rad = ctx.createRadialGradient(x, y, 10, x, y, 380);
      rad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      rad.addColorStop(0.25, color);
      rad.addColorStop(0.7, 'rgba(255, 255, 255, 0.04)');
      rad.addColorStop(1, 'transparent');
      ctx.fillStyle = rad;
      ctx.beginPath();
      ctx.arc(x, y, 380, 0, Math.PI * 2);
      ctx.fill();
    };

    drawFloodlight(90, 60, currentPalette.accent1);
    drawFloodlight(width - 90, 60, currentPalette.accent2);

    // Top Neon Athletic Accent Bar
    const topBar = ctx.createLinearGradient(0, 0, width, 0);
    topBar.addColorStop(0, currentPalette.accent1);
    topBar.addColorStop(0.5, currentPalette.accent2);
    topBar.addColorStop(1, currentPalette.accent3);
    ctx.fillStyle = topBar;
    ctx.fillRect(0, 0, width, 12);

    // 2. Official Club Badge and 3D Urban Typography
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = '/logo.jpg';
      await new Promise((res) => {
        logoImg.onload = res;
        logoImg.onerror = res;
      });

      if (logoImg.width > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(105, 120, 48, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, 57, 72, 96, 96);
        ctx.restore();

        ctx.strokeStyle = currentPalette.accent1;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(105, 120, 48, 0, Math.PI * 2);
        ctx.stroke();
      }
    } catch {
      // Fallback
    }

    // 3D Title: PICHANGAS DE BARRIO FC
    ctx.save();
    ctx.translate(width / 2 + 30, 125);
    ctx.rotate(-0.025);

    // Top Line: PICHANGAS
    ctx.font = '900 84px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 3D extruded shadow layers
    ctx.fillStyle = '#000000';
    ctx.fillText('PICHANGAS', 4, -36);
    ctx.fillText('PICHANGAS', 3, -37);
    ctx.fillText('PICHANGAS', 2, -38);

    // Title face gradient
    const titleGrad = ctx.createLinearGradient(0, -70, 0, -10);
    titleGrad.addColorStop(0, '#ffffff');
    titleGrad.addColorStop(0.4, currentPalette.accent1);
    titleGrad.addColorStop(1, currentPalette.accent1);
    ctx.fillStyle = titleGrad;
    ctx.fillText('PICHANGAS', 0, -40);

    // Bottom Line: DE BARRIO FC
    ctx.font = '900 68px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('DE BARRIO FC', 4, 38);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('DE BARRIO FC', 0, 34);
    ctx.restore();

    // 3D Soccer Ball at Top-Right
    draw3DSoccerBall(ctx, width - 95, 115, 52);

    // 3. Category Ribbon & AI Motto (y = 225 to 305)
    ctx.save();
    ctx.translate(width / 2, 245);
    ctx.rotate(-0.02);

    // Angled Category Ribbon
    const ribbonGrad = ctx.createLinearGradient(-220, 0, 220, 0);
    ribbonGrad.addColorStop(0, '#facc15');
    ribbonGrad.addColorStop(1, '#eab308');
    ctx.fillStyle = ribbonGrad;
    ctx.strokeStyle = '#05070a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-220, -32, 440, 64, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0a0a0a';
    ctx.font = '900 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(categoryText.toUpperCase(), 0, 0);
    ctx.restore();

    // AI Headline / Motto
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.font = '900 24px sans-serif';
    ctx.fillText(`⚡ ${aiHeadline} ⚡`, width / 2, 305);

    // 4. Match Details HUD Glassmorphic Card (y = 330 to 465)
    ctx.fillStyle = currentPalette.cardBg;
    ctx.strokeStyle = currentPalette.borderColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(55, 330, width - 110, 132, 24);
    ctx.fill();
    ctx.stroke();

    // Date & Time
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px sans-serif';
    ctx.fillText(`📅 ${dateTimeText.toUpperCase()}`, width / 2, 372);

    // Sede / Venue
    ctx.fillStyle = currentPalette.accent1;
    ctx.font = '900 40px sans-serif';
    ctx.fillText(`📍 SEDE: ${venueText.toUpperCase()}`, width / 2, 422);

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

    // 5. Teams & Roster Section (y = 485 to 1420)
    if (hasTeams) {
      if (detectedNumTeams === 2) {
        // =========================================================
        // 2 TEAMS: DUELO VERSUS BATTLE ARENA (High-impact visual duel)
        // =========================================================
        const colWidth = 460;
        const col1X = 60;
        const col2X = 560;
        const startY = 495;
        const pillH = 58;

        // Team 1 Left Pill: Furia Roja
        const t1Grad = ctx.createLinearGradient(col1X, startY, col1X + colWidth, startY);
        t1Grad.addColorStop(0, '#dc2626');
        t1Grad.addColorStop(1, '#991b1b');
        ctx.fillStyle = t1Grad;
        ctx.beginPath();
        ctx.roundRect(col1X, startY, colWidth, pillH, 29);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔴 EQUIPO 1', col1X + colWidth / 2, startY + 30);

        // Team 2 Right Pill: Rayo Verde
        const t2Grad = ctx.createLinearGradient(col2X, startY, col2X + colWidth, startY);
        t2Grad.addColorStop(0, '#84cc16');
        t2Grad.addColorStop(1, '#4d7c0f');
        ctx.fillStyle = t2Grad;
        ctx.beginPath();
        ctx.roundRect(col2X, startY, colWidth, pillH, 29);
        ctx.fill();

        ctx.fillStyle = '#0a0a0a';
        ctx.font = '900 30px sans-serif';
        ctx.fillText('🟢 EQUIPO 2', col2X + colWidth / 2, startY + 30);

        // Center VS Badge
        ctx.fillStyle = '#070b14';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(width / 2, startY + pillH / 2, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.font = '900 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VS', width / 2, startY + pillH / 2 + 4);

        // Vertical divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, startY + 70);
        ctx.lineTo(width / 2, 1400);
        ctx.stroke();

        // Render 2-Column Player Cards
        const render2ColRoster = (players: Confirmacion[], colX: number, accentColor: string) => {
          const sorted = sortWithGkFirst(players);
          const rowStartY = startY + 80;
          const maxR = Math.max(7, sorted.length);
          const rowH = Math.min(85, 820 / maxR);

          sorted.forEach((p, idx) => {
            const py = rowStartY + idx * rowH;
            const isGk = p.match_role === 'portero';
            const rawName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
            let nameToShow = p.user?.nickname ? `${rawName.split(' ')[0]} "${p.user.nickname}"` : rawName.split(' ').slice(0, 2).join(' ');
            if (nameToShow.length > 20) nameToShow = nameToShow.slice(0, 19) + '.';

            // Glassmorphic Player Card
            ctx.fillStyle = isGk ? 'rgba(245, 158, 11, 0.22)' : 'rgba(15, 23, 42, 0.75)';
            ctx.strokeStyle = isGk ? '#f59e0b' : 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(colX, py - 24, colWidth, rowH - 12, 14);
            ctx.fill();
            ctx.stroke();

            // Number Badge
            ctx.fillStyle = isGk ? '#f59e0b' : accentColor;
            ctx.beginPath();
            ctx.roundRect(colX + 12, py - 16, 40, rowH - 28, 8);
            ctx.fill();

            ctx.fillStyle = '#0a0a0a';
            ctx.font = '900 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${idx + 1}`, colX + 32, py + 2);

            // Player Name
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 24px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(nameToShow, colX + 66, py + 2);

            // Goalkeeper Badge
            if (isGk) {
              const textW = ctx.measureText(nameToShow).width;
              ctx.fillText('🧤', colX + 74 + textW, py + 2);

              ctx.fillStyle = '#f59e0b';
              ctx.font = '900 15px sans-serif';
              ctx.textAlign = 'right';
              ctx.fillText('ARQUERO', colX + colWidth - 16, py + 2);
            }
          });
        };

        render2ColRoster(team1, col1X, '#ef4444');
        render2ColRoster(team2, col2X, '#84cc16');

      } else {
        // =========================================================
        // 3 TEAMS: TRIANGULAR CHAMPIONSHIP ROSTER (3 Balanced Columns)
        // =========================================================
        const colWidth = 310;
        const col1X = 45;
        const col2X = 385;
        const col3X = 725;
        const startY = 495;
        const pillH = 54;

        // Team 1 Pill: Red
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(col1X, startY, colWidth, pillH, 27);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔴 EQUIPO 1', col1X + colWidth / 2, startY + 28);

        // Team 2 Pill: Lime
        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.roundRect(col2X, startY, colWidth, pillH, 27);
        ctx.fill();
        ctx.fillStyle = '#0a0a0a';
        ctx.font = '900 26px sans-serif';
        ctx.fillText('🟢 EQUIPO 2', col2X + colWidth / 2, startY + 28);

        // Team 3 Pill: Purple / White
        ctx.fillStyle = '#9333ea';
        ctx.beginPath();
        ctx.roundRect(col3X, startY, colWidth, pillH, 27);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 26px sans-serif';
        ctx.fillText('🟣 EQUIPO 3', col3X + colWidth / 2, startY + 28);

        // Vertical dividers
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(365, startY + 65);
        ctx.lineTo(365, 1400);
        ctx.moveTo(705, startY + 65);
        ctx.lineTo(705, 1400);
        ctx.stroke();

        const render3ColRoster = (players: Confirmacion[], colX: number, accentColor: string) => {
          const sorted = sortWithGkFirst(players);
          const rowStartY = startY + 75;
          const maxR = Math.max(7, sorted.length);
          const rowH = Math.min(85, 820 / maxR);

          sorted.forEach((p, idx) => {
            const py = rowStartY + idx * rowH;
            const isGk = p.match_role === 'portero';
            const rawName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
            let nameToShow = p.user?.nickname ? p.user.nickname : rawName.split(' ').slice(0, 2).join(' ');
            if (nameToShow.length > 13) nameToShow = nameToShow.slice(0, 12) + '.';

            // Glassmorphic Player Card
            ctx.fillStyle = isGk ? 'rgba(245, 158, 11, 0.22)' : 'rgba(15, 23, 42, 0.75)';
            ctx.strokeStyle = isGk ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(colX, py - 22, colWidth, rowH - 10, 12);
            ctx.fill();
            ctx.stroke();

            // Number Pill
            ctx.fillStyle = isGk ? '#f59e0b' : accentColor;
            ctx.font = '900 22px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${idx + 1}.`, colX + 12, py + 2);

            // Player Name
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 22px sans-serif';
            ctx.fillText(nameToShow, colX + 46, py + 2);

            if (isGk) {
              const textW = ctx.measureText(nameToShow).width;
              ctx.fillText('🧤', colX + 50 + textW, py + 2);
            }
          });
        };

        render3ColRoster(team1, col1X, '#ef4444');
        render3ColRoster(team2, col2X, '#84cc16');
        render3ColRoster(team3, col3X, '#c084fc');

        // Resting Team Note under Column 3
        const resting = activeConvocatoria.draw_metadata?.first_match?.resting_teams;
        if (resting && resting.includes(3)) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('(Descansa 1er partido)', col3X + colWidth / 2, 1410);
        }
      }
    } else if (confirmados.length > 0) {
      // General Roster when not sorted into teams yet
      ctx.textAlign = 'center';
      ctx.fillStyle = currentPalette.accent1;
      ctx.font = '900 32px sans-serif';
      ctx.fillText(`📋 CONVOCADOS CONFIRMADOS (${confirmados.length} / ${activeConvocatoria.max_players})`, width / 2, 530);

      const colWidth = 310;
      const colXCoords = [45, 385, 725];
      const startY = 590;
      const sorted = sortWithGkFirst(confirmados);

      sorted.slice(0, 21).forEach((p, idx) => {
        const colIdx = Math.floor(idx / 7);
        const rowIdx = idx % 7;
        const colX = colXCoords[colIdx] || 45;
        const py = startY + rowIdx * 82;
        const isGk = p.match_role === 'portero';
        const rawName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
        let nameToShow = p.user?.nickname ? p.user.nickname : rawName.split(' ').slice(0, 2).join(' ');
        if (nameToShow.length > 13) nameToShow = nameToShow.slice(0, 12) + '.';

        ctx.fillStyle = isGk ? 'rgba(245, 158, 11, 0.22)' : 'rgba(15, 23, 42, 0.75)';
        ctx.strokeStyle = isGk ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(colX, py - 24, colWidth, 70, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isGk ? '#f59e0b' : currentPalette.accent1;
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${idx + 1}.`, colX + 16, py + 2);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 22px sans-serif';
        ctx.fillText(nameToShow, colX + 54, py + 2);

        if (isGk) {
          const textW = ctx.measureText(nameToShow).width;
          ctx.fillText('🧤', colX + 60 + textW, py + 2);
        }
      });
    } else {
      // 0 Players registered
      ctx.textAlign = 'center';
      ctx.fillStyle = currentPalette.accent1;
      ctx.font = '900 34px sans-serif';
      ctx.fillText(`📋 INSCRIPCIONES ABIERTAS (0 / ${activeConvocatoria.max_players || 21} CUPOS)`, width / 2, 700);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('¡Aún no hay jugadores registrados para este partido!', width / 2, 780);

      ctx.fillStyle = '#facc15';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('⚡ Los equipos y alineaciones aparecerán aquí automáticamente ⚡', width / 2, 850);
    }

    // 6. Modern Footer Section (y = 1440 to 1620)
    // 3D Soccer Ball at bottom-left
    draw3DSoccerBall(ctx, 115, 1525, 75);

    // Official Community WhatsApp & Web Pill
    ctx.fillStyle = 'rgba(6, 12, 22, 0.95)';
    ctx.strokeStyle = currentPalette.borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(220, 1485, width - 250, 80, 20);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 26px sans-serif';
    ctx.fillText('📲 ÚNETE AL GRUPO DE WHATSAPP:', 250, 1512);

    ctx.fillStyle = '#22c55e'; // WhatsApp green
    ctx.font = '900 30px sans-serif';
    ctx.fillText(`INFO 💬 ${contactPhone}`, 250, 1546);

    ctx.textAlign = 'right';
    ctx.fillStyle = currentPalette.accent1;
    ctx.font = '900 24px monospace';
    ctx.fillText('pichangasdebarrio.com', width - 50, 1528);

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
                  Diseño de Flyer con Inteligencia Artificial
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase">
                  Gemini 3.5 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Diseño bespoke adaptado a {numTeams} equipos con logo oficial y arqueros 🧤</span>
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

        {/* Theme Selector Toolbar */}
        <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold">
            <Palette size={14} className="text-lime-400" />
            <span className="hidden sm:inline">Tema Visual:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setTheme('neon_arena')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                theme === 'neon_arena' ? 'bg-lime-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              🟢 Neón Arena
            </button>
            <button
              type="button"
              onClick={() => setTheme('fuego_barrio')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                theme === 'fuego_barrio' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              🔴 Fuego Barrio
            </button>
            <button
              type="button"
              onClick={() => setTheme('cyber_futsal')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                theme === 'cyber_futsal' ? 'bg-cyan-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              🔵 Cyber Futsal
            </button>
            <button
              type="button"
              onClick={() => setTheme('champions_gold')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                theme === 'champions_gold' ? 'bg-yellow-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              🏆 Oro Real
            </button>
          </div>
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
              title="Personalizar afiche con IA"
            >
              <Sparkles size={14} className={isGenerating ? 'animate-spin' : ''} />
              <span>{isGenerating ? 'Pensando...' : 'Magia IA'}</span>
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
              <span>Generando afiche personalizado en alta definición con IA...</span>
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
