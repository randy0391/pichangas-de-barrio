import { useEffect, useState } from 'react';
import { Check, X, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

export const AdminReactivationRequestsPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/reactivation-requests');
      setItems(response.data.data || []);
    } catch {
      toast.error('No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const review = async (id: number, decision: 'approved' | 'rejected') => {
    setBusy(id);
    try {
      const response = await api.post(`/admin/reactivation-requests/${id}/review`, { decision });
      toast.success(response.data.message);
      await refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se pudo revisar la solicitud.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-black text-white">Solicitudes de reactivación</h1><p className="mt-1 text-slate-400">Revisa y decide qué jugadores pueden volver a inscribirse.</p></div>
        <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-white"><RefreshCw size={16}/> Actualizar</button>
      </div>
      {loading ? <p className="text-slate-400">Cargando solicitudes...</p> : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0b1221] p-10 text-center text-slate-400"><ShieldCheck className="mx-auto mb-3" size={32}/>No hay solicitudes registradas.</div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const player = item.user || {};
            const name = [player.nombres, player.apellido_paterno, player.apellido_materno].filter(Boolean).join(' ');
            return <div key={item.id} className="rounded-2xl border border-slate-800 bg-[#0b1221] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="font-black text-white">{name || `Jugador #${player.id}`}</h2><p className="text-sm text-slate-400">{player.phone || player.email || 'Sin contacto'}</p><p className="mt-1 text-xs text-slate-500">Registrado: {player.created_at ? new Date(player.created_at).toLocaleDateString('es-PE') : '—'} · Última inscripción: {player.last_convocatoria_at ? new Date(player.last_convocatoria_at).toLocaleDateString('es-PE') : 'Nunca'}</p></div>
                <span className={item.status === 'pending' ? 'rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300' : 'rounded-full bg-slate-700 px-3 py-1 text-xs font-bold text-slate-200'}>{item.status === 'pending' ? 'Pendiente' : item.status === 'approved' ? 'Aprobada' : 'Rechazada'}</span>
              </div>
              {item.message && <p className="mt-3 rounded-xl bg-slate-900 p-3 text-sm text-slate-300">{item.message}</p>}
              {item.admin_note && <p className="mt-2 text-sm text-slate-400">Nota: {item.admin_note}</p>}
              {item.status === 'pending' && <div className="mt-4 flex flex-wrap gap-2"><button disabled={busy === item.id} onClick={() => void review(item.id, 'approved')} className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-50"><Check size={16}/> Aprobar y reactivar</button><button disabled={busy === item.id} onClick={() => void review(item.id, 'rejected')} className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 px-4 py-2 text-sm font-bold text-red-300 disabled:opacity-50"><X size={16}/> Rechazar</button></div>}
            </div>;
          })}
        </div>
      )}
    </div>
  );
};
