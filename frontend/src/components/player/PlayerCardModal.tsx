import React from 'react';
import { User, Confirmacion } from '@/types';
import { FutPlayerCard } from '@/components/player/FutPlayerCard';
import { X } from 'lucide-react';

interface PlayerCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: (Partial<User> | Confirmacion) | null;
}

export const PlayerCardModal: React.FC<PlayerCardModalProps> = ({
  isOpen,
  onClose,
  player
}) => {
  if (!isOpen || !player) return null;

  // Normalize if passed a Confirmacion object
  const userData: Partial<User> = (player as Confirmacion).user
    ? {
        ...(player as Confirmacion).user,
        position: (player as Confirmacion).user?.position || ((player as Confirmacion).match_role === 'portero' ? 'portero' : 'medio')
      }
    : (player as Partial<User>);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl overflow-y-auto p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-200">
      
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 my-auto flex flex-col items-center max-w-sm w-full py-2 pb-24 sm:pb-4">
        
        {/* Top Control Bar with Close Button */}
        <div className="w-full flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              Carta Digital Oficial EA FC • PBFC
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shadow-lg cursor-pointer"
            title="Cerrar ventana"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3D FUT Card */}
        <div className="w-full flex justify-center py-1">
          <FutPlayerCard user={userData} size="md" showDownload={true} />
        </div>

      </div>
    </div>
  );
};
