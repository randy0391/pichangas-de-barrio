import React, { useState, useMemo } from 'react';
import { useConvocatorias } from '@/hooks/useConvocatorias';
import { Button } from '@/components/ui/Button';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Link } from 'react-router-dom';
import { Convocatoria } from '@/types';
import { motion } from 'motion/react';
import { 
    MapPin, 
    Users, 
    ChevronRight, 
    Swords, 
    Wallet, 
    Clock, 
    CheckCircle2, 
    Sparkles, 
    Calendar
} from 'lucide-react';

// Helper to safely parse local date from "YYYY-MM-DD"
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

const formatDayLabel = (date: Date) => {
    const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];
    return {
        dayName: days[date.getDay()],
        dayNumber: date.getDate(),
        monthName: months[date.getMonth()],
        fullFormatted: `${days[date.getDay()]} ${date.getDate()} DE ${months[date.getMonth()]}`
    };
};

export const ConvocatoriasPage = () => {
    const [page] = useState(1);
    const { data: response, isLoading } = useConvocatorias(page);

    // Filters
    const [periodFilter, setPeriodFilter] = useState<'todos' | 'esta_semana' | 'proxima_semana' | 'futuro'>('todos');
    const [dayFilter, setDayFilter] = useState<'todos' | 'martes' | 'jueves' | 'sabado'>('todos');
    const [onlyMySignups, setOnlyMySignups] = useState(false);

    const rawConvocatorias = (response?.data || []) as Convocatoria[];

    // Filter only upcoming or today matches
    const upcomingList = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        return rawConvocatorias.filter(c => {
            const matchDate = parseLocalDate(c.match_date, c.match_time);
            return matchDate.getTime() >= todayStart;
        }).sort((a, b) => {
            const dateA = parseLocalDate(a.match_date, a.match_time).getTime();
            const dateB = parseLocalDate(b.match_date, b.match_time).getTime();
            return dateA - dateB;
        });
    }, [rawConvocatorias]);

    // Categorize into weeks
    const categorizedMatches = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // End of current week (Sunday midnight)
        const dayOfWeek = todayStart.getDay(); // 0 is Sunday, 1 is Monday ...
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        const endOfThisWeek = new Date(todayStart);
        endOfThisWeek.setDate(todayStart.getDate() + daysUntilSunday);
        endOfThisWeek.setHours(23, 59, 59, 999);

        // End of next week (Sunday + 7 days)
        const endOfNextWeek = new Date(endOfThisWeek);
        endOfNextWeek.setDate(endOfThisWeek.getDate() + 7);

        return upcomingList.map(c => {
            const matchDate = parseLocalDate(c.match_date, c.match_time);
            const time = matchDate.getTime();
            let periodCategory: 'esta_semana' | 'proxima_semana' | 'futuro' = 'futuro';

            if (time <= endOfThisWeek.getTime()) {
                periodCategory = 'esta_semana';
            } else if (time <= endOfNextWeek.getTime()) {
                periodCategory = 'proxima_semana';
            }

            const dayNum = matchDate.getDay();
            let dayCategory: 'martes' | 'jueves' | 'sabado' | 'otro' = 'otro';
            if (dayNum === 2) dayCategory = 'martes';
            else if (dayNum === 4) dayCategory = 'jueves';
            else if (dayNum === 6) dayCategory = 'sabado';

            return {
                ...c,
                periodCategory,
                dayCategory,
                parsedDate: matchDate
            };
        });
    }, [upcomingList]);

    // Apply active filters
    const filteredMatches = useMemo(() => {
        return categorizedMatches.filter(item => {
            if (periodFilter !== 'todos' && item.periodCategory !== periodFilter) {
                return false;
            }
            if (dayFilter !== 'todos' && item.dayCategory !== dayFilter) {
                return false;
            }
            if (onlyMySignups && !item.is_user_confirmed) {
                return false;
            }
            return true;
        });
    }, [categorizedMatches, periodFilter, dayFilter, onlyMySignups]);

    // Grouping for "Todos" view
    const estaSemana = filteredMatches.filter(m => m.periodCategory === 'esta_semana');
    const proximaSemana = filteredMatches.filter(m => m.periodCategory === 'proxima_semana');
    const futuro = filteredMatches.filter(m => m.periodCategory === 'futuro');

    const shouldGroup = periodFilter === 'todos' && dayFilter === 'todos' && !onlyMySignups;

    if (isLoading && !rawConvocatorias.length) {
        return (
            <div className="py-24 flex justify-center">
                <FootballSpinner />
            </div>
        );
    }

    const renderCard = (c: typeof categorizedMatches[0], index: number) => {
        const confirmados = c.confirmed_count || 0;
        const maximos = c.max_players || 14;
        const progress = Math.min(100, (confirmados / maximos) * 100);
        const cost = parseFloat(String(c.cost_per_player || 0));
        const spotsLeft = Math.max(0, maximos - confirmados);
        const isFull = confirmados >= maximos;
        const isConfirmed = c.is_user_confirmed;
        const dateInfo = formatDayLabel(c.parsedDate);

        // Day specific theme
        const isMartes = c.dayCategory === 'martes';
        const isJueves = c.dayCategory === 'jueves';
        const isSabado = c.dayCategory === 'sabado';

        const dayColorClass = isMartes 
            ? 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10'
            : isJueves 
            ? 'text-lime-400 border-lime-500/40 bg-lime-500/10'
            : isSabado 
            ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
            : 'text-primary border-primary/40 bg-primary/10';

        const cardBorderClass = isConfirmed
            ? 'border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.12)]'
            : isMartes 
            ? 'hover:border-cyan-500/50 shadow-cyan-950/20'
            : isJueves 
            ? 'hover:border-lime-500/50 shadow-lime-950/20'
            : isSabado 
            ? 'hover:border-amber-500/50 shadow-amber-950/20'
            : 'hover:border-primary/50';

        return (
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                key={c.id} 
                className={`group bg-slate-900/90 border border-slate-800 ${cardBorderClass} rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl relative overflow-hidden flex flex-col md:flex-row items-stretch md:items-center gap-5`}
            >
                {/* Neon accent left line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isConfirmed ? 'bg-emerald-500' : isMartes ? 'bg-cyan-400' : isJueves ? 'bg-lime-400' : isSabado ? 'bg-amber-400' : 'bg-primary'
                }`}></div>

                {/* Left: Day & Date Pill */}
                <div className="flex md:flex-col items-center justify-between md:justify-center p-3 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0 min-w-[110px] text-center">
                    <span className={`text-[11px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md border ${dayColorClass}`}>
                        {dateInfo.dayName}
                    </span>
                    <div className="flex md:flex-col items-center gap-1 md:gap-0 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-white font-mono leading-tight">
                            {dateInfo.dayNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {dateInfo.monthName}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 mt-1 md:mt-2">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{c.match_time ? c.match_time.slice(0, 5) : '20:00'}</span>
                    </div>
                </div>

                {/* Center: Match Details & Meta */}
                <div className="flex-1 min-w-0 space-y-3">
                    {/* Top tags row */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Inscription badge if user is signed up */}
                        {isConfirmed && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black uppercase tracking-wider shadow-sm animate-pulse">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {c.user_match_role === 'portero' ? 'Inscrito (Portero 🧤)' : '¡Estás Inscrito! ⚽'}
                            </span>
                        )}

                        {/* Cost badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-white font-mono text-xs font-black shadow-sm">
                            <Wallet className="w-3.5 h-3.5 text-lime-400" />
                            <span>{cost > 0 ? `S/ ${cost.toFixed(2)}` : 'Gratis'}</span>
                        </div>

                        {/* Format tag */}
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 text-[11px] font-bold uppercase tracking-wider border border-slate-700/60">
                            👕 {c.num_teams || 2} Equipos
                        </span>

                        {/* Availability Pill */}
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                            isFull 
                                ? 'bg-red-500/15 text-red-400 border-red-500/30' 
                                : spotsLeft <= 3 
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                                : 'bg-lime-500/15 text-lime-400 border-lime-500/30'
                        }`}>
                            {isFull ? 'Cupos Llenos' : `Quedan ${spotsLeft} cupos`}
                        </span>
                    </div>

                    {/* Match Title */}
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors flex items-center gap-2">
                            <span>{c.title}</span>
                            {c.rival && (
                                <span className="text-sm font-semibold text-slate-400 normal-case">
                                    vs {c.rival}
                                </span>
                            )}
                        </h3>
                        {c.description && (
                            <p className="text-xs sm:text-sm text-slate-400 line-clamp-1 mt-0.5">
                                {c.description}
                            </p>
                        )}
                    </div>

                    {/* Bottom Specs: Location & Spots Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="flex items-center gap-2.5 text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-semibold truncate">{c.location}</span>
                        </div>

                        <div className="flex flex-col justify-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                            <div className="flex justify-between items-center text-xs font-bold mb-1">
                                <span className="text-slate-400 flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-lime-400" />
                                    <span>Jugadores:</span>
                                </span>
                                <span className="text-white font-mono">{confirmados} / {maximos}</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-700 ${
                                        isFull ? 'bg-red-500' : 'bg-gradient-to-r from-lime-400 to-emerald-400'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: CTA Button */}
                <div className="w-full md:w-auto shrink-0 flex flex-col justify-center pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-800/80 md:pl-5">
                    <Link to={`/convocatorias/${c.id}`} className="w-full md:w-auto">
                        <Button className={`w-full md:w-44 h-12 sm:h-14 font-black uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm ${
                            isConfirmed 
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                                : isFull 
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                : 'bg-lime-400 hover:bg-lime-300 text-slate-950 shadow-lime-400/20 hover:scale-[1.02]'
                        }`}>
                            {isConfirmed ? (
                                <>
                                    <span>Ver Mi Partido</span>
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            ) : isFull ? (
                                <>
                                    <span>Ver Lista</span>
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    <span>Inscribirme</span>
                                    <span className="font-mono text-xs">({cost > 0 ? `S/ ${cost.toFixed(0)}` : 'Gratis'})</span>
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </Link>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="space-y-8 pb-12 font-sans">
            {/* ===== Top Hero & Weekly Fixed Schedule Banner ===== */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
                {/* Decorative neon ambient glows */}
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-lime-400/10 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-cyan-400/10 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/30 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> Temporada Oficial 2026
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                            Próximas Pichangas y Convocatorias
                        </h1>
                        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mt-1">
                            Inscríbete con anticipación a las pichangas oficiales del club para asegurar tu cupo. El costo se descuenta automáticamente de tu Billetera Digital.
                        </p>
                    </div>

                    <Link to="/billetera" className="shrink-0">
                        <Button className="bg-slate-800/90 hover:bg-slate-800 text-lime-400 border border-lime-400/30 hover:border-lime-400 rounded-2xl h-12 px-5 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg">
                            <Wallet className="w-4 h-4" /> Recargar Mi Billetera
                        </Button>
                    </Link>
                </div>

                {/* Fixed Weekly Schedule Cards: Martes S/ 15, Jueves S/ 15, Sabado S/ 18 */}
                <div className="relative z-10 pt-2 border-t border-slate-800/80">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-lime-400" />
                        Horario Fijo Semanal del Club:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {/* Martes */}
                        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-cyan-500/60 transition-colors">
                            <div className="space-y-0.5">
                                <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                                    ⚽ Martes
                                </span>
                                <p className="text-xs text-slate-300 font-medium">8:00 PM • Cancha Sintética</p>
                            </div>
                            <div className="text-right">
                                <span className="text-base font-black font-mono text-cyan-400">S/ 15.00</span>
                                <p className="text-[10px] text-slate-500 font-bold">por cupo</p>
                            </div>
                        </div>

                        {/* Jueves */}
                        <div className="bg-slate-950/80 border border-lime-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-lime-500/60 transition-colors">
                            <div className="space-y-0.5">
                                <span className="text-xs font-black uppercase tracking-wider text-lime-400 flex items-center gap-1">
                                    ⚽ Jueves
                                </span>
                                <p className="text-xs text-slate-300 font-medium">8:00 PM • Cancha Sintética</p>
                            </div>
                            <div className="text-right">
                                <span className="text-base font-black font-mono text-lime-400">S/ 15.00</span>
                                <p className="text-[10px] text-slate-500 font-bold">por cupo</p>
                            </div>
                        </div>

                        {/* Sabado */}
                        <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-amber-500/60 transition-colors">
                            <div className="space-y-0.5">
                                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                                    🏆 Sábados
                                </span>
                                <p className="text-xs text-slate-300 font-medium">6:00 PM • Cancha Sintética</p>
                            </div>
                            <div className="text-right">
                                <span className="text-base font-black font-mono text-amber-400">S/ 18.00</span>
                                <p className="text-[10px] text-slate-500 font-bold">por cupo</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Smart Filter Pills ===== */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Period tabs */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            onClick={() => setPeriodFilter('todos')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                periodFilter === 'todos' 
                                    ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/20' 
                                    : 'text-slate-400 hover:text-white bg-slate-950/60'
                            }`}
                        >
                            Todas las Fechas ({upcomingList.length})
                        </button>
                        <button
                            onClick={() => setPeriodFilter('esta_semana')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                periodFilter === 'esta_semana' 
                                    ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/20' 
                                    : 'text-slate-400 hover:text-white bg-slate-950/60'
                            }`}
                        >
                            🔥 Esta Semana
                        </button>
                        <button
                            onClick={() => setPeriodFilter('proxima_semana')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                periodFilter === 'proxima_semana' 
                                    ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/20' 
                                    : 'text-slate-400 hover:text-white bg-slate-950/60'
                            }`}
                        >
                            📆 Próxima Semana
                        </button>
                        <button
                            onClick={() => setPeriodFilter('futuro')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                periodFilter === 'futuro' 
                                    ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/20' 
                                    : 'text-slate-400 hover:text-white bg-slate-950/60'
                            }`}
                        >
                            🚀 Fechas a Futuro
                        </button>
                    </div>

                    {/* Day filter pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                                onClick={() => setDayFilter('todos')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    dayFilter === 'todos' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setDayFilter('martes')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    dayFilter === 'martes' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-cyan-400'
                                }`}
                            >
                                Martes (S/ 15)
                            </button>
                            <button
                                onClick={() => setDayFilter('jueves')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    dayFilter === 'jueves' ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30' : 'text-slate-500 hover:text-lime-400'
                                }`}
                            >
                                Jueves (S/ 15)
                            </button>
                            <button
                                onClick={() => setDayFilter('sabado')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    dayFilter === 'sabado' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-500 hover:text-amber-400'
                                }`}
                            >
                                Sábados (S/ 18)
                            </button>
                        </div>

                        {/* My signups filter */}
                        <button
                            onClick={() => setOnlyMySignups(!onlyMySignups)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                                onlyMySignups 
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm' 
                                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                            }`}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mis Inscripciones</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== Matches Display ===== */}
            {filteredMatches.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 space-y-4">
                    <Swords size={56} className="mx-auto text-slate-700" />
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase">No hay convocatorias con estos filtros</h2>
                        <p className="text-slate-500 text-sm mt-1">
                            Intenta seleccionando "Todas las Fechas" o cambiando el día de la semana.
                        </p>
                    </div>
                    <Button 
                        onClick={() => { setPeriodFilter('todos'); setDayFilter('todos'); setOnlyMySignups(false); }}
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                        Restablecer Filtros
                    </Button>
                </div>
            ) : shouldGroup ? (
                /* Grouped Timeline View */
                <div className="space-y-10">
                    {/* Esta Semana */}
                    {estaSemana.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-lime-400 shadow-[0_0_8px_#a3e635]"></span>
                                <h2 className="text-sm font-black text-lime-400 uppercase tracking-widest">
                                    Esta Semana
                                </h2>
                                <div className="flex-1 h-[1px] bg-slate-800"></div>
                                <span className="text-xs font-bold text-slate-500 font-mono">
                                    {estaSemana.length} {estaSemana.length === 1 ? 'partido' : 'partidos'}
                                </span>
                            </div>
                            <div className="grid gap-4">
                                {estaSemana.map((c, idx) => renderCard(c, idx))}
                            </div>
                        </div>
                    )}

                    {/* Próxima Semana */}
                    {proximaSemana.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
                                <h2 className="text-sm font-black text-cyan-400 uppercase tracking-widest">
                                    Próxima Semana
                                </h2>
                                <div className="flex-1 h-[1px] bg-slate-800"></div>
                                <span className="text-xs font-bold text-slate-500 font-mono">
                                    {proximaSemana.length} {proximaSemana.length === 1 ? 'partido' : 'partidos'}
                                </span>
                            </div>
                            <div className="grid gap-4">
                                {proximaSemana.map((c, idx) => renderCard(c, idx))}
                            </div>
                        </div>
                    )}

                    {/* Futuro (2+ Semanas) */}
                    {futuro.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"></span>
                                <h2 className="text-sm font-black text-amber-400 uppercase tracking-widest">
                                    Próximas Fechas Programadas (Futuro)
                                </h2>
                                <div className="flex-1 h-[1px] bg-slate-800"></div>
                                <span className="text-xs font-bold text-slate-500 font-mono">
                                    {futuro.length} {futuro.length === 1 ? 'partido' : 'partidos'}
                                </span>
                            </div>
                            <div className="grid gap-4">
                                {futuro.map((c, idx) => renderCard(c, idx))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Filtered Flat List */
                <div className="grid gap-4">
                    {filteredMatches.map((c, idx) => renderCard(c, idx))}
                </div>
            )}
        </div>
    );
};
