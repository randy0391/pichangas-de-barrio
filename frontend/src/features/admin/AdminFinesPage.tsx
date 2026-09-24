import React, { useState } from 'react';
import { useMultas, useApproveMulta, useRejectMulta } from '@/hooks/useMultas';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Check, X, Eye, FileText, AlertTriangle } from 'lucide-react';
import { Multa } from '@/types';

export const AdminFinesPage = () => {
    const { data: multas, isLoading } = useMultas();
    const { mutate: approve, isPending: isApproving } = useApproveMulta();
    const { mutate: reject, isPending: isRejecting } = useRejectMulta();

    const [selectedMulta, setSelectedMulta] = useState<Multa | null>(null);

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    const pendientes = multas?.filter(m => m.status === 'pendiente') || [];
    const enRevision = multas?.filter(m => m.status === 'en_revision') || [];
    const pagadas = multas?.filter(m => m.status === 'pagada') || [];

    const handleApprove = (id: number) => {
        toast('¿Aprobar el pago de esta multa?', {
            action: {
                label: 'Aprobar',
                onClick: () => approve({ id }, { onSuccess: () => toast.success('Multa pagada exitosamente') })
            }
        });
    };

    const handleReject = (id: number) => {
        toast('¿Rechazar este pago? El voucher será eliminado.', {
            action: {
                label: 'Rechazar',
                onClick: () => reject({ id }, { onSuccess: () => toast.success('Multa rechazada') })
            }
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Gestión de Multas</h1>
                <p className="text-slate-500 dark:text-slate-400">Verifica los pagos de multas por faltas y tardanzas.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* En Revisión */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-yellow-500">
                        <FileText /> Pagos en Revisión ({enRevision.length})
                    </h2>
                    {enRevision.length === 0 && <p className="text-slate-500 italic">No hay pagos pendientes de revisión.</p>}
                    
                    {enRevision.map(m => (
                        <div key={m.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-yellow-200 dark:border-yellow-800/30 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                            {m.payment_receipt && (
                                <a href={m.payment_receipt} target="_blank" rel="noreferrer" className="shrink-0 w-32 h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 block hover:opacity-80 transition-opacity relative group">
                                    <img src={m.payment_receipt} alt="Voucher" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Eye className="text-white" />
                                    </div>
                                </a>
                            )}
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">{m.user.name}</h3>
                                <p className="text-sm text-slate-500 mb-2">Multa por <strong className="text-red-500 uppercase">{m.reason}</strong> en: <span className="italic">{m.convocatoria.title}</span></p>
                                <div className="text-2xl font-black text-yellow-500">S/. {m.amount}</div>
                            </div>
                            <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                                <Button 
                                    onClick={() => handleApprove(m.id)} 
                                    disabled={isApproving}
                                    className="flex-1 sm:flex-none bg-lime-500 text-white font-bold h-10 px-4 rounded-xl flex items-center gap-2 justify-center"
                                >
                                    <Check size={18} /> Aprobar
                                </Button>
                                <Button 
                                    onClick={() => handleReject(m.id)} 
                                    disabled={isRejecting}
                                    variant="outline"
                                    className="flex-1 sm:flex-none border-red-500 text-red-500 hover:bg-red-500/10 font-bold h-10 px-4 rounded-xl flex items-center gap-2 justify-center"
                                >
                                    <X size={18} /> Rechazar
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pendientes y Pagadas */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-red-500 mb-4">
                            <AlertTriangle /> Multas Pendientes ({pendientes.length})
                        </h2>
                        <div className="space-y-3">
                            {pendientes.length === 0 && <p className="text-slate-500 text-sm italic">Nadie tiene multas pendientes.</p>}
                            {pendientes.map(m => (
                                <div key={m.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold">{m.user.name}</div>
                                            <div className="text-xs text-slate-500">{m.reason} - {m.convocatoria.title}</div>
                                        </div>
                                        <div className="font-black text-red-500">S/. {m.amount}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-lime-500 mb-4">
                            <Check /> Multas Pagadas ({pagadas.length})
                        </h2>
                        <div className="space-y-3">
                            {pagadas.slice(0, 5).map(m => (
                                <div key={m.id} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 opacity-70">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold">{m.user.name}</div>
                                            <div className="text-xs text-slate-500">{m.reason} - {m.convocatoria.title}</div>
                                        </div>
                                        <div className="font-black text-lime-500">S/. {m.amount}</div>
                                    </div>
                                </div>
                            ))}
                            {pagadas.length > 5 && <p className="text-center text-xs text-slate-500 font-bold">+ {pagadas.length - 5} más</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
