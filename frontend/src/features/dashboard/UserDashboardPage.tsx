import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useUserDashboard } from '@/hooks/useDashboard';
import { useConvocatorias } from '@/hooks/useConvocatorias';
import { useAuthStore } from '@/stores/authStore';
import { DashboardStats, Convocatoria } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { CalendarDays, Trophy, Activity, MapPin, ChevronRight, CheckCircle2, Wallet, Sparkles, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { DashboardPhotoGallery } from './DashboardPhotoGallery';
import { PlayerCardModal } from '@/components/player/PlayerCardModal';
import { PlayerAchievements } from '@/components/player/PlayerAchievements';

const parseLocalDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return new Date();
    try {
        const [y, m, d] = dateStr.split('-').map(Number);
        const [hour, minute] = timeStr ? timeStr.split(':').map(Number) : [20, 0];
        return new Date(y, (m || 1) - 1, d || 1, hour || 0, minute || 0);
    } catch {
        return new Date();
    }
};

export const UserDashboardPage = () => {
    const { data: dashboard, isLoading: isDashboardLoading } = useUserDashboard();
    const { data: convsResponse, isLoading: isConvsLoading } = useConvocatorias(1);
    const { user } = useAuthStore();
    const [showFutModal, setShowFutModal] = useState(false);
    const dashData = dashboard as DashboardStats | undefined;
    const allConvs = (convsResponse?.data || []) as Convocatoria[];

    const upcomingMatches = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        return allConvs.filter(c => parseLocalDate(c.match_date, c.match_time).getTime() >= todayStart)
            .sort((a, b) => parseLocalDate(a.match_date, a.match_time).getTime() - parseLocalDate(b.match_date, b.match_time).getTime());
    }, [allConvs]);

    const isLoading = isDashboardLoading && isConvsLoading;
    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    const stats = [
        { title: 'Próximas pichangas', value: upcomingMatches.length || dashData?.stats?.upcoming_convocatorias_count || 0, icon: Activity, tone: 'text-[#F00091]', surface: 'bg-[#F00091]/[0.08]' },
        { title: 'Eventos inscritos', value: dashData?.stats?.registered_events || 0, icon: CalendarDays, tone: 'text-sky-600 dark:text-[#00C9E8]', surface: 'bg-sky-500/[0.08]' },
        { title: 'Participaciones', value: dashData?.stats?.total_participations || 0, icon: Trophy, tone: 'text-slate-600 dark:text-slate-300', surface: 'bg-slate-500/[0.08]' }
    ];

    return (
        <div className="space-y-7 sm:space-y-9">
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#101827] sm:p-7 lg:p-8"
            >
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#F00091]/[0.07] blur-3xl" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                        <button
                            type="button"
                            onClick={() => setShowFutModal(true)}
                            title="Ver mi Carta FUT"
                            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm transition-transform hover:scale-[1.03] dark:border-white/10 dark:bg-slate-800"
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                <span className="flex h-full w-full items-center justify-center text-3xl font-black text-[#F00091]">{user?.name?.charAt(0)}</span>
                            )}
                            {user?.jersey_number && (
                                <span className="absolute -bottom-0.5 -right-0.5 rounded-tl-lg bg-[#F00091] px-2 py-1 text-[10px] font-black text-white">
                                    #{user.jersey_number}
                                </span>
                            )}
                        </button>
                        <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                <span className="rounded-full bg-[#F00091]/[0.08] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#D0007D] dark:text-[#FF70C2]">
                                    {user?.nickname ? `"${user.nickname}"` : 'Jugador oficial'}
                                </span>
                                {user?.position && (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                                        {user.position}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                                ¡Hola, {user?.name?.split(' ')[0]}!
                            </h1>
                            <p className="max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Este es tu espacio para organizar tus partidos, revisar tu actividad y mantenerte al día con la comunidad.
                            </p>
                        </div>
                    </div>
                    <div className="flex w-full flex-wrap justify-center gap-2.5 lg:w-auto lg:justify-end">
                        <Button
                            onClick={() => setShowFutModal(true)}
                            className="h-10 rounded-xl bg-[#F00091] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#D90082]"
                        >
                            <Sparkles className="mr-2 h-4 w-4" /> Mi Carta FUT
                        </Button>
                        <Link to="/billetera">
                            <Button className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]">
                                <Wallet className="mr-2 h-4 w-4" /> Mi billetera
                            </Button>
                        </Link>
                        <Link to="/convocatorias">
                            <Button className="h-10 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                                <Trophy className="mr-2 h-4 w-4" /> Ver pichangas
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.section>

            <DashboardPhotoGallery />

            <section aria-label="Resumen de actividad" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {stats.map((stat, index) => (
                    <motion.article
                        key={stat.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.07, duration: 0.3 }}
                        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.07] dark:bg-[#101827] sm:p-5"
                    >
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.surface} ${stat.tone}`}>
                            <stat.icon size={21} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.title}</p>
                            <p className="mt-0.5 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{stat.value}</p>
                        </div>
                    </motion.article>
                ))}
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">Próximas pichangas</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Encuentros abiertos para inscripción</p>
                        </div>
                        <Link to="/convocatorias" className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-[#D0007D] transition-colors hover:bg-[#F00091]/[0.07] dark:text-[#FF70C2]">
                            Ver todas <ChevronRight size={15} />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {upcomingMatches.length ? upcomingMatches.slice(0, 8).map((c) => {
                            const confirmados = c.confirmed_count || 0;
                            const maximos = c.max_players || 14;
                            const isFull = confirmados >= maximos;
                            const isConfirmed = c.is_user_confirmed;
                            const cost = parseFloat(String(c.cost_per_player || 0));
                            return (
                                <Link
                                    to={`/convocatorias/${c.id}`}
                                    key={c.id}
                                    className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[#F00091]/35 hover:shadow-md dark:border-white/[0.07] dark:bg-[#101827] dark:hover:border-[#F00091]/35 sm:p-5"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-[#D0007D] dark:text-white dark:group-hover:text-[#FF70C2]">{c.title}</h3>
                                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> {c.match_date}</span>
                                                <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {c.match_time ? c.match_time.slice(0, 5) : '20:00'}</span>
                                                <span className="inline-flex min-w-0 items-center gap-1.5"><MapPin size={13} /> <span className="truncate">{c.location || 'Cancha Sintética'}</span></span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-extrabold tabular-nums text-slate-900 dark:text-white">{cost > 0 ? `S/ ${cost.toFixed(0)}` : 'Gratis'}</p>
                                            <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${isConfirmed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : isFull ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-[#A5E900]/15 text-slate-700 dark:text-[#C6F36A]'}`}>
                                                {isConfirmed ? <><CheckCircle2 size={11} /> Inscrito</> : isFull ? 'Completo' : 'Disponible'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        }) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center dark:border-white/10 dark:bg-[#101827]">
                                <Trophy className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                                <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">No hay pichangas próximas disponibles.</p>
                            </div>
                        )}
                        {upcomingMatches.length > 8 && (
                            <div className="pt-1 text-center">
                                <Link to="/convocatorias" className="text-xs font-semibold text-[#D0007D] hover:underline dark:text-[#FF70C2]">
                                    Ver las {upcomingMatches.length - 8} convocatorias restantes
                                </Link>
                            </div>
                        )}
                    </div>
                </motion.section>

                <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                    <div className="mb-4">
                        <h2 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">Otros eventos</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Actividades en las que participas</p>
                    </div>
                    <div className="space-y-3">
                        {dashData?.my_events?.length ? dashData.my_events.map((e) => (
                            <article key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.07] dark:bg-[#101827] sm:p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white">{e.title}</h3>
                                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><MapPin size={13} /> {e.location || 'Sede Principal'}</p>
                                    </div>
                                    <span className="rounded-full bg-sky-500/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-700 dark:text-[#00C9E8]">Inscrito</span>
                                </div>
                            </article>
                        )) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center dark:border-white/10 dark:bg-[#101827]">
                                <CalendarDays className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                                <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">Todavía no estás inscrito en eventos.</p>
                            </div>
                        )}
                    </div>
                </motion.section>
            </div>

            <PlayerAchievements
                user={user || {}}
                participationsCount={dashData?.stats?.total_participations || 0}
            />

            <PlayerCardModal
                isOpen={showFutModal}
                onClose={() => setShowFutModal(false)}
                player={user}
            />
        </div>
    );
};
