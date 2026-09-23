import React, { useState } from 'react';
import { useMembers, useUpdateMember, useDeleteMember } from '@/hooks/useMembers';
import { Button } from '@/components/ui/Button';
import { User } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { motion } from 'motion/react';
import { UserCircle, ShieldAlert, Trash2, Eye, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/Pagination';

export const AdminMembersPage = () => {
    const [page, setPage] = useState(1);
    const { data: response, isLoading } = useMembers(page);
    const { mutate: updateMember } = useUpdateMember();
    const { mutate: deleteMember } = useDeleteMember();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const members = response?.data || [];
    const meta = response?.meta;

    if (isLoading && !members.length) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Directorio de Miembros</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestiona los jugadores, asigna roles y mantén la plantilla actualizada.</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400">
                    Total: {(members as User[]).length} jugadores
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
                                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                                                <UserCircle size={24} />
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
                                            className="border-slate-300 dark:border-slate-700 rounded-xl h-9 px-3" 
                                            onClick={() => setSelectedUser(m)}
                                            title="Ver Detalle"
                                        >
                                            <Eye size={16} className="text-slate-500" />
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

                                        {m.is_approved && (
                                            <Button 
                                                variant="outline" 
                                                className="border-slate-300 dark:border-slate-700 rounded-xl h-9 px-3" 
                                                title={m.status === 'inactive' ? 'Activar Jugador' : 'Desactivar Jugador'}
                                                onClick={() => {
                                                    const newStatus = m.status === 'inactive' ? 'active' : 'inactive';
                                                    toast(`¿${m.status === 'inactive' ? 'Activar' : 'Desactivar'} a este jugador?`, {
                                                        action: {
                                                            label: 'Confirmar',
                                                            onClick: () => {
                                                                updateMember({ id: m.id, data: { status: newStatus } }, {
                                                                    onSuccess: () => toast.success(`Jugador ${newStatus === 'active' ? 'activado' : 'desactivado'}`),
                                                                    onError: () => toast.error('Error al actualizar estado')
                                                                });
                                                            }
                                                        },
                                                        cancel: { label: 'Cancelar', onClick: () => {} },
                                                    });
                                                }}
                                            >
                                                {m.status === 'inactive' ? <UserCheck size={16} className="text-lime-500" /> : <UserX size={16} className="text-red-400" />}
                                            </Button>
                                        )}

                                        <Button 
                                            variant="outline" 
                                            className="border-slate-300 dark:border-slate-700 rounded-xl h-9 px-3" 
                                            title="Cambiar Rol"
                                            onClick={() => {
                                                const newRole = m.role === 'admin' ? 'member' : 'admin';
                                                toast(`¿Cambiar rol a ${newRole}?`, {
                                                    action: {
                                                        label: 'Confirmar',
                                                        onClick: () => {
                                                            updateMember({ id: m.id, data: { role: newRole } }, {
                                                                onSuccess: () => toast.success('Rol actualizado'),
                                                                onError: () => toast.error('Error al actualizar rol')
                                                            });
                                                        }
                                                    },
                                                    cancel: { label: 'Cancelar', onClick: () => {} },
                                                });
                                            }}
                                        >
                                            {m.role === 'admin' ? <ShieldAlert size={16} className="text-amber-500" /> : <ShieldAlert size={16} className="text-slate-400" />}
                                        </Button>

                                        <Button 
                                            variant="outline" 
                                            className="border-red-500 text-red-500 hover:bg-red-500/10 rounded-xl h-9 px-3" 
                                            title="Eliminar Jugador"
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

            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Detalle del Jugador</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4 mt-4">
                            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                    <UserCircle size={40} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                                    <p className="text-slate-400">{selectedUser.email}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-3 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Teléfono</p>
                                    <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">DNI</p>
                                    <p className="font-medium">{selectedUser.dni || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Posición</p>
                                    <p className="font-medium uppercase">{selectedUser.position || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Dorsal</p>
                                    <p className="font-medium">{selectedUser.jersey_number || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 p-3 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Biografía</p>
                                <p className="font-medium text-sm">{selectedUser.bio || 'Sin biografía.'}</p>
                            </div>

                            {selectedUser.payment_receipt && (
                                <Button 
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white" 
                                    onClick={() => window.open(selectedUser.payment_receipt, '_blank')}
                                >
                                    📄 Ver Comprobante de Pago
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
