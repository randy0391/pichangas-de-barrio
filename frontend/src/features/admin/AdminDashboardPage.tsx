import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAdminDashboard } from '@/hooks/useDashboard';
import { AdminDashboardStats } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Users, Calendar, Megaphone, Activity } from 'lucide-react';

export const AdminDashboardPage = () => {
    const { data: stats, isLoading } = useAdminDashboard();
    const adminStats = stats as AdminDashboardStats | undefined;

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    return (
        <div className="space-y-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="bg-gradient-to-r from-slate-900 to-[#0a1128] rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden"
            >
                {/* Decorative background elements */}
                <div className="absolute right-0 top-0 w-1/2 h-full bg-accent/10 -skew-x-12 transform origin-top translate-x-20"></div>
                <div className="absolute left-[-10%] bottom-[-50%] w-64 h-64 bg-primary/20 blur-[80px] rounded-full"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center md:justify-between gap-6">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 text-xs font-bold uppercase tracking-widest backdrop-blur-md mb-4">
                            <Activity size={14} /> Centro de Comando
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase">
                            Panel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Control</span>
                        </h1>
                        <p className="text-slate-300 mt-3 text-lg max-w-xl">
                            Bienvenido al panel administrativo. Gestiona jugadores, organiza partidos y actualiza el estado del club en tiempo real.
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <div className="w-24 h-24 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 flex items-center justify-center transform rotate-12 shadow-2xl">
                            <span className="text-5xl">⚙️</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Admin Scoreboards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "Plantel Total", value: adminStats?.stats?.total_members || 0, icon: Users, color: "text-primary" },
                    { title: "Partidos Activos", value: adminStats?.stats?.active_convocatorias || 0, icon: Activity, color: "text-lime-400" },
                    { title: "Eventos", value: adminStats?.stats?.total_events || 0, icon: Calendar, color: "text-accent" },
                    { title: "Noticias", value: adminStats?.stats?.total_posts || 0, icon: Megaphone, color: "text-white" }
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i }}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-bl-full -z-10 group-hover:bg-slate-100 dark:group-hover:bg-slate-800/80 transition-colors"></div>
                        
                        <div className={`w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center mb-6 shadow-lg border border-slate-700 ${stat.color} transform group-hover:scale-110 transition-transform duration-300`}>
                            <stat.icon size={24} />
                        </div>
                        
                        <div>
                            <p className="text-4xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{stat.title}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions (Mock) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800"
            >
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Atajos de Gestión</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link to="/admin/convocatorias" className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary text-slate-600 dark:text-slate-300 hover:text-primary transition-all font-bold uppercase tracking-wider text-sm flex flex-col items-center justify-center gap-2 h-32 text-center">
                        <span className="text-3xl">+</span>
                        Crear Convocatoria
                    </Link>
                    <Link to="/admin/galeria" className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-accent text-slate-600 dark:text-slate-300 hover:text-accent transition-all font-bold uppercase tracking-wider text-sm flex flex-col items-center justify-center gap-2 h-32 text-center">
                        <span className="text-3xl">+</span>
                        Subir Foto a Galería
                    </Link>
                    <Link to="/admin/noticias" className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-lime-400 text-slate-600 dark:text-slate-300 hover:text-lime-400 transition-all font-bold uppercase tracking-wider text-sm flex flex-col items-center justify-center gap-2 h-32 text-center">
                        <span className="text-3xl">+</span>
                        Publicar Noticia
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};
