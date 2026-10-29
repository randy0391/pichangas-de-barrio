import React, { useState, useRef, useMemo } from 'react';
import { 
    useConvocatorias, 
    useCreateConvocatoria, 
    useUpdateConvocatoria, 
    useDeleteConvocatoria, 
    useSortearEquipos, 
    useConvocatoria, 
    useRemoveConfirmacion, 
    useUpdatePlayerRole 
} from '@/hooks/useConvocatorias';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Convocatoria, Confirmacion } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
    Plus, 
    Shuffle, 
    Trash2, 
    Eye, 
    EyeOff, 
    X, 
    Users, 
    Shield, 
    MapPin, 
    CalendarDays, 
    Clock, 
    Copy, 
    Search, 
    CheckCircle2, 
    DollarSign, 
    Swords, 
    Sparkles, 
    ExternalLink, 
    Edit3, 
    Trophy, 
    ClipboardCheck,
    Calendar,
    Zap,
    Repeat
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { Link } from 'react-router-dom';
import { AdminAttendanceDialog } from './AdminAttendanceDialog';
import { AdminRecurringScheduleDialog } from './AdminRecurringScheduleDialog';

const getPlayerName = (user: any) => {
    if (!user) return 'Jugador';
    return user.full_name || user.name || `${user.nombres || ''} ${user.apellido_paterno || ''}`.trim() || 'Jugador';
};

const formatMatchDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return '';
    try {
        const [year, month, day] = dateStr.split('-');
        if (year && month && day) {
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
            const dayName = dayNames[date.getDay()];
            const monthName = monthNames[date.getMonth()];
            const timeFormatted = timeStr ? timeStr.slice(0, 5) : '';
            return `${dayName} ${parseInt(day)} de ${monthName}${timeFormatted ? ' • ' + timeFormatted : ''}`;
        }
    } catch {
        return `${dateStr} ${timeStr || ''}`;
    }
    return `${dateStr} ${timeStr || ''}`;
};

