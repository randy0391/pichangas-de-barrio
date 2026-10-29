import React, { useEffect, useRef, useState } from 'react';
import { Convocatoria, Confirmacion } from '@/types';
import { X, Download, Copy, Share2, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      return;
    }

    renderFlyer();
  }, [isOpen, convocatoria]);

  const renderFlyer = async () => {
    setIsGenerating(true);
    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      const width = 1080;
      const height = 1920;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Dark athletic gradient background
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, '#030712'); // slate-950
      bg.addColorStop(0.3, '#064e3b'); // emerald-900
      bg.addColorStop(0.7, '#022c22'); // deep emerald
      bg.addColorStop(1, '#020617'); // slate-950
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Subtle diagonal decorative stripes
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.05)';
      ctx.lineWidth = 18;
      for (let i = -width; i < width * 2; i += 80) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height, height);
        ctx.stroke();
      }

      // Neon Top Border Accent
      const neonLine = ctx.createLinearGradient(0, 0, width, 0);
      neonLine.addColorStop(0, '#84cc16');
      neonLine.addColorStop(0.5, '#22c55e');
      neonLine.addColorStop(1, '#06b6d4');
      ctx.fillStyle = neonLine;
      ctx.fillRect(0, 0, width, 24);

      // 2. Club Header
      ctx.textAlign = 'center';
      ctx.fillStyle = '#a3e635'; // lime-400
      ctx.font = '900 38px sans-serif';
      ctx.fillText('⚽ PICHANGAS DE BARRIO FC ⚽', width / 2, 110);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 28px sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('CONVOCATORIA OFICIAL', width / 2, 160);

      // Outer Match Card Frame
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.35)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(60, 210, width - 120, 520, 36);
      ctx.fill();
      ctx.stroke();

      // Match Title
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 68px sans-serif';
      const title = convocatoria.title.toUpperCase();
      ctx.fillText(title.length > 24 ? title.slice(0, 24) + '...' : title, width / 2, 310);

      // Rival if any
      if (convocatoria.rival) {
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(`⚔️ VS ${convocatoria.rival.toUpperCase()}`, width / 2, 370);
      }

      // Date & Time Box
      ctx.fillStyle = '#84cc16';
      ctx.font = '900 48px sans-serif';
      const timeStr = convocatoria.match_time ? convocatoria.match_time.slice(0, 5) : '21:00';
      ctx.fillText(`📅 ${convocatoria.match_date}   ·   ⏰ ${timeStr} HRS`, width / 2, convocatoria.rival ? 450 : 410);

      // Venue / Location
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 36px sans-serif';
      const loc = convocatoria.location || 'Cancha Sintética Oficial';
      ctx.fillText(`🏟️ ${loc.length > 34 ? loc.slice(0, 34) + '...' : loc}`, width / 2, convocatoria.rival ? 520 : 480);

      // Cost & Capacity
      const cost = parseFloat(String(convocatoria.cost_per_player || '0'));
      const costText = cost > 0 ? `💰 S/ ${cost.toFixed(2)} por jugador` : '🎉 Inscripción Gratuita';
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText(`${costText}   ·   👥 Cupo: ${convocatoria.max_players} Jugadores`, width / 2, convocatoria.rival ? 590 : 550);

      // Spots remaining pill
      const confirmados = (convocatoria.confirmaciones || []).filter(c => c.status === 'confirmado');
      const remaining = Math.max(0, convocatoria.max_players - confirmados.length);
      const isFull = remaining === 0;

      ctx.fillStyle = isFull ? '#ef4444' : '#84cc16';
      ctx.beginPath();
      ctx.roundRect(width / 2 - 280, convocatoria.rival ? 640 : 600, 560, 64, 32);
      ctx.fill();

      ctx.fillStyle = isFull ? '#ffffff' : '#020617';
      ctx.font = '900 30px sans-serif';
      ctx.fillText(
        isFull ? '🔥 ¡CUPO COMPLETO! (LISTA CERRADA)' : `⚡ ¡SOLO QUEDAN ${remaining} CUPOS DISPONIBLES!`,
        width / 2,
        convocatoria.rival ? 682 : 642
      );

      // 3. Confirmed Players Roster Section
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 40px sans-serif';
      ctx.fillText(`📋 LISTA DE CONVOCADOS (${confirmados.length} / ${convocatoria.max_players})`, width / 2, 800);

      // Roster Container
      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(60, 840, width - 120, 890, 32);
      ctx.fill();
      ctx.stroke();

      // Render players (2 columns, up to 16 players)
      const sorted = [...confirmados].sort((a, b) => (a.match_role === 'portero' ? -1 : 1));
      const colWidth = (width - 160) / 2;
      const startY = 910;
      const rowGap = 95;

      sorted.slice(0, 16).forEach((p, idx) => {
        const isCol2 = idx >= 8;
        const colX = isCol2 ? width / 2 + 20 : 90;
        const rowY = startY + (idx % 8) * rowGap;
        const isGk = p.match_role === 'portero';
        const pName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
        const nickname = p.user?.nickname ? ` "${p.user.nickname}"` : '';

        // Player item badge background
        ctx.fillStyle = isGk ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.8)';
        ctx.strokeStyle = isGk ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(colX, rowY - 45, colWidth - 20, 75, 18);
        ctx.fill();
        ctx.stroke();

        // Icon & Number
        ctx.fillStyle = isGk ? '#f59e0b' : '#a3e635';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(isGk ? '🧤' : '⚽', colX + 16, rowY + 5);

        // Player text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        const fullText = `${idx + 1}. ${pName}${nickname}`;
        ctx.fillText(fullText.length > 20 ? fullText.slice(0, 20) + '..' : fullText, colX + 68, rowY + 5);

        // Role tag
        if (p.user?.jersey_number) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 22px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`#${p.user.jersey_number}`, colX + colWidth - 40, rowY + 5);
        }
      });

      // If less than max players, show placeholder spots
      if (confirmados.length < convocatoria.max_players) {
        const nextIdx = confirmados.length;
        if (nextIdx < 16) {
          const isCol2 = nextIdx >= 8;
          const colX = isCol2 ? width / 2 + 20 : 90;
          const rowY = startY + (nextIdx % 8) * rowGap;

          ctx.fillStyle = 'rgba(163, 230, 53, 0.15)';
          ctx.strokeStyle = '#84cc16';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.roundRect(colX, rowY - 45, colWidth - 20, 75, 18);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#a3e635';
          ctx.font = '900 26px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`✨ ${nextIdx + 1}. ¡ESTE CUPO PUEDE SER TUYO!`, colX + 24, rowY + 5);
        }
      }

      // 4. Footer CTA
      ctx.textAlign = 'center';
      ctx.fillStyle = '#84cc16';
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
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el flyer');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `Flyer-Convocatoria-${convocatoria.match_date}.png`;
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
      toast.success('¡Imagen copiada al portapapeles! Ya puedes pegarla en WhatsApp Web (Ctrl+V)');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo copiar directamente. Usa el botón "Descargar Flyer".');
    }
  };

  const handleShareWhatsApp = () => {
    const confirmados = (convocatoria.confirmaciones || []).filter(c => c.status === 'confirmado');
    const remaining = Math.max(0, convocatoria.max_players - confirmados.length);
    const cost = parseFloat(String(convocatoria.cost_per_player || '0'));
    const costText = cost > 0 ? `S/ ${cost.toFixed(2)}` : 'Gratis';

    const text = `⚽ *CONVOCATORIA OFICIAL - PICHANGAS DE BARRIO FC* ⚽\n\n` +
      `🔥 *${convocatoria.title.toUpperCase()}*\n` +
      `📅 *Fecha:* ${convocatoria.match_date}\n` +
      `⏰ *Hora:* ${convocatoria.match_time.slice(0, 5)} hrs\n` +
      `🏟️ *Lugar:* ${convocatoria.location}\n` +
      `💰 *Costo:* ${costText}\n` +
      `👥 *Inscritos:* ${confirmados.length} / ${convocatoria.max_players} (${remaining > 0 ? `¡Quedan ${remaining} cupos!` : '¡Lleno!'})\n\n` +
      `📲 *Inscríbete ahora:* ${window.location.origin}/convocatorias/${convocatoria.id}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-lime-400/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-black text-lg text-white uppercase tracking-tight">
                Generador de Flyer para WhatsApp
              </h3>
              <p className="text-xs text-slate-400">
                Comparte en tus historias y grupos con diseño profesional 9:16
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

        {/* Flyer Preview Box */}
        <div className="relative w-full max-h-[55vh] flex justify-center items-center bg-slate-950 rounded-2xl p-3 border border-slate-800 overflow-hidden">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Flyer Preview"
              className="max-h-[50vh] w-auto rounded-xl shadow-2xl object-contain border border-slate-700"
            />
          ) : (
            <div className="py-20 text-center text-slate-400 text-sm">
              Generando flyer en alta resolución...
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={!previewUrl}
            className="h-12 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-lime-400/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download size={16} /> Descargar Flyer (HD)
          </button>

          {/* Copy Image */}
          <button
            type="button"
            onClick={handleCopyImage}
            disabled={!previewUrl}
            className="h-12 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-400/30 hover:border-cyan-400 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            {copied ? '¡Copiado!' : 'Copiar Imagen'}
          </button>

          {/* Share WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Share2 size={16} /> Enviar a WhatsApp
          </button>
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          💡 <strong>Tip pro:</strong> Puedes copiar la imagen y pegarla directo en WhatsApp Web con <code className="bg-slate-800 px-1 py-0.5 rounded text-white font-mono">Ctrl + V</code>.
        </p>

      </div>
    </div>
  );
};
