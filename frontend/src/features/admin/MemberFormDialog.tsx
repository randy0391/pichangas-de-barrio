import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User } from '@/types';
import { useCreateMember, useUpdateMember } from '@/hooks/useMembers';
import { toast } from 'sonner';
import { User as UserIcon, Shield, Trophy, Phone, Mail, IdCard, Hash, X } from 'lucide-react';

interface MemberFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: User | null;
}

export const MemberFormDialog: React.FC<MemberFormDialogProps> = ({ open, onOpenChange, member }) => {
    const { mutate: createMember, isPending: isCreating } = useCreateMember();
    const { mutate: updateMember, isPending: isUpdating } = useUpdateMember();
    const isPending = isCreating || isUpdating;

    const [formData, setFormData] = useState<Partial<User>>({
        nombres: '',
        apellido_paterno: '',
        apellido_materno: '',
        nickname: '',
        email: '',
        dni: '',
        phone: '',
        position: null,
        jersey_number: null,
        role: 'member',
        status: 'active'
    });

    useEffect(() => {
        if (member) {
            setFormData({
                nombres: member.nombres || '',
                apellido_paterno: member.apellido_paterno || '',
                apellido_materno: member.apellido_materno || '',
                nickname: member.nickname || '',
                email: member.email || '',
                dni: member.dni || '',
                phone: member.phone || '',
                position: member.position || null,
                jersey_number: member.jersey_number || null,
                role: member.role || 'member',
                status: member.status || 'active'
            });
        } else {
            setFormData({
                nombres: '',
                apellido_paterno: '',
                apellido_materno: '',
                nickname: '',
                email: '',
                dni: '',
                phone: '',
                position: null,
                jersey_number: null,
                role: 'member',
                status: 'active'
            });
        }
    }, [member, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'jersey_number' 
                ? (value ? parseInt(value) : null) 
                : (value === '' ? null : value)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (member) {
            updateMember({ id: member.id, data: formData }, {
                onSuccess: () => {
                    toast.success('¡Jugador actualizado correctamente!');
                    onOpenChange(false);
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || 'Error al actualizar jugador');
                }
            });
        } else {
            createMember(formData, {
                onSuccess: () => {
                    toast.success('¡Jugador añadido al club exitosamente!');
                    onOpenChange(false);
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || 'Error al crear jugador');
                }
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <UserIcon size={22} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight">
                                {member ? 'Editar Jugador' : 'Añadir Nuevo Jugador'}
                            </DialogTitle>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {member ? 'Modifica los datos del jugador en la plantilla.' : 'Registra un nuevo miembro del club para convocatorias y estadísticas.'}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {/* Nombres */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Nombres *
                        </label>
                        <Input 
                            name="nombres" 
                            value={formData.nombres || ''} 
                            onChange={handleChange} 
                            placeholder="Ej: Juan Carlos" 
                            required 
                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-11 rounded-xl" 
                        />
                    </div>

                    {/* Apellidos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Apellido Paterno *
                            </label>
                            <Input 
                                name="apellido_paterno" 
                                value={formData.apellido_paterno || ''} 
                                onChange={handleChange} 
                                placeholder="Ej: Pérez" 
                                required 
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-11 rounded-xl" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Apellido Materno *
                            </label>
                            <Input 
                                name="apellido_materno" 
                                value={formData.apellido_materno || ''} 
                                onChange={handleChange} 
                                placeholder="Ej: García" 
                                required 
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-11 rounded-xl" 
                            />
                        </div>
                    </div>

                    {/* Apodo y Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Apodo / Chapa (Opcional)
                            </label>
                            <Input 
                                name="nickname" 
                                value={formData.nickname || ''} 
                                onChange={handleChange} 
                                placeholder="Ej: El Tanque" 
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-11 rounded-xl" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Correo Electrónico *
                            </label>
                            <Input 
                                type="email" 
                                name="email" 
                                value={formData.email || ''} 
                                onChange={handleChange} 
                                placeholder="ejemplo@correo.com" 
                                required 
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-11 rounded-xl" 
                            />
                        </div>
                    </div>

                    {/* DNI y Celular */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                DNI (Contraseña inicial) *
                            </label>
                            <Input 
                                name="dni" 
                                value={formData.dni || ''} 
                                onChange={handleChange} 
                                placeholder="8 dígitos" 
                                required 
                                maxLength={12}
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-11 rounded-xl font-bold" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Celular / WhatsApp *
                            </label>
                            <Input 
                                name="phone" 
                                value={formData.phone || ''} 
                                onChange={handleChange} 
                                placeholder="9XXXXXXXX" 
                                required 
                                maxLength={15}
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-11 rounded-xl font-bold" 
                            />
                        </div>
                    </div>

                    {/* Posición y Dorsal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Posición en Cancha
                            </label>
                            <select 
                                name="position" 
                                value={formData.position || ''} 
                                onChange={handleChange} 
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-11 px-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">Sin posición fija</option>
                                <option value="portero">🧤 Portero / Arquero</option>
                                <option value="defensa">🛡️ Defensa</option>
                                <option value="medio">⚙️ Mediocampista / Volante</option>
                                <option value="delantero">⚡ Delantero / Atacante</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Dorsal (Camiseta)
                            </label>
                            <Input 
                                type="number" 
                                min={1} 
                                max={99} 
                                name="jersey_number" 
                                value={formData.jersey_number || ''} 
                                onChange={handleChange} 
                                placeholder="Ej: 10" 
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-11 rounded-xl font-black text-lg text-emerald-600 dark:text-emerald-400" 
                            />
                        </div>
                    </div>
                    
                    {/* Rol y Estado */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Rol en la App
                            </label>
                            <select 
                                name="role" 
                                value={formData.role || 'member'} 
                                onChange={handleChange} 
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-11 px-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="member">⚽ Jugador (Miembro)</option>
                                <option value="admin">🛡️ Administrador</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Estado de la Cuenta
                            </label>
                            <select 
                                name="status" 
                                value={formData.status || 'active'} 
                                onChange={handleChange} 
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-11 px-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="active">🟢 Activo (Habilitado)</option>
                                <option value="inactive">⏸️ Inactivo (Suspendido)</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button 
                            type="submit" 
                            disabled={isPending} 
                            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black uppercase tracking-wider rounded-xl shadow-lg border-0 text-sm"
                        >
                            {isPending ? 'Guardando...' : (member ? '💾 Guardar Cambios' : '⚽ Añadir Jugador')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
