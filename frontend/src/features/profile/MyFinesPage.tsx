import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMultas, useUploadMultaReceipt, usePayMultaWithWallet } from '@/hooks/useMultas';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { toast } from 'sonner';
import { Check, Upload, AlertCircle, Wallet, Smartphone, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/axios';

export const MyFinesPage = () => {
    const { data: multas, isLoading } = useMultas();
    const { data: walletData } = useQuery({ queryKey: ['wallet'], queryFn: async () => (await api.get('/wallet')).data });
    const { mutate: uploadReceipt, isPending: isUploading } = useUploadMultaReceipt();
    const { mutate: payWithWallet, isPending: isPaying } = usePayMultaWithWallet();
    const [uploadingId, setUploadingId] = React.useState<number | null>(null);
    const balance = Number(walletData?.wallet?.balance ?? 0);

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;
    const pendientes = multas?.filter(m => m.status === 'pendiente') || [];
    const enRevision = multas?.filter(m => m.status === 'en_revision') || [];
    const pagadas = multas?.filter(m => m.status === 'pagada') || [];

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingId(id);
        uploadReceipt({ id, receipt: file }, {
            onSuccess: () => { toast.success('Voucher enviado. Tu pago quedará pendiente de verificación.'); setUploadingId(null); },
            onError: () => { toast.error('No se pudo subir el voucher.'); setUploadingId(null); },
        });
        e.target.value = '';
    };

    const handleWalletPayment = (id: number, amount: string) => {
        toast(`¿Confirmas pagar S/ ${Number(amount).toFixed(2)} con tu billetera?`, {
            action: { label: 'Sí, pagar', onClick: () => payWithWallet(id, {
                onSuccess: () => toast.success('¡Multa pagada con tu billetera!'),
                onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo realizar el pago.'),
            }) },
            cancel: { label: 'Cancelar', onClick: () => {} },
        });
    };

    return <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div><h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Mis Multas</h1><p className="text-slate-500 dark:text-slate-400">Elige cómo deseas pagar tus multas pendientes.</p></div>
            <div className="rounded-2xl border border-lime-500/30 bg-lime-500/10 px-5 py-3"><p className="text-xs font-bold uppercase tracking-wider text-lime-600 dark:text-lime-400 flex items-center gap-2"><Wallet size={15}/> Saldo de mi billetera</p><p className="text-2xl font-black text-slate-900 dark:text-white">S/ {balance.toFixed(2)}</p></div>
        </div>

        {pendientes.length > 0 && <section className="bg-red-500/10 border border-red-500/20 p-5 sm:p-6 rounded-3xl space-y-4">
            <h2 className="text-xl font-black text-red-500 flex items-center gap-2 uppercase tracking-tight"><AlertCircle size={24}/> Multas pendientes de pago</h2>
            <p className="text-sm text-red-400 font-semibold">Paga con tu saldo disponible o envía el voucher del pago por Yape.</p>
            {pendientes.map(m => <article key={m.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xl border border-red-500/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"><div><div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">{m.reason}</div><div className="text-lg font-bold text-slate-900 dark:text-white">{m.convocatoria?.title || 'Multa registrada'}</div>{m.admin_notes && <p className="text-sm text-slate-500 mt-2 italic">{m.admin_notes}</p>}</div><div className="text-3xl font-black text-slate-900 dark:text-white whitespace-nowrap">S/ {Number(m.amount).toFixed(2)}</div></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button onClick={() => handleWalletPayment(m.id, m.amount)} disabled={isPaying || balance < Number(m.amount)} className="w-full bg-lime-500 hover:bg-lime-600 text-slate-950 font-black uppercase tracking-wide rounded-xl h-12 flex items-center justify-center gap-2 disabled:opacity-50"><Wallet size={17}/> {isPaying ? 'Procesando...' : 'Pagar con mi saldo'}</Button>
                    <div className="relative"><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-12" onChange={e => handleUpload(e, m.id)} disabled={isUploading}/><Button className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-black uppercase tracking-wide rounded-xl h-12 flex items-center justify-center gap-2 pointer-events-none"><Smartphone size={17}/> {uploadingId === m.id ? 'Subiendo voucher...' : 'Pagar con Yape'}</Button></div>
                </div>
                {balance < Number(m.amount) && <p className="text-xs text-amber-500 font-semibold">Tu saldo no alcanza para esta multa. Puedes recargar tu billetera o pagar por Yape.</p>}
                <p className="text-[11px] text-slate-500">Al enviar el voucher, el administrador verificará el pago antes de marcar la multa como pagada.</p>
            </article>)}
        </section>}

        {enRevision.length > 0 && <section className="space-y-4"><h2 className="text-xl font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2"><Clock3 size={20}/> Pagos Yape en revisión</h2><div className="grid gap-4">{enRevision.map(m => <div key={m.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-yellow-500/30 flex justify-between items-center gap-4"><div><div className="font-bold text-slate-900 dark:text-white">{m.convocatoria?.title || 'Multa registrada'}</div><div className="text-xs text-yellow-500 uppercase font-bold tracking-widest">Esperando validación del administrador</div></div><div className="font-black text-yellow-500 whitespace-nowrap">S/ {Number(m.amount).toFixed(2)}</div></div>)}</div></section>}

        {pagadas.length > 0 && <section className="space-y-4"><h2 className="text-xl font-bold text-lime-500 uppercase tracking-widest">Pagadas</h2><div className="grid gap-4 opacity-80">{pagadas.map(m => <div key={m.id} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-lime-500/30 flex justify-between items-center gap-4"><div><div className="font-bold text-slate-900 dark:text-white">{m.convocatoria?.title || 'Multa registrada'}</div><div className="text-xs text-lime-500 uppercase font-bold tracking-widest flex items-center gap-1"><Check size={14}/> Multa saldada</div></div><div className="font-black text-lime-500 whitespace-nowrap">S/ {Number(m.amount).toFixed(2)}</div></div>)}</div></section>}

        {pendientes.length === 0 && enRevision.length === 0 && pagadas.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-slate-500">No tienes multas registradas.</div>}
    </div>;
};
