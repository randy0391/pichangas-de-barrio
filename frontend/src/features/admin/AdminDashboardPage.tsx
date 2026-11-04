import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAdminDashboard } from '@/hooks/useDashboard';
import { AdminDashboardStats } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Users, Calendar, Megaphone, Activity, ArrowUpRight, ImagePlus, Plus, ShieldCheck } from 'lucide-react';

export const AdminDashboardPage = () => {
    const { data: stats, isLoading } = useAdminDashboard();
    const adminStats = stats as AdminDashboardStats | undefined;

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    const scoreboards = [
        { title: 'Plantel total', value: adminStats?.stats?.total_members || 0, icon: Users, color: 'text-[#D0007D]', surface: 'bg-[#F00091]/[0.08]', label: 'Jugadores registrados' },
        { title: 'Partidos activos', value: adminStats?.stats?.active_convocatorias || 0, icon: Activity, color: 'text-emerald-600 dark:text-[#A5E900]', surface: 'bg-emerald-500/[0.08]', label: 'Convocatorias en curso' },
        { title: 'Eventos', value: adminStats?.stats?.total_events || 0, icon: Calendar, color: 'text-sky-600 dark:text-[#00C9E8]', surface: 'bg-sky-500/[0.08]', label: 'Actividades registradas' },
        { title: 'Noticias', value: adminStats?.stats?.total_posts || 0, icon: Megaphone, color: 'text-slate-600 dark:text-slate-300', surface: 'bg-slate-500/[0.08]', label: 'Publicaciones realizadas' },
    ];

    const shortcuts = [
        { title: 'Nueva convocatoria', description: 'Organiza el próximo encuentro', to: '/admin/convocatorias', icon: Plus, color: 'text-[#D0007D]', iconBg: 'bg-[#F00091]/[0.08]' },
        { title: 'Añadir fotografías', description: 'Comparte los mejores momentos', to: '/admin/galeria', icon: ImagePlus, color: 'text-sky-600 dark:text-[#00C9E8]', iconBg: 'bg-sky-500/[0.08]' },
        { title: 'Publicar noticia', description: 'Mantén informada a la comunidad', to: '/admin/noticias', icon: Megaphone, color: 'text-slate-600 dark:text-slate-300', iconBg: 'bg-slate-500/[0.08]' },
    ];

    return (
        <div className="space-y-7 sm:space-y-8">
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#101827] sm:p-8"
            >
                <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#F00091]/[0.06] blur-3xl" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#F00091]/[0.08] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#D0007D] dark:text-[#FF70C2]">
                            <ShieldCheck size={13} /> Administración
                        </span>
                        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                            Panel de control
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Revisa la actividad del club y accede a las herramientas de gestión desde un solo lugar.
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/[0.09] text-emerald-600 dark:text-[#A5E900]">
                            <Activity size={18} />
                        </span>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Estado</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Resumen general</p>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                </div>
            </motion.section>

            <section aria-label="Indicadores generales">
                <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#D0007D] dark:text-[#FF70C2]">Vista general</p>
                        <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-2xl">Indicadores del club</h2>
                    </div>
                    <span className="hidden text-xs text-slate-500 sm:block">Datos del sistema</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {scoreboards.map((stat, index) => (
                        <motion.article
                            key={stat.title}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.06, duration: 0.25 }}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-white/[0.07] dark:bg-[#101827] sm:p-5"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.surface} ${stat.color}`}>
                                    <stat.icon size={20} strokeWidth={2} />
                                </div>
                                <p className="text-3xl font-black tracking-tight tabular-nums text-slate-950 dark:text-white">{stat.value}</p>
                            </div>
                            <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{stat.title}</h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                        </motion.article>
                    ))}
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#101827] sm:p-7">
                <div className="mb-5">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#D0007D] dark:text-[#FF70C2]">Accesos rápidos</p>
                    <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-2xl">¿Qué deseas gestionar?</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Entra directamente a las tareas más habituales.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {shortcuts.map((item, index) => (
                        <motion.div key={item.to} whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
                            <Link
                                to={item.to}
                                className="group flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-[#F00091]/30 hover:bg-white dark:border-white/[0.07] dark:bg-white/[0.02] dark:hover:bg-white/[0.045]"
                            >
                                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.color}`}>
                                    <item.icon size={20} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-bold text-slate-900 dark:text-white">{item.title}</span>
                                    <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</span>
                                </span>
                                <ArrowUpRight size={17} className="shrink-0 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#D0007D] dark:group-hover:text-[#FF70C2]" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
};
