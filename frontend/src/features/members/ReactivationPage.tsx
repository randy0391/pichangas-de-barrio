import { useEffect, useState } from 'react';
import { ShieldCheck, Clock, Send, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';

export const ReactivationPage = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, fetchUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const refresh = async () => {
    try {
      const response = await api.get('/reactivation-requests/mine');
      setRequests(response.data.data || []);
    } catch {
      toast.error('No se pudo consultar el estado de tu solicitud.');
    }
  };

  useEffect(() => {
    void fetchUser();
    void refresh();
  }, []);

  const pending = requests.some(item => item.status === 'pending');

  const submit = async () => {
    setLoading(true);
    try {
      const response = await api.post('/reactivation-requests', { message });
      toast.success(response.data.message || 'Solicitud enviada.');
      setMessage('');
      await refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se pudo enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      toast.error('No se pudo cerrar la sesión. Inténtalo nuevamente.');
      setLoggingOut(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#060913] px-4 py-10">
      <div className="w-full max-w-2xl space-y-5">
        <section className="rounded-3xl border border-amber-400/20 bg-[#0b1221] p-6 shadow-2xl sm:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
              <ShieldCheck size={30} />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
            >
              <LogOut size={16} />
              {loggingOut ? 'Cerrando...' : 'Cerrar sesión'}
            </button>
          </div>

          <h1 className="text-2xl font-black text-white sm:text-3xl">Cuenta temporalmente inactiva</h1>
          <p className="mt-3 leading-relaxed text-slate-300">
            Tu cuenta está inactiva porque no registraste una inscripción a convocatorias durante 30 días.
            Para volver a utilizar Pichangas de Barrio y participar en las convocatorias, solicita la reactivación al administrador.
          </p>
          <p className="mt-4 text-sm text-slate-400">
            Jugador: <strong className="text-white">{user?.full_name || user?.name || 'Tu cuenta'}</strong>
            <span className="mx-2 text-slate-600">·</span>
            Estado: <strong className="text-amber-300">Inactivo</strong>
          </p>

          {pending ? (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-cyan-100">
              <Clock size={20} className="mt-0.5 shrink-0" />
              <div>
                <strong className="block">Solicitud pendiente de revisión</strong>
                <span className="mt-1 block text-sm text-cyan-100/80">
                  El administrador ya recibió tu solicitud. Cuando la revise, podrás volver a ingresar al sistema si la aprueba.
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <label className="block text-sm font-bold text-slate-200" htmlFor="reactivation-message">
                Mensaje para el administrador (opcional)
              </label>
              <textarea
                id="reactivation-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-cyan-400"
                placeholder="Escribe un mensaje si deseas explicar tu situación."
              />
              <button
                disabled={loading}
                onClick={submit}
                className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-3 font-black text-slate-950 transition hover:bg-lime-300 disabled:opacity-50"
              >
                <Send size={17} />
                {loading ? 'Enviando...' : 'Solicitar reactivación'}
              </button>
            </div>
          )}
        </section>

        {requests.length > 0 && (
          <section className="rounded-2xl border border-slate-800 bg-[#0b1221] p-5 sm:p-6">
            <h2 className="mb-3 font-black text-white">Historial de solicitudes</h2>
            <div className="space-y-3">
              {requests.map(item => (
                <div key={item.id} className="rounded-xl bg-slate-900 p-3 text-sm">
                  <div className="flex justify-between gap-3 text-white">
                    <span>Solicitud #{item.id}</span>
                    <strong className={item.status === 'pending' ? 'text-amber-300' : item.status === 'approved' ? 'text-lime-300' : 'text-red-300'}>
                      {item.status === 'pending' ? 'Pendiente' : item.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                    </strong>
                  </div>
                  {item.admin_note && <p className="mt-2 text-slate-400">Respuesta: {item.admin_note}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};
