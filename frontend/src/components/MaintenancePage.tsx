import { Wrench, Clock3, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MaintenancePage = () => (
  <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center px-5 py-12">
    <section className="w-full max-w-xl text-center">
      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-[#F00091]/30 bg-[#F00091]/10 shadow-[0_0_60px_rgba(240,0,145,0.14)]">
        <Wrench className="h-11 w-11 text-[#F00091]" />
      </div>
      <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-[#00C9E8]">Pichangas de Barrio</p>
      <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Estamos en mantenimiento</h1>
      <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
        Estamos realizando mejoras para ofrecerte una mejor experiencia. Durante este periodo el sistema no estará disponible.
      </p>
      <div className="mt-9 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left sm:p-6">
        <div className="flex items-center gap-3">
          <Clock3 className="h-5 w-5 shrink-0 text-[#A5E900]" />
          <div>
            <p className="text-sm font-bold text-white">Mantenimiento programado</p>
            <p className="mt-1 text-sm text-slate-400">Hoy, 8 de noviembre · 10:00 p. m.</p>
          </div>
        </div>
        <div className="my-5 h-px bg-white/10" />
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-[#00C9E8]" />
          <div>
            <p className="text-sm font-bold text-white">Reanudación del servicio</p>
            <p className="mt-1 text-sm text-slate-400">Mañana, 9 de noviembre · 10:00 a. m.</p>
          </div>
        </div>
      </div>
      <p className="mt-7 text-xs text-slate-500">Gracias por tu comprensión. Volveremos pronto.</p>\n      <Link to="/login" className="mt-6 inline-flex text-sm font-semibold text-slate-400 underline decoration-slate-600 underline-offset-4 hover:text-white">Acceso del propietario</Link>
    </section>
  </main>
);