const TeamsList = ({ convocatoriaId }: { convocatoriaId: number }) => {
    const { data: c } = useConvocatoria(convocatoriaId);
    const { mutate: removeConfirmacion } = useRemoveConfirmacion();
    const { mutate: updateRole } = useUpdatePlayerRole();
    if (!c || !c.confirmaciones) return null;

    const confirmados = c.confirmaciones.filter((p: Confirmacion) => p.status === 'confirmado');
    const hasTeams = confirmados.some((p: Confirmacion) => p.team_number !== null);

    const handleCopy = () => {
        if (hasTeams) {
            const teamsMap: Record<number, Confirmacion[]> = {};
            confirmados.forEach((p: Confirmacion) => {
                const t = p.team_number || 0;
                if (!teamsMap[t]) teamsMap[t] = [];
                teamsMap[t].push(p);
            });

            const lines = [
                `⚽ *EQUIPOS SORTEADOS - ${c.title.toUpperCase()}*`,
                `📅 ${c.match_date} • 🕒 ${c.match_time ? c.match_time.slice(0, 5) : ''}`,
                `📍 ${c.location}`,
                `-------------------------------------------`
            ];

            Object.entries(teamsMap).sort(([a], [b]) => Number(a) - Number(b)).forEach(([teamNum, players]) => {
                lines.push(``);
                lines.push(`🏆 *${Number(teamNum) === 0 ? 'SIN EQUIPO' : `EQUIPO ${teamNum}`}* (${players.length} jugadores):`);
                players.sort((a, b) => a.match_role === 'portero' ? -1 : 1).forEach((p, i) => {
                    const name = getPlayerName(p.user);
                    const role = p.match_role === 'portero' ? ' 🧤 (Portero)' : '';
                    lines.push(`  ${i + 1}. ${name}${role}`);
                });
            });

            lines.push(``);
            lines.push(`-------------------------------------------`);
            lines.push(`_Pichangas de Barrio - ¡Puntualidad y fair play!_`);
            navigator.clipboard.writeText(lines.join('\n'));
            toast.success('¡Equipos copiados al portapapeles para WhatsApp!');
        } else {
            const sorted = [...confirmados].sort((a, b) => a.match_role === 'portero' ? -1 : 1);
            const text = sorted.map((p, i) => `${i + 1}. ${getPlayerName(p.user)} ${p.match_role === 'portero' ? '🧤 (Portero)' : ''}`).join('\n');
            navigator.clipboard.writeText(`⚽ Lista de Confirmados - ${c.title} (${confirmados.length}/${c.max_players}):\n\n${text}`);
            toast.success('Lista de confirmados copiada al portapapeles');
        }
    };

    if (!hasTeams) return (
        <div className="bg-slate-50 dark:bg-slate-950/70 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                        <Users size={16} className="text-primary" /> 
                        Jugadores Confirmados ({confirmados.length} / {c.max_players})
                    </h4>
                    <p className="text-xs text-slate-500">Toca el ícono ⚽ / 🧤 para cambiar el rol de portero.</p>
                </div>
                <Button 
                    onClick={handleCopy} 
                    variant="outline"
                    className="h-9 px-3 rounded-xl border-primary/30 text-primary hover:bg-primary/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                    <Copy size={14} /> Copiar Lista
                </Button>
            </div>

            {confirmados.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-4 text-center">Aún no hay jugadores confirmados para este partido.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {confirmados.sort((a, b) => a.match_role === 'portero' ? -1 : 1).map((p: Confirmacion) => {
                        const name = getPlayerName(p.user);
                        const isPortero = p.match_role === 'portero';
                        return (
                            <div key={p.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                <button 
                                    onClick={() => updateRole({ 
                                        id: convocatoriaId, 
                                        userId: p.user.id, 
                                        role: isPortero ? 'jugador' : 'portero' 
                                    }, {
                                        onSuccess: () => toast.success(`Rol cambiado a ${isPortero ? 'Jugador' : 'Portero'}`)
                                    })}
                                    title={`Cambiar a ${isPortero ? 'Jugador' : 'Portero'}`}
                                    className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm transition-transform active:scale-95 cursor-pointer ${
                                        isPortero 
                                            ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-400/40 shadow-sm' 
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {isPortero ? '🧤' : '⚽'}
                                </button>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1">
                                        {name}
                                        {isPortero && (
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded-md">
                                                Portero
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">{p.user?.phone || 'Sin teléfono'}</p>
                                </div>
                                {p.payment_receipt && (
                                    <button 
                                        onClick={() => window.open(p.payment_receipt!, '_blank')} 
                                        className="p-1.5 text-base hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" 
                                        title="Ver Comprobante de Pago"
                                    >
                                        📄
                                    </button>
                                )}
                                <button 
                                    onClick={() => {
                                        toast(`¿Eliminar la reserva de ${name}?`, {
                                            action: {
                                                label: 'Eliminar',
                                                onClick: () => removeConfirmacion({ id: convocatoriaId, userId: p.user.id })
                                            },
                                            cancel: { label: 'Cancelar', onClick: () => {} }
                                        });
                                    }} 
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors" 
                                    title="Eliminar Reserva"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const teams: Record<number, Confirmacion[]> = {};
    confirmados.forEach((p: Confirmacion) => {
        const t = p.team_number || 0;
        if (!teams[t]) teams[t] = [];
        teams[t].push(p);
    });

    const teamGradients = [
        'from-blue-600 to-cyan-500', 
        'from-rose-600 to-amber-500', 
        'from-emerald-600 to-teal-500', 
        'from-purple-600 to-indigo-500', 
        'from-orange-500 to-yellow-500'
    ];

    return (
        <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <Trophy className="text-amber-500" size={18} />
                    <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                        Equipos Sorteados ({confirmados.length} jugadores en {Object.keys(teams).length} equipos)
                    </h4>
                </div>
                <Button 
                    onClick={handleCopy} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
                >
                    <Copy size={14} /> Copiar Equipos para WhatsApp
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(teams).sort(([a], [b]) => Number(a) - Number(b)).map(([teamNum, players]) => {
                    const num = Number(teamNum);
                    const gradient = num === 0 ? 'bg-slate-700' : `bg-gradient-to-r ${teamGradients[(num - 1) % teamGradients.length]}`;
                    
                    return (
                        <div key={teamNum} className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="flex justify-between items-center">
                                <div className={`px-3 py-1 rounded-xl ${gradient} text-white font-black text-xs uppercase tracking-widest shadow-sm flex items-center gap-1.5`}>
                                    <Trophy size={13} /> {num === 0 ? 'Sin Equipo' : `Equipo ${num}`}
                                </div>
                                <span className="text-xs font-bold text-slate-500">
                                    {players.length} jugadores
                                </span>
                            </div>

                            <div className="space-y-2">
                                {players.sort((a, b) => a.match_role === 'portero' ? -1 : 1).map(p => {
                                    const name = getPlayerName(p.user);
                                    const isPortero = p.match_role === 'portero';

                                    return (
                                        <div key={p.id} className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm text-sm">
                                            <button 
                                                onClick={() => updateRole({ 
                                                    id: convocatoriaId, 
                                                    userId: p.user.id, 
                                                    role: isPortero ? 'jugador' : 'portero' 
                                                }, {
                                                    onSuccess: () => toast.success(`Rol cambiado a ${isPortero ? 'Jugador' : 'Portero'}`)
                                                })}
                                                title={`Cambiar rol de ${name}`}
                                                className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs transition-transform active:scale-95 cursor-pointer ${
                                                    isPortero ? 'bg-amber-400 text-amber-950 shadow-sm ring-1 ring-amber-400/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                                }`}
                                            >
                                                {isPortero ? '🧤' : '⚽'}
                                            </button>

                                            <div className="min-w-0 flex-1">
                                                <span className="font-bold text-slate-900 dark:text-white truncate block text-xs">
                                                    {name}
                                                    {isPortero && (
                                                        <span className="ml-1 text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded">
                                                            Portero
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-[11px] text-slate-400 block truncate">{p.user?.phone || 'Sin número'}</span>
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    toast(`¿Eliminar la reserva de ${name}?`, {
                                                        action: {
                                                            label: 'Eliminar',
                                                            onClick: () => removeConfirmacion({ id: convocatoriaId, userId: p.user.id })
                                                        },
                                                        cancel: { label: 'Cancelar', onClick: () => {} }
                                                    });
                                                }} 
                                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" 
                                                title="Eliminar de convocatoria"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const AdminConvocatoriasPage = () => {
    const [page, setPage] = useState(1);
    const { data: response, isLoading } = useConvocatorias(page, 100);
    const { mutate: crear, isPending: isCreating } = useCreateConvocatoria();
    const { mutate: eliminar } = useDeleteConvocatoria();
    const { mutate: sortear, isPending: isSorting } = useSortearEquipos();
    const { mutate: actualizar, isPending: isUpdating } = useUpdateConvocatoria();
    
    const convs = response?.data || [];
    const meta = response?.meta;

    const [showForm, setShowForm] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [attendanceDialogId, setAttendanceDialogId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'todas' | 'abierta' | 'cerrada' | 'completada' | 'cancelada' | 'martes' | 'jueves' | 'sabado'>('todas');
    const [filterDate, setFilterDate] = useState<string>('');
    const [showRecurringDialog, setShowRecurringDialog] = useState(false);

    const initialForm = { 
        title: '', 
        description: '', 
        location: '', 
        match_date: '', 
        match_time: '21:00', 
        max_players: 14, 
        num_teams: 2, 
        rival: '', 
        cost_per_player: 0 
    };
    const [form, setForm] = useState(initialForm);
    const [debouncedLocation, setDebouncedLocation] = useState('');

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedLocation(form.location), 800);
        return () => clearTimeout(timer);
    }, [form.location]);

    // Resumen de estadísticas
    const stats = useMemo(() => {
        const abiertas = convs.filter(c => c.status === 'abierta').length;
        const completadas = convs.filter(c => c.status === 'completada' || c.status === 'cerrada').length;
        const totalConfirmados = convs.reduce((acc, c) => acc + (c.confirmed_count || 0), 0);
        return { total: convs.length, abiertas, completadas, totalConfirmados };
    }, [convs]);

    // Filtrar convocatorias
    const filteredConvs = useMemo(() => {
        return convs.filter(c => {
            if (filterDate && c.match_date !== filterDate) {
                return false;
            }

            if (statusFilter !== 'todas') {
                if (statusFilter === 'completada' && c.status !== 'completada' && c.status !== 'cerrada') return false;
                if (statusFilter === 'abierta' && c.status !== 'abierta') return false;
                if (statusFilter === 'martes') {
                    const d = new Date(c.match_date + 'T12:00:00');
                    if (d.getDay() !== 2) return false;
                }
                if (statusFilter === 'jueves') {
                    const d = new Date(c.match_date + 'T12:00:00');
                    if (d.getDay() !== 4) return false;
                }
                if (statusFilter === 'sabado') {
                    const d = new Date(c.match_date + 'T12:00:00');
                    if (d.getDay() !== 6) return false;
                }
            }

            if (searchTerm.trim() !== '') {
                const term = searchTerm.toLowerCase();
                const title = (c.title || '').toLowerCase();
                const location = (c.location || '').toLowerCase();
                const rival = (c.rival || '').toLowerCase();
                const date = (c.match_date || '').toLowerCase();
                return title.includes(term) || location.includes(term) || rival.includes(term) || date.includes(term);
            }

            return true;
        });
    }, [convs, statusFilter, filterDate, searchTerm]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            actualizar({ id: editingId, data: form as any }, {
                onSuccess: () => {
                    toast.success('¡Convocatoria actualizada con éxito!');
                    setShowForm(false);
                    setEditingId(null);
                    setForm(initialForm);
                },
                onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al actualizar convocatoria')
            });
        } else {
            crear(form as any, {
                onSuccess: () => {
                    toast.success('¡Convocatoria creada con éxito!');
                    setShowForm(false);
                    setForm(initialForm);
                },
                onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al crear convocatoria')
            });
        }
    };

    const handleEditClick = (c: Convocatoria) => {
        setEditingId(c.id);
        setForm({
            title: c.title,
            description: c.description || '',
            location: c.location,
            match_date: c.match_date,
            match_time: c.match_time ? c.match_time.slice(0, 5) : '20:00',
            max_players: c.max_players,
            num_teams: c.num_teams,
            rival: c.rival || '',
            cost_per_player: c.cost_per_player ? Number(c.cost_per_player) : 0
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSortear = (c: Convocatoria) => {
        if (c.confirmed_count < c.max_players) {
            toast.error(`El sorteo oficial requiere que todos los cupos estén completos (${c.confirmed_count}/${c.max_players} confirmados).`);
            return;
        }

        toast(`¿Sortear aleatoriamente los equipos para "${c.title}"?`, {
            action: {
                label: 'Sortear Ahora 🎲',
                onClick: () => {
                    sortear(c.id, {
                        onSuccess: () => {
                            toast.success('¡Equipos sorteados con éxito! 🎲');
                            setExpandedId(c.id); // Expand teams view automatically
                        },
                        onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al sortear equipos.')
                    });
                }
            },
            cancel: { label: 'Cancelar', onClick: () => {} }
        });
    };

    const handleDeleteConvocatoria = (c: Convocatoria) => {
        toast(`¿Eliminar definitivamente la convocatoria "${c.title}"?`, {
            action: {
                label: 'Eliminar',
                onClick: () => eliminar(c.id, { 
                    onSuccess: () => toast.success('Convocatoria eliminada') 
                })
            },
            cancel: { label: 'Cancelar', onClick: () => {} },
            style: { background: '#ef4444', color: 'white', border: 'none' }
        });
    };

    // Atajos de formato predeterminado
    const applyFormatPreset = (teams: number, players: number) => {
        setForm(prev => ({ ...prev, num_teams: teams, max_players: players }));
        toast.info(`Formato aplicado: ${teams} equipos (${players} jugadores)`);
    };

    // Atajos de costo
    const applyCostPreset = (cost: number) => {
        setForm(prev => ({ ...prev, cost_per_player: cost }));
    };

    // Atajos de fecha
    const applyDatePreset = (daysOffset: number) => {
        const d = new Date();
        d.setDate(d.getDate() + daysOffset);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setForm(prev => ({ ...prev, match_date: `${yyyy}-${mm}-${dd}` }));
    };

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        Gestionar Convocatorias
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Crea pichangas, controla la asistencia, define equipos y sortea las alineaciones.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
                    <Button 
                        type="button"
                        onClick={() => setShowRecurringDialog(true)}
                        className="h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 text-lime-400 border border-lime-400/40 hover:border-lime-400 font-black uppercase tracking-wider rounded-2xl shadow-md px-4 sm:px-5 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all flex-1 sm:flex-initial"
                    >
                        <Repeat className="h-4 w-4 text-lime-400" />
                        <span>⚡ Convocatorias Automáticas</span>
                    </Button>
                    <Button 
                        onClick={() => {
                            if (showForm && editingId) {
                                setEditingId(null);
                                setForm(initialForm);
                            } else {
                                setShowForm(!showForm);
                            }
                        }} 
                        className="h-11 sm:h-12 bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-slate-950 font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-lime-400/20 px-5 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all flex-1 sm:flex-initial"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Nueva Convocatoria</span>
                    </Button>
                </div>
            </div>

            {/* Tarjetas de Métricas Rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Partidos</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
                    <p className="text-xs text-slate-400">En la plataforma</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-emerald-500/20 shadow-md">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Abiertas / Activas</p>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.abiertas}</p>
                    <p className="text-xs text-slate-400">Recibiendo jugadores</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Finalizadas</p>
                    <p className="text-2xl font-black text-slate-600 dark:text-slate-400 mt-1">{stats.completadas}</p>
                    <p className="text-xs text-slate-400">Partidos jugados</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-cyan-500/20 shadow-md">
                    <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Confirmaciones</p>
                    <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">{stats.totalConfirmados}</p>
                    <p className="text-xs text-slate-400">Total cupos ocupados</p>
                </div>
            </div>

            {/* Modal / Formulario Crear & Editar */}
            <AnimatePresence>
                {showForm && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, height: 0 }} 
                        animate={{ opacity: 1, y: 0, height: 'auto' }} 
                        exit={{ opacity: 0, y: -20, height: 0 }} 
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border-2 border-emerald-500/30 shadow-2xl space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                        <Trophy className="text-primary" />
                                        {editingId ? 'Editar Convocatoria' : 'Crear Nueva Convocatoria'}
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Configura la cancha, cupos, formato de equipos y costo por jugador.
                                    </p>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => { setShowForm(false); setEditingId(null); setForm(initialForm); }} 
                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Título */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        Título del Partido *
                                    </label>
                                    <Input 
                                        value={form.title} 
                                        onChange={e => setForm({...form, title: e.target.value})} 
                                        placeholder="Ej: Pichanga del Sábado • Noche de Clásico" 
                                        required 
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl text-base font-bold" 
                                    />
                                </div>

                                {/* Descripción */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        Descripción o Indicaciones (Opcional)
                                    </label>
                                    <Textarea 
                                        value={form.description} 
                                        onChange={e => setForm({...form, description: e.target.value})} 
                                        placeholder="Ej: Llevar camiseta clara y oscura. Puntualidad 15 min antes para calentar..." 
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl min-h-[75px]" 
                                    />
                                </div>

                                {/* Ubicación */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <MapPin size={14} className="text-primary" /> Ubicación de la Cancha *
                                    </label>
                                    <Input 
                                        value={form.location} 
                                        onChange={e => setForm({...form, location: e.target.value})} 
                                        placeholder="Ej: Estadio San Ramón, Cajamarca" 
                                        required 
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" 
                                    />
                                    {debouncedLocation.length > 3 && (
                                        <div className="w-full h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 relative shadow-inner">
                                            <div className="absolute top-0 left-0 bg-primary/90 text-white text-[10px] px-2 py-0.5 rounded-br-lg z-10 font-bold uppercase tracking-wider">
                                                Vista Previa del Mapa
                                            </div>
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                style={{ border: 0 }}
                                                src={`https://maps.google.com/maps?q=${encodeURIComponent(debouncedLocation)}&t=m&z=15&output=embed&iwloc=near`}
                                            ></iframe>
                                        </div>
                                    )}
                                </div>

                                {/* Rival */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <Swords size={14} className="text-amber-500" /> Rival (Opcional - si es partido contra otro club)
                                    </label>
                                    <Input 
                                        value={form.rival} 
                                        onChange={e => setForm({...form, rival: e.target.value})} 
                                        placeholder="Ej: Los Pumas FC (dejar vacío si es interna)" 
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" 
                                    />
                                </div>

                                {/* Fecha y Atajos */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <CalendarDays size={14} className="text-emerald-500" /> Fecha del Partido *
                                        </label>
                                        <div className="flex gap-1">
                                            <button type="button" onClick={() => applyDatePreset(0)} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md">Hoy</button>
                                            <button type="button" onClick={() => applyDatePreset(1)} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md">Mañana</button>
                                        </div>
                                    </div>
                                    <Input 
                                        type="date" 
                                        value={form.match_date} 
                                        onChange={e => setForm({...form, match_date: e.target.value})} 
                                        required 
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl font-bold" 
                                    />
                                </div>

                                {/* Hora */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <Clock size={14} className="text-cyan-500" /> Hora del Partido *
                                    </label>
                                    <Input 
                                        type="time" 
                                        value={form.match_time} 
                                        onChange={e => setForm({...form, match_time: e.target.value})} 
                                        required 
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl font-bold text-lg" 
                                    />
                                </div>

                                {/* Formato de Equipos y Presets */}
                                <div className="space-y-3 md:col-span-2 p-4 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <Zap size={14} className="text-amber-500" /> Atajos Rápidos de Formato:
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            <button 
                                                type="button" 
                                                onClick={() => applyFormatPreset(2, 14)} 
                                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors"
                                            >
                                                ⚡ F7 (2 eq • 14 jug)
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => applyFormatPreset(2, 16)} 
                                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors"
                                            >
                                                ⚡ F8 (2 eq • 16 jug)
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => applyFormatPreset(3, 21)} 
                                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors"
                                            >
                                                ⚡ 3 Equipos (21 jug)
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => applyFormatPreset(4, 28)} 
                                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors"
                                            >
                                                ⚡ 4 Equipos (28 jug)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                Número de Equipos
                                            </label>
                                            <Input 
                                                type="number" 
                                                min={2} 
                                                max={10} 
                                                value={form.num_teams} 
                                                onChange={e => setForm({...form, num_teams: parseInt(e.target.value) || 2})} 
                                                required 
                                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white h-12 rounded-xl font-black text-lg" 
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                Máx. Jugadores Confirmados
                                            </label>
                                            <Input 
                                                type="number" 
                                                min={2} 
                                                value={form.max_players} 
                                                onChange={e => setForm({...form, max_players: parseInt(e.target.value) || 14})} 
                                                required 
                                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white h-12 rounded-xl font-black text-lg" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Costo por Jugador */}
                                <div className="space-y-2 md:col-span-2">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <DollarSign size={14} className="text-emerald-500" /> Costo por Jugador (S/)
                                        </label>
                                        <div className="flex gap-1.5">
                                            <button type="button" onClick={() => applyCostPreset(0)} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md">Gratis (S/ 0)</button>
                                            <button type="button" onClick={() => applyCostPreset(5)} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md">S/ 5.00</button>
                                            <button type="button" onClick={() => applyCostPreset(10)} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md">S/ 10.00</button>
                                            <button type="button" onClick={() => applyCostPreset(15)} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md">S/ 15.00</button>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-500 text-lg">S/</span>
                                        <Input 
                                            type="number" 
                                            step="0.50" 
                                            min={0} 
                                            value={form.cost_per_player} 
                                            onChange={e => setForm({...form, cost_per_player: parseFloat(e.target.value) || 0})} 
                                            required 
                                            className="pl-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 h-12 rounded-xl font-black text-xl" 
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        {form.cost_per_player > 0 
                                            ? `Se descontará S/. ${Number(form.cost_per_player).toFixed(2)} del saldo de cada jugador al postular.`
                                            : 'El partido no tiene costo de inscripción (Gratis).'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button 
                                    type="submit" 
                                    disabled={isCreating || isUpdating} 
                                    className={`flex-1 h-14 font-black uppercase tracking-widest rounded-xl shadow-lg border-0 text-base flex items-center justify-center gap-2 ${
                                        editingId 
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                                    }`}
                                >
                                    {isCreating || isUpdating 
                                        ? 'Guardando...' 
                                        : editingId ? '💾 Actualizar Convocatoria' : '🏟️ Publicar Convocatoria'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setShowForm(false); setEditingId(null); setForm(initialForm); }}
                                    className="h-14 px-6 rounded-xl font-bold uppercase text-xs border-slate-300 dark:border-slate-700"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Barra de Búsqueda y Filtros */}
            <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                    {/* Tabs de Estado */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setStatusFilter('todas')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                statusFilter === 'todas'
                                    ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Todas ({convs.length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('abierta')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                statusFilter === 'abierta'
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                            Abiertas ({stats.abiertas})
                        </button>
                        <button
                            onClick={() => setStatusFilter('martes')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                statusFilter === 'martes'
                                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-cyan-400'
                            }`}
                        >
                            Martes
                        </button>
                        <button
                            onClick={() => setStatusFilter('jueves')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                statusFilter === 'jueves'
                                    ? 'bg-lime-400 text-slate-950 font-black shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-lime-400'
                            }`}
                        >
                            Jueves
                        </button>
                        <button
                            onClick={() => setStatusFilter('sabado')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                statusFilter === 'sabado'
                                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-amber-400'
                            }`}
                        >
                            Sábados
                        </button>
                        <button
                            onClick={() => setStatusFilter('completada')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                statusFilter === 'completada'
                                    ? 'bg-slate-600 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Finalizadas ({stats.completadas})
                        </button>
                    </div>

                    {/* Filtro por Fecha y Buscador */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
                        {/* Selector interactivo de Fecha */}
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 px-3.5 h-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Fecha:</span>
                            <input 
                                type="date" 
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                            />
                            {filterDate && (
                                <button 
                                    onClick={() => setFilterDate('')} 
                                    title="Quitar filtro de fecha"
                                    className="text-[11px] text-slate-400 hover:text-white bg-slate-200 dark:bg-slate-800 hover:bg-rose-500 dark:hover:bg-rose-500 rounded-full w-5 h-5 flex items-center justify-center transition-colors font-bold ml-1"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Buscador */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar por título, cancha, fecha o rival..."
                                className="pl-11 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')} 
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Listado de Convocatorias Rediseñadas */}
            <div className="space-y-4">
                {filteredConvs.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
                        <CheckCircle2 size={48} className="mx-auto text-emerald-500 opacity-80" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {searchTerm ? 'No hay partidos que coincidan con la búsqueda' : 'No hay convocatorias en esta sección.'}
                        </h3>
                        <p className="text-slate-500 text-sm">
                            {searchTerm ? 'Prueba con otra palabra clave.' : 'Presiona "+ Nueva Convocatoria" para crear la primera.'}
                        </p>
                    </div>
                ) : (
                    filteredConvs.map((c, i) => {
                        const isAbierta = c.status === 'abierta';
                        const isFinalizada = c.status === 'completada' || c.status === 'cerrada';
                        const isCupoLleno = c.confirmed_count >= c.max_players;
                        const fillPercent = Math.min(100, Math.round((c.confirmed_count / c.max_players) * 100)) || 0;
                        const isExpanded = expandedId === c.id;
                        const cost = Number(c.cost_per_player || 0);

                        return (
                            <motion.div 
                                key={c.id} 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ delay: i * 0.03 }}
                                className={`bg-white dark:bg-slate-900 rounded-3xl border shadow-xl overflow-hidden transition-all ${
                                    isAbierta 
                                        ? 'border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/5' 
                                        : 'border-slate-200 dark:border-slate-800/80 opacity-95'
                                }`}
                            >
                                <div className="p-6 space-y-5">
                                    {/* Fila Superior: Badges de Estado, Formato, Costo y Rival */}
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Estado */}
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                                isAbierta 
                                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}>
                                                {isAbierta && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                                                {c.status}
                                            </span>

                                            {/* Formato Equipos */}
                                            <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-xs font-black uppercase tracking-wider">
                                                👕 {c.num_teams} Equipos
                                            </span>

                                            {/* Costo */}
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                                cost > 0 
                                                    ? 'bg-lime-500/15 text-lime-600 dark:text-lime-400 border border-lime-500/30' 
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                            }`}>
                                                💰 {cost > 0 ? `S/. ${cost.toFixed(2)}` : 'Gratis'}
                                            </span>

                                            {/* Rival */}
                                            {c.rival && (
                                                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                                                    <Swords size={12} /> vs {c.rival}
                                                </span>
                                            )}
                                        </div>

                                        {/* Sorteo Status Badge */}
                                        <div>
                                            {c.has_teams ? (
                                                <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                                    <Trophy size={13} /> Sorteado ✓
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium">
                                                    Equipos pendientes de sorteo
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Fila Central: Título y Metadatos */}
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                                            {c.title}
                                        </h3>
                                        
                                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                            <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                                                <CalendarDays size={16} className="text-emerald-500" />
                                                {formatMatchDateTime(c.match_date, c.match_time)}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                                <MapPin size={16} className="text-primary" />
                                                {c.location}
                                            </span>
                                        </div>

                                        {c.description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic pt-1">
                                                "{c.description}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Barra de Progreso de Capacidad de Jugadores */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <Users size={15} className="text-primary" />
                                                Jugadores: <span className="font-black text-slate-900 dark:text-white text-sm">{c.confirmed_count} / {c.max_players}</span>
                                                {isCupoLleno ? (
                                                    <span className="ml-2 font-black text-emerald-600 dark:text-emerald-400 uppercase text-[11px]">
                                                        (¡Cupo Completo!)
                                                    </span>
                                                ) : (
                                                    <span className="ml-1 text-slate-400">
                                                        (Faltan {c.max_players - c.confirmed_count})
                                                    </span>
                                                )}
                                            </span>
                                            <span className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                <Shield size={14} /> {c.porteros_count} / {c.num_teams} porteros
                                            </span>
                                        </div>

                                        {/* Barra visual de llenado */}
                                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 rounded-full ${
                                                    isCupoLleno 
                                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                                                        : fillPercent > 50 
                                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500' 
                                                            : 'bg-gradient-to-r from-amber-500 to-orange-400'
                                                }`}
                                                style={{ width: `${fillPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Barra de Acciones Rediseñada y Limpia */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                        {/* Acciones Primarias */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Botón Tomar Lista / Asistencia */}
                                            <Button 
                                                onClick={() => setAttendanceDialogId(c.id)} 
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md"
                                            >
                                                <ClipboardCheck size={16} /> Tomar Lista
                                            </Button>

                                            {/* Botón Ver / Ocultar Equipos */}
                                            <Button 
                                                onClick={() => setExpandedId(isExpanded ? null : c.id)} 
                                                variant="outline" 
                                                className={`h-11 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 border transition-all ${
                                                    isExpanded 
                                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700' 
                                                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
                                                {isExpanded ? 'Ocultar Equipos' : 'Ver Equipos'}
                                            </Button>

                                            {/* Botón Sortear */}
                                            <Button 
                                                onClick={() => handleSortear(c)} 
                                                disabled={isSorting || c.confirmed_count < c.max_players} 
                                                className={`h-11 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all ${
                                                    c.confirmed_count < c.max_players 
                                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700' 
                                                        : c.has_teams
                                                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                                                            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                                                }`}
                                                title={c.confirmed_count < c.max_players ? `Requiere cupo completo (${c.confirmed_count}/${c.max_players})` : 'Sortear alineaciones'}
                                            >
                                                <Shuffle size={16} /> {c.has_teams ? 'Volver a Sortear' : 'Sortear'}
                                            </Button>
                                        </div>

                                        {/* Acciones Secundarias (Ver Página, Editar, Eliminar) */}
                                        <div className="flex items-center gap-2">
                                            {/* Ver Página Pública */}
                                            <Link to={`/convocatorias/${c.id}`} target="_blank">
                                                <Button 
                                                    variant="outline" 
                                                    className="h-11 px-3.5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:border-emerald-500/40 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                                                    title="Abrir página pública del partido"
                                                >
                                                    <ExternalLink size={15} /> <span className="hidden sm:inline">Ver Partido</span>
                                                </Button>
                                            </Link>

                                            {/* Editar */}
                                            <Button 
                                                onClick={() => handleEditClick(c)} 
                                                variant="outline" 
                                                className="h-11 px-3.5 rounded-xl border-slate-200 dark:border-slate-700 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-bold text-xs uppercase"
                                                title="Editar detalles del partido"
                                            >
                                                <Edit3 size={16} />
                                            </Button>

                                            {/* Eliminar */}
                                            <Button 
                                                onClick={() => handleDeleteConvocatoria(c)} 
                                                variant="outline" 
                                                className="h-11 px-3.5 rounded-xl border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold text-xs uppercase"
                                                title="Eliminar convocatoria"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Vista Expandida de Equipos y Confirmados */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }} 
                                            animate={{ opacity: 1, height: 'auto' }} 
                                            exit={{ opacity: 0, height: 0 }} 
                                            className="border-t border-slate-200 dark:border-slate-800 p-6 bg-slate-50/70 dark:bg-slate-950/70"
                                        >
                                            <TeamsList convocatoriaId={c.id} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Paginación */}
            {meta && meta.last_page > 1 && (
                <div className="mt-8 flex justify-center">
                    <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={setPage} />
                </div>
            )}

            {/* Diálogo de Asistencia Rápida */}
            {attendanceDialogId && (
                <AdminAttendanceDialog 
                    convocatoriaId={attendanceDialogId} 
                    onClose={() => setAttendanceDialogId(null)} 
                />
            )}

            {/* Diálogo de Horarios Recurrentes y Convocatorias Automáticas */}
            <AdminRecurringScheduleDialog 
                isOpen={showRecurringDialog} 
                onClose={() => setShowRecurringDialog(false)} 
            />
        </div>
    );
};
