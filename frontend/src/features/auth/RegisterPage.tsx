import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { FootballSpinner } from '@/components/ui/FootballSpinner';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (!paymentReceipt) {
      toast.error('Debes subir el comprobante de pago');
      return;
    }
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('email', email);
      fd.append('dni', dni);
      fd.append('phone', phone);
      fd.append('password', password);
      fd.append('password_confirmation', passwordConfirmation);
      fd.append('payment_receipt', paymentReceipt);

      await register(fd);
      
      toast.success('¡Registro exitoso! Tu cuenta está pendiente de aprobación.');
      navigate('/login');
    } catch (error: any) {
      toast.error('Error al registrarse. Verifica los datos.');
      setIsSubmitting(false);
    }
  };

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
        {/* Right Side: Visual (Reversed for Register) */}
        <div className="w-full md:w-1/2 bg-gradient-to-bl from-slate-900 via-[#0a1128] to-black p-12 flex-col justify-between relative overflow-hidden hidden md:flex">
            {/* Tactical pitch pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            <div className="relative z-10 text-right">
                <img src="/logo.jpg" alt="Pichangas FC" className="w-20 h-20 rounded-full border-2 border-accent shadow-[0_0_20px_rgba(255,0,127,0.4)] ml-auto" />
            </div>

            <div className="relative z-10 mt-12 text-right">
                <h1 className="text-5xl font-black text-white mb-4 leading-tight tracking-tight">
                    COMIENZA<br/><span className="text-transparent bg-clip-text bg-gradient-to-l from-accent to-lime-400">TU LEGADO</span>
                </h1>
                <p className="text-slate-300 text-lg leading-relaxed ml-auto max-w-sm">Únete a nuestra comunidad. Demuestra tu talento, participa en los torneos y conviértete en la figura del equipo.</p>
            </div>
            
            {/* Decorative glows */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-accent/30 blur-[80px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-lime-400/20 blur-[80px] rounded-full"></div>
        </div>

        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white dark:bg-slate-950 flex flex-col justify-center relative">
            <div className="absolute top-0 left-0 p-8 md:hidden">
                 <img src="/logo.jpg" alt="Logo" className="w-12 h-12 rounded-full border-2 border-accent" />
            </div>

            <div className="max-w-md w-full mx-auto space-y-6">
                <div className="text-center md:text-left mt-8 md:mt-0">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Ficha por el Club</h2>
                    <p className="text-slate-500 mt-2">Crea tu cuenta de jugador ahora</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nombre Completo</label>
                        <Input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Tu nombre en la camiseta"
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email</label>
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">DNI</label>
                            <Input
                                type="text"
                                required
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                placeholder="Tu DNI"
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Celular</label>
                            <Input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Tu celular"
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Contraseña</label>
                            <Input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Confirmar</label>
                            <Input
                                type="password"
                                required
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                placeholder="••••••••"
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2 mt-4 p-4 border border-accent/20 bg-accent/5 rounded-xl">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">📄 Comprobante de Pago (Inscripción)</label>
                        <p className="text-xs text-slate-500 mb-2">Para completar tu registro debes subir una foto o PDF de tu pago de colaboración.</p>
                        <Input
                            type="file"
                            required
                            accept="image/*,.pdf"
                            onChange={(e) => setPaymentReceipt(e.target.files?.[0] || null)}
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-accent file:text-white hover:file:bg-accent/80"
                        />
                    </div>
                    
                    <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-lg font-bold bg-gradient-to-r from-accent to-lime-500 text-slate-900 hover:opacity-90 shadow-[0_0_20px_rgba(255,0,127,0.3)] transition-all rounded-xl mt-6 border-0">
                        {isSubmitting ? 'Registrando...' : 'Firmar Contrato'}
                    </Button>
                </form>

                <div className="text-center text-sm font-medium text-slate-500 pt-2">
                    ¿Ya eres parte del plantel? <Link to="/login" className="text-accent hover:text-lime-500 transition-colors font-bold text-base">Inicia Sesión</Link>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
