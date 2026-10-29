import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useUserDashboard } from '@/hooks/useDashboard';
import { useConvocatorias } from '@/hooks/useConvocatorias';
import { useAuthStore } from '@/stores/authStore';
import { DashboardStats, Convocatoria } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { CalendarDays, Trophy, Activity, MapPin, ChevronRight, CheckCircle2, Clock, Wallet, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { DashboardPhotoGallery } from './DashboardPhotoGallery';
import { ClubStoriesBar } from './ClubStoriesBar';
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

    // Filter only upcoming matches
    const upcomingMatches = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        return allConvs.filter(c => {
            const d = parseLocalDate(c.match_date, c.match_time);
            return d.getTime() >= todayStart;
        }).sort((a, b) => {
            const dA = parseLocalDate(a.match_date, a.match_time).getTime();
            const dB = parseLocalDate(b.match_date, b.match_time).getTime();
            return dA - dB;
        });
    }, [allConvs]);

    const isLoading = isDashboardLoading && isConvsLoading;

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    return (
        <div className="space-y-8">
            {/* Club Moments Stories Bar */}
            <ClubStoriesBar />

            {/* VIP Player Welcome Banner */}
            <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
            >
                <div className="absolute right-0 top-0 w-80 h-full bg-lime-400/5 -skew-x-12 transform origin-top pointer-events-none"></div>
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                    <div className="relative">
                        <div className="w-20 h-20 sm:w-22 sm:h-22 bg-slate-800 rounded-2xl border-2 border-lime-400/50 flex items-center justify-center overflow-hidden shadow-lg shadow-lime-400/10 cursor-pointer" onClick={() => setShowFutModal(true)} title="Clic para ver tu Carta FUT">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-black text-lime-400">{user?.name?.charAt(0)}</span>
                            )}
                        </div>
                        {user?.jersey_number && (
                            <span className="absolute -bottom-2 -right-2 w-7 h-7 bg-lime-400 text-slate-950 rounded-full font-black text-xs flex items-center justify-center shadow-md font-mono border-2 border-slate-900">
                                #{user.jersey_number}
                            </span>
                        )}
                    </div>
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <span className="text-[11px] uppercase tracking-widest text-lime-400 font-black px-2.5 py-0.5 rounded-full bg-lime-400/10 border border-lime-400/20">
                                {user?.nickname ? `"${user.nickname}"` : 'Jugador Oficial'}
                            </span>
                            {user?.position && (
                                <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                                    ⚽ {user.position}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                            ¡Hola, {user?.name?.split(' ')[0]}!
                        </h1>
                        <p className="text-slate-400 text-xs sm:text-sm">
                            Bienvenido a tu panel de Pichangas de Barrio FC.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex flex-wrap items-center gap-3 w-full sm:w-auto justify-center">
                    <Button 
                        onClick={() => setShowFutModal(true)}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl h-11 px-4 shadow-md flex items-center gap-2 shadow-amber-400/20"
                    >
                        <Sparkles className="w-4 h-4" /> Mi Carta FUT
                    </Button>
                    <Link to="/billetera">
                        <Button className="bg-slate-800 hover:bg-slate-700 text-lime-400 border border-lime-400/30 hover:border-lime-400 font-bold text-xs uppercase tracking-wider rounded-xl h-11 px-4 shadow-md flex items-center gap-2">
                            <Wallet className="w-4 h-4" /> Mi Billetera
                        </Button>
                    </Link>
                    <Link to="/convocatorias">
                        <Button className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl h-11 px-4 shadow-md flex items-center gap-1.5 shadow-lime-400/20">
                            <Trophy className="w-4 h-4" /> Convocatorias
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* ===== Official Photo Gallery Showcase (First Screen for Players) ===== */}
            <DashboardPhotoGallery />
            
            {/* Scoreboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: "Próximas Convocatorias", value: upcomingMatches.length || dashData?.stats?.upcoming_convocatorias_count || 0, icon: Activity, color: "text-primary" },
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
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Tu Calendario</h2>
                            <p className="text-xs text-slate-400">Pichangas oficiales abiertas para inscripción</p>
                        </div>
                        <Link 
                            to="/convocatorias" 
                            className="px-3 py-1 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-lime-400/30 flex items-center gap-1"
                        >
                            Ver Todas ({upcomingMatches.length}) <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    
                    <div className="space-y-3.5">
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
                                    className="block group bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-lime-400/50 dark:hover:border-lime-400/50 transition-all hover:scale-[1.01]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1.5 min-w-0 flex-1">
                                            <h3 className="font-black text-base text-slate-900 dark:text-white group-hover:text-lime-400 transition-colors truncate">
                                                {c.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center text-xs text-slate-500 dark:text-slate-400 gap-x-4 gap-y-1">
                                                <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                                                    <CalendarDays size={13} className="text-lime-500 shrink-0" />
                                                    {c.match_date} • {c.match_time ? c.match_time.slice(0, 5) : '20:00'}
                                                </span>
                                                <span className="flex items-center gap-1 truncate">
                                                    <MapPin size={13} className="text-slate-400 shrink-0" />
                                                    {c.location || 'Cancha Sintética'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="text-sm font-black font-mono text-lime-400">
                                                {cost > 0 ? `S/ ${cost.toFixed(0)}` : 'Gratis'}
                                            </span>
                                            <div className="mt-1">
                                                {isConfirmed ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                                                        <CheckCircle2 className="w-2.5 h-2.5" /> Listo
                                                    </span>
                                                ) : isFull ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
                                                        Lleno
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/30 text-[10px] font-black uppercase tracking-wider group-hover:bg-lime-400 group-hover:text-slate-950 transition-colors">
                                                        Unirse
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        }) : (
                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-slate-500 text-sm">No hay convocatorias próximas disponibles.</p>
                            </div>
                        )}

                        {upcomingMatches.length > 8 && (
                            <div className="pt-2 text-center">
                                <Link 
                                    to="/convocatorias"
                                    className="text-xs font-black uppercase tracking-wider text-lime-400 hover:text-lime-300 underline underline-offset-4"
                                >
                                    Ver las {upcomingMatches.length - 8} convocatorias restantes →
                                </Link>
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

            {/* Player Badges & Achievements */}
            <PlayerAchievements 
                user={user || {}} 
                participationsCount={dashData?.stats?.total_participations || 0} 
            />

            {/* Modal for 3D FUT Card */}
            <PlayerCardModal 
                isOpen={showFutModal} 
                onClose={() => setShowFutModal(false)} 
                player={user} 
            />
        </div>
    );
};
