import React, { useState } from 'react';
import { usePublicEvents, useCreateEvent, useDeleteEvent, useUpdateEvent } from '@/hooks/useEvents';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Event } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit, Calendar, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { AdminEventRegistrationsModal } from './AdminEventRegistrationsModal';
import { Pagination } from '@/components/ui/Pagination';

export const AdminEventsPage = () => {
    const [page, setPage] = useState(1);
    const { data: eventsResponse, isLoading } = usePublicEvents(page);
    const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
    const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent();
    const { mutate: deleteEvent } = useDeleteEvent();
    
    const events = eventsResponse?.data || [];
    const meta = eventsResponse?.meta;

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [viewEventId, setViewEventId] = useState<number | null>(null);
    const [form, setForm] = useState({ title: '', description: '', location: '', event_date: '', event_time: '', max_participants: 50, cover_image: null as File | null });

    if (isLoading && !events.length) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    const openCreateForm = () => {
        setEditingId(null);
        setForm({ title: '', description: '', location: '', event_date: '', event_time: '', max_participants: 50, cover_image: null });
        setShowForm(true);
    };

    const openEditForm = (e: Event) => {
        setEditingId(e.id);
        setForm({ title: e.title, description: e.description, location: e.location, event_date: e.event_date, event_time: e.event_time, max_participants: e.max_participants || 50, cover_image: null });
        setShowForm(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                fd.append(key, value.toString());
            }
        });
        if ((form as any).cover_image instanceof File) {
            fd.set('cover_image', (form as any).cover_image);
        }

        if (editingId) {
            updateEvent({ id: editingId, data: fd }, {
                onSuccess: () => {
                    toast.success('Evento actualizado con éxito');
                    setShowForm(false);
                },
                onError: () => toast.error('Error al actualizar el evento')
            });
        } else {
            createEvent(fd as any, {
                onSuccess: () => {
                    toast.success('Evento creado con éxito');
                    setShowForm(false);
                },
                onError: () => toast.error('Error al crear el evento')
            });
        }
    };

    const handleDelete = (id: number) => {
        toast('¿Seguro que deseas eliminar este evento?', {
            action: {
                label: 'Eliminar',
                onClick: () => {
                    deleteEvent(id, {
                        onSuccess: () => toast.success('Evento eliminado'),
                        onError: () => toast.error('Error al eliminar')
                    });
                }
            },
            cancel: { label: 'Cancelar', onClick: () => {} },
            style: { background: '#ef4444', color: 'white', border: 'none' }
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Gestionar Eventos</h1>
                    <p className="text-slate-500 dark:text-slate-400">Organiza parrilladas, reuniones y celebraciones del club.</p>
                </div>
                <Button onClick={openCreateForm} className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-0 font-black uppercase tracking-wider rounded-xl shadow-lg">
                    <Plus className="mr-2 h-5 w-5" /> Nuevo Evento
                </Button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase">{editingId ? 'Editar Evento' : 'Crear Evento'}</h2>
                                <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X /></button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Título del Evento</label>
                                    <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ej: Parrillada de Fin de Mes" required className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Descripción</label>
                                    <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detalles del evento..." required className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl min-h-[80px]" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">📍 Ubicación</label>
                                    <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Ej: Casa de Juan" required className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">📅 Fecha</label>
                                    <Input type="date" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} required className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">🕐 Hora</label>
                                    <Input type="time" value={form.event_time} onChange={e => setForm({...form, event_time: e.target.value})} required className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">👥 Máx. Participantes</label>
                                    <Input type="number" min={1} value={form.max_participants || ''} onChange={e => setForm({...form, max_participants: e.target.value ? parseInt(e.target.value) : 0})} required className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">📸 Imagen de Portada (Opcional)</label>
                                    <Input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) setForm({...form, cover_image: file as any});
                                        }}
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" 
                                    />
                                </div>
                            </div>
                            
                            <Button type="submit" disabled={isCreating || isUpdating} className="w-full h-14 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-black uppercase tracking-widest rounded-xl shadow-lg border-0 text-lg">
                                {isCreating || isUpdating ? 'Guardando...' : (editingId ? '💾 Guardar Cambios' : '🎉 Crear Evento')}
                            </Button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Evento</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Fecha y Hora</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(events as Event[]).map((e, i) => (
                                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                                                <Calendar size={20} />
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{e.title}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{e.event_date} {e.event_time}</span>
                                    </td>
                                    <td className="p-5 text-right space-x-2">
                                        <Button variant="outline" onClick={() => setViewEventId(e.id)} className="border-primary/50 text-primary hover:bg-primary/10 rounded-xl h-9 px-3">
                                            <Users size={16} />
                                        </Button>
                                        <Button variant="outline" onClick={() => openEditForm(e)} className="border-slate-300 dark:border-slate-700 rounded-xl h-9 px-3">
                                            <Edit size={16} className="text-slate-600 dark:text-slate-400" />
                                        </Button>
                                        <Button variant="outline" onClick={() => handleDelete(e.id)} className="border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl h-9 px-3">
                                            <Trash2 size={16} className="text-red-500" />
                                        </Button>
                                    </td>
                                </motion.tr>
                            ))}
                            {(events as Event[]).length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-500 italic">No hay eventos programados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {meta && meta.last_page > 1 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={setPage} />
                    </div>
                )}
            </div>

            <AdminEventRegistrationsModal 
                eventId={viewEventId} 
                onClose={() => setViewEventId(null)} 
            />
        </div>
    );
};
