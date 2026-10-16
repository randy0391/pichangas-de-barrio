import ReactDOM from 'react-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { useConvocatoria } from '@/hooks/useConvocatorias';
import { useBatchAttendance } from '@/hooks/useMultas';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Check, Clock, XCircle, X, Download, Save, Users, Edit2, RotateCcw, Search, CheckCheck } from 'lucide-react';

interface AdminAttendanceDialogProps {
    convocatoriaId: number;
    onClose: () => void;
}

interface PlayerAttendanceState {
    attendance: 'presente' | 'tardanza' | 'falta' | 'pendiente';
    amount: number;
}

export const AdminAttendanceDialog: React.FC<AdminAttendanceDialogProps> = ({ convocatoriaId, onClose }) => {
    const { data: convocatoria, isLoading } = useConvocatoria(convocatoriaId);
    const { mutate: saveBatch, isPending: isSaving } = useBatchAttendance();

    const [attendanceMap, setAttendanceMap] = useState<Record<number, PlayerAttendanceState>>({});
    const [hasInitialized, setHasInitialized] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');
    const [editingAmountId, setEditingAmountId] = useState<number | null>(null);
    const [tempAmount, setTempAmount] = useState<string>('');

    const confirmados = useMemo(() => {
        return convocatoria?.confirmaciones?.filter(c => c.status === 'confirmado') || [];
    }, [convocatoria]);

    // Initialize local attendance map once data is loaded
    useEffect(() => {
        if (confirmados.length > 0 && !hasInitialized) {
            const initial: Record<number, PlayerAttendanceState> = {};
            confirmados.forEach((c) => {
                const att = (c.attendance || 'pendiente') as 'presente' | 'tardanza' | 'falta' | 'pendiente';
                let amt = 0;
                if (att === 'tardanza') amt = 3;
                else if (att === 'falta') amt = 30;
                initial[c.id] = { attendance: att, amount: amt };
            });
            setAttendanceMap(initial);
            setHasInitialized(true);
        }
    }, [confirmados, hasInitialized]);

    if (isLoading) {
        return ReactDOM.createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col items-center gap-3">
                    <FootballSpinner />
                    <p className="text-sm font-bold text-slate-300">Cargando convocatoria...</p>
                </div>
            </div>,
            document.body
        );
    }
    
    if (!convocatoria) {
        return ReactDOM.createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center text-white">
                    <p className="font-bold mb-4">Error al cargar la convocatoria.</p>
                    <Button onClick={onClose} className="bg-lime-400 text-slate-950 font-bold">Cerrar</Button>
                </div>
            </div>,
            document.body
        );
    }

    // Instant click handlers (0 ms latency, no network wait)
    const handleSetStatus = (confirmacionId: number, targetStatus: 'presente' | 'tardanza' | 'falta') => {
        setAttendanceMap(prev => {
            const current = prev[confirmacionId] || { attendance: 'pendiente', amount: 0 };
            // Toggle off if clicking the already active status
            if (current.attendance === targetStatus) {
                return {
                    ...prev,
                    [confirmacionId]: { attendance: 'pendiente', amount: 0 }
                };
            }

            let newAmount = 0;
            if (targetStatus === 'tardanza') newAmount = 3.00; // S/ 3 predeterminada
            else if (targetStatus === 'falta') newAmount = 30.00; // S/ 30 predeterminada

            return {
                ...prev,
                [confirmacionId]: { attendance: targetStatus, amount: newAmount }
            };
        });
    };

    const handleMarkAllPresent = () => {
        setAttendanceMap(prev => {
            const next = { ...prev };
            confirmados.forEach(c => {
                next[c.id] = { attendance: 'presente', amount: 0 };
            });
            return next;
        });
        toast.info('Se marcaron todos los jugadores como Presentes');
    };

    const handleResetAll = () => {
        setAttendanceMap(prev => {
            const next = { ...prev };
            confirmados.forEach(c => {
                next[c.id] = { attendance: 'pendiente', amount: 0 };
            });
            return next;
        });
        toast.info('Se desmarcaron todas las asistencias');
    };

    const handleSaveCustomAmount = (confirmacionId: number) => {
        const val = parseFloat(tempAmount);
        if (isNaN(val) || val < 0) {
            toast.error('Ingresa un monto válido');
            return;
        }
        setAttendanceMap(prev => ({
            ...prev,
            [confirmacionId]: {
                ...prev[confirmacionId],
                amount: val
            }
        }));
        setEditingAmountId(null);
        setTempAmount('');
        toast.success(`Monto actualizado a S/ ${val.toFixed(2)}`);
    };

    // Save all attendances in a single batch request
    const handleSaveBatch = () => {
        const payload = confirmados.map(c => {
            const record = attendanceMap[c.id] || { attendance: 'pendiente', amount: 0 };
            return {
                confirmacion_id: c.id,
                attendance: record.attendance,
                amount: record.amount
            };
        });

        saveBatch({
            convocatoriaId,
            attendances: payload
        }, {
            onSuccess: () => {
                toast.success('¡Asistencias y multas guardadas exitosamente!');
                onClose();
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.message || 'Error al guardar las asistencias');
            }
        });
    };

    // Calculate live counters
    const stats = useMemo(() => {
        let presentes = 0;
        let tardanzas = 0;
        let faltas = 0;
        let sinMarcar = 0;
        let totalMultas = 0;

        confirmados.forEach(c => {
            const att = attendanceMap[c.id]?.attendance || 'pendiente';
            const amt = attendanceMap[c.id]?.amount || 0;
            if (att === 'presente') presentes++;
            else if (att === 'tardanza') {
                tardanzas++;
                totalMultas += amt;
            } else if (att === 'falta') {
                faltas++;
                totalMultas += amt;
            } else {
                sinMarcar++;
            }
        });

        return { presentes, tardanzas, faltas, sinMarcar, totalMultas };
    }, [confirmados, attendanceMap]);

    // Filter players by name or nickname
    const filteredConfirmados = useMemo(() => {
        if (!searchFilter.trim()) return confirmados;
        const q = searchFilter.toLowerCase();
        return confirmados.filter(c =>
            (c.user.name || '').toLowerCase().includes(q) ||
            (c.user.nickname || '').toLowerCase().includes(q) ||
            (c.user.dni || '').toLowerCase().includes(q)
        );
    }, [confirmados, searchFilter]);

    const exportCSV = () => {
        if (!convocatoria) return;
        
        let csvContent = "\uFEFF";
        csvContent += "Jugador;Rol;Partido;Fecha;Asistencia;Multa (S/)\n";

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
            const state = attendanceMap[c.id] || { attendance: c.attendance || 'pendiente', amount: 0 };
            const attendance = `"${state.attendance.toUpperCase()}"`;
            const multaAmt = state.amount > 0 ? state.amount.toFixed(2) : '0.00';
            csvContent += `${name};${role};${title};${dateStr};${attendance};${multaAmt}\n`;
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

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-slate-800 flex justify-between items-start sm:items-center gap-3 bg-slate-950 shrink-0">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold text-lime-400 uppercase tracking-wider bg-lime-400/10 px-2 py-0.5 rounded-full border border-lime-400/20">
                                Asistencia Rápida
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                                {confirmados.length} Jugadores
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight truncate">
                            Llamado de Lista
                        </h2>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{convocatoria.title}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button 
                            onClick={exportCSV} 
                            variant="outline" 
                            className="h-9 text-xs font-bold text-slate-300 border-slate-700 hover:bg-slate-800 px-3 rounded-xl"
                            title="Exportar asistencias a Excel / CSV"
                        >
                            <Download size={14} className="sm:mr-1.5" /> <span className="hidden sm:inline">Exportar</span>
                        </Button>
                        <button 
                            onClick={onClose} 
                            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Live Stats & Quick Actions Toolbar */}
                <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 py-3 shrink-0 flex flex-col gap-2.5">
                    {/* Live Counter Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-slate-900 border border-lime-500/30 rounded-xl p-2 text-center">
                            <span className="text-[10px] text-lime-400 font-bold uppercase block">Presentes</span>
                            <span className="text-lg font-black text-white">{stats.presentes}</span>
                        </div>
                        <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-2 text-center">
                            <span className="text-[10px] text-orange-400 font-bold uppercase block">Tardanzas (S/ 3)</span>
                            <span className="text-lg font-black text-white">{stats.tardanzas}</span>
                        </div>
                        <div className="bg-slate-900 border border-red-500/30 rounded-xl p-2 text-center">
                            <span className="text-[10px] text-red-400 font-bold uppercase block">Faltas (S/ 30)</span>
                            <span className="text-lg font-black text-white">{stats.faltas}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-2 text-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Sin Marcar</span>
                            <span className="text-lg font-black text-white">{stats.sinMarcar}</span>
                        </div>
                    </div>

                    {/* Quick Action Buttons & Search */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Filtrar por nombre..."
                                value={searchFilter}
                                onChange={e => setSearchFilter(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400/50"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                                type="button"
                                onClick={handleMarkAllPresent}
                                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 border border-lime-400/30 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5"
                                title="Marcar todos como Presentes de una sola vez"
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                <span>Marcar Todos Presente</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-colors"
                                title="Desmarcar todos"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Players List with Instant Marking */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
                    {confirmados.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                            <p className="text-base font-bold">Nadie ha confirmado asistencia aún.</p>
                        </div>
                    ) : filteredConfirmados.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <p className="text-sm font-bold">No se encontraron jugadores con ese nombre.</p>
                        </div>
                    ) : (
                        filteredConfirmados.map((c, idx) => {
                            const state = attendanceMap[c.id] || { attendance: 'pendiente', amount: 0 };
                            const isPresente = state.attendance === 'presente';
                            const isTardanza = state.attendance === 'tardanza';
                            const isFalta = state.attendance === 'falta';
                            const isEditing = editingAmountId === c.id;

                            return (
                                <div 
                                    key={c.id} 
                                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                                        isPresente 
                                            ? 'bg-lime-950/20 border-lime-500/40' 
                                            : isTardanza 
                                            ? 'bg-orange-950/20 border-orange-500/40' 
                                            : isFalta 
                                            ? 'bg-red-950/20 border-red-500/40' 
                                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                                    }`}
                                >
                                    {/* Player Info */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                            c.match_role === 'portero' 
                                                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40' 
                                                : 'bg-slate-800 text-slate-300'
                                        }`}>
                                            {c.match_role === 'portero' ? '🧤' : idx + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-sm text-white truncate">{c.user.name}</span>
                                                {c.user.nickname && (
                                                    <span className="text-[11px] text-lime-400 font-bold">"{c.user.nickname}"</span>
                                                )}
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    c.match_role === 'portero' ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30' : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {c.match_role}
                                                </span>
                                            </div>

                                            {/* Status Badge + Multa info */}
                                            <div className="flex items-center gap-2 mt-1">
                                                {isPresente && (
                                                    <span className="text-xs font-bold text-lime-400 inline-flex items-center gap-1">
                                                        <Check className="h-3 w-3" /> Presente (A tiempo)
                                                    </span>
                                                )}
                                                {isTardanza && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-bold text-orange-400 inline-flex items-center gap-1">
                                                            <Clock className="h-3 w-3" /> Tardanza
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingAmountId(c.id);
                                                                setTempAmount(String(state.amount || 3));
                                                            }}
                                                            className="text-[10px] font-black font-mono bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-md hover:bg-orange-500/30 border border-orange-500/30 flex items-center gap-1"
                                                            title="Clic para cambiar monto de multa"
                                                        >
                                                            Multa S/ {state.amount.toFixed(2)}
                                                            <Edit2 className="h-2.5 w-2.5" />
                                                        </button>
                                                    </div>
                                                )}
                                                {isFalta && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-bold text-red-400 inline-flex items-center gap-1">
                                                            <XCircle className="h-3 w-3" /> Falta
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingAmountId(c.id);
                                                                setTempAmount(String(state.amount || 30));
                                                            }}
                                                            className="text-[10px] font-black font-mono bg-red-500/20 text-red-300 px-2 py-0.5 rounded-md hover:bg-red-500/30 border border-red-500/30 flex items-center gap-1"
                                                            title="Clic para cambiar monto de multa"
                                                        >
                                                            Multa S/ {state.amount.toFixed(2)}
                                                            <Edit2 className="h-2.5 w-2.5" />
                                                        </button>
                                                    </div>
                                                )}
                                                {state.attendance === 'pendiente' && (
                                                    <span className="text-xs text-slate-500 font-medium">⚪ Sin marcar</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons: Check, Clock, Falta */}
                                    {isEditing ? (
                                        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end bg-slate-900 p-1.5 rounded-xl border border-slate-700">
                                            <span className="text-xs text-slate-400 font-bold pl-1">S/</span>
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={tempAmount}
                                                onChange={e => setTempAmount(e.target.value)}
                                                className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs font-mono font-bold"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleSaveCustomAmount(c.id)}
                                                className="px-2 py-1 bg-lime-400 hover:bg-lime-500 text-slate-950 text-xs font-bold rounded-lg"
                                            >
                                                OK
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingAmountId(null)}
                                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                                            {/* Presente */}
                                            <button
                                                type="button"
                                                onClick={() => handleSetStatus(c.id, 'presente')}
                                                className={`h-10 px-3.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                                                    isPresente
                                                        ? 'bg-lime-400 text-slate-950 shadow-lg shadow-lime-400/30 scale-105'
                                                        : 'bg-slate-900 hover:bg-lime-500/10 text-slate-400 hover:text-lime-400 border border-slate-800 hover:border-lime-500/40'
                                                }`}
                                                title="Presente (A tiempo, sin multa)"
                                            >
                                                <Check size={16} className={isPresente ? 'stroke-[3]' : ''} />
                                                <span className="hidden sm:inline">Presente</span>
                                            </button>

                                            {/* Tardanza (S/ 3) */}
                                            <button
                                                type="button"
                                                onClick={() => handleSetStatus(c.id, 'tardanza')}
                                                className={`h-10 px-3.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                                                    isTardanza
                                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105'
                                                        : 'bg-slate-900 hover:bg-orange-500/10 text-slate-400 hover:text-orange-400 border border-slate-800 hover:border-orange-500/40'
                                                }`}
                                                title="Tardanza (Multa automática de S/ 3.00)"
                                            >
                                                <Clock size={16} className={isTardanza ? 'stroke-[3]' : ''} />
                                                <span>Tardanza</span>
                                            </button>

                                            {/* Falta (S/ 30) */}
                                            <button
                                                type="button"
                                                onClick={() => handleSetStatus(c.id, 'falta')}
                                                className={`h-10 px-3.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                                                    isFalta
                                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                                                        : 'bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40'
                                                }`}
                                                title="Falta (Multa automática de S/ 30.00)"
                                            >
                                                <XCircle size={16} className={isFalta ? 'stroke-[3]' : ''} />
                                                <span>Falta</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Sticky Footer Action Bar */}
                <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-slate-400 text-center sm:text-left">
                        {stats.sinMarcar > 0 ? (
                            <span className="text-yellow-400 font-bold">
                                ⚠️ Faltan {stats.sinMarcar} jugadores por marcar
                            </span>
                        ) : (
                            <span className="text-lime-400 font-bold">
                                ✅ Todos los jugadores han sido marcados
                            </span>
                        )}
                        {stats.totalMultas > 0 && (
                            <span className="block text-[11px] text-orange-400 font-mono mt-0.5">
                                Total en multas a registrar: <strong>S/ {stats.totalMultas.toFixed(2)}</strong>
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-700"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveBatch}
                            disabled={isSaving}
                            className="flex-1 sm:flex-none bg-lime-400 hover:bg-lime-500 text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl border-0 shadow-lg shadow-lime-400/20 flex items-center justify-center gap-2"
                        >
                            <Save size={16} />
                            {isSaving ? 'Guardando asistencias...' : `Guardar Asistencias (${confirmados.length})`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
