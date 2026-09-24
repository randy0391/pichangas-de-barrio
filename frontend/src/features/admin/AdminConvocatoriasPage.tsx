import React, { useState } from 'react';
import { useConvocatorias, useCreateConvocatoria, useUpdateConvocatoria, useDeleteConvocatoria, useSortearEquipos, useConvocatoria, useRemoveConfirmacion } from '@/hooks/useConvocatorias';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Convocatoria, Confirmacion } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Plus, Shuffle, Trash2, Eye, X, Users, Shield, MapPin, CalendarDays, Clock } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { AdminAttendanceDialog } from './AdminAttendanceDialog';

const TeamsList = ({ convocatoriaId }: { convocatoriaId: number }) => {
    const { data: c } = useConvocatoria(convocatoriaId);
    const { mutate: removeConfirmacion } = useRemoveConfirmacion();
    if (!c || !c.confirmaciones) return null;

    const confirmados = c.confirmaciones.filter((p: Confirmacion) => p.status === 'confirmado');
    const hasTeams = confirmados.some((p: Confirmacion) => p.team_number !== null);

    if (!hasTeams) return (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="font-black text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Jugadores Confirmados ({confirmados.length}/{c.max_players})</h4>
            {confirmados.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Nadie ha confirmado asistencia aún.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {confirmados.sort((a,b) => a.match_role === 'portero' ? -1 : 1).map((p: Confirmacion) => (
                        <div key={p.id} className="flex items-center gap-3 text-sm bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-xs ${p.match_role === 'portero' ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                {p.match_role === 'portero' ? '🧤' : '⚽'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-900 dark:text-white truncate">{p.user?.name}</p>
                                <p className="text-xs text-slate-500 truncate">{p.user?.phone || 'Sin número'}</p>
                            </div>
                            {p.payment_receipt && (
                                <button onClick={() => window.open(p.payment_receipt!, '_blank')} className="text-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Ver Comprobante">
                                    📄
                                </button>
                            )}
                            <button onClick={() => {
                                toast(`¿Eliminar la reserva de ${p.user?.name}?`, {
                                    action: {
                                        label: 'Eliminar',
                                        onClick: () => removeConfirmacion({ id: convocatoriaId, userId: p.user.id }, {
                                            onSuccess: () => toast.success('Reserva eliminada')
                                        })
                                    },
                                    cancel: {
                                        label: 'Cancelar',
                                        onClick: () => {}
                                    }
                                });
                            }} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-lg transition-colors" title="Eliminar Reserva">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
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

    const teamColors = ['from-primary to-cyan-400', 'from-accent to-pink-400', 'from-lime-400 to-emerald-400', 'from-amber-400 to-orange-400', 'from-violet-400 to-purple-400'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
            {Object.entries(teams).sort(([a],[b]) => Number(a)-Number(b)).map(([teamNum, players]) => (
                <div key={teamNum} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className={`inline-block px-3 py-1 rounded-full ${Number(teamNum) === 0 ? 'bg-slate-500' : `bg-gradient-to-r ${teamColors[(Number(teamNum)-1) % teamColors.length]}`} text-white font-black text-xs uppercase tracking-widest mb-3`}>
                        {Number(teamNum) === 0 ? 'Sin Equipo' : `Equipo ${teamNum}`}
                    </div>
                    <div className="space-y-2">
                        {players.sort((a,b) => a.match_role === 'portero' ? -1 : 1).map(p => (
                            <div key={p.id} className="flex items-center gap-3 text-sm bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm">
                                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-xs ${p.match_role === 'portero' ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                    {p.match_role === 'portero' ? '🧤' : '⚽'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="font-bold text-slate-900 dark:text-white truncate block">{p.user?.name} {p.match_role === 'portero' && <span className="ml-1 text-[10px] text-yellow-600 dark:text-yellow-400 font-bold uppercase bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">Portero</span>}</span>
                                    <span className="text-xs text-slate-500 block truncate">{p.user?.phone || 'Sin número'}</span>
                                </div>
                                {p.payment_receipt && (
                                    <button onClick={() => window.open(p.payment_receipt!, '_blank')} className="text-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Ver Comprobante">
                                        📄
                                    </button>
                                )}
                                <button onClick={() => {
                                    toast(`¿Eliminar la reserva de ${p.user?.name}?`, {
                                        action: {
                                            label: 'Eliminar',
                                            onClick: () => removeConfirmacion({ id: convocatoriaId, userId: p.user.id }, {
                                                onSuccess: () => toast.success('Reserva eliminada')
                                            })
                                        },
                                        cancel: {
                                            label: 'Cancelar',
                                            onClick: () => {}
                                        }
                                    });
                                }} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-lg transition-colors" title="Eliminar Reserva">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const AdminConvocatoriasPage = () => {
    const [page, setPage] = useState(1);
    const { data: response, isLoading } = useConvocatorias(page);
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
    const initialForm = { title: '', description: '', location: '', match_date: '', match_time: '', max_players: 14, num_teams: 2, rival: '' };
    const [form, setForm] = useState(initialForm);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            actualizar({ id: editingId, data: form as any }, {
                onSuccess: () => {
                    toast.success('¡Convocatoria actualizada!');
                    setShowForm(false);
                    setEditingId(null);
                    setForm(initialForm);
                },
                onError: () => toast.error('Error al actualizar')
            });
        } else {
            crear(form as any, {
                onSuccess: () => {
                    toast.success('¡Convocatoria creada!');
                    setShowForm(false);
                    setForm(initialForm);
                },
                onError: () => toast.error('Error al crear')
            });
        }
    };

    const handleEditClick = (c: Convocatoria) => {
        setEditingId(c.id);
        setForm({
            title: c.title,
            description: c.description,
            location: c.location,
            match_date: c.match_date,
            match_time: c.match_time.slice(0, 5), // Assuming HH:mm:ss, we want HH:mm for the input type="time"
            max_players: c.max_players,
            num_teams: c.num_teams,
            rival: c.rival || ''
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSortear = (id: number) => {
        sortear(id, {
            onSuccess: () => toast.success('¡Equipos sorteados! 🎲'),
            onError: () => toast.error('Error al sortear. Verifica que haya jugadores confirmados.')
        });
    };

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Gestionar Convocatorias</h1>
                    <p className="text-slate-500 dark:text-slate-400">Crea partidos, define equipos y sortea las alineaciones.</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-primary to-accent text-white border-0 font-bold uppercase tracking-wider rounded-xl shadow-lg">
                    <Plus className="mr-2 h-5 w-5" /> Nueva Convocatoria
                </Button>
            </div>

            {/* Create / Edit Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase">{editingId ? 'Actualizar Partido' : 'Crear Partido'}</h2>
                                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(initialForm); }} className="text-slate-400 hover:text-white"><X /></button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Título del Partido</label>
                                    <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ej: Pichanga del Sábado" required className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Descripción</label>
                                    <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detalles del partido..." required className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl min-h-[80px]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">📍 Ubicación</label>
                                    <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Cancha sintética norte" required className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">⚔️ Rival (opcional)</label>
                                    <Input value={form.rival} onChange={e => setForm({...form, rival: e.target.value})} placeholder="Los Pumas FC" className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">📅 Fecha</label>
                                    <Input type="date" value={form.match_date} onChange={e => setForm({...form, match_date: e.target.value})} required className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">🕐 Hora</label>
                                    <Input type="time" value={form.match_time} onChange={e => setForm({...form, match_time: e.target.value})} required className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">👥 Máx. Jugadores</label>
                                    <Input type="number" min={2} value={form.max_players} onChange={e => setForm({...form, max_players: parseInt(e.target.value)})} required className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl font-bold text-lg" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">🏟️ Número de Equipos</label>
                                    <Input type="number" min={2} max={10} value={form.num_teams} onChange={e => setForm({...form, num_teams: parseInt(e.target.value)})} required className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl font-bold text-lg" />
                                </div>
                            </div>
                            
                            <Button type="submit" disabled={isCreating || isUpdating} className={`w-full h-14 font-black uppercase tracking-widest rounded-xl shadow-lg border-0 text-lg ${editingId ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white' : 'bg-gradient-to-r from-lime-400 to-lime-500 text-slate-900'}`}>
                                {isCreating || isUpdating ? 'Guardando...' : editingId ? '💾 Actualizar Convocatoria' : '🏟️ Crear Convocatoria'}
                            </Button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Convocatorias List */}
            <div className="space-y-4">
                {(convs as Convocatoria[]).map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden"
                    >
                        <div className="p-6 flex flex-col lg:flex-row gap-4 justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{c.title}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${c.status === 'abierta' ? 'bg-lime-400/20 text-lime-600 dark:text-lime-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>{c.status}</span>
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">{c.num_teams} equipos</span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                    <span className="flex items-center gap-1"><CalendarDays size={14} /> {c.match_date}</span>
                                    <span className="flex items-center gap-1"><Clock size={14} /> {c.match_time}</span>
                                    <span className="flex items-center gap-1"><MapPin size={14} /> {c.location}</span>
                                </div>
                                <div className="mt-3 flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1 font-bold text-slate-900 dark:text-white"><Users size={16} className="text-primary" /> {c.confirmed_count}/{c.max_players}</span>
                                    <span className="flex items-center gap-1 font-bold text-yellow-600 dark:text-yellow-400"><Shield size={16} /> {c.porteros_count}/{c.num_teams} porteros</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 items-center">
                                <Button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)} variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase">
                                    <Eye className="mr-1 h-4 w-4" /> {expandedId === c.id ? 'Ocultar' : 'Ver Equipos'}
                                </Button>
                                <Button onClick={() => setAttendanceDialogId(c.id)} variant="outline" className="border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs uppercase">
                                    📋 Lista
                                </Button>
                                <Button onClick={() => handleSortear(c.id)} disabled={isSorting || c.confirmed_count < c.max_players || c.confirmaciones?.some((p: Confirmacion) => p.team_number !== null)} className={`border-0 rounded-xl font-bold text-xs uppercase shadow-md ${c.confirmed_count < c.max_players || c.confirmaciones?.some((p: Confirmacion) => p.team_number !== null) ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'}`}>
                                    <Shuffle className="mr-1 h-4 w-4" /> {c.confirmaciones?.some((p: Confirmacion) => p.team_number !== null) ? 'Sorteado' : 'Sortear'}
                                </Button>
                                <Button onClick={() => handleEditClick(c)} variant="outline" className="border-blue-300 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl font-bold text-xs uppercase">
                                    ✏️
                                </Button>
                                <Button onClick={() => { 
                                    toast('¿Eliminar esta convocatoria?', {
                                        action: {
                                            label: 'Eliminar',
                                            onClick: () => eliminar(c.id, { onSuccess: () => toast.success('Eliminada') })
                                        },
                                        cancel: {
                                            label: 'Cancelar',
                                            onClick: () => {}
                                        }
                                    });
                                }} variant="outline" className="border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl font-bold text-xs uppercase">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedId === c.id && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-slate-100 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-950/50">
                                    <TeamsList convocatoriaId={c.id} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {(convs as Convocatoria[]).length === 0 && (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 text-lg">No hay convocatorias creadas. ¡Crea la primera!</p>
                </div>
            )}

            {meta && meta.last_page > 1 && (
                <div className="mt-8">
                    <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={setPage} />
                </div>
            )}

            {attendanceDialogId && (
                <AdminAttendanceDialog 
                    convocatoriaId={attendanceDialogId} 
                    onClose={() => setAttendanceDialogId(null)} 
                />
            )}
        </div>
    );
};
