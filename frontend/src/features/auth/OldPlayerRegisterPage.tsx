import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { FootballSpinner } from '@/components/ui/FootballSpinner';

export const OldPlayerRegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  // Validate temporary period (Ends Sept 23, 2026 11:59:59 PM Lima Time)
  const isTemporaryPeriod = new Date() < new Date('2026-09-24T00:00:00-05:00');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTemporaryPeriod) {
      toast.error('El periodo de registro rápido ha expirado.');
      return;
    }
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('email', email);
      fd.append('dni', dni);
      fd.append('phone', phone);
      fd.append('birth_date', birthDate);
      // No payment_receipt is added because they are old players

      await register(fd);
      
      toast.success('¡Registro exitoso! Tu cuenta está pendiente de aprobación.');
      navigate('/login');
    } catch (error: any) {
      if (error.response?.data?.errors?.dni || error.response?.data?.errors?.phone) {
         toast.error('Este DNI o celular ya están registrados.');
      } else {
         toast.error('Error al registrarse. Verifica los datos.');
      }
      setIsSubmitting(false);
    }
  };

  if (!isTemporaryPeriod) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-800 p-8 rounded-xl max-w-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Enlace Expirado</h2>
            <p>El periodo de registro rápido para jugadores antiguos ha terminado.</p>
            <Link to="/register" className="mt-6 inline-block bg-accent text-white px-6 py-2 rounded-lg font-bold">Ir al Registro Normal</Link>
        </div>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <FootballSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl bg-card/90 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row-reverse border border-white/10"
      >
        {/* Right Side: Visual */}
        <div className="w-full md:w-1/2 bg-gradient-to-bl from-yellow-600 via-orange-500 to-red-600 p-12 flex-col justify-between relative overflow-hidden hidden md:flex">
            {/* Tactical pitch pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            <div className="relative z-10 text-right">
                <img src="/logo.jpg" alt="Pichangas FC" className="w-20 h-20 rounded-full border-2 border-white shadow-xl ml-auto" />
            </div>

            <div className="relative z-10 mt-12 text-right">
                <h1 className="text-5xl font-black text-white mb-4 leading-tight tracking-tight">
                    BIENVENIDO<br/>DE VUELTA
                </h1>
                <p className="text-yellow-100 text-lg leading-relaxed ml-auto max-w-sm">Registro rápido exclusivo para jugadores antiguos. Válido solo por hoy.</p>
            </div>
        </div>

        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white dark:bg-slate-950 flex flex-col justify-center relative">
            <div className="max-w-md w-full mx-auto space-y-6">
                <div className="text-center md:text-left mt-8 md:mt-0">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Jugador Antiguo</h2>
                    <p className="text-yellow-600 font-bold mt-2">Vía rápida de registro (Sin comprobante)</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nombre Completo</label>
                        <Input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre en la camiseta" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email</label>
                        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">DNI</label>
                            <Input type="text" required value={dni} onChange={(e) => setDni(e.target.value)} placeholder="Tu DNI" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Celular</label>
                            <Input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Tu celular" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Fecha de Nacimiento</label>
                        <Input
                            type="date"
                            required
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent"
                        />
                    </div>
                    
                    <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:opacity-90 shadow-lg transition-all rounded-xl mt-6 border-0">
                        {isSubmitting ? 'Registrando...' : 'Confirmar Retorno'}
                    </Button>
                </form>

                <div className="text-center text-sm font-medium text-slate-500 pt-2">
                    ¿Eres nuevo? <Link to="/register" className="text-accent hover:text-lime-500 transition-colors font-bold text-base">Ir al registro normal</Link>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
