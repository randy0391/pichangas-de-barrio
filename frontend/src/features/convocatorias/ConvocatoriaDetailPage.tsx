import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConvocatoria, useConfirmar, useAddPlayerToConvocatoria } from '@/hooks/useConvocatorias';
import { useMembers } from '@/hooks/useMembers';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Confirmacion } from '@/types';
import { ArrowLeft, Users, Shield, MapPin, CalendarDays, Clock, User as UserIcon } from 'lucide-react';

export const ConvocatoriaDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { data: c, isLoading } = useConvocatoria(Number(id));
    const { mutate: confirmar, isPending: isConfirming } = useConfirmar();
    const { mutate: addPlayer, isPending: isAddingPlayer } = useAddPlayerToConvocatoria();
    const { data: membersData } = useMembers(1, '', 100);
    
    const [selectedRole, setSelectedRole] = useState<'jugador' | 'portero'>('jugador');
    const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);

    const [adminSelectedUserId, setAdminSelectedUserId] = useState<string>('');
    const [adminSelectedRole, setAdminSelectedRole] = useState<'jugador' | 'portero'>('jugador');

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;
    if (!c) return <div className="py-20 text-center text-white text-2xl font-bold">Convocatoria no encontrada</div>;

    const confirmados = c.confirmaciones?.filter((p: Confirmacion) => p.status === 'confirmado') || [];
    const isConfirmed = confirmados.some((p: Confirmacion) => p.user?.id === user?.id);
    
    const porterosLlenos = (c.porteros_count || 0) >= (c.num_teams || 2);
    const cupoLleno = c.confirmed_count >= c.max_players;

    const hasTeams = confirmados.some((p: Confirmacion) => p.team_number !== null);
    const teams: Record<number, Confirmacion[]> = {};
    if (hasTeams) {
        confirmados.forEach((p: Confirmacion) => {
            const t = p.team_number || 0;
            if (!teams[t]) teams[t] = [];
            teams[t].push(p);
        });
    }

    const teamColors = ['from-primary to-cyan-400', 'from-accent to-pink-400', 'from-lime-400 to-emerald-400', 'from-amber-400 to-orange-400'];

    const handleConfirm = () => {
        if (!paymentReceipt) {
            toast.error('Debes subir el comprobante de pago de la convocatoria.');
            return;
        }

        const fd = new FormData();
        fd.append('match_role', selectedRole);
        fd.append('payment_receipt', paymentReceipt);

        confirmar({ id: c.id, formData: fd }, {
            onSuccess: () => toast.success(`¡Confirmado como ${selectedRole}!`),
            onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al confirmar')
        });
    };

    const handleAdminAddPlayer = () => {
        if (!adminSelectedUserId) return toast.error('Selecciona un jugador');
        addPlayer({ id: c.id, userId: Number(adminSelectedUserId), matchRole: adminSelectedRole }, {
            onSuccess: () => {
                toast.success('Jugador añadido exitosamente');
                setAdminSelectedUserId('');
            },
            onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al añadir jugador')
        });
    };

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
                            <div className="mb-6 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">📄 Comprobante de Pago</label>
                                <p className="text-xs text-slate-500 mb-3">Sube la captura de tu transferencia o Yape/Plin para asegurar tu cupo.</p>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setPaymentReceipt(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:file:bg-primary/20 dark:hover:file:bg-primary/30"
                                />
                            </div>
                            <div className="flex gap-4">
                                {isConfirmed ? (
                                    <div className="flex-1 h-14 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700">
                                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">✅ Ya confirmaste asistencia</span>
                                    </div>
                                ) : user?.has_pending_multas ? (
                                    <div className="flex-1 bg-red-500/20 text-red-600 dark:text-red-400 font-bold p-4 rounded-xl text-center border border-red-500/30">
                                        ⚠️ Tienes una multa pendiente. Págala para poder asistir.
                                    </div>
                                ) : (
                                    <Button onClick={handleConfirm} disabled={isConfirming} className="flex-1 h-14 bg-gradient-to-r from-lime-400 to-lime-500 text-slate-900 font-black uppercase tracking-widest rounded-xl shadow-lg border-0 text-lg">
                                        {isConfirming ? 'Confirmando...' : '✅ Confirmar Asistencia'}
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
                    className="bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl p-8 shadow-xl border border-indigo-200 dark:border-indigo-800 mb-8"
                >
                    <h2 className="text-xl font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-tight mb-4">👑 Panel Admin: Añadir Jugador Manualmente</h2>
                    <div className="flex flex-col md:flex-row gap-4">
                        <select 
                            value={adminSelectedUserId} 
                            onChange={(e) => setAdminSelectedUserId(e.target.value)}
                            className="flex-1 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                        >
                            <option value="">Selecciona un miembro...</option>
                            {membersData?.data?.filter((m: any) => !confirmados.some((conf: any) => conf.user?.id === m.id)).map((m: any) => (
                                <option key={m.id} value={m.id}>{m.name} ({m.nickname || 'Sin apodo'})</option>
                            ))}
                        </select>
                        <select 
                            value={adminSelectedRole} 
                            onChange={(e) => setAdminSelectedRole(e.target.value as any)}
                            className="w-full md:w-48 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                        >
                            <option value="jugador">Jugador</option>
                            <option value="portero">Portero</option>
                        </select>
                        <Button 
                            onClick={handleAdminAddPlayer} 
                            disabled={isAddingPlayer || !adminSelectedUserId} 
                            className="h-auto px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-xl"
                        >
                            {isAddingPlayer ? 'Añadiendo...' : 'Añadir'}
                        </Button>
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
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                                ✅ Confirmados <span className="text-primary">({confirmados.length})</span>
                            </h3>
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
