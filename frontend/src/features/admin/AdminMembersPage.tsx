import React, { useState, useMemo } from 'react';
import { useMembers, useUpdateMember, useDeleteMember, useAllMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { motion, AnimatePresence } from 'motion/react';
import { 
    UserCircle, 
    ShieldAlert, 
    Trash2, 
    Edit, 
    UserX, 
    UserCheck, 
    Plus, 
    Search, 
    Eye, 
    Phone, 
    MessageCircle, 
    Shield, 
    Users, 
    Trophy, 
    Copy,
    CheckCircle2,
    X,
    User as UserIcon,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/Pagination';
import { MemberFormDialog } from './MemberFormDialog';
import { MemberViewDialog } from './MemberViewDialog';

export const AdminMembersPage = () => {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState<'todos' | 'jugadores' | 'admins' | 'porteros' | 'pendientes' | 'inactivos'>('todos');

    const { data: response, isLoading } = useMembers(page, searchQuery);
    const { data: allMembers = [] } = useAllMembers();
    const { mutate: updateMember } = useUpdateMember();
    const { mutate: deleteMember, isPending: isDeleting } = useDeleteMember();

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    const members = response?.data || [];
    const meta = response?.meta;

    // Métricas globales calculadas
    const stats = useMemo(() => {
        const total = meta?.total || allMembers.length || members.length;
        const admins = allMembers.filter(m => m.role === 'admin').length;
        const porteros = allMembers.filter(m => m.position === 'portero').length;
        const pendientes = allMembers.filter(m => !m.is_approved).length;
        const activos = allMembers.filter(m => m.status === 'active' && m.is_approved).length;

        return { total, admins, porteros, pendientes, activos };
    }, [allMembers, meta, members]);

    // Filtrar miembros según pestaña
    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            if (filterTab === 'jugadores') return m.role === 'member';
            if (filterTab === 'admins') return m.role === 'admin';
            if (filterTab === 'porteros') return m.position === 'portero';
            if (filterTab === 'pendientes') return !m.is_approved;
            if (filterTab === 'inactivos') return m.status === 'inactive';
            return true;
        });
    }, [members, filterTab]);

    if (isLoading && !members.length) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    const openEdit = (user: User) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    const openCreate = () => {
        setSelectedUser(null);
        setIsDialogOpen(true);
    };

    const getPositionBadge = (pos?: string | null) => {
        switch (pos) {
            case 'portero':
                return { label: 'Portero', icon: '🧤', className: 'bg-amber-400/15 text-amber-600 dark:text-amber-400 border-amber-400/30' };
            case 'defensa':
                return { label: 'Defensa', icon: '🛡️', className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' };
            case 'medio':
                return { label: 'Medio', icon: '⚙️', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
            case 'delantero':
                return { label: 'Delantero', icon: '⚡', className: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' };
            default:
                return { label: 'Sin posición', icon: '⚽', className: 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700' };
        }
    };

    const getWhatsAppUrl = (phone?: string | null, name?: string) => {
        if (!phone) return null;
        let clean = phone.replace(/\D/g, '');
        if (clean.length === 9) clean = '51' + clean;
        const msg = encodeURIComponent(`Hola ${name || ''}, te saludamos de Pichangas de Barrio.`);
        return `https://wa.me/${clean}?text=${msg}`;
    };

    // Copiar lista de teléfonos para grupo de WhatsApp
    const copyContactsList = () => {
        const withPhone = members.filter(m => m.phone);
        if (withPhone.length === 0) {
            toast.info('No hay teléfonos para copiar');
            return;
        }

        const lines = withPhone.map((m, idx) => {
            const name = m.full_name || m.name || m.nombres;
            return `${idx + 1}. ${name}: ${m.phone}`;
        });

        navigator.clipboard.writeText(`📲 Directorio Telefónico - Pichangas de Barrio:\n\n${lines.join('\n')}`);
        toast.success('Lista de contactos copiada al portapapeles');
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        Directorio de Miembros
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Gestiona los jugadores, asigna roles, dorsales y mantén la plantilla actualizada.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <Button 
                        onClick={copyContactsList}
                        variant="outline"
                        className="h-12 px-4 rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs uppercase tracking-wider flex items-center gap-2"
                    >
                        <Copy size={16} /> Copiar Teléfonos
                    </Button>
                    <Button 
                        onClick={openCreate} 
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black h-12 px-5 rounded-xl shadow-lg border-0 flex items-center gap-2 text-sm uppercase tracking-wider"
                    >
                        <Plus size={18} /> Añadir Jugador
                    </Button>
                </div>
            </div>

            {/* Tarjetas de Resumen (KPIs) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Plantilla</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
                    <p className="text-xs text-slate-400">Miembros registrados</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-emerald-500/20 shadow-md">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Habilitados</p>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.activos || stats.total}</p>
                    <p className="text-xs text-slate-400">Jugadores activos</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-amber-500/20 shadow-md">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Porteros</p>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.porteros}</p>
                    <p className="text-xs text-slate-400">Arqueros disponibles</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-blue-500/20 shadow-md">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Admins</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.admins}</p>
                    <p className="text-xs text-slate-400">Con permisos de gestión</p>
                </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                    {/* Tabs de Filtro */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setFilterTab('todos')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                filterTab === 'todos'
                                    ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilterTab('jugadores')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                filterTab === 'jugadores'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            ⚽ Jugadores
                        </button>
                        <button
                            onClick={() => setFilterTab('admins')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                filterTab === 'admins'
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            🛡️ Admins
                        </button>
                        <button
                            onClick={() => setFilterTab('porteros')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                filterTab === 'porteros'
                                    ? 'bg-amber-400 text-amber-950 font-black shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            🧤 Porteros
                        </button>
                        {stats.pendientes > 0 && (
                            <button
                                onClick={() => setFilterTab('pendientes')}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                    filterTab === 'pendientes'
                                        ? 'bg-orange-500 text-white shadow-md'
                                        : 'text-orange-500 hover:bg-orange-500/10'
                                }`}
                            >
                                ⏳ Pendientes ({stats.pendientes})
                            </button>
                        )}
                        <button
                            onClick={() => setFilterTab('inactivos')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                filterTab === 'inactivos'
                                    ? 'bg-red-500 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Inactivos
                        </button>
                    </div>

                    {/* Buscador */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input 
                            type="text" 
                            placeholder="Buscar por nombre, DNI, teléfono o apodo..." 
                            className="pl-11 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')} 
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabla Rediseñada de Jugadores */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Jugador</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Posición</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Contacto</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Rol</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Estado</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredMembers.map((m, i) => {
                                const playerName = m.full_name || m.name || `${m.nombres || ''} ${m.apellido_paterno || ''}`.trim();
                                const pos = getPositionBadge(m.position);
                                const whatsappUrl = getWhatsAppUrl(m.phone, playerName);

                                return (
                                    <motion.tr 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        transition={{ delay: i * 0.03 }} 
                                        key={m.id} 
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        {/* Jugador con Avatar y Dorsal */}
                                        <td className="p-5">
                                            <div className="flex items-center gap-3.5">
                                                <div className="relative shrink-0">
                                                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                                                        {m.avatar ? (
                                                            <img loading="lazy" src={m.avatar} alt={playerName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-black text-lg">
                                                                {playerName.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {m.jersey_number && (
                                                        <span className="absolute -bottom-1 -right-1 bg-primary text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow border border-slate-900">
                                                            #{m.jersey_number}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-900 dark:text-white block text-sm leading-snug">
                                                            {playerName}
                                                        </span>
                                                        {m.nickname && (
                                                            <span className="text-xs font-bold text-primary">
                                                                "{m.nickname}"
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-slate-400 block truncate">
                                                        {m.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Posición */}
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border inline-flex items-center gap-1 ${pos.className}`}>
                                                <span>{pos.icon}</span> {pos.label}
                                            </span>
                                        </td>

                                        {/* Contacto (WhatsApp, DNI) */}
                                        <td className="p-5">
                                            <div className="space-y-1">
                                                {m.phone ? (
                                                    <a 
                                                        href={whatsappUrl || '#'} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                                        title="Clic para abrir chat de WhatsApp"
                                                    >
                                                        <MessageCircle size={13} /> {m.phone}
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Sin celular</span>
                                                )}
                                                <div className="text-xs text-slate-500 font-medium">
                                                    DNI: <span className="font-bold text-slate-700 dark:text-slate-300">{m.dni || 'No reg.'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Rol */}
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                                m.role === 'admin' 
                                                    ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30' 
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                            }`}>
                                                {m.role === 'admin' ? '🛡️ Admin' : '⚽ Jugador'}
                                            </span>
                                        </td>

                                        {/* Estado */}
                                        <td className="p-5">
                                            {!m.is_approved ? (
                                                <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-orange-400/20 text-orange-600 dark:text-orange-400 border border-orange-400/30">
                                                    ⏳ Pendiente
                                                </span>
                                            ) : m.status === 'inactive' ? (
                                                <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-400/20 text-red-600 dark:text-red-400 border border-red-400/30">
                                                    Inactivo
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 border border-emerald-400/30 inline-flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Activo
                                                </span>
                                            )}
                                        </td>

                                        {/* Acciones */}
                                        <td className="p-5 text-right space-x-1.5 whitespace-nowrap">
                                            {/* Ver Ficha */}
                                            <Button 
                                                variant="outline" 
                                                className="border-slate-200 dark:border-slate-700 rounded-xl h-9 px-3 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary/40" 
                                                onClick={() => { setViewingUser(m); setIsViewOpen(true); }}
                                                title="Ver Ficha Técnica"
                                            >
                                                <Eye size={15} />
                                            </Button>

                                            {/* WhatsApp Directo */}
                                            {whatsappUrl && (
                                                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-block">
                                                    <Button 
                                                        variant="outline" 
                                                        className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl h-9 px-3" 
                                                        title="Escribir por WhatsApp"
                                                    >
                                                        <MessageCircle size={15} />
                                                    </Button>
                                                </a>
                                            )}

                                            {/* Editar */}
                                            <Button 
                                                variant="outline" 
                                                className="border-slate-200 dark:border-slate-700 rounded-xl h-9 px-3 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30" 
                                                onClick={() => openEdit(m)}
                                                title="Editar Jugador"
                                            >
                                                <Edit size={15} />
                                            </Button>

                                            {/* Botón Aprobar si está pendiente */}
                                            {!m.is_approved && (
                                                <Button 
                                                    className="bg-lime-500 hover:bg-lime-600 text-slate-950 font-black rounded-xl h-9 px-3 text-xs uppercase" 
                                                    onClick={() => {
                                                        toast(`¿Aprobar el ingreso de ${playerName}?`, {
                                                            action: {
                                                                label: 'Aprobar',
                                                                onClick: () => {
                                                                    updateMember({ id: m.id, data: { is_approved: true } }, {
                                                                        onSuccess: () => toast.success('Jugador aprobado con éxito'),
                                                                        onError: () => toast.error('Error al aprobar jugador')
                                                                    });
                                                                }
                                                            },
                                                            cancel: { label: 'Cancelar', onClick: () => {} },
                                                        });
                                                    }}
                                                >
                                                    Aprobar
                                                </Button>
                                            )}

                                            {/* Eliminar */}
                                            <Button 
                                                variant="outline" 
                                                className="border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl h-9 px-3" 
                                                title="Eliminar Jugador"
                                                disabled={isDeleting}
                                                onClick={() => {
                                                    toast(`¿Eliminar definitivamente a ${playerName}?`, {
                                                        action: {
                                                            label: 'Eliminar',
                                                            onClick: () => {
                                                                deleteMember(m.id, {
                                                                    onSuccess: () => toast.success('Jugador eliminado del sistema'),
                                                                    onError: () => toast.error('Error al eliminar jugador')
                                                                });
                                                            }
                                                        },
                                                        cancel: { label: 'Cancelar', onClick: () => {} },
                                                        style: { background: '#ef4444', color: 'white', border: 'none' }
                                                    });
                                                }}
                                            >
                                                <Trash2 size={15} />
                                            </Button>
                                        </td>
                                    </motion.tr>
                                );
                            })}

                            {filteredMembers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500">
                                        <Users size={36} className="mx-auto mb-2 opacity-40" />
                                        <p className="font-bold">No se encontraron jugadores</p>
                                        <p className="text-xs mt-1">Prueba cambiando los filtros o la búsqueda.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {meta && meta.last_page > 1 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-center">
                        <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={setPage} />
                    </div>
                )}
            </div>

            <MemberFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} member={selectedUser} />
            <MemberViewDialog 
                open={isViewOpen} 
                onOpenChange={setIsViewOpen} 
                member={viewingUser} 
                onEdit={(u) => openEdit(u)}
            />
        </div>
    );
};
