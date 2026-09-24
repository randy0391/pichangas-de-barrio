import React, { useState } from 'react';
import { useConvocatoria } from '@/hooks/useConvocatorias';
import { useMarkAttendance } from '@/hooks/useMultas';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Check, Clock, XCircle, X, Download } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface AdminAttendanceDialogProps {
    convocatoriaId: number;
    onClose: () => void;
}

export const AdminAttendanceDialog: React.FC<AdminAttendanceDialogProps> = ({ convocatoriaId, onClose }) => {
    const { data: convocatoria, isLoading } = useConvocatoria(convocatoriaId);
    const { mutate: markAttendance, isPending } = useMarkAttendance();

    const [activeConfirmacion, setActiveConfirmacion] = useState<number | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [actionType, setActionType] = useState<'tardanza' | 'falta' | null>(null);

    if (isLoading) return <div className="p-10 flex justify-center"><FootballSpinner /></div>;
    
    if (!convocatoria) return <div className="p-10 text-center">Error al cargar la convocatoria</div>;

    const confirmados = convocatoria.confirmaciones?.filter(c => c.status === 'confirmado') || [];

    const handlePresente = (id: number) => {
        markAttendance({ confirmacionId: id, attendance: 'presente' }, {
            onSuccess: () => toast.success('Asistencia registrada: Presente')
        });
    };

    const handlePromptMonto = (id: number, type: 'tardanza' | 'falta') => {
        setActiveConfirmacion(id);
        setActionType(type);
        setAmount('');
    };

    const submitMulta = () => {
        if (!activeConfirmacion || !actionType || !amount || isNaN(Number(amount))) return;
        markAttendance({ confirmacionId: activeConfirmacion, attendance: actionType, amount: Number(amount) }, {
            onSuccess: () => {
                toast.success(`Multa registrada: ${actionType.toUpperCase()}`);
                setActiveConfirmacion(null);
                setActionType(null);
            }
        });
    };

    const exportCSV = () => {
        if (!convocatoria) return;
        
        let csvContent = "\uFEFF";
        csvContent += "Jugador;Rol;Partido;Fecha;Asistencia\n";

        // Formatear la fecha
        let date = convocatoria.match_date || '';
        if (date) {
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                date = `${day}/${month}/${year}`;
            }
        }

        confirmados.forEach(c => {
            const name = `"${c.user.name}"`;
            const role = `"${c.match_role.toUpperCase()}"`;
            const title = `"${convocatoria.title}"`;
            const dateStr = `"${date}"`;
            const attendance = `"${c.attendance || 'Sin marcar'}"`;
            csvContent += `${name};${role};${title};${dateStr};${attendance}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `asistencia_${convocatoria.title.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Llamado de Lista</h2>
                        <p className="text-sm text-slate-500">{convocatoria.title}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={exportCSV} variant="outline" className="h-10 text-green-600 border-green-200 hover:bg-green-50">
                            <Download size={16} className="mr-2" /> Exportar
                        </Button>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={24} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {confirmados.length === 0 && <p className="text-center italic text-slate-500">Nadie ha confirmado asistencia aún.</p>}
                    
                    {confirmados.map(c => (
                        <div key={c.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <div className="font-bold text-lg">{c.user.name}</div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{c.match_role}</div>
                            </div>

                            {activeConfirmacion === c.id ? (
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Input 
                                        type="number" 
                                        placeholder="Monto S/." 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)}
                                        className="w-24 h-10"
                                    />
                                    <Button onClick={submitMulta} disabled={isPending} className="h-10 bg-red-500 text-white font-bold">Cobrar</Button>
                                    <Button onClick={() => setActiveConfirmacion(null)} variant="outline" className="h-10 border-slate-300">Cancelar</Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="text-sm mr-4 font-black uppercase">
                                        {c.attendance === 'presente' && <span className="text-lime-500">Presente</span>}
                                        {c.attendance === 'tardanza' && <span className="text-orange-500">Tardanza</span>}
                                        {c.attendance === 'falta' && <span className="text-red-500">Falta</span>}
                                        {(!c.attendance || c.attendance === 'pendiente') && <span className="text-slate-400">Sin marcar</span>}
                                    </div>
                                    <Button onClick={() => handlePresente(c.id)} disabled={isPending} variant="outline" className="h-10 w-10 p-0 rounded-xl border-lime-500 text-lime-500 hover:bg-lime-500/10" title="Presente"><Check size={18} /></Button>
                                    <Button onClick={() => handlePromptMonto(c.id, 'tardanza')} disabled={isPending} variant="outline" className="h-10 w-10 p-0 rounded-xl border-orange-500 text-orange-500 hover:bg-orange-500/10" title="Tardanza"><Clock size={18} /></Button>
                                    <Button onClick={() => handlePromptMonto(c.id, 'falta')} disabled={isPending} variant="outline" className="h-10 w-10 p-0 rounded-xl border-red-500 text-red-500 hover:bg-red-500/10" title="Falta"><XCircle size={18} /></Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
