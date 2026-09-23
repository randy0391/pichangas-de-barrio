import React from 'react';
import { useMisConvocatorias } from '@/hooks/useConvocatorias';
import { Convocatoria } from '@/types';
import { motion } from 'motion/react';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { CalendarDays, MapPin, Clock, Shield, CheckCircle2, XCircle } from 'lucide-react';

export const MisParticipacionesPage = () => {
    const { data: participaciones = [], isLoading } = useMisConvocatorias();

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    const convs = participaciones as Convocatoria[];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Mis Participaciones</h1>
                <p className="text-slate-500 dark:text-slate-400">Historial de partidos en los que te has inscrito o rechazado.</p>
            </div>

            {convs.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 text-lg">Aún no te has inscrito a ninguna convocatoria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {convs.map((c, i) => {
                        const myConfirmacion = c.confirmaciones?.[0];
                        const isConfirmed = myConfirmacion?.status === 'confirmado';
                        const isRejected = myConfirmacion?.status === 'rechazado';
                        
                        return (
                            <motion.div key={c.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                className={`rounded-3xl border shadow-lg overflow-hidden transition-all hover:-translate-y-1 ${isConfirmed ? 'bg-white dark:bg-slate-900 border-lime-200 dark:border-lime-900/50 hover:shadow-lime-500/10' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'}`}
                            >
                                <div className={`h-2 w-full ${isConfirmed ? 'bg-gradient-to-r from-lime-400 to-lime-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{c.title}</h3>
                                        {isConfirmed ? (
                                            <div className="bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
                                                <CheckCircle2 size={14} /> Confirmado
                                            </div>
                                        ) : (
                                            <div className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
                                                <XCircle size={14} /> Rechazado
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <CalendarDays size={16} className={isConfirmed ? "text-primary" : "text-slate-400"} />
                                            {c.match_date} a las {c.match_time}
                                        </p>
                                        <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <MapPin size={16} className={isConfirmed ? "text-accent" : "text-slate-400"} />
                                            <span className="truncate">{c.location}</span>
                                        </p>
                                    </div>

                                    {isConfirmed && (
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${myConfirmacion?.match_role === 'portero' ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                                    {myConfirmacion?.match_role === 'portero' ? '🧤' : '⚽'}
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">{myConfirmacion?.match_role}</span>
                                            </div>
                                            {myConfirmacion?.team_number && (
                                                <div className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-black uppercase tracking-wider">
                                                    Eq. {myConfirmacion.team_number}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
