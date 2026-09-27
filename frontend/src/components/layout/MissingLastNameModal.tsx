import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { X } from 'lucide-react';
import api from '@/lib/axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const MissingLastNameModal = () => {
  const { user, fetchUser } = useAuthStore();
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Solamente mostrar si el usuario está logueado y NO tiene apellido_paterno
  if (!user || user.apellido_paterno) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apellidoPaterno.trim() || !apellidoMaterno.trim()) {
      toast.error('Ambos apellidos son requeridos');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.put('/user', { nombres: user.nombres, apellido_paterno: apellidoPaterno, apellido_materno: apellidoMaterno });
      await fetchUser();
      toast.success('Apellidos guardados correctamente. ¡Gracias!');
    } catch (error) {
      toast.error('Error al guardar los apellidos');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-red-500/50 rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Acción Requerida!</h2>
          <p className="text-slate-400">
            Hola <strong className="text-white">{user.nombres}</strong>, hemos actualizado nuestro sistema y ahora es <strong className="text-red-400">obligatorio</strong> registrar tus apellidos para continuar usando la plataforma.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Apellido Paterno <span className="text-red-500">*</span>
            </label>
            <Input
              required
              value={apellidoPaterno}
              onChange={(e) => setApellidoPaterno(e.target.value)}
              placeholder="Ej. García"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Apellido Materno <span className="text-red-500">*</span>
            </label>
            <Input
              required
              value={apellidoMaterno}
              onChange={(e) => setApellidoMaterno(e.target.value)}
              placeholder="Ej. Pérez"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3 mt-4"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Apellidos y Continuar'}
          </Button>
        </form>
      </div>
    </div>
  );
};






