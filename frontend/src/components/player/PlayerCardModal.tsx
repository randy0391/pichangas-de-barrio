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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative flex flex-col items-center">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 sm:-right-8 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* 3D FUT Card */}
        <FutPlayerCard user={userData} size="lg" showDownload={true} />
      </div>
    </div>
  );
};
