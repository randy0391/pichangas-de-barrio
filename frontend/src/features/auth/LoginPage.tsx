import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
export const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login({ phone, password });
      toast.success('¡Bienvenido!');
      const user = useAuthStore.getState().user;
      if (user?.role === 'admin') {
          navigate('/admin');
      } else {
          navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Credenciales inválidas');
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
        className="w-full max-w-5xl bg-card/90 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/10"
      >
        {/* Left Side: Visual */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-slate-900 via-[#0a1128] to-black p-12 flex-col justify-between relative overflow-hidden hidden md:flex">
            {/* Tactical pitch pattern */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
            
            <div className="relative z-10">
                <img src="/logo.jpg" alt="Pichangas FC" className="w-20 h-20 rounded-full border-2 border-primary shadow-[0_0_20px_rgba(0,210,255,0.4)]" />
            </div>

            <div className="relative z-10 mt-12">
                <h1 className="text-5xl font-black text-white mb-4 leading-tight tracking-tight">
                    Volvamos a la <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-lime-400">cancha.</span>
                </h1>
                <p className="text-xl text-slate-300 font-medium">Inicia sesión y revisa tu próxima convocatoria.</p>
            </div>
            
            {/* Decorative glows */}
            <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-accent/30 blur-[80px] rounded-full"></div>
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/30 blur-[80px] rounded-full"></div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white dark:bg-slate-950 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
                <div className="text-center md:text-left mb-8">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Iniciar Sesión</h2>
                    <p className="text-slate-500 mt-2">Ingresa tus credenciales para continuar</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Número de Celular</label>
                        <Input
                            type="text"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="987654321"
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-14 text-lg rounded-xl focus-visible:ring-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">DNI (Contraseña)</label>
                        <Input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Tu número de DNI"
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-14 text-lg rounded-xl focus-visible:ring-primary"
                        />
                    </div>
                    <Button type="submit" className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-[0_0_20px_rgba(0,210,255,0.3)] transition-all rounded-xl mt-4 border-0">
                        Entrar al Vestuario
                    </Button>
                </form>

                <div className="text-center text-sm font-medium text-slate-500 pt-4">
                    ¿Aún no tienes equipo? <Link to="/registro" className="text-primary hover:text-accent transition-colors font-bold text-base">Solicita tu Fichaje</Link>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
