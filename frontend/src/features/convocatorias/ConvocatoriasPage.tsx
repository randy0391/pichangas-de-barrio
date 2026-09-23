import React from 'react';
import { useConvocatorias } from '@/hooks/useConvocatorias';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Link } from 'react-router-dom';
import { Convocatoria } from '@/types';
import { motion } from 'motion/react';
import { CalendarDays, MapPin, Users, ChevronRight, Swords } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Pagination } from '@/components/ui/Pagination';

export const ConvocatoriasPage = () => {
    const [page, setPage] = React.useState(1);
    const { data: response, isLoading } = useConvocatorias(page);

    const convocatorias = response?.data || [];
    const meta = response?.meta;

    if (isLoading && !convocatorias.length) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    const list = (convocatorias as Convocatoria[]).filter(c => {
        const matchDate = new Date(c.match_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return matchDate >= today;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-accent/20 blur-[100px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Próximos Encuentros</h1>
                    <p className="text-slate-400">Revisa la lista de partidos y confirma tu asistencia para jugar.</p>
                </div>
            </div>

            {list.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800">
                    <Swords size={64} className="mx-auto text-slate-700 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2 uppercase">Sin Convocatorias</h2>
                    <p className="text-slate-500">Aún no hay partidos programados. ¡Mantente atento!</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {list.map((c, index) => {
                        const confirmados = c.confirmed_count || 0;
                        const maximos = c.max_players || 14;
                        const progress = Math.min(100, (confirmados / maximos) * 100);
                        
                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={c.id} 
                                className="group bg-slate-900 border border-slate-800 hover:border-primary/50 rounded-3xl p-6 md:p-8 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,210,255,0.1)] relative overflow-hidden flex flex-col md:flex-row items-center gap-6"
                            >
                                {/* Decorative line */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex-1 w-full">
                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                        <Badge className={`px-3 py-1 font-bold text-xs uppercase tracking-wider ${
                                            c.status === 'abierta' ? 'bg-lime-400/20 text-lime-400 border-lime-400/30' : 
                                            c.status === 'completada' ? 'bg-primary/20 text-primary border-primary/30' : 
                                            'bg-red-400/20 text-red-400 border-red-400/30'
                                        }`}>
                                            {c.status}
                                        </Badge>
                                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <CalendarDays size={14} className="text-primary" />
                                            {format(new Date(`${c.match_date}T${c.match_time}`), "EEEE d 'de' MMMM, h:mm a", { locale: es })}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4 group-hover:text-primary transition-colors">
                                        {c.title} {c.rival && <span className="text-slate-500 font-medium normal-case ml-2">vs {c.rival}</span>}
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        <div className="flex items-center gap-3 text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                            <div className="bg-slate-800 p-2 rounded-lg text-accent">
                                                <MapPin size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-500 uppercase font-bold">Ubicación</span>
                                                <span className="text-sm font-medium truncate">{c.location}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                            <div className="bg-slate-800 p-2 rounded-lg text-lime-400">
                                                <Users size={18} />
                                            </div>
                                            <div className="flex flex-col w-full pr-2">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs text-slate-500 uppercase font-bold">Jugadores</span>
                                                    <span className="text-xs font-bold text-white">{confirmados}/{maximos}</span>
                                                </div>
                                                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-gradient-to-r from-lime-400 to-primary h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6 flex flex-col justify-center">
                                    <Link to={`/convocatorias/${c.id}`} className="w-full">
                                        <Button className="w-full md:w-auto h-14 px-8 bg-white hover:bg-slate-200 text-slate-900 font-black uppercase tracking-widest rounded-xl transition-all group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                            Ver Partido <ChevronRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
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
