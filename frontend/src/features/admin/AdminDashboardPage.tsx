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
        { title: 'Plantel total', value: adminStats?.stats?.total_members || 0, icon: Users, tone: 'from-[#F00091]/20 to-[#F00091]/5', color: 'text-[#F00091]', label: 'Jugadores registrados' },
        { title: 'Partidos activos', value: adminStats?.stats?.active_convocatorias || 0, icon: Activity, tone: 'from-[#A5E900]/20 to-[#A5E900]/5', color: 'text-[#A5E900]', label: 'Convocatorias en curso' },
        { title: 'Eventos', value: adminStats?.stats?.total_events || 0, icon: Calendar, tone: 'from-[#00C9E8]/20 to-[#00C9E8]/5', color: 'text-[#00C9E8]', label: 'Actividades registradas' },
        { title: 'Noticias', value: adminStats?.stats?.total_posts || 0, icon: Megaphone, tone: 'from-white/10 to-white/[0.02]', color: 'text-white', label: 'Publicaciones realizadas' },
    ];

    const shortcuts = [
        { title: 'Nueva convocatoria', description: 'Organiza el próximo encuentro', to: '/admin/convocatorias', icon: Plus, color: 'text-[#F00091]', glow: 'group-hover:border-[#F00091]/60', iconBg: 'bg-[#F00091]/10' },
        { title: 'Añadir fotografías', description: 'Comparte los mejores momentos', to: '/admin/galeria', icon: ImagePlus, color: 'text-[#00C9E8]', glow: 'group-hover:border-[#00C9E8]/60', iconBg: 'bg-[#00C9E8]/10' },
        { title: 'Publicar noticia', description: 'Mantén informada a la comunidad', to: '/admin/noticias', icon: Megaphone, color: 'text-[#A5E900]', glow: 'group-hover:border-[#A5E900]/60', iconBg: 'bg-[#A5E900]/10' },
    ];

    return (
        <div className="space-y-7 sm:space-y-9">
            <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[#080D1B] px-6 py-8 shadow-2xl shadow-black/20 sm:px-9 sm:py-10 lg:px-11"
            >
                <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#00C9E8]/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-36 left-1/3 h-80 w-80 rounded-full bg-[#F00091]/15 blur-3xl" />
                <div className="pointer-events-none absolute right-8 top-8 hidden h-44 w-44 rounded-full border border-white/[0.06] sm:block" />
                <div className="pointer-events-none absolute right-16 top-16 hidden h-28 w-28 rounded-full border border-[#A5E900]/20 sm:block" />

                <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00C9E8]/25 bg-[#00C9E8]/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#58E5F5]">
                            <ShieldCheck size={13} /> Centro de administración
                        </div>
                        <h1 className="text-3xl font-black leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl">
                            Tu comunidad,
                            <span className="block bg-gradient-to-r from-[#F00091] via-[#00C9E8] to-[#A5E900] bg-clip-text text-transparent"> bajo control.</span>
                        </h1>
                        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                            Administra la actividad de Pichangas de Barrio desde un solo lugar. Revisa el estado del club y accede rápidamente a las herramientas de gestión.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 self-start rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-md lg:self-auto">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#A5E900]/10 text-[#A5E900]">
                            <Activity size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Estado del panel</p>
                            <p className="mt-0.5 text-sm font-extrabold text-white">Resumen general</p>
                        </div>
                        <span className="ml-2 h-2 w-2 rounded-full bg-[#A5E900] shadow-[0_0_12px_#A5E900]" />
                    </div>
                </div>
            </motion.section>

            <section aria-label="Indicadores generales">
                <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#00C9E8]">Vista general</p>
                        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">Indicadores del club</h2>
                    </div>
                    <span className="hidden text-xs font-medium text-slate-500 sm:block">Datos del sistema</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {scoreboards.map((stat, i) => (
                        <motion.article
                            key={stat.title}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 * i, duration: 0.35 }}
                            whileHover={{ y: -4 }}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-black/10 dark:border-white/[0.07] dark:bg-[#101827]"
                        >
                            <div className={`pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${stat.tone} blur-2xl transition-transform duration-500 group-hover:scale-125`} />
                            <div className="relative flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{stat.title}</p>
                                    <p className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-[2.65rem]">{stat.value}</p>
                                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-500">{stat.label}</p>
                                </div>
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-current/10 bg-gradient-to-br ${stat.tone} ${stat.color} transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-110`}>
                                    <stat.icon size={22} strokeWidth={2.2} />
                                </div>
                            </div>
                            <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                                <div className={`h-full w-1/2 rounded-full bg-current opacity-70 ${stat.color}`} />
                            </div>
                        </motion.article>
                    ))}
                </div>
            </section>

            <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#101827] sm:p-7"
            >
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F00091]">Acceso directo</p>
                        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">Atajos de gestión</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Las herramientas que más utilizas, siempre a mano.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {shortcuts.map((item, i) => (
                        <motion.div key={item.to} whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}>
                            <Link
                                to={item.to}
                                className={`group flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-300 hover:bg-white hover:shadow-lg dark:border-white/[0.07] dark:bg-white/[0.025] dark:hover:bg-white/[0.05] ${item.glow}`}
                            >
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.color} transition-transform duration-300 group-hover:scale-110`}>
                                    <item.icon size={22} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-extrabold text-slate-900 dark:text-white">{item.title}</h3>
                                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
                                </div>
                                <ArrowUpRight size={18} className="shrink-0 text-slate-400 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </motion.section>
        </div>
    );
};
