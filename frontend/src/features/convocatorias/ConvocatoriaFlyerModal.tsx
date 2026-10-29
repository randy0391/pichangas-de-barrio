import React, { useEffect, useRef, useState } from 'react';
import { Convocatoria, Confirmacion } from '@/types';
import { X, Download, Copy, Share2, Sparkles, Check, Key, RefreshCw, Tag, Users, Wand2, Image as ImageIcon } from 'lucide-react';
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

  // Flyer Style Mode: AI Generative (adapts to 2, 3 or 4 teams) vs Classic Template
  const [flyerStyle, setFlyerStyle] = useState<'ai_generative' | 'classic_template'>('ai_generative');

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
  const numTeams = activeConvocatoria?.num_teams || 2;
  const defaultTag = numTeams === 2 ? 'CLÁSICO DE BARRIO ⚡ 1 VS 1' : (numTeams === 3 ? 'TRIANGULAR DE CANDELA' : 'CUADRANGULAR DE TITANES');
  const [aiHeadline, setAiHeadline] = useState<string>('¡DUELO DE TITANES EN LA CANCHA!');
  const [aiMatchTag, setAiMatchTag] = useState<string>(defaultTag);
  const [aiHypeNarrative, setAiHypeNarrative] = useState<string>('');
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  // Strictly only accessible for Admin
  const isAdmin = user?.role === 'admin' || user?.role?.toLowerCase() === 'admin' || Boolean((user as any)?.is_admin);
  if (!isOpen || !isAdmin) return null;

  useEffect(() => {
    if (isOpen && activeConvocatoria) {
      renderPoster(aiHeadline, aiMatchTag);
    }
  }, [isOpen, activeConvocatoria, categoryText, aiHeadline, aiMatchTag, flyerStyle]);

  // Request AI Match Announcement & Slogan from Gemini 3.5 Flash Lite
  const fetchGeminiData = async (keyToUse: string) => {
    try {
      setIsGenerating(true);
      setAiStatus('Gemini IA analizando alineaciones...');
      
      const venue = activeConvocatoria.location || 'la cancha';
      const prompt = `Actua como narrador deportivo oficial de "Pichangas de Barrio FC".
Partido: "${activeConvocatoria.title}"
Formato: ${numTeams} equipos
Sede: "${venue}"
Genera un JSON con este formato exacto:
{
  "headline": "Eslogan epico de maximo 6 palabras en MAYUSCULAS (sin comillas)",
  "match_tag": "Etiqueta corta en MAYUSCULAS (ej: CLASICO DE BARRIO, DUELO DE TITANES, o TRIANGULAR DE CANDELA)",
  "hype": "Narrativa de 2 lineas motivadoras para compartir en WhatsApp anunciando a los equipos y la sede."
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
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Error en Gemini API');
      }

      const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        const headlineText = (parsed.headline || '¡DUELO DE TITANES EN LA CANCHA!').toUpperCase();
        const tagText = (parsed.match_tag || defaultTag).toUpperCase();
        
        setAiHeadline(headlineText);
        setAiMatchTag(tagText);
        if (parsed.hype) setAiHypeNarrative(parsed.hype);

        setAiStatus('¡Afiche generado con Gemini IA!');
        toast.success('¡Diseño actualizado con Inteligencia Artificial!');
        await renderPoster(headlineText, tagText);
      }
    } catch {
      setAiStatus('Eslogan oficial activo.');
      await renderPoster(aiHeadline, aiMatchTag);
    } finally {
      setIsGenerating(false);
    }
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

  // Procedural 3D Soccer Ball Renderer in Canvas
  const drawSoccerBall = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx + 8, cy + r - 5, r * 0.85, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Base Sphere gradient
    const ballGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.65, '#f1f5f9');
    ballGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Central pentagon
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const ang = (i * 72 - 18) * (Math.PI / 180);
      const px = cx + Math.cos(ang) * (r * 0.38);
      const py = cy + Math.sin(ang) * (r * 0.38);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Seam lines to outer points
    for (let i = 0; i < 5; i++) {
      const ang = (i * 72 - 18) * (Math.PI / 180);
      const px1 = cx + Math.cos(ang) * (r * 0.38);
      const py1 = cy + Math.sin(ang) * (r * 0.38);
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
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(px2, py2, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }

    // Specular shine
    const shine = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, 2, cx - r * 0.4, cy - r * 0.4, r * 0.45);
    shine.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(cx - r * 0.4, cy - r * 0.4, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Procedural Graffiti Splatter Renderer
  const drawSplatter = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Satellite droplets
    for (let i = 0; i < 6; i++) {
      const ang = (i * 60 + 15) * (Math.PI / 180);
      const dist = radius * (1.6 + (i % 3) * 0.5);
      const dropR = radius * 0.28;
      ctx.beginPath();
      ctx.arc(x + Math.cos(ang) * dist, y + Math.sin(ang) * dist, dropR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const renderPoster = async (headline: string, matchTag: string) => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const width = 1080;
    const height = 1620; // 2:3 vertical poster
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
    const team4 = confirmados.filter(c => Number(c.team_number) === 4);

    const hasTeams = team1.length > 0 && team2.length > 0;
    const detectedNumTeams = activeConvocatoria.num_teams || (team4.length > 0 ? 4 : (team3.length > 0 ? 3 : 2));

    // Sort helper: Portero always at index 0 (#1)
    const sortWithGkFirst = (list: Confirmacion[]) => {
      return [...list].sort((a, b) => {
        const aGk = a.match_role === 'portero' ? 1 : 0;
        const bGk = b.match_role === 'portero' ? 1 : 0;
        return bGk - aGk;
      });
    };

    // -------------------------------------------------------------
    // OPTION A: AI GENERATIVE SPORTS POSTER (ADAPTIVE TO 2, 3, 4 TEAMS)
    // -------------------------------------------------------------
    if (flyerStyle === 'ai_generative') {
      // 1. Athletic Arena Background
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#020612');
      bg.addColorStop(0.2, '#041724');
      bg.addColorStop(0.55, '#06261c');
      bg.addColorStop(0.85, '#031118');
      bg.addColorStop(1, '#020612');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Diagonal Stadium Netting Mesh Texture
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1.5;
      for (let i = -width; i < width * 2; i += 45) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height, height);
        ctx.stroke();
      }
      for (let i = width * 2; i > -width; i -= 45) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i - height, height);
        ctx.stroke();
      }

      // Top Floodlights
      const drawStadiumLight = (x: number, y: number, tintColor: string) => {
        const rad = ctx.createRadialGradient(x, y, 15, x, y, 320);
        rad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        rad.addColorStop(0.2, tintColor);
        rad.addColorStop(0.6, 'rgba(200, 255, 0, 0.12)');
        rad.addColorStop(1, 'transparent');
        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(x, y, 320, 0, Math.PI * 2);
        ctx.fill();
      };
      drawStadiumLight(100, 60, 'rgba(200, 255, 0, 0.5)');
      drawStadiumLight(width - 100, 60, 'rgba(34, 211, 238, 0.5)');

      // Top Athletic Bar
      const topBar = ctx.createLinearGradient(0, 0, width, 0);
      topBar.addColorStop(0, '#e11d48');
      topBar.addColorStop(0.5, '#84cc16');
      topBar.addColorStop(1, '#06b6d4');
      ctx.fillStyle = topBar;
      ctx.fillRect(0, 0, width, 14);

      // 2. Title: "PICHANGAS DE BARRIO" in brush street typography
      ctx.save();
      ctx.translate(width / 2 - 40, 140);
      ctx.rotate(-0.03);

      // Dark grunge halo behind title
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 420, 95, 0, 0, Math.PI * 2);
      ctx.fill();

      // Top line: PICHANGAS (neon lime/chartreuse)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 86px sans-serif';
      ctx.fillStyle = '#0a0a0a';
      ctx.fillText('PICHANGAS', 4, -40); // shadow
      ctx.fillStyle = '#c8ff00';
      ctx.fillText('PICHANGAS', 0, -44);

      // Bottom line: DE BARRIO (white)
      ctx.font = '900 76px sans-serif';
      ctx.fillStyle = '#0a0a0a';
      ctx.fillText('DE BARRIO', 4, 38);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('DE BARRIO', 0, 34);
      ctx.restore();

      // 3D Soccer Ball at Top-Right
      drawSoccerBall(ctx, width - 110, 120, 60);

      // 3. Category Banner & AI Match Tag (y = 235 to 330)
      ctx.save();
      ctx.translate(width / 2, 260);
      ctx.rotate(-0.02);

      // Yellow Ribbon
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#05070a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-220, -32, 440, 64, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0a0a0a';
      ctx.font = '900 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(categoryText.toUpperCase(), 0, 0);
      ctx.restore();

      // AI Match Tag Pill
      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 22px sans-serif';
      ctx.fillText(`⚡ ${matchTag} ⚡`, width / 2, 322);

      // 4. Match Details Box (Date, Time, Sede) (y = 345 to 480)
      const { dayNameStr, formattedTime } = formatMatchDateTime(activeConvocatoria.match_date, activeConvocatoria.match_time);
      const venueName = (activeConvocatoria.location || 'JOHN ANDREWS').toUpperCase();

      ctx.fillStyle = '#050b18';
      ctx.beginPath();
      ctx.roundRect(65, 345, width - 130, 132, 22);
      ctx.fill();

      const infoBoxGrad = ctx.createLinearGradient(0, 345, 0, 477);
      infoBoxGrad.addColorStop(0, '#0a1628');
      infoBoxGrad.addColorStop(1, '#040914');
      ctx.fillStyle = infoBoxGrad;
      ctx.strokeStyle = 'rgba(200, 255, 0, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(65, 345, width - 130, 132, 22);
      ctx.fill();
      ctx.stroke();

      // AI Slogan
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fde047';
      ctx.font = '900 22px sans-serif';
      ctx.fillText(`🔥 ${headline} 🔥`, width / 2, 375);

      // Date & Time
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px sans-serif';
      ctx.fillText(`📅 ${dayNameStr}   |   🕒 ${formattedTime}`, width / 2, 415);

      // Venue / Sede
      ctx.fillStyle = '#c8ff00';
      ctx.font = '900 38px sans-serif';
      ctx.fillText(`📍 SEDE: ${venueName}`, width / 2, 455);

      // 5. Center Matchup Hero Section (y = 490 to 650)
      if (detectedNumTeams === 2 && hasTeams) {
        // 2 TEAMS VERSUS DUEL SHOWCASE
        const duelBoxY = 500;
        const duelH = 140;

        // Team 1 Left Shield Card
        const redGrad = ctx.createLinearGradient(70, duelBoxY, 480, duelBoxY);
        redGrad.addColorStop(0, '#dc2626');
        redGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = redGrad;
        ctx.beginPath();
        ctx.roundRect(70, duelBoxY, 410, duelH, 20);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 34px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔴 EQUIPO 1', 70 + 205, duelBoxY + 50);
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#fecaca';
        ctx.fillText(`${team1.length} Convocados`, 70 + 205, duelBoxY + 95);

        // Team 2 Right Shield Card
        const limeGrad = ctx.createLinearGradient(600, duelBoxY, 1010, duelBoxY);
        limeGrad.addColorStop(0, '#84cc16');
        limeGrad.addColorStop(1, '#4d7c0f');
        ctx.fillStyle = limeGrad;
        ctx.beginPath();
        ctx.roundRect(600, duelBoxY, 410, duelH, 20);
        ctx.fill();

        ctx.fillStyle = '#0a0a0a';
        ctx.font = '900 34px sans-serif';
        ctx.fillText('🟢 EQUIPO 2', 600 + 205, duelBoxY + 50);
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#14532d';
        ctx.fillText(`${team2.length} Convocados`, 600 + 205, duelBoxY + 95);

        // Center VS Badge with electric lightning aura
        ctx.fillStyle = '#0a0f1d';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(width / 2, duelBoxY + duelH / 2, 54, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.font = '900 40px sans-serif';
        ctx.fillText('VS', width / 2, duelBoxY + duelH / 2 + 5);

      } else {
        // 3 or 4 Teams: Futsal Field Graphics in Center
        const pitchY = 495;
        const pitchH = 145;

        ctx.fillStyle = 'rgba(6, 78, 59, 0.45)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(65, pitchY, width - 130, pitchH, 20);
        ctx.fill();
        ctx.stroke();

        // Center Line and circle
        ctx.beginPath();
        ctx.moveTo(width / 2, pitchY);
        ctx.lineTo(width / 2, pitchY + pitchH);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(width / 2, pitchY + pitchH / 2, 45, 0, Math.PI * 2);
        ctx.stroke();

        drawSoccerBall(ctx, width / 2, pitchY + pitchH / 2, 26);

        // Triangular / Multi-team announcement
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🏆 MODALIDAD: ${detectedNumTeams} EQUIPOS · TODOS CONTRA TODOS`, width / 2, pitchY + 30);

        if (detectedNumTeams === 3 && activeConvocatoria.draw_metadata?.first_match) {
          const fm = activeConvocatoria.draw_metadata.first_match;
          ctx.fillStyle = '#c8ff00';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText(`⚡ Partido 1: Equipo ${fm.team_a} vs Equipo ${fm.team_b}  ·  Descansa: Equipo ${fm.resting_teams?.[0] || 3}`, width / 2, pitchY + pitchH - 30);
        }
      }

      // 6. "CONVOCADOS" Brush Banner (y = 660 to 725)
      ctx.fillStyle = '#05070c';
      ctx.beginPath();
      ctx.roundRect(50, 660, width - 100, 60, 10);
      ctx.fill();

      // Neon trim
      ctx.fillStyle = '#c8ff00';
      ctx.fillRect(50, 660, 18, 60);
      ctx.fillRect(width - 68, 660, 18, 60);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 46px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CONVOCADOS', width / 2, 690);

      // 7. Dynamic Rosters Section (y = 735 to 1420)
      if (hasTeams) {
        if (detectedNumTeams === 2) {
          // 2-COLUMN EXPANDED BATTLE LAYOUT (Spacious, bold, clear)
          const colWidth = 460;
          const col1X = 65;
          const col2X = 555;
          const startY = 745;
          const pillH = 50;

          // Team 1 Pill Header
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.roundRect(col1X, startY, colWidth, pillH, 25);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 26px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🏆 EQUIPO 1', col1X + colWidth / 2, startY + 26);

          // Team 2 Pill Header
          ctx.fillStyle = '#84cc16';
          ctx.beginPath();
          ctx.roundRect(col2X, startY, colWidth, pillH, 25);
          ctx.fill();

          ctx.fillStyle = '#0a0a0a';
          ctx.font = '900 26px sans-serif';
          ctx.fillText('🏆 EQUIPO 2', col2X + colWidth / 2, startY + 26);

          // Vertical dividing line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(width / 2, startY + 5);
          ctx.lineTo(width / 2, 1400);
          ctx.stroke();

          // Render 2-column player cards
          const render2Col = (players: Confirmacion[], colX: number, accentColor: string) => {
            const sorted = sortWithGkFirst(players);
            const rowStartY = startY + 68;
            const maxR = Math.max(7, sorted.length);
            const rowH = Math.min(54, 580 / maxR);

            sorted.forEach((p, idx) => {
              const py = rowStartY + idx * rowH;
              const isGk = p.match_role === 'portero';
              const rawName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
              let nameToShow = p.user?.nickname ? `${rawName.split(' ')[0]} "${p.user.nickname}"` : rawName.split(' ').slice(0, 2).join(' ');
              if (nameToShow.length > 18) nameToShow = nameToShow.slice(0, 17) + '.';

              // Background player card
              ctx.fillStyle = isGk ? 'rgba(245, 158, 11, 0.18)' : 'rgba(15, 23, 42, 0.7)';
              ctx.strokeStyle = isGk ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.roundRect(colX, py - 20, colWidth, rowH - 8, 12);
              ctx.fill();
              ctx.stroke();

              // Number
              ctx.fillStyle = accentColor;
              ctx.font = '900 24px sans-serif';
              ctx.textAlign = 'left';
              ctx.fillText(`${idx + 1}.`, colX + 16, py + 2);

              // Player Name
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 23px sans-serif';
              ctx.fillText(nameToShow, colX + 54, py + 2);

              // Goalkeeper icon
              if (isGk) {
                const textW = ctx.measureText(nameToShow).width;
                ctx.fillText('🧤', colX + 62 + textW, py + 2);
                ctx.fillStyle = '#f59e0b';
                ctx.font = 'bold 15px sans-serif';
                ctx.fillText('[ARQUERO]', colX + colWidth - 105, py + 2);
              }
            });
          };

          render2Col(team1, col1X, '#ef4444');
          render2Col(team2, col2X, '#84cc16');

        } else {
          // 3-COLUMN ROSTER LAYOUT (Standard 3-Team Triangular)
          const colWidth = 310;
          const col1X = 45;
          const col2X = 385;
          const col3X = 725;
          const startY = 745;
          const pillH = 48;

          // Headers
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.roundRect(col1X, startY, colWidth, pillH, 24);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🏆 EQUIPO 1', col1X + colWidth / 2, startY + 25);

          ctx.fillStyle = '#84cc16';
          ctx.beginPath();
          ctx.roundRect(col2X, startY, colWidth, pillH, 24);
          ctx.fill();
          ctx.fillStyle = '#0a0a0a';
          ctx.fillText('🏆 EQUIPO 2', col2X + colWidth / 2, startY + 25);

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(col3X, startY, colWidth, pillH, 24);
          ctx.fill();
          ctx.fillStyle = '#0a0a0a';
          ctx.fillText('🏆 EQUIPO 3', col3X + colWidth / 2, startY + 25);

          // Dividers
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(365, startY + 5);
          ctx.lineTo(365, 1400);
          ctx.moveTo(705, startY + 5);
          ctx.lineTo(705, 1400);
          ctx.stroke();

          const render3Col = (players: Confirmacion[], colX: number, accentColor: string) => {
            const sorted = sortWithGkFirst(players);
            const rowStartY = startY + 65;
            const maxR = Math.max(7, sorted.length);
            const rowH = Math.min(48, 580 / maxR);

            sorted.forEach((p, idx) => {
              const py = rowStartY + idx * rowH;
              const isGk = p.match_role === 'portero';
              const rawName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
              let nameToShow = p.user?.nickname ? p.user.nickname : rawName.split(' ').slice(0, 2).join(' ');
              if (nameToShow.length > 14) nameToShow = nameToShow.slice(0, 13) + '.';

              ctx.fillStyle = accentColor;
              ctx.font = '900 23px sans-serif';
              ctx.textAlign = 'left';
              ctx.fillText(`${idx + 1}.`, colX + 12, py);

              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 22px sans-serif';
              ctx.fillText(nameToShow, colX + 46, py);

              if (isGk) {
                const textW = ctx.measureText(nameToShow).width;
                ctx.fillText('🧤', colX + 50 + textW, py);
              }
            });
          };

          render3Col(team1, col1X, '#ef4444');
          render3Col(team2, col2X, '#84cc16');
          render3Col(team3, col3X, '#ffffff');

          const resting = activeConvocatoria.draw_metadata?.first_match?.resting_teams;
          if (resting && resting.includes(3)) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('(Descansa 1er partido)', col3X + colWidth / 2, 1410);
          }
        }
      } else if (confirmados.length > 0) {
        // Enrolled players confirmed, waiting for team shuffle
        ctx.textAlign = 'center';
        ctx.fillStyle = '#c8ff00';
        ctx.font = '900 30px sans-serif';
        ctx.fillText(`📋 CONVOCADOS CONFIRMADOS (${confirmados.length} / ${activeConvocatoria.max_players})`, width / 2, 770);

        const colWidth = 310;
        const colXCoords = [55, 385, 715];
        const startY = 825;
        const sorted = sortWithGkFirst(confirmados);

        sorted.slice(0, 21).forEach((p, idx) => {
          const colIdx = Math.floor(idx / 7);
          const rowIdx = idx % 7;
          const colX = colXCoords[colIdx] || 55;
          const py = startY + rowIdx * 52;
          const isGk = p.match_role === 'portero';
          const rawName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
          let nameToShow = p.user?.nickname ? p.user.nickname : rawName.split(' ').slice(0, 2).join(' ');
          if (nameToShow.length > 13) nameToShow = nameToShow.slice(0, 12) + '.';

          ctx.fillStyle = isGk ? '#f59e0b' : '#c8ff00';
          ctx.font = '900 23px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${idx + 1}.`, colX + 10, py);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText(nameToShow, colX + 46, py);

          if (isGk) {
            const textW = ctx.measureText(nameToShow).width;
            ctx.fillText('🧤', colX + 50 + textW, py);
          }
        });
      } else {
        // 0 Players registered
        ctx.textAlign = 'center';
        ctx.fillStyle = '#c8ff00';
        ctx.font = '900 34px sans-serif';
        ctx.fillText(`📋 INSCRIPCIONES ABIERTAS (0 / ${activeConvocatoria.max_players || 21} CUPOS)`, width / 2, 850);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('¡Aún no hay jugadores registrados para este partido!', width / 2, 920);

        ctx.fillStyle = '#facc15';
        ctx.font = '900 24px sans-serif';
        ctx.fillText('⚡ Los equipos y alineaciones aparecerán aquí automáticamente ⚡', width / 2, 990);
      }

      // 8. Footer with Graffiti Splatters and Soccer Ball
      drawSoccerBall(ctx, 110, 1530, 85);
      drawSplatter(ctx, 230, 1550, '#84cc16', 14);
      drawSplatter(ctx, 310, 1565, '#d946ef', 18);
      drawSplatter(ctx, width - 260, 1555, '#06b6d4', 16);
      drawSplatter(ctx, width - 180, 1540, '#84cc16', 12);

      // Kicking player silhouette (bottom right)
      ctx.fillStyle = '#c8ff00';
      ctx.beginPath();
      // stylized player head
      ctx.arc(width - 90, 1490, 14, 0, Math.PI * 2);
      ctx.fill();
      // stylized torso & kicking leg
      ctx.beginPath();
      ctx.moveTo(width - 90, 1504);
      ctx.lineTo(width - 80, 1540);
      ctx.lineTo(width - 45, 1535); // kicking foot
      ctx.lineTo(width - 55, 1550);
      ctx.lineTo(width - 95, 1555);
      ctx.lineTo(width - 110, 1585); // standing foot
      ctx.lineTo(width - 120, 1575);
      ctx.closePath();
      ctx.fill();
      // mini ball
      ctx.beginPath();
      ctx.arc(width - 35, 1532, 8, 0, Math.PI * 2);
      ctx.fill();

      // Brand watermarks
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('pichangasdebarrio.com · Pichangas de Barrio FC © 2026', width / 2, 1595);

    } else {
      // -------------------------------------------------------------
      // OPTION B: CLASSIC PHOTO TEMPLATE BACKDROP
      // -------------------------------------------------------------
      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      templateImg.src = '/flyer-template.jpg';
      await new Promise<boolean>((resolve) => {
        templateImg.onload = () => resolve(true);
        templateImg.onerror = () => resolve(false);
      });
      ctx.drawImage(templateImg, 0, 0, width, height);

      // Modality Banner
      ctx.save();
      ctx.translate(width / 2, 335);
      ctx.rotate(-0.02);
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#05070a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-230, -38, 460, 76, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0a0a0a';
      ctx.font = '900 50px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(categoryText.toUpperCase(), 0, 0);
      ctx.restore();

      // Solid Match Details
      const { dayNameStr, formattedTime } = formatMatchDateTime(activeConvocatoria.match_date, activeConvocatoria.match_time);
      const venueName = (activeConvocatoria.location || 'JOHN ANDREWS').toUpperCase();

      ctx.fillStyle = '#040711';
      ctx.beginPath();
      ctx.roundRect(75, 380, width - 150, 148, 24);
      ctx.fill();

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

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px sans-serif';
      ctx.fillText(`📅 ${dayNameStr}   |   🕒 ${formattedTime}`, width / 2, 428);

      ctx.fillStyle = '#c8ff00';
      ctx.font = '900 44px sans-serif';
      ctx.fillText(`📍 ${venueName}`, width / 2, 484);

      // Solid Rosters Box
      ctx.fillStyle = '#04070d';
      ctx.fillRect(15, 1025, width - 30, 400);

      // Render 3 Columns
      const colWidth = 310;
      const col1X = 45;
      const col2X = 385;
      const col3X = 725;
      const pillY = 1045;
      const pillH = 48;

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(col1X, pillY, colWidth, pillH, 24);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('🏆 EQUIPO 1', col1X + colWidth / 2, pillY + 24);

      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.roundRect(col2X, pillY, colWidth, pillH, 24);
      ctx.fill();
      ctx.fillStyle = '#0a0a0a';
      ctx.fillText('🏆 EQUIPO 2', col2X + colWidth / 2, pillY + 24);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(col3X, pillY, colWidth, pillH, 24);
      ctx.fill();
      ctx.fillStyle = '#0a0a0a';
      ctx.fillText('🏆 EQUIPO 3', col3X + colWidth / 2, pillY + 24);

      const renderColumnPlayers = (players: Confirmacion[], colX: number, accentColor: string) => {
        const sorted = sortWithGkFirst(players);
        const maxRows = Math.max(7, sorted.length);
        const rowH = Math.min(42, 280 / maxRows);
        const startY = 1125;

        sorted.forEach((p, idx) => {
          const py = startY + idx * rowH;
          const isGk = p.match_role === 'portero';
          const rawName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
          let nameToShow = p.user?.nickname ? p.user.nickname : rawName.split(' ').slice(0, 2).join(' ');
          if (nameToShow.length > 14) nameToShow = nameToShow.slice(0, 13) + '.';

          ctx.fillStyle = accentColor;
          ctx.font = '900 23px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${idx + 1}.`, colX + 12, py);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText(nameToShow, colX + 46, py);

          if (isGk) {
            const textW = ctx.measureText(nameToShow).width;
            ctx.fillText('🧤', colX + 50 + textW, py);
          }
        });
      };

      renderColumnPlayers(team1, col1X, '#ef4444');
      renderColumnPlayers(team2, col2X, '#84cc16');
      renderColumnPlayers(team3, col3X, '#ffffff');
    }

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
      `📅 *Fecha:* ${activeConvocatoria.match_date}\n` +
      `⏰ *Hora:* ${activeConvocatoria.match_time?.slice(0, 5)} hrs\n` +
      `🏟️ *Sede:* ${activeConvocatoria.location}\n` +
      `👥 *Inscritos:* ${confirmados.length}/${activeConvocatoria.max_players} (${remaining > 0 ? `¡Quedan ${remaining} cupos!` : '¡Equipos Sorteados!'})\n\n` +
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
                  Generador de Flyer con IA
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase">
                  Gemini 3.5 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Adaptable a {numTeams} equipos con sede, arqueros 🧤 y jugadores</span>
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

        {/* Style Selector & Customization Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Style Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setFlyerStyle('ai_generative')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                flyerStyle === 'ai_generative'
                  ? 'bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wand2 size={13} /> Diseño IA Adaptable
            </button>
            <button
              type="button"
              onClick={() => setFlyerStyle('classic_template')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                flyerStyle === 'classic_template'
                  ? 'bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon size={13} /> Plantilla Clásica
            </button>
          </div>

          {/* Quick AI & Refresh Controls */}
          <div className="flex items-center justify-end gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => fetchGeminiData(geminiKey)}
              disabled={isGenerating}
              className="text-lime-400 hover:text-lime-300 font-black flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Personalizar afiche con Gemini IA"
            >
              <Sparkles size={14} className={isGenerating ? 'animate-spin' : ''} />
              <span>{isGenerating ? 'Gemini IA...' : 'Generar con IA'}</span>
            </button>
            <span className="text-slate-700">|</span>
            <button
              type="button"
              onClick={() => {
                refetch();
                renderPoster(aiHeadline, aiMatchTag);
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

        {/* Category Tape Bar */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
          <Tag size={14} className="text-yellow-400 shrink-0" />
          <span className="text-slate-400 font-bold shrink-0">Cinta de Categoría:</span>
          <input 
            type="text" 
            value={categoryText} 
            onChange={(e) => setCategoryText(e.target.value.toUpperCase())}
            placeholder="FUTSAL / FÚTBOL 7..."
            className="w-full bg-transparent text-white font-black uppercase outline-none"
          />
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
              💡 La clave activa verificada es: <span className="text-lime-400 font-mono">AQ.Ab8RN6...</span>
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
              <span>Generando afiche oficial con Inteligencia Artificial...</span>
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
