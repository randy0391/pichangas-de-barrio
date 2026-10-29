import React, { useEffect, useRef, useState } from 'react';
import { Convocatoria, Confirmacion } from '@/types';
import { X, Download, Copy, Share2, Sparkles, Check, Key, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
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

  // Gemini API Key management
  const DEFAULT_KEY = 'AIzaSyDAR9JEpDaeu2RlYun_u7HWDKawPaD0w2w';
  const [geminiKey, setGeminiKey] = useState<string>(() => {
    return localStorage.getItem('pb_gemini_api_key') || DEFAULT_KEY;
  });
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [aiHeadline, setAiHeadline] = useState<string>('¡DUELO DE TITANES EN LA CANCHA!');
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  // Strictly only accessible for Admin
  if (!isOpen || user?.role !== 'admin') return null;

  useEffect(() => {
    if (isOpen) {
      generateWithGeminiAndRender();
    }
  }, [isOpen, convocatoria]);

  // Request AI Hype Headline from Gemini API
  const fetchGeminiHype = async (keyToUse: string): Promise<string> => {
    try {
      setAiStatus('Consultando a Gemini AI...');
      const prompt = `Actua como narrador oficial de Pichangas de Barrio FC. Genera UN SOLO eslogan epico, corto y motivador (maximo 8 palabras en MAYUSCULAS, sin comillas) para el partido: "${convocatoria.title}". Responde unicamente con el texto del eslogan.`;

      // Try gemini-1.5-flash or gemini-2.0-flash
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keyToUse}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data?.error?.message?.includes('leaked')) {
          setAiStatus('Clave de Gemini reportada como revocada por Google. Se utilizó diseño oficial.');
        } else {
          setAiStatus(data?.error?.message || 'Error en Gemini API');
        }
        return '¡DUELO DE TITANES EN LA CANCHA!';
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.replace(/["\n]/g, '');
      if (text) {
        setAiStatus('¡Eslogan generado por Gemini AI!');
        return text.toUpperCase();
      }
      return '¡DUELO DE TITANES EN LA CANCHA!';
    } catch (err: any) {
      setAiStatus('No se pudo conectar a Gemini. Usando diseño oficial.');
      return '¡DUELO DE TITANES EN LA CANCHA!';
    }
  };

  const generateWithGeminiAndRender = async () => {
    setIsGenerating(true);
    let headline = aiHeadline;
    if (geminiKey) {
      headline = await fetchGeminiHype(geminiKey);
      setAiHeadline(headline);
    }
    await drawFlyerCanvas(headline);
    setIsGenerating(false);
  };

  const drawFlyerCanvas = async (headline: string) => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Dark Athletic Gradient Background
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#020617'); // slate-950
    bg.addColorStop(0.2, '#064e3b'); // emerald-900
    bg.addColorStop(0.65, '#022c22'); // deep synthetic green
    bg.addColorStop(1, '#020617'); // slate-950
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Diagonal texture stripes
    ctx.strokeStyle = 'rgba(163, 230, 53, 0.04)';
    ctx.lineWidth = 20;
    for (let i = -width; i < width * 2; i += 75) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }

    // Top Neon Athletic Bar
    const neonLine = ctx.createLinearGradient(0, 0, width, 0);
    neonLine.addColorStop(0, '#84cc16');
    neonLine.addColorStop(0.5, '#22c55e');
    neonLine.addColorStop(1, '#06b6d4');
    ctx.fillStyle = neonLine;
    ctx.fillRect(0, 0, width, 24);

    // 2. Official Club Logo and Title
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = '/logo.jpg';
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
      });

      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, 120, 56, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, width / 2 - 56, 64, 112, 112);
      ctx.restore();

      ctx.strokeStyle = '#a3e635';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(width / 2, 120, 56, 0, Math.PI * 2);
      ctx.stroke();
    } catch {
      // Fallback emoji
      ctx.font = '80px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚽', width / 2, 140);
    }

    // Club Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a3e635';
    ctx.font = '900 36px sans-serif';
    ctx.fillText('PICHANGAS DE BARRIO FC', width / 2, 220);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('⚡ ALINEACIÓN OFICIAL · EQUIPOS SORTEADOS ⚡', width / 2, 255);

    // 3. Match Card Frame
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(163, 230, 53, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(60, 280, width - 120, 320, 32);
    ctx.fill();
    ctx.stroke();

    // AI Headline Tagline
    ctx.fillStyle = '#fde047';
    ctx.font = '900 30px sans-serif';
    ctx.fillText(headline.length > 36 ? headline.slice(0, 36) + '...' : headline, width / 2, 340);

    // Match Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 58px sans-serif';
    const title = convocatoria.title.toUpperCase();
    ctx.fillText(title.length > 26 ? title.slice(0, 26) + '...' : title, width / 2, 410);

    // Date, Time & Venue
    ctx.fillStyle = '#a3e635';
    ctx.font = '900 40px sans-serif';
    const timeStr = convocatoria.match_time ? convocatoria.match_time.slice(0, 5) : '21:00';
    ctx.fillText(`📅 ${convocatoria.match_date}   ·   ⏰ ${timeStr} HRS`, width / 2, 475);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 30px sans-serif';
    const loc = convocatoria.location || 'Cancha Sintética Oficial';
    ctx.fillText(`🏟️ ${loc.length > 36 ? loc.slice(0, 36) + '...' : loc}`, width / 2, 530);

    const cost = parseFloat(String(convocatoria.cost_per_player || '0'));
    const costText = cost > 0 ? `💰 S/ ${cost.toFixed(2)}` : 'Inscripción Gratuita';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`${costText}  ·  Modalidad: ${convocatoria.num_teams || 2} Equipos`, width / 2, 570);

    // 4. Sorted Teams Section
    const confirmados = (convocatoria.confirmaciones || []).filter(c => c.status === 'confirmado');
    const team1 = confirmados.filter(c => c.team_number === 1);
    const team2 = confirmados.filter(c => c.team_number === 2);
    const team3 = confirmados.filter(c => c.team_number === 3);

    const hasTeams = team1.length > 0 && team2.length > 0;

    if (hasTeams) {
      // 2 Column Layout for Team 1 and Team 2
      const teamBoxWidth = 460;
      const teamBoxHeight = 840;
      const teamBoxY = 630;

      // Team 1 Box (Left)
      ctx.fillStyle = 'rgba(6, 78, 59, 0.5)';
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(60, teamBoxY, teamBoxWidth, teamBoxHeight, 28);
      ctx.fill();
      ctx.stroke();

      // Team 1 Header
      ctx.fillStyle = '#22d3ee';
      ctx.font = '900 36px sans-serif';
      ctx.fillText('⚪ EQUIPO 1', 60 + teamBoxWidth / 2, teamBoxY + 55);

      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`${team1.length} Jugadores Convocados`, 60 + teamBoxWidth / 2, teamBoxY + 90);

      // Team 1 Players List
      ctx.textAlign = 'left';
      team1.forEach((p, idx) => {
        const py = teamBoxY + 140 + idx * 80;
        const isGk = p.match_role === 'portero';
        const pName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
        const nick = p.user?.nickname ? ` "${p.user.nickname}"` : '';

        ctx.fillStyle = isGk ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.6)';
        ctx.strokeStyle = isGk ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(80, py - 35, teamBoxWidth - 40, 62, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isGk ? '#f59e0b' : '#38bdf8';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(isGk ? '🧤' : '⚽', 95, py + 8);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        const nameStr = `${idx + 1}. ${pName}${nick}`;
        ctx.fillText(nameStr.length > 20 ? nameStr.slice(0, 20) + '..' : nameStr, 135, py + 8);

        if (p.user?.jersey_number) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 18px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`#${p.user.jersey_number}`, 60 + teamBoxWidth - 35, py + 8);
          ctx.textAlign = 'left';
        }
      });

      // Team 2 Box (Right)
      ctx.fillStyle = 'rgba(6, 78, 59, 0.5)';
      ctx.strokeStyle = '#a3e635';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(width - 60 - teamBoxWidth, teamBoxY, teamBoxWidth, teamBoxHeight, 28);
      ctx.fill();
      ctx.stroke();

      // Team 2 Header
      ctx.textAlign = 'center';
      ctx.fillStyle = '#a3e635';
      ctx.font = '900 36px sans-serif';
      ctx.fillText('🟢 EQUIPO 2', width - 60 - teamBoxWidth / 2, teamBoxY + 55);

      ctx.fillStyle = '#ecfccb';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`${team2.length} Jugadores Convocados`, width - 60 - teamBoxWidth / 2, teamBoxY + 90);

      // Team 2 Players List
      ctx.textAlign = 'left';
      team2.forEach((p, idx) => {
        const py = teamBoxY + 140 + idx * 80;
        const isGk = p.match_role === 'portero';
        const pName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
        const nick = p.user?.nickname ? ` "${p.user.nickname}"` : '';

        ctx.fillStyle = isGk ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.6)';
        ctx.strokeStyle = isGk ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(width - teamBoxWidth - 40, py - 35, teamBoxWidth - 40, 62, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isGk ? '#f59e0b' : '#a3e635';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(isGk ? '🧤' : '⚽', width - teamBoxWidth - 25, py + 8);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        const nameStr = `${idx + 1}. ${pName}${nick}`;
        ctx.fillText(nameStr.length > 20 ? nameStr.slice(0, 20) + '..' : nameStr, width - teamBoxWidth + 15, py + 8);

        if (p.user?.jersey_number) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 18px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`#${p.user.jersey_number}`, width - 75, py + 8);
          ctx.textAlign = 'left';
        }
      });

      // Triangular Resting Box if Team 3 exists
      if (team3.length > 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(60, 1500, width - 120, 190, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = '900 28px sans-serif';
        ctx.fillText('⏸️ DESCANSA PRIMER TURNO: EQUIPO 3 (ESPERA AL GANADOR)', width / 2, 1545);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        const p3Names = team3.map(p => (p.user?.nickname || (p.user?.name || 'J').split(' ')[0])).join(' · ');
        ctx.fillText(p3Names.length > 60 ? p3Names.slice(0, 60) + '...' : p3Names, width / 2, 1600);
      }
    } else {
      // General Roster when not sorted yet
      ctx.textAlign = 'center';
      ctx.fillStyle = '#a3e635';
      ctx.font = '900 36px sans-serif';
      ctx.fillText(`📋 CONVOCADOS CONFIRMADOS (${confirmados.length} / ${convocatoria.max_players})`, width / 2, 690);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(60, 730, width - 120, 960, 28);
      ctx.fill();
      ctx.stroke();

      const startY = 800;
      ctx.textAlign = 'left';
      confirmados.slice(0, 14).forEach((p, idx) => {
        const isCol2 = idx >= 7;
        const colX = isCol2 ? width / 2 + 20 : 90;
        const colWidth = (width - 160) / 2;
        const rowY = startY + (idx % 7) * 115;
        const isGk = p.match_role === 'portero';
        const pName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';

        ctx.fillStyle = isGk ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.8)';
        ctx.beginPath();
        ctx.roundRect(colX, rowY - 40, colWidth - 20, 80, 16);
        ctx.fill();

        ctx.fillStyle = isGk ? '#f59e0b' : '#a3e635';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(isGk ? '🧤' : '⚽', colX + 16, rowY + 10);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`${idx + 1}. ${pName}`, colX + 65, rowY + 10);
      });
    }

    // 5. Official Footer Banner
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a3e635';
    ctx.font = '900 32px sans-serif';
    ctx.fillText('📲 ASEGURA TU CUPO EN LA WEB OFICIAL:', width / 2, 1785);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('pichangasdebarrio.com', width / 2, 1835);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Pichangas de Barrio FC © 2026 · Todos los derechos reservados', width / 2, 1880);

    const url = canvas.toDataURL('image/png');
    setPreviewUrl(url);
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `Flyer-PBFC-${convocatoria.match_date}.png`;
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
      toast.error('No se pudo copiar automáticamente. Usa el botón "Descargar Flyer".');
    }
  };

  const handleShareWhatsApp = () => {
    const confirmados = (convocatoria.confirmaciones || []).filter(c => c.status === 'confirmado');
    const remaining = Math.max(0, convocatoria.max_players - confirmados.length);

    const text = `⚽ *CONVOCATORIA OFICIAL - PICHANGAS DE BARRIO FC* ⚽\n\n` +
      `🔥 *${convocatoria.title.toUpperCase()}*\n` +
      `📅 *Fecha:* ${convocatoria.match_date}\n` +
      `⏰ *Hora:* ${convocatoria.match_time?.slice(0, 5)} hrs\n` +
      `🏟️ *Sede:* ${convocatoria.location}\n` +
      `👥 *Inscritos:* ${confirmados.length}/${convocatoria.max_players} (${remaining > 0 ? `¡Quedan ${remaining} cupos!` : '¡Equipos Sorteados!'})\n\n` +
      `📲 *Ver convocatoria:* ${window.location.origin}/convocatorias/${convocatoria.id}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSaveKey = () => {
    localStorage.setItem('pb_gemini_api_key', geminiKey.trim());
    toast.success('Clave de Gemini guardada.');
    setShowKeyConfig(false);
    generateWithGeminiAndRender();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-5 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-lime-400/20">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white uppercase tracking-tight">
                  Generador de Flyer para WhatsApp
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase">
                  Solo Administrador
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Póster con logo oficial, equipos sorteados y titular épico con Gemini AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Gemini API Status Banner */}
        <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles size={14} className="text-lime-400 shrink-0" />
            <span className="text-slate-300 font-medium">
              {aiStatus || 'Gemini AI activo para generar el eslogan del partido.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={generateWithGeminiAndRender}
              disabled={isGenerating}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-lime-400 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              title="Regenerar con IA"
            >
              <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} /> Regenerar
            </button>
            <button
              type="button"
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Key size={12} /> Configurar API Key
            </button>
          </div>
        </div>

        {/* Optional Gemini Key Input */}
        {showKeyConfig && (
          <div className="p-4 bg-slate-950/90 rounded-2xl border border-indigo-500/30 space-y-2 animate-in fade-in duration-150">
            <label className="text-xs font-bold text-slate-300 block">
              Clave de API de Google Gemini (Google AI Studio):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
              >
                Guardar
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              💡 Si Google reporta una clave como filtrada o revoca el acceso, puedes generar una clave gratuita en <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-lime-400 underline">aistudio.google.com</a>.
            </p>
          </div>
        )}

        {/* Flyer Preview Box */}
        <div className="relative w-full max-h-[50vh] flex justify-center items-center bg-slate-950 rounded-2xl p-3 border border-slate-800 overflow-hidden">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Flyer Preview"
              className="max-h-[46vh] w-auto rounded-xl shadow-2xl object-contain border border-slate-700"
            />
          ) : (
            <div className="py-20 text-center text-slate-400 text-sm">
              Generando flyer en alta resolución con equipos y logo...
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!previewUrl}
            className="h-12 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-lime-400/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Download size={16} /> Descargar Flyer (HD)
          </button>

          <button
            type="button"
            onClick={handleCopyImage}
            disabled={!previewUrl}
            className="h-12 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-400/30 hover:border-cyan-400 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            {copied ? '¡Copiado!' : 'Copiar Imagen'}
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Share2 size={16} /> Enviar a WhatsApp
          </button>
        </div>

      </div>
    </div>
  );
};
