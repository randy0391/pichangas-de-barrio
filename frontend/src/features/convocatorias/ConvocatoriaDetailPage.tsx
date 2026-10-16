import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useConvocatoria, useConfirmar, useAddPlayerToConvocatoria, useUpdatePlayerRole } from '@/hooks/useConvocatorias';
import { useMembers, useAllMembers } from '@/hooks/useMembers';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Confirmacion, User } from '@/types';
import { ArrowLeft, Users, Shield, MapPin, CalendarDays, Clock, User as UserIcon, Copy, Wallet, Search, X, Check, ChevronDown, UserPlus } from 'lucide-react';
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

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;
    if (!c) return <div className="py-20 text-center text-white text-2xl font-bold">Convocatoria no encontrada</div>;

    const confirmados = c.confirmaciones?.filter((p: Confirmacion) => p.status === 'confirmado') || [];
    const isConfirmed = confirmados.some((p: Confirmacion) => p.user?.id === user?.id);
    
    const porterosLlenos = (c.porteros_count || 0) >= (c.num_teams || 2);
    const cupoLleno = c.confirmed_count >= c.max_players;

        const handleCopy = () => {
        const sorted = [...confirmados].sort((a,b) => a.match_role === 'portero' ? -1 : 1);
        const text = sorted.map((p, i) => `${i + 1}. ${p.user?.name || 'Jugador'} ${p.match_role === 'portero' ? '(Portero)' : ''}`).join('\n');
        navigator.clipboard.writeText(`Lista de confirmados:\n\n${text}`);
        toast.success('Lista copiada al portapapeles');
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

    const teamColors = ['from-red-500 to-red-400', 'from-purple-600 to-purple-400', 'from-green-500 to-emerald-400', 'from-orange-500 to-amber-400', 'from-blue-500 to-cyan-400'];

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
                toast.success(`¡Confirmado como ${selectedRole}!`);
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
                toast.success('Jugador añadido exitosamente');
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

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <Button variant="outline" onClick={() => navigate(-1)} className="mb-8 border-white/20 text-white hover:bg-white hover:text-slate-900 rounded-full pl-4 pr-6 uppercase font-bold text-xs tracking-wider bg-white/5 backdrop-blur-md">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-900 to-[#0a1128] rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden mb-8"
            >
                <div className="absolute right-0 top-0 w-1/3 h-full bg-primary/10 -skew-x-12 transform origin-top translate-x-16"></div>
                <div className="relative z-10">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${c.status === 'abierta' ? 'bg-lime-400 text-lime-950' : 'bg-slate-700 text-slate-300'}`}>{c.status}</span>
                        {c.rival && <span className="px-4 py-1.5 rounded-full bg-accent/20 text-accent border border-accent/30 text-xs font-bold uppercase tracking-wider">vs {c.rival}</span>}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">{c.title}</h1>
                    <p className="text-slate-300 text-lg mb-6 max-w-2xl">{c.description}</p>
                    
                    <div className="flex flex-wrap gap-6 text-sm">
                        <span className="flex items-center gap-2 text-slate-300"><CalendarDays size={16} className="text-primary" /> {c.match_date}</span>
                        <span className="flex items-center gap-2 text-slate-300"><Clock size={16} className="text-primary" /> {c.match_time} hrs</span>
                        <span className="flex items-center gap-2 text-slate-300"><MapPin size={16} className="text-accent" /> {c.location}</span>
                        <span className="flex items-center gap-2 text-slate-300"><Users size={16} className="text-lime-400" /> {c.confirmed_count}/{c.max_players} jugadores</span>
                        <span className="flex items-center gap-2 text-slate-300"><Shield size={16} className="text-yellow-400" /> {c.porteros_count}/{c.num_teams} porteros</span>
                    </div>
                </div>
            </motion.div>

            {/* Location Map */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 mb-8"
            >
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                    <MapPin className="text-primary" /> Ubicacion del Partido
                </h2>
                <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {c.maps_url && (
                        <div className="mb-4">
                            <a href={c.maps_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/20">
                                ?? Abrir en Google Maps (Ruta Oficial)
                            </a>
                        </div>
                    )}
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
            </motion.div>

            {/* Confirm Action */}
            {c.status === 'abierta' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 mb-8"
                >
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">¿Vas a jugar?</h2>
                    
                    {cupoLleno ? (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                            <p className="text-red-700 dark:text-red-400 font-bold text-lg">⚠️ El cupo está completo ({c.max_players} jugadores)</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 block">Escoge tu posición para este partido:</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRole('jugador')}
                                        className={`flex-1 p-4 rounded-2xl border-2 transition-all text-center ${selectedRole === 'jugador' ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(0,210,255,0.2)]' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'}`}
                                    >
                                        <span className="text-3xl block mb-2">⚽</span>
                                        <span className="font-black uppercase tracking-wider text-sm">Jugador</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => !porterosLlenos && setSelectedRole('portero')}
                                        disabled={porterosLlenos}
                                        className={`flex-1 p-4 rounded-2xl border-2 transition-all text-center ${porterosLlenos ? 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 cursor-not-allowed opacity-50' : selectedRole === 'portero' ? 'border-yellow-400 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'}`}
                                    >
                                        <span className="text-3xl block mb-2">🧤</span>
                                        <span className="font-black uppercase tracking-wider text-sm">Portero</span>
                                        {porterosLlenos && <p className="text-xs mt-1 text-red-500 font-bold">CUPOS LLENOS</p>}
                                    </button>
                                </div>
                            </div>
                            {/* Digital Wallet or Free match info */}
                            {cost > 0 ? (
                                <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Wallet className="h-4 w-4 text-lime-500 dark:text-lime-400" /> Billetera Digital
                                        </span>
                                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                                            Tu saldo: <span className={hasEnoughBalance ? 'text-lime-600 dark:text-lime-400 font-black' : 'text-red-500 font-black'}>S/ {userBalance.toFixed(2)}</span>
                                        </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                        <div>
                                            <p className="text-xs text-slate-500">Costo de inscripción:</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white">S/ {cost.toFixed(2)}</p>
                                        </div>
                                        {!hasEnoughBalance && (
                                            <Link to="/billetera">
                                                <Button className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-bold text-xs h-9 rounded-xl border-0">
                                                    Recargar Saldo
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                    {!hasEnoughBalance && (
                                        <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-medium">
                                            ⚠️ Saldo insuficiente en tu billetera digital. Recarga tu saldo para confirmar tu cupo.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="mb-6 p-4 rounded-xl bg-lime-400/10 border border-lime-400/30 text-center">
                                    <p className="text-sm font-bold text-lime-600 dark:text-lime-400">🎉 ¡Esta pichanga es de inscripción gratuita!</p>
                                </div>
                            )}

                            <div className="flex gap-4">
                                {isConfirmed ? (
                                    <div className="flex-1 h-14 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700">
                                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">✅ Ya confirmaste asistencia</span>
                                    </div>
                                ) : user?.has_pending_multas ? (
                                    <div className="flex-1 bg-red-500/20 text-red-600 dark:text-red-400 font-bold p-4 rounded-xl text-center border border-red-500/30">
                                        ⚠️ Tienes una multa pendiente. Págala para poder asistir.
                                    </div>
                                ) : !hasEnoughBalance ? (
                                    <Link to="/billetera" className="flex-1">
                                        <Button className="w-full h-14 bg-gradient-to-r from-lime-400 to-lime-500 text-slate-900 font-black uppercase tracking-widest rounded-xl shadow-lg border-0 text-base">
                                            💳 Recargar Billetera para Confirmar
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button onClick={handleConfirm} disabled={isConfirming} className="flex-1 h-14 bg-gradient-to-r from-lime-400 to-lime-500 text-slate-900 font-black uppercase tracking-widest rounded-xl shadow-lg border-0 text-lg">
                                        {isConfirming ? 'Confirmando...' : `✅ Confirmar Asistencia${cost > 0 ? ` (S/ ${cost.toFixed(2)})` : ''}`}
                                    </Button>
                                )}
                            </div>
                        </>
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

            {/* Teams or Player List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                {hasTeams ? (
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">🎲 Equipos Sorteados</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(teams).sort(([a],[b]) => Number(a)-Number(b)).map(([teamNum, players]) => (
                                <div key={teamNum} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
                                    <div className={`inline-block px-4 py-2 rounded-full ${Number(teamNum) === 0 ? 'bg-slate-500' : `bg-gradient-to-r ${teamColors[(Number(teamNum)-1) % teamColors.length]}`} text-white font-black uppercase tracking-widest text-sm mb-4`}>
                                        {Number(teamNum) === 0 ? 'Sin Equipo' : `Equipo ${teamNum}`} ({players.length} jugadores)
                                    </div>
                                    <div className="space-y-3">
                                        {players.sort((a,b) => a.match_role === 'portero' ? -1 : 1).map((p, idx) => (
                                            <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl ${p.match_role === 'portero' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${p.match_role === 'portero' ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                                    {p.match_role === 'portero' ? '🧤' : `${idx + 1}`}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 dark:text-white">{p.user?.name}</span>
                                                    {p.match_role === 'portero' && <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full text-[10px] font-black uppercase">Portero</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        {/* Confirmed */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
            ? Confirmados <span className="text-primary">({confirmados.length})</span>
        </h3>
        {user?.role === 'admin' && (
                                <button onClick={handleCopy} className="flex items-center gap-1 text-xs font-bold uppercase text-primary hover:text-accent transition-colors px-3 py-2 bg-primary/10 hover:bg-accent/10 rounded-lg">
                                    <Copy size={14} /> Copiar Lista
                                </button>
                            )}
    </div>
                            <div className="space-y-3">
                                {confirmados.length === 0 && <p className="text-slate-500 text-sm italic">Nadie se ha confirmado aún.</p>}
                                {confirmados.map((p: Confirmacion) => (
                                    <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl ${p.match_role === 'portero' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${p.match_role === 'portero' ? 'bg-yellow-400 text-yellow-900' : 'bg-primary/20 text-primary'}`}>
                                            {p.match_role === 'portero' ? '🧤' : <UserIcon size={18} />}
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-900 dark:text-white">{p.user?.name}</span>
                                            <span className={`ml-2 text-xs font-bold uppercase ${p.match_role === 'portero' ? 'text-yellow-600 dark:text-yellow-400' : 'text-primary'}`}>{p.match_role}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
