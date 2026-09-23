import React, { useState } from 'react';
import { useMembers, useUpdateMember, useDeleteMember } from '@/hooks/useMembers';
import { Button } from '@/components/ui/Button';
import { User } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { motion } from 'motion/react';
import { UserCircle, ShieldAlert, Trash2, Edit, UserX, UserCheck, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/Pagination';
import { MemberFormDialog } from './MemberFormDialog';
import { MemberViewDialog } from './MemberViewDialog';
import { Eye } from 'lucide-react';

export const AdminMembersPage = () => {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: response, isLoading } = useMembers(page, searchQuery);
    const { mutate: updateMember } = useUpdateMember();
    const { mutate: deleteMember, isPending: isDeleting } = useDeleteMember();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    const members = response?.data || [];
    const meta = response?.meta;

    if (isLoading && !members.length) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    const openEdit = (user: User) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    const openCreate = () => {
        setSelectedUser(null);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Directorio de Miembros</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestiona los jugadores, asigna roles y mantén la plantilla actualizada.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, DNI o apodo..." 
                        className="w-full sm:w-64 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    />
                    <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        Total: {meta?.total || 0} jugadores
                    </div>
                    <Button onClick={openCreate} className="bg-accent text-white font-bold h-10 px-4 rounded-xl flex items-center gap-2">
                        <Plus size={18} /> Añadir Jugador
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Jugador</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Contacto</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Rol</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Estado</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(members as User[]).map((m, i) => (
                                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 overflow-hidden border border-slate-700">
                                                {m.avatar ? (
                                                    <img src={m.avatar} alt="Avatar" className="w-full h-full object-cover shrink-0" />
                                                ) : (
                                                    <UserCircle size={24} />
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 dark:text-white block">{m.name}</span>
                                                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{m.position || 'Sin posición'} {m.jersey_number ? `#${m.jersey_number}` : ''}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="block text-sm text-slate-900 dark:text-white">{m.email}</span>
                                        <span className="block text-xs text-slate-500">{m.phone || 'Sin número'} | DNI: {m.dni || 'N/A'}</span>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${m.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                            {m.role}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        {!m.is_approved ? (
                                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-400/20 text-orange-600 dark:text-orange-400">Pendiente</span>
                                        ) : m.status === 'inactive' ? (
                                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-400/20 text-red-600 dark:text-red-400">Inactivo</span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-lime-400/20 text-lime-600 dark:text-lime-400">Activo</span>
                                        )}
                                    </td>
                                    <td className="p-5 flex justify-end gap-2">
                                        <Button 
                                            variant="outline" 
                                            className="border-slate-300 dark:border-slate-700 rounded-xl h-9 px-3 hover:text-primary hover:bg-primary/10" 
                                            onClick={() => { setViewingUser(m); setIsViewOpen(true); }}
                                            title="Ver Jugador"
                                        >
                                            <Eye size={16} className="text-slate-500" />
                                        </Button>

                                        <Button 
                                            variant="outline" 
                                            className="border-slate-300 dark:border-slate-700 rounded-xl h-9 px-3" 
                                            onClick={() => openEdit(m)}
                                            title="Editar Jugador"
                                        >
                                            <Edit size={16} className="text-slate-500" />
                                        </Button>

                                        {!m.is_approved && (
                                            <Button 
                                                variant="outline" 
                                                className="border-lime-500 text-lime-500 hover:bg-lime-500/10 rounded-xl h-9 px-3 text-xs uppercase font-bold" 
                                                onClick={() => {
                                                    toast('¿Aprobar ingreso de este jugador?', {
                                                        action: {
                                                            label: 'Aprobar',
                                                            onClick: () => {
                                                                updateMember({ id: m.id, data: { is_approved: true } }, {
                                                                    onSuccess: () => toast.success('Jugador aprobado'),
                                                                    onError: () => toast.error('Error al aprobar')
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

                                        <Button 
                                            variant="outline" 
                                            className="border-red-500 text-red-500 hover:bg-red-500/10 rounded-xl h-9 px-3" 
                                            title="Eliminar Jugador"
                                            disabled={isDeleting}
                                            onClick={() => {
                                                toast(`¿Eliminar definitivamente a ${m.name}?`, {
                                                    action: {
                                                        label: 'Eliminar',
                                                        onClick: () => {
                                                            deleteMember(m.id, {
                                                                onSuccess: () => toast.success('Jugador eliminado'),
                                                                onError: () => toast.error('Error al eliminar')
                                                            });
                                                        }
                                                    },
                                                    cancel: { label: 'Cancelar', onClick: () => {} },
                                                });
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {meta && meta.last_page > 1 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={setPage} />
                    </div>
                )}
            </div>

            <MemberFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} member={selectedUser} />
            <MemberViewDialog open={isViewOpen} onOpenChange={setIsViewOpen} member={viewingUser} />
        </div>
    );
};
