import React from 'react';
import { useMultas, useUploadMultaReceipt } from '@/hooks/useMultas';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { toast } from 'sonner';
import { Check, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const MyFinesPage = () => {
    const { data: multas, isLoading } = useMultas();
    const { mutate: uploadReceipt, isPending } = useUploadMultaReceipt();
    const [uploadingId, setUploadingId] = React.useState<number | null>(null);

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    const pendientes = multas?.filter(m => m.status === 'pendiente') || [];
    const enRevision = multas?.filter(m => m.status === 'en_revision') || [];
    const pagadas = multas?.filter(m => m.status === 'pagada') || [];

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadingId(id);
            uploadReceipt({ id, receipt: file }, {
                onSuccess: () => {
                    toast.success('Comprobante subido. Espera a que un administrador lo verifique.');
                    setUploadingId(null);
                },
                onError: () => {
                    toast.error('Error al subir el comprobante.');
                    setUploadingId(null);
                }
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Mis Multas</h1>
                <p className="text-slate-500 dark:text-slate-400">Revisa tus multas pendientes y sube tus comprobantes de pago.</p>
            </div>

            {pendientes.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl space-y-4">
                    <h2 className="text-2xl font-black text-red-500 flex items-center gap-2 uppercase tracking-tight">
                        <AlertCircle size={28} /> Multas Pendientes de Pago
                    </h2>
                    <p className="text-red-400 font-bold mb-4">No podrás unirte a nuevas convocatorias hasta pagar estas multas.</p>
                    
                    <div className="space-y-4">
                        {pendientes.map(m => (
                            <div key={m.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-red-500/30">
                                <div>
                                    <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Motivo: {m.reason}</div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white">{m.convocatoria.title}</div>
                                    {m.admin_notes && <p className="text-sm text-slate-500 mt-2 italic">Nota: {m.admin_notes}</p>}
                                </div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white">S/. {m.amount}</div>
                                <div className="w-full md:w-auto relative">
                                    <input 
                                        type="file" 
                                        accept="image/*,.pdf" 
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full" 
                                        onChange={(e) => handleUpload(e, m.id)}
                                        disabled={isPending}
                                    />
                                    <Button className="w-full md:w-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-black uppercase tracking-widest rounded-xl h-12 px-8 flex items-center gap-2">
                                        {uploadingId === m.id ? 'Subiendo...' : <><Upload size={18} /> Subir Voucher</>}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {enRevision.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-yellow-500 uppercase tracking-widest">En Revisión</h2>
                    <div className="grid gap-4">
                        {enRevision.map(m => (
                            <div key={m.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-yellow-500/30 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">{m.convocatoria.title}</div>
                                    <div className="text-xs text-yellow-500 uppercase font-bold tracking-widest">Esperando validación de un Administrador</div>
                                </div>
                                <div className="font-black text-yellow-500">S/. {m.amount}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {pagadas.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-lime-500 uppercase tracking-widest">Pagadas</h2>
                    <div className="grid gap-4 opacity-75">
                        {pagadas.map(m => (
                            <div key={m.id} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-lime-500/30 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white line-through">{m.convocatoria.title}</div>
                                    <div className="text-xs text-lime-500 uppercase font-bold tracking-widest flex items-center gap-1"><Check size={14}/> Multa saldada</div>
                                </div>
                                <div className="font-black text-lime-500">S/. {m.amount}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
