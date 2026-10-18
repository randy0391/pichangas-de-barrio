import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useConvocatoria, useConfirmar, useAddPlayerToConvocatoria, useUpdatePlayerRole, useRemoveConfirmacion } from '@/hooks/useConvocatorias';
import { useAllMembers } from '@/hooks/useMembers';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Confirmacion, User } from '@/types';
import { 
    ArrowLeft, 
    Users, 
    Shield, 
    MapPin, 
    CalendarDays, 
    Clock, 
    User as UserIcon, 
    Copy, 
    Wallet, 
    Search, 
    X, 
    Check, 
    ChevronDown, 
    UserPlus,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    Trophy,
    Sparkles,
    Flame,
    Trash2
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export const ConvocatoriaDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const { data: c, isLoading } = useConvocatoria(Number(id));
    const { mutate: confirmar, isPending: isConfirming } = useConfirmar();
    const { mutate: addPlayer, isPending: isAddingPlayer } = useAddPlayerToConvocatoria();
    const { mutate: removeConfirmacion } = useRemoveConfirmacion();
    const { mutate: updateRole } = useUpdatePlayerRole();
    const { data: allMembers = [], isLoading: loadingMembers } = useAllMembers();
    
    const [selectedRole, setSelectedRole] = useState<'jugador' | 'portero'>('jugador');
    const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);

    const [adminSelectedUserId, setAdminSelectedUserId] = useState<string>('');
    const [adminSelectedRole, setAdminSelectedRole] = useState<'jugador' | 'portero'>('jugador');
    const [adminSearch, setAdminSearch] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Normalize accents and casing for robust search
    const normalizeText = (text: string = '') =>
        text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { data: walletData } = useQuery<{ wallet: { balance: string } }>({
        queryKey: ['my-wallet'],
        queryFn: async () => {
            const res = await api.get('/wallet');
            return res.data;
        },
        enabled: !!user
    });

    const userBalance = parseFloat(walletData?.wallet?.balance || '0');
    const cost = parseFloat(String(c?.cost_per_player || '0'));
    const hasEnoughBalance = cost <= 0 || userBalance >= cost;

    if (isLoading) return <div className="py-24 flex justify-center"><FootballSpinner /></div>;
    if (!c) return <div className="py-24 text-center text-white text-2xl font-bold">Convocatoria no encontrada</div>;

    const confirmados = c.confirmaciones?.filter((p: Confirmacion) => p.status === 'confirmado') || [];
    const myConfirmation = confirmados.find((p: Confirmacion) => p.user?.id === user?.id);
    const isConfirmed = !!myConfirmation;
    
    const porterosMax = c.num_teams || 2;
    const porterosActuales = c.porteros_count || confirmados.filter((p: Confirmacion) => p.match_role === 'portero').length;
    const porterosLlenos = porterosActuales >= porterosMax;
    const cupoLleno = c.confirmed_count >= c.max_players;

    const jugadoresMax = Math.max(0, c.max_players - porterosMax);
    const jugadoresActuales = Math.max(0, c.confirmed_count - porterosActuales);
    const fillPercent = Math.min(100, Math.round((c.confirmed_count / (c.max_players || 1)) * 100));

    // Formateo de fecha amigable en español
    const formattedDate = (() => {
        if (!c.match_date) return '';
        try {
            const [y, m, d] = c.match_date.split('-');
            if (!y || !m || !d) return c.match_date;
            const date = new Date(Number(y), Number(m) - 1, Number(d));
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return c.match_date;
        }
    })();

    const handleCopy = () => {
        const sorted = [...confirmados].sort((a,b) => a.match_role === 'portero' ? -1 : 1);
        const text = sorted.map((p, i) => {
            const userName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
            const nickname = p.user?.nickname ? ` "${p.user?.nickname}"` : '';
            const roleTag = p.match_role === 'portero' ? '🧤 (Portero)' : '⚽';
            return `${i + 1}. ${roleTag} ${userName}${nickname}`;
        }).join('\n');

        navigator.clipboard.writeText(`⚽ CONVOCADOS: ${c.title.toUpperCase()}\n📅 ${c.match_date} · ⏰ ${c.match_time} hrs\n🏟️ ${c.location}\n\nLista de confirmados (${confirmados.length}/${c.max_players}):\n\n${text}`);
        toast.success('Lista de convocados copiada para WhatsApp');
    };

    const hasTeams = confirmados.some((p: Confirmacion) => p.team_number !== null);
    const teams: Record<number, Confirmacion[]> = {};
    if (hasTeams) {
        confirmados.forEach((p: Confirmacion) => {
            const t = p.team_number || 0;
            if (!teams[t]) teams[t] = [];
            teams[t].push(p);
        });
    }

    const teamColors = [
        { label: 'Equipo Rojo', bg: 'from-rose-600 to-red-500', border: 'border-red-500/40', badge: 'bg-red-500/20 text-red-300' },
        { label: 'Equipo Azul', bg: 'from-blue-600 to-cyan-500', border: 'border-blue-500/40', badge: 'bg-blue-500/20 text-blue-300' },
        { label: 'Equipo Verde', bg: 'from-emerald-600 to-teal-500', border: 'border-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-300' },
        { label: 'Equipo Naranja', bg: 'from-amber-600 to-orange-500', border: 'border-orange-500/40', badge: 'bg-orange-500/20 text-orange-300' },
        { label: 'Equipo Morado', bg: 'from-purple-600 to-indigo-500', border: 'border-purple-500/40', badge: 'bg-purple-500/20 text-purple-300' },
    ];

    const handleConfirm = () => {
        if (cost > 0 && !hasEnoughBalance) {
            toast.error(`Saldo insuficiente. Necesitas S/ ${cost.toFixed(2)} en tu Billetera Digital.`);
            return;
        }

        const fd = new FormData();
        fd.append('match_role', selectedRole);
        if (paymentReceipt) {
            fd.append('payment_receipt', paymentReceipt);
        }

        confirmar({ id: c.id, formData: fd }, {
            onSuccess: () => {
                toast.success(`¡Confirmado con éxito como ${selectedRole === 'portero' ? 'Portero 🧤' : 'Jugador ⚽'}!`);
                queryClient.invalidateQueries({ queryKey: ['my-wallet'] });
            },
            onError: (err: any) => {
                const msgs = err?.response?.data?.errors;
                if (msgs) {
                    const firstError = Object.values(msgs)[0] as string[];
                    toast.error(firstError[0] || 'Error al confirmar');
                } else {
                    toast.error(err?.response?.data?.message || 'Error al confirmar');
                }
            }
        });
    };

    const handleAdminAddPlayer = () => {
        if (!adminSelectedUserId) return toast.error('Selecciona un jugador');
        addPlayer({ id: c.id, userId: Number(adminSelectedUserId), matchRole: adminSelectedRole }, {
            onSuccess: () => {
                toast.success('Jugador añadido a la convocatoria');
                setAdminSelectedUserId('');
                setAdminSearch('');
                setIsSearchOpen(false);
            },
            onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al añadir jugador')
        });
    };

    const availableMembers = (allMembers as User[]).filter((m: User) => !confirmados.some((conf: Confirmacion) => conf.user?.id === m.id));
    const searchTerms = normalizeText(adminSearch).split(/\s+/).filter(Boolean);
    const filteredMembers = availableMembers.filter((m: User) => {
        if (searchTerms.length === 0) return true;
        const target = normalizeText(
            `${m.name || ''} ${m.nombres || ''} ${m.apellido_paterno || ''} ${m.apellido_materno || ''} ${m.nickname || ''} ${m.dni || ''} ${m.phone || ''} ${m.email || ''}`
        );
        return searchTerms.every(term => target.includes(term));
    });
    const selectedMember = (allMembers as User[]).find((m: User) => String(m.id) === adminSelectedUserId);

    const googleMapsUrl = c.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.location)}`;

    return (
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl space-y-8">
            {/* Volver */}
            <Button 
                variant="outline" 
                onClick={() => navigate(-1)} 
                className="border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full pl-4 pr-6 uppercase font-bold text-xs tracking-wider bg-white/50 dark:bg-slate-900/50 backdrop-blur-md transition-all shadow-sm"
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Convocatorias
            </Button>

            {/* Hero Card del Partido */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl overflow-hidden"
            >
                {/* Acento decorativo deportivo */}
                <div className="absolute right-0 top-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mb-20"></div>

                <div className="relative z-10 space-y-6">
                    {/* Badges superiores */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${
                            c.status === 'abierta' 
                                ? 'bg-lime-400 text-slate-950 shadow-lime-400/20' 
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                            <span className={`w-2 h-2 rounded-full ${c.status === 'abierta' ? 'bg-slate-950 animate-pulse' : 'bg-slate-400'}`}></span>
                            {c.status === 'abierta' ? 'Convocatoria Abierta' : 'Convocatoria Cerrada'}
                        </span>

                        {c.rival && (
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider">
                                ⚔️ VS {c.rival}
                            </span>
                        )}

                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-white text-xs font-bold uppercase tracking-wider">
                            {cost > 0 ? `💰 S/ ${cost.toFixed(2)} por cupo` : '🎉 Inscripción Gratuita'}
                        </span>
                    </div>

                    {/* Título y Descripción */}
                    <div>
                        <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight">
                            {c.title}
                        </h1>
                        {c.description && (
                            <p className="text-slate-300 text-base sm:text-lg mt-3 max-w-3xl leading-relaxed">
                                {c.description}
                            </p>
                        )}
                    </div>

                    {/* Píldoras con Datos Clave del Encuentro */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                                <CalendarDays size={20} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fecha</p>
                                <p className="text-xs sm:text-sm font-black text-white truncate capitalize">{formattedDate || c.match_date}</p>
                            </div>
                        </div>

                        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0">
                                <Clock size={20} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hora</p>
                                <p className="text-xs sm:text-sm font-black text-white truncate">{c.match_time} hrs</p>
                            </div>
                        </div>

                        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                                <MapPin size={20} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sede</p>
                                <p className="text-xs sm:text-sm font-black text-white truncate" title={c.location}>{c.location}</p>
                            </div>
                        </div>

                        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-lime-400/15 text-lime-400 flex items-center justify-center shrink-0">
                                <Users size={20} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Formato</p>
                                <p className="text-xs sm:text-sm font-black text-white truncate">{c.num_teams || 2} Equipos</p>
                            </div>
                        </div>
                    </div>

                    {/* Barra de Progreso de Capacidad en Tiempo Real */}
                    <div className="bg-slate-900/80 border border-slate-800/90 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-lime-400"></span>
                                Cupos confirmados: <span className="text-lime-400 font-black">{c.confirmed_count} / {c.max_players}</span> ({fillPercent}%)
                            </span>
                            <span className="text-slate-400">
                                {cupoLleno ? '🚫 Cupo Completo' : `Quedan ${Math.max(0, c.max_players - c.confirmed_count)} disponibles`}
                            </span>
                        </div>

                        {/* Barra */}
                        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative">
                            <div 
                                className={`h-full rounded-full transition-all duration-700 ${
                                    cupoLleno 
                                        ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                                        : 'bg-gradient-to-r from-emerald-500 via-lime-400 to-teal-400'
                                }`}
                                style={{ width: `${fillPercent}%` }}
                            ></div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>🧤 Arqueros: <strong className="text-amber-400">{porterosActuales}/{porterosMax}</strong></span>
                            <span>⚽ Jugadores de campo: <strong className="text-emerald-400">{jugadoresActuales}/{jugadoresMax}</strong></span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Sede del Partido & Mapa GPS */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <MapPin className="text-emerald-500" /> Sede del Encuentro
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {c.location}
                        </p>
                    </div>

                    <a 
                        href={googleMapsUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 shrink-0"
                    >
                        <ExternalLink size={15} /> Abrir en Google Maps (GPS)
                    </a>
                </div>

                <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                    <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(c.location)}&t=m&z=15&output=embed&iwloc=near`}
                        allowFullScreen
                    ></iframe>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span>💡</span> <strong>Consejo del DT:</strong> Llega con 15 minutos de anticipación para realizar el calentamiento y la entrega oficial de indumentaria.
                </p>
            </motion.div>

            {/* Acción de Confirmación para el Jugador */}
            {c.status === 'abierta' && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-lime-500 block">Inscripción Oficial</span>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                ¿Vas a Jugar en esta Pichanga?
                            </h2>
                        </div>

                        {isConfirmed && (
                            <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                                <CheckCircle2 size={16} /> Ya estás confirmado
                            </span>
                        )}
                    </div>

                    {/* Caso 1: Jugador ya confirmado */}
                    {isConfirmed ? (
                        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
                            <div className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-emerald-500/30">
                                ⚽
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">
                                🎉 ¡Tu cupo está 100% asegurado!
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                                Estás registrado oficialmente como <strong className="text-emerald-600 dark:text-emerald-400 uppercase">{myConfirmation?.match_role === 'portero' ? '🧤 Arquero' : '⚽ Jugador de Campo'}</strong>.
                            </p>
                            <p className="text-xs text-slate-400">
                                Te esperamos el {c.match_date} a las {c.match_time} hrs en {c.location}.
                            </p>
                        </div>
                    ) : user?.has_pending_multas ? (
                        /* Caso 2: Tiene multa pendiente */
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center space-y-3">
                            <AlertCircle size={36} className="mx-auto text-red-500" />
                            <h3 className="text-base font-black text-red-700 dark:text-red-400 uppercase">
                                Tienes una multa pendiente
                            </h3>
                            <p className="text-xs text-red-600 dark:text-red-300 max-w-md mx-auto">
                                Para poder confirmar tu participación en las convocatorias, es necesario regularizar tu multa pendiente en tu perfil o billetera.
                            </p>
                            <Link to="/mis-multas" className="inline-block mt-2">
                                <Button className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase px-5 rounded-xl border-0">
                                    Ver y Pagar Multa
                                </Button>
                            </Link>
                        </div>
                    ) : cupoLleno ? (
                        /* Caso 3: Cupo lleno */
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
                            <p className="text-amber-700 dark:text-amber-400 font-black text-base">
                                ⚠️ El cupo para este partido está completo ({c.max_players} jugadores).
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Mantente atento al grupo por si algún jugador cancela su cupo.
                            </p>
                        </div>
                    ) : (
                        /* Caso 4: Selección de Posición y Confirmación */
                        <div className="space-y-6">
                            {/* Selector de Posición */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 block">
                                    Paso 1: Selecciona tu posición en cancha:
                                </label>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Opción Jugador de Campo */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRole('jugador')}
                                        className={`relative p-5 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${
                                            selectedRole === 'jugador'
                                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-2 ring-emerald-500/20'
                                                : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${
                                                selectedRole === 'jugador' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700'
                                            }`}>
                                                ⚽
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                                                    Jugador de Campo
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Defensa, volante o delantero
                                                </p>
                                                <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                                                    {jugadoresActuales}/{jugadoresMax} inscritos
                                                </span>
                                            </div>
                                        </div>

                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                            selectedRole === 'jugador' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                            {selectedRole === 'jugador' && <Check size={14} className="stroke-[3]" />}
                                        </div>
                                    </button>

                                    {/* Opción Portero */}
                                    <button
                                        type="button"
                                        onClick={() => !porterosLlenos && setSelectedRole('portero')}
                                        disabled={porterosLlenos}
                                        className={`relative p-5 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${
                                            porterosLlenos
                                                ? 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 opacity-60 cursor-not-allowed'
                                                : selectedRole === 'portero'
                                                    ? 'border-amber-400 bg-amber-400/10 text-amber-600 dark:text-amber-400 shadow-[0_0_20px_rgba(250,204,21,0.15)] ring-2 ring-amber-400/20'
                                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${
                                                selectedRole === 'portero' ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-200 dark:bg-slate-700'
                                            }`}>
                                                🧤
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                                                    Arquero / Portero
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Defensa del arco
                                                </p>
                                                <span className={`inline-block mt-1 text-[10px] font-bold uppercase ${porterosLlenos ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                                                    {porterosLlenos ? 'CUPOS COMPLETOS (2/2)' : `${porterosActuales}/${porterosMax} disponibles`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                            selectedRole === 'portero' ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                            {selectedRole === 'portero' && <Check size={14} className="stroke-[3]" />}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Billetera Digital & Tarjeta de Confirmación */}
                            <div className="bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                                    Paso 2: Billetera Digital y Pago de Cupo:
                                </label>

                                {cost > 0 ? (
                                    <div className="space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-lime-400/20 text-lime-600 dark:text-lime-400 flex items-center justify-center shrink-0">
                                                    <Wallet size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Costo de tu cupo</p>
                                                    <p className="text-xl font-black text-slate-900 dark:text-white">S/ {cost.toFixed(2)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Tu saldo disponible</p>
                                                    <p className={`text-xl font-black ${hasEnoughBalance ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                                        S/ {userBalance.toFixed(2)}
                                                    </p>
                                                </div>
                                                {!hasEnoughBalance && (
                                                    <Link to="/billetera">
                                                        <Button className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black text-xs h-10 px-4 rounded-xl border-0 shadow-md">
                                                            + Recargar
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        {!hasEnoughBalance && (
                                            <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 p-3.5 rounded-xl text-xs text-red-600 dark:text-red-400">
                                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                                <span>
                                                    Saldo insuficiente en tu billetera. Te faltan <strong>S/ {(cost - userBalance).toFixed(2)}</strong> para poder confirmar tu asistencia. Recarga tu billetera para no perder tu cupo.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-center font-bold text-sm">
                                        🎉 ¡Esta pichanga es de inscripción 100% gratuita!
                                    </div>
                                )}

                                {/* Botón de Acción Principal */}
                                <div>
                                    {!hasEnoughBalance && cost > 0 ? (
                                        <Link to="/billetera" className="block">
                                            <Button className="w-full h-14 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-slate-950 font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-lime-400/20 border-0 text-base flex items-center justify-center gap-2">
                                                <Wallet size={18} /> Recargar Billetera para Confirmar Cupo
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button 
                                            onClick={handleConfirm} 
                                            disabled={isConfirming} 
                                            className="w-full h-14 bg-gradient-to-r from-emerald-500 via-teal-500 to-lime-400 hover:from-emerald-600 hover:via-teal-600 hover:to-lime-500 text-slate-950 font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/20 border-0 text-base flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <CheckCircle2 size={20} />
                                            {isConfirming 
                                                ? 'Confirmando tu cupo...' 
                                                : `Confirmar Asistencia como ${selectedRole === 'portero' ? 'Portero 🧤' : 'Jugador ⚽'}${cost > 0 ? ` (S/ ${cost.toFixed(2)})` : ''}`
                                            }
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Admin Add Player */}
            {user?.role === 'admin' && c.status === 'abierta' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="bg-indigo-950/40 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl border border-indigo-500/30 mb-8"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-1">
                                <Shield className="h-3.5 w-3.5 text-indigo-400" /> Control de Administrador
                            </span>
                            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                                👑 Añadir Jugador Manualmente
                            </h2>
                        </div>
                        <span className="text-xs text-indigo-300 font-bold bg-indigo-900/60 border border-indigo-700/50 px-3.5 py-1.5 rounded-full self-start sm:self-auto">
                            {availableMembers.length} disponibles · {confirmados.length}/{c.max_players} confirmados
                        </span>
                    </div>

                    <p className="text-xs text-slate-300 mb-4">
                        Busca cualquier jugador registrado por su <strong>nombre, apellido, apodo o DNI</strong> para sumarlo a la convocatoria.
                    </p>

                    {/* Selected Member Preview Card OR Search Combobox */}
                    {selectedMember ? (
                        <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="w-12 h-12 rounded-full bg-slate-800 text-lime-400 border border-indigo-500/50 flex items-center justify-center font-black text-base shrink-0 overflow-hidden">
                                    {selectedMember.avatar ? (
                                        <img src={selectedMember.avatar} alt={selectedMember.name} className="w-full h-full object-cover" />
                                    ) : (
                                        (selectedMember.name || 'J')[0].toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-base font-black text-white truncate">{selectedMember.name}</span>
                                        {selectedMember.nickname && (
                                            <span className="text-xs font-bold text-lime-400 bg-lime-400/10 border border-lime-400/20 px-2.5 py-0.5 rounded-full">
                                                "{selectedMember.nickname}"
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                                        {selectedMember.dni ? `DNI: ${selectedMember.dni}` : ''} {selectedMember.phone ? `| 📱 ${selectedMember.phone}` : ''} {selectedMember.position ? `| ⚽ ${selectedMember.position}` : ''}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setAdminSelectedUserId('');
                                    setAdminSearch('');
                                    setIsSearchOpen(true);
                                }}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors inline-flex items-center justify-center gap-1.5 border border-slate-700"
                            >
                                <X className="h-4 w-4" /> Cambiar jugador
                            </button>
                        </div>
                    ) : (
                        <div ref={searchContainerRef} className="relative mb-4">
                            {/* Search input with icons */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar por nombre, apellido, apodo o DNI..."
                                    value={adminSearch}
                                    onFocus={() => setIsSearchOpen(true)}
                                    onChange={(e) => {
                                        setAdminSearch(e.target.value);
                                        setIsSearchOpen(true);
                                    }}
                                    className="w-full pl-12 pr-12 py-3.5 bg-slate-900 border border-indigo-400/40 rounded-2xl text-white placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                                />
                                {adminSearch ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAdminSearch('');
                                            setIsSearchOpen(true);
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                                        title="Limpiar búsqueda"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 p-1"
                                        title="Ver lista"
                                    >
                                        <ChevronDown className={`h-4 w-4 transition-transform ${isSearchOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                )}
                            </div>

                            {/* Autocomplete Dropdown List */}
                            {isSearchOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/98 backdrop-blur-xl border border-indigo-500/40 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-800/80">
                                    <div className="p-2.5 bg-slate-950/80 text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between sticky top-0 border-b border-slate-800 z-10">
                                        <span>
                                            {adminSearch ? `Resultados (${filteredMembers.length})` : `Todos los jugadores (${filteredMembers.length})`}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-normal">
                                            Clic para seleccionar
                                        </span>
                                    </div>

                                    {loadingMembers ? (
                                        <div className="py-8 flex justify-center"><FootballSpinner /></div>
                                    ) : filteredMembers.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400">
                                            <p className="text-sm font-bold text-slate-300">No se encontró ningún jugador</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                No hay resultados para "{adminSearch}". Verifica si el jugador ya está confirmado en la lista de abajo o regístralo si es nuevo.
                                            </p>
                                        </div>
                                    ) : (
                                        filteredMembers.map((m: User) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => {
                                                    setAdminSelectedUserId(String(m.id));
                                                    setIsSearchOpen(false);
                                                }}
                                                className="w-full text-left p-3 hover:bg-indigo-950/50 transition-colors flex items-center justify-between gap-3 group"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 text-lime-400 border border-slate-700 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden group-hover:border-lime-400 transition-colors">
                                                        {m.avatar ? (
                                                            <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            (m.name || 'J')[0].toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-sm font-bold text-white group-hover:text-lime-400 transition-colors truncate">
                                                                {m.name}
                                                            </span>
                                                            {m.nickname && (
                                                                <span className="text-[11px] font-bold text-slate-400 group-hover:text-lime-300">
                                                                    "{m.nickname}"
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                                                            {m.dni && <span>DNI: {m.dni}</span>}
                                                            {m.phone && <span>📱 {m.phone}</span>}
                                                            {m.position && (
                                                                <span className="text-indigo-400 capitalize">
                                                                    ⚽ {m.position}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="shrink-0">
                                                    <span className="text-xs font-bold text-indigo-400 group-hover:text-lime-400 opacity-0 group-hover:opacity-100 transition-all inline-flex items-center gap-1">
                                                        Elegir <Check className="h-3.5 w-3.5" />
                                                    </span>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Bar: Role + Add Button */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <div className="w-full sm:w-56 shrink-0">
                            <label className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block mb-1">
                                Rol en el Partido
                            </label>
                            <select 
                                value={adminSelectedRole} 
                                onChange={(e) => setAdminSelectedRole(e.target.value as any)}
                                className="w-full p-3.5 rounded-xl border border-indigo-400/40 bg-slate-900 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="jugador">⚽ Jugador de Campo</option>
                                <option value="portero">🧤 Portero</option>
                            </select>
                        </div>

                        <div className="w-full flex-1 sm:self-end">
                            <label className="text-[10px] text-transparent font-bold uppercase tracking-wider hidden sm:block mb-1 select-none">
                                Acción
                            </label>
                            <Button 
                                onClick={handleAdminAddPlayer} 
                                disabled={isAddingPlayer || !adminSelectedUserId} 
                                className="w-full h-12 bg-lime-400 hover:bg-lime-500 text-slate-950 font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-lime-400/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm border-0"
                            >
                                <UserPlus className="h-4 w-4" />
                                {isAddingPlayer ? 'Añadiendo a la convocatoria...' : 'Añadir a la Convocatoria'}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Lista de Convocados & Equipos */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 }}
                className="space-y-6"
            >
                {hasTeams ? (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">Alineaciones del Encuentro</span>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    🎲 Equipos Sorteados Oficiales
                                </h2>
                            </div>

                            {user?.role === 'admin' && (
                                <button 
                                    onClick={handleCopy} 
                                    className="inline-flex items-center gap-2 text-xs font-black uppercase text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                                >
                                    <Copy size={15} /> Copiar Equipos
                                </button>
                            )}
                        </div>

                        {/* Cuadrícula de Equipos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(teams).sort(([a],[b]) => Number(a)-Number(b)).map(([teamNum, players]) => {
                                const tNum = Number(teamNum);
                                const style = tNum === 0 
                                    ? { label: 'Sin Equipo Asignado', bg: 'from-slate-700 to-slate-800', border: 'border-slate-700', badge: 'bg-slate-800 text-slate-300' }
                                    : teamColors[(tNum - 1) % teamColors.length];
                                
                                const teamGoalkeepers = players.filter(p => p.match_role === 'portero');
                                const teamFieldPlayers = players.filter(p => p.match_role !== 'portero');

                                return (
                                    <div 
                                        key={teamNum} 
                                        className={`bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border ${style.border} shadow-xl flex flex-col`}
                                    >
                                        {/* Cabecera del Equipo */}
                                        <div className={`bg-gradient-to-r ${style.bg} p-5 text-white flex items-center justify-between`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg shadow-sm">
                                                    {tNum === 0 ? '?' : tNum}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-lg uppercase tracking-tight">
                                                        {tNum === 0 ? 'Sin Equipo Asignado' : `Equipo ${tNum}`}
                                                    </h3>
                                                    <p className="text-xs text-white/80 font-medium">
                                                        {players.length} jugadores en la plantilla
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="text-[11px] font-black uppercase tracking-wider bg-black/25 px-3 py-1 rounded-full border border-white/20">
                                                🧤 {teamGoalkeepers.length} · ⚽ {teamFieldPlayers.length}
                                            </span>
                                        </div>

                                        {/* Lista de Jugadores del Equipo */}
                                        <div className="p-5 space-y-2.5 flex-1">
                                            {/* Porteros Primero */}
                                            {teamGoalkeepers.map((p) => {
                                                const pName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
                                                const isMe = p.user?.id === user?.id;

                                                return (
                                                    <div 
                                                        key={p.id} 
                                                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                                            isMe 
                                                                ? 'bg-amber-400/15 border-amber-400/40 shadow-sm' 
                                                                : 'bg-amber-400/5 dark:bg-amber-400/10 border-amber-400/20'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base shrink-0 shadow-sm">
                                                                🧤
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="font-black text-sm text-slate-900 dark:text-white truncate">
                                                                        {pName}
                                                                    </span>
                                                                    {p.user?.nickname && (
                                                                        <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                                                                            "{p.user.nickname}"
                                                                        </span>
                                                                    )}
                                                                    {isMe && (
                                                                        <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase">
                                                                            Tú
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                                                                    Arquero Titular
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {user?.role === 'admin' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        toast(`¿Eliminar la reserva de ${pName}?`, {
                                                                            action: {
                                                                                label: 'Eliminar',
                                                                                onClick: () => removeConfirmacion({ id: c.id, userId: p.user.id })
                                                                            },
                                                                            cancel: { label: 'Cancelar', onClick: () => {} }
                                                                        });
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                                                    title="Eliminar de la convocatoria"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            {p.user?.jersey_number && (
                                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                                                    #{p.user.jersey_number}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Jugadores de Campo */}
                                            {teamFieldPlayers.map((p, idx) => {
                                                const pName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
                                                const isMe = p.user?.id === user?.id;

                                                return (
                                                    <div 
                                                        key={p.id} 
                                                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                                            isMe 
                                                                ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm' 
                                                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-black text-sm shrink-0">
                                                                {p.user?.avatar ? (
                                                                    <img src={p.user.avatar} alt={pName} className="w-full h-full object-cover rounded-xl" />
                                                                ) : (
                                                                    pName.charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                                        {pName}
                                                                    </span>
                                                                    {p.user?.nickname && (
                                                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                                            "{p.user.nickname}"
                                                                        </span>
                                                                    )}
                                                                    {isMe && (
                                                                        <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase">
                                                                            Tú
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize block">
                                                                    ⚽ {p.user?.position || 'Jugador'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {user?.role === 'admin' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        toast(`¿Eliminar la reserva de ${pName}?`, {
                                                                            action: {
                                                                                label: 'Eliminar',
                                                                                onClick: () => removeConfirmacion({ id: c.id, userId: p.user.id })
                                                                            },
                                                                            cancel: { label: 'Cancelar', onClick: () => {} }
                                                                        });
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                                                    title="Eliminar de la convocatoria"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            {p.user?.jersey_number ? (
                                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                                                    #{p.user.jersey_number}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] font-mono text-slate-400">
                                                                    #{teamGoalkeepers.length + idx + 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Vista cuando no hay sorteo de equipos: Lista general de Convocados */
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                        🏆 Lista de Convocados
                                    </h3>
                                    <span className="bg-primary/15 text-primary text-xs font-black px-3 py-1 rounded-full border border-primary/20">
                                        {confirmados.length} / {c.max_players}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    🧤 {porterosActuales} Arqueros inscritos · ⚽ {Math.max(0, confirmados.length - porterosActuales)} Jugadores de campo
                                </p>
                            </div>

                            <button 
                                onClick={handleCopy} 
                                className="inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-sm self-start sm:self-auto"
                            >
                                <Copy size={15} /> Copiar Lista para WhatsApp
                            </button>
                        </div>

                        {confirmados.length === 0 ? (
                            <div className="py-16 text-center space-y-3">
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-3xl">
                                    ⚽
                                </div>
                                <h4 className="font-bold text-slate-700 dark:text-slate-300">
                                    Aún no hay jugadores confirmados
                                </h4>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    ¡Sé el primero en sumarte a la convocatoria y asegurar tu lugar en la cancha!
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {[...confirmados]
                                    .sort((a, b) => a.match_role === 'portero' ? -1 : 1)
                                    .map((p: Confirmacion, idx: number) => {
                                        const pName = p.user?.name || `${p.user?.nombres || ''} ${p.user?.apellido_paterno || ''}`.trim() || 'Jugador';
                                        const isGoalkeeper = p.match_role === 'portero';
                                        const isMe = p.user?.id === user?.id;

                                        return (
                                            <div 
                                                key={p.id} 
                                                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                                    isMe 
                                                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm' 
                                                        : isGoalkeeper 
                                                            ? 'bg-amber-400/5 dark:bg-amber-400/10 border-amber-400/30' 
                                                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {/* Badge de orden o dorsal */}
                                                    <div className="relative shrink-0">
                                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm border ${
                                                            isGoalkeeper 
                                                                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm' 
                                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                                                        }`}>
                                                            {p.user?.avatar ? (
                                                                <img src={p.user.avatar} alt={pName} className="w-full h-full object-cover rounded-2xl" />
                                                            ) : isGoalkeeper ? (
                                                                '🧤'
                                                            ) : (
                                                                pName.charAt(0).toUpperCase()
                                                            )}
                                                        </div>

                                                        {p.user?.jersey_number && (
                                                            <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white font-mono font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-700">
                                                                {p.user.jersey_number}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                                {pName}
                                                            </span>
                                                            {isMe && (
                                                                <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                                                                    Tú
                                                                </span>
                                                            )}
                                                        </div>

                                                        {p.user?.nickname && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 italic truncate">
                                                                "{p.user.nickname}"
                                                            </p>
                                                        )}

                                                        <div className="mt-1 flex items-center gap-2">
                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                                isGoalkeeper 
                                                                    ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400' 
                                                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                            }`}>
                                                                {isGoalkeeper ? '🧤 Arquero' : '⚽ Jugador'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {user?.role === 'admin' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                toast(`¿Eliminar la reserva de ${pName}?`, {
                                                                    action: {
                                                                        label: 'Eliminar',
                                                                        onClick: () => removeConfirmacion({ id: c.id, userId: p.user.id })
                                                                    },
                                                                    cancel: { label: 'Cancelar', onClick: () => {} }
                                                                });
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                                            title="Eliminar de la convocatoria"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <span className="text-xs font-mono font-bold text-slate-400">
                                                        #{idx + 1}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};
