import React from 'react';
import { motion } from 'motion/react';
import { useUserDashboard } from '@/hooks/useDashboard';
import { useAuthStore } from '@/stores/authStore';
import { DashboardStats } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { CalendarDays, Trophy, Activity, MapPin } from 'lucide-react';

export const UserDashboardPage = () => {
    const { data: dashboard, isLoading } = useUserDashboard();
    const { user } = useAuthStore();
    const dashData = dashboard as DashboardStats | undefined;

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    return (
        <div className="space-y-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden"
            >
                <div className="absolute right-0 top-0 w-64 h-full bg-primary/10 -skew-x-12 transform origin-top translate-x-10"></div>
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-24 h-24 bg-slate-800 rounded-full border-4 border-primary flex items-center justify-center overflow-hidden">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl">🧑‍🚀</span>
                        )}
                    </div>
                    <div className="text-center sm:text-left">
                        <h2 className="text-sm uppercase tracking-widest text-primary font-bold mb-1">Perfil del Jugador</h2>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">{user?.name}</h1>
                        <p className="text-slate-400 mt-2">{user?.email}</p>
                    </div>
                </div>
            </motion.div>
            
            {/* Scoreboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: "Próximas Convocatorias", value: dashData?.stats?.upcoming_convocatorias_count || 0, icon: Activity, color: "text-primary" },
                    { title: "Eventos Registrados", value: dashData?.stats?.registered_events || 0, icon: CalendarDays, color: "text-lime-400" },
                    { title: "Total Participaciones", value: dashData?.stats?.total_participations || 0, icon: Trophy, color: "text-accent" }
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4"
                    >
                        <div className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-800 ${stat.color}`}>
                            <stat.icon size={32} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{stat.title}</p>
                            <p className="text-4xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Tu Calendario</h2>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full">Partidos</span>
                    </div>
                    
                    <div className="space-y-4">
                        {dashData?.upcoming_convocatorias?.length ? dashData.upcoming_convocatorias.map((c) => (
                            <div key={c.id} className="group bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{c.title}</h3>
                                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 gap-2">
                                            <CalendarDays size={14} /> {c.match_date} - {c.match_time}
                                        </div>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-xs font-bold text-slate-600 dark:text-slate-300">
                                        FÚTBOL
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-slate-500">No hay convocatorias próximas.</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Otros Eventos</h2>
                        <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold uppercase rounded-full">Inscrito</span>
                    </div>
                    
                    <div className="space-y-4">
                        {dashData?.my_events?.length ? dashData.my_events.map((e) => (
                            <div key={e.id} className="group bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-accent/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{e.title}</h3>
                                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 gap-2">
                                            <MapPin size={14} /> {e.location || 'Sede Principal'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-xs font-bold text-slate-600 dark:text-slate-300">
                                        EVENTO
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-slate-500">No estás inscrito en eventos.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
