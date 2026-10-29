import React, { useState } from 'react';
import { Convocatoria, Confirmacion } from '@/types';
import { X, Shuffle, RotateCcw, Check, Sparkles, Trophy } from 'lucide-react';
import { useSortearEquipos, useResetEquipos } from '@/hooks/useConvocatorias';
import { toast } from 'sonner';

interface TeamShuffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  convocatoria: Convocatoria;
}

export const TeamShuffleModal: React.FC<TeamShuffleModalProps> = ({
  isOpen,
  onClose,
  convocatoria
}) => {
  const { mutate: sortear, isPending: isSorting } = useSortearEquipos();
  const { mutate: resetTeams, isPending: isResetting } = useResetEquipos();
  const [isShufflingAnimation, setIsShufflingAnimation] = useState(false);

  if (!isOpen) return null;

  const confirmados = (convocatoria.confirmaciones || []).filter(c => c.status === 'confirmado');
  const porteros = confirmados.filter(c => c.match_role === 'portero');
  const jugadores = confirmados.filter(c => c.match_role !== 'portero');

  const handleExecuteSortear = () => {
    if (confirmados.length < 2) {
      toast.error('Se necesitan al menos 2 jugadores confirmados para sortear.');
      return;
    }

    setIsShufflingAnimation(true);
    setTimeout(() => {
      sortear(convocatoria.id, {
        onSuccess: () => {
          setIsShufflingAnimation(false);
          toast.success('¡Equipos sorteados y alineados exitosamente!');
          onClose();
        },
        onError: (err: any) => {
          setIsShufflingAnimation(false);
          toast.error(err?.response?.data?.message || 'Error al sortear equipos');
        }
      });
    }, 1200);
  };

  const handleReset = () => {
    toast('¿Deseas reiniciar los equipos a su estado original sin asignar?', {
      action: {
        label: 'Reiniciar',
        onClick: () => {
          resetTeams(convocatoria.id, {
            onSuccess: () => {
              toast.success('Equipos reiniciados correctamente.');
              onClose();
            },
            onError: () => toast.error('Error al reiniciar equipos.')
          });
        }
      },
      cancel: { label: 'Cancelar', onClick: () => {} }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-lime-400/20">
              <Shuffle size={20} />
            </div>
            <div>
              <h3 className="font-black text-lg text-white uppercase tracking-tight">
                Sorteo Inteligente de Equipos
              </h3>
              <p className="text-xs text-slate-400">
                Balancea porteros y jugadores equitativamente
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

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total</span>
            <span className="font-black text-xl text-white font-mono">{confirmados.length}</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-amber-400 block">🧤 Porteros</span>
            <span className="font-black text-xl text-amber-400 font-mono">{porteros.length}</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-lime-400 block">⚽ Jugadores</span>
            <span className="font-black text-xl text-lime-400 font-mono">{jugadores.length}</span>
          </div>
        </div>

        {/* Animation or Explanation */}
        {isShufflingAnimation ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-lime-400 text-slate-950 flex items-center justify-center text-3xl animate-bounce shadow-xl shadow-lime-400/30">
              🎲
            </div>
            <p className="text-base font-black text-white uppercase tracking-wider animate-pulse">
              ¡Mezclando alineaciones y sorteando equipos...!
            </p>
            <p className="text-xs text-slate-400">
              Garantizando 1 arquero por escuadra y paridad física.
            </p>
          </div>
        ) : (
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-2.5">
            <p className="text-xs text-slate-300">
              El sistema distribuirá a los <strong>{confirmados.length} jugadores confirmados</strong> en {convocatoria.num_teams || 2} equipos equilibrados (Equipo Blanco vs Equipo Verde).
            </p>
            <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
              <li>Asigna 1 portero oficial a cada equipo.</li>
              <li>Distribuye aleatoriamente a los jugadores de campo.</li>
              <li>Puedes volver a sortear o mover jugadores manualmente en la cancha.</li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleExecuteSortear}
            disabled={isShufflingAnimation || isSorting || confirmados.length < 2}
            className="w-full h-12 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-lime-400/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Shuffle size={16} />
            {convocatoria.has_teams ? 'Volver a Sortear Equipos 🎲' : 'Iniciar Sorteo Oficial 🎲'}
          </button>

          {convocatoria.has_teams && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting}
              className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <RotateCcw size={14} /> Deshacer Equipos (Dejar sin asignar)
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
