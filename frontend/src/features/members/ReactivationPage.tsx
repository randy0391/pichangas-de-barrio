import { useEffect, useState } from 'react';
import { ShieldCheck, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';

export const ReactivationPage = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, fetchUser } = useAuthStore();

  const refresh = async () => {
    try {
      const response = await api.get('/reactivation-requests/mine');
      setRequests(response.data.data || []);
    } catch {
      toast.error('No se pudo consultar el estado de tu solicitud.');
    }
  };

  useEffect(() => {
    void refresh();
    void fetchUser();
  }, []);

  const pending = requests.some(item => item.status === 'pending');
  const isInactive = user?.status === 'inactive';

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

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <div className="rounded-3xl border border-cyan-400/20 bg-[#0b1221] p-6 sm:p-8">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
          <ShieldCheck size={30} />
        </div>
        <h1 className="text-2xl font-black text-white">Reactivación de cuenta</h1>
        {isInactive ? (
          <>
            <p className="mt-2 text-slate-300">Tu cuenta figura como inactiva porque no registró una inscripción a convocatorias durante 30 días. Puedes solicitar al administrador que la reactive.</p>
            <p className="mt-3 text-sm text-slate-400">Estado actual: <strong className="text-amber-300">Inactivo</strong></p>
            {pending ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-cyan-100">
                <Clock size={20} />
                Tu solicitud está pendiente de revisión por el administrador.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <label className="block text-sm font-bold text-slate-200" htmlFor="reactivation-message">Mensaje para el administrador (opcional)</label>
                <textarea id="reactivation-message" value={message} onChange={e => setMessage(e.target.value)} rows={3} maxLength={1000} className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-cyan-400" placeholder="Escribe un mensaje si deseas explicar tu situación." />
                <button disabled={loading} onClick={submit} className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50">
                  <Send size={17} /> {loading ? 'Enviando...' : 'Solicitar reactivación'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-lime-400/20 bg-lime-400/10 p-4 text-lime-100">
            Tu cuenta está activa. No necesitas solicitar una reactivación.
          </div>
        )}
      </div>
      {requests.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-[#0b1221] p-5">
          <h2 className="mb-3 font-black text-white">Historial de solicitudes</h2>
          <div className="space-y-3">
            {requests.map(item => (
              <div key={item.id} className="rounded-xl bg-slate-900 p-3 text-sm">
                <div className="flex justify-between gap-3 text-white"><span>Solicitud #{item.id}</span><strong>{item.status === 'pending' ? 'Pendiente' : item.status === 'approved' ? 'Aprobada' : 'Rechazada'}</strong></div>
                {item.admin_note && <p className="mt-2 text-slate-400">Respuesta: {item.admin_note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
