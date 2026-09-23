import React, { useState } from 'react';
import { usePublicEvents, useRegisterEvent } from '@/hooks/useEvents';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Clock, CalendarDays, Ticket } from 'lucide-react';
import { Event } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/Pagination';

export const EventsPage = () => {
    const [page, setPage] = useState(1);
    const { data: eventsResponse, isLoading } = usePublicEvents(page);
    const { mutate: registerEvent, isPending: isRegistering } = useRegisterEvent();
    const { user } = useAuthStore();
    const [filter, setFilter] = useState<'proximo' | 'completado'>('proximo');
    
    const events = eventsResponse?.data || [];
    const meta = eventsResponse?.meta;

    const filtered = (events as Event[]).filter(e => {
        if (filter !== 'proximo') return e.status === filter;
        const eventDate = new Date(e.event_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return e.status === 'proximo' && eventDate >= today;
    });

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight mb-2">
                        Calendario de <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-primary">Eventos</span>
                    </h1>
                    <p className="text-slate-400 text-lg">Revisa los próximos encuentros, entrenamientos y torneos del club.</p>
                </div>
                
                <div className="flex bg-slate-900/80 p-1.5 rounded-full border border-slate-700/50 backdrop-blur-md">
                    <button 
                        onClick={() => setFilter('proximo')} 
                        className={`px-6 py-2 rounded-full font-bold text-sm transition-all capitalize ${filter === 'proximo' ? 'bg-lime-400 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        Próximos
                    </button>
                    <button 
                        onClick={() => setFilter('completado')} 
                        className={`px-6 py-2 rounded-full font-bold text-sm transition-all capitalize ${filter === 'completado' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        Completados
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filtered.map((event: Event, index: number) => (
                    <motion.div 
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative bg-white dark:bg-slate-900 rounded-3xl flex flex-col sm:flex-row overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 group"
                    >
                        {/* Ticket Stub (Left Side) */}
                        <div className="bg-gradient-to-br from-primary to-accent sm:w-1/3 p-6 flex flex-col justify-center items-center text-white relative border-b-2 sm:border-b-0 sm:border-r-2 border-dashed border-white/30">
                            <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#070b14] rounded-full hidden sm:block"></div>
                            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-[#070b14] rounded-full hidden sm:block"></div>
                            
                            <CalendarDays size={32} className="mb-2 opacity-80" />
                            <div className="text-4xl font-black tracking-tighter leading-none mb-1">
                                {format(new Date(event.event_date), 'dd')}
                            </div>
                            <div className="text-xl font-bold uppercase tracking-wider">
                                {format(new Date(event.event_date), 'MMM', { locale: es })}
                            </div>
                            <div className="text-sm font-medium opacity-80 mt-1">
                                {format(new Date(event.event_date), 'yyyy')}
                            </div>
                        </div>

                        {/* Ticket Content (Right Side) */}
                        <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between relative">
                            <div className="absolute top-4 right-4">
                                <Badge variant={filter === 'proximo' ? 'default' : 'secondary'} className={filter === 'proximo' ? 'bg-lime-400 text-slate-900 hover:bg-lime-500' : ''}>
                                    {event.status}
                                </Badge>
                            </div>
                            
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 pr-16 leading-tight group-hover:text-primary transition-colors">{event.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm line-clamp-2">{event.description}</p>
                                
                                {event.cover_image && (
                                    <div className="mb-4 h-32 w-full rounded-xl overflow-hidden">
                                        <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                
                                <div className="flex flex-wrap items-center gap-y-4 gap-x-6 mb-6">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium text-sm">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary shrink-0">
                                            <Clock size={16} />
                                        </div>
                                        <span>{event.event_time} hrs</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium text-sm">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-accent shrink-0">
                                            <MapPin size={16} />
                                        </div>
                                        <span>{event.location}</span>
                                    </div>
                                    {event.max_participants ? (
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium text-sm">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lime-500 shrink-0">
                                                <Ticket size={16} />
                                            </div>
                                            <span>Cupo: {Math.max(0, event.max_participants - (event.registrations_count || 0))} libres</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium text-sm">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lime-500 shrink-0">
                                                <Ticket size={16} />
                                            </div>
                                            <span>{event.registrations_count || 0} inscritos (Sin límite)</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(() => {
                                const isRegistered = user && event.registrations?.some((r: any) => r.user_id === user.id);
                                const isFull = event.max_participants && (event.registrations_count || 0) >= event.max_participants;

                                if (!user) {
                                    return (
                                        <Link to="/login">
                                            <Button variant="outline" className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors font-bold uppercase tracking-wider h-12 rounded-xl">
                                                Inicia sesión para participar
                                            </Button>
                                        </Link>
                                    );
                                }

                                if (filter !== 'proximo') {
                                    return <Button disabled variant="outline" className="w-full font-bold uppercase tracking-wider h-12 rounded-xl">Evento Finalizado</Button>;
                                }

                                if (isRegistered) {
                                    return (
                                        <div className="w-full bg-lime-400/20 text-lime-500 font-bold uppercase tracking-wider h-12 rounded-xl flex items-center justify-center border border-lime-400/30">
                                            ✅ Ya tienes un cupo
                                        </div>
                                    );
                                }

                                if (isFull) {
                                    return (
                                        <Button disabled variant="outline" className="w-full font-bold uppercase tracking-wider h-12 rounded-xl border-red-500/50 text-red-500">
                                            Cupos Agotados
                                        </Button>
                                    );
                                }

                                return (
                                    <Button 
                                        onClick={() => {
                                            registerEvent(event.id, {
                                                onSuccess: () => toast.success('¡Cupo reservado con éxito!'),
                                                onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al reservar el cupo')
                                            });
                                        }}
                                        disabled={isRegistering}
                                        className="w-full bg-slate-900 dark:bg-slate-800 text-white hover:bg-primary transition-colors font-bold uppercase tracking-wider h-12 rounded-xl shadow-[0_0_15px_rgba(0,210,255,0.1)]"
                                    >
                                        <Ticket className="mr-2 h-5 w-5" /> Reservar Cupo
                                    </Button>
                                );
                            })()}
                        </div>
                    </motion.div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-24 bg-slate-900/30 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
                    <CalendarDays className="mx-auto h-16 w-16 text-slate-600 mb-4" />
                    <p className="text-slate-400 text-xl font-medium">No hay eventos para esta categoría.</p>
                </div>
            )}

            {meta && meta.last_page > 1 && (
                <div className="mt-8">
                    <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={setPage} />
                </div>
            )}
        </div>
    );
};
