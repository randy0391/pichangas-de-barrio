import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User } from '@/types';
import { useCreateMember, useUpdateMember } from '@/hooks/useMembers';
import { toast } from 'sonner';

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
        name: '',
        email: '',
        dni: '',
        phone: '',
        position: undefined,
        jersey_number: undefined,
        role: 'member',
        status: 'active'
    });

    useEffect(() => {
        if (member) {
            setFormData(member);
        } else {
            setFormData({
                name: '',
                email: '',
                dni: '',
                phone: '',
                position: undefined,
                jersey_number: undefined,
                role: 'member',
                status: 'active'
            });
        }
    }, [member, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'jersey_number' ? (value ? parseInt(value) : undefined) : (value === '' ? undefined : value)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (member) {
            updateMember({ id: member.id, data: formData }, {
                onSuccess: () => {
                    toast.success('Jugador actualizado');
                    onOpenChange(false);
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || 'Error al actualizar');
                }
            });
        } else {
            createMember(formData, {
                onSuccess: () => {
                    toast.success('Jugador creado');
                    onOpenChange(false);
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || 'Error al crear');
                }
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                        {member ? 'Editar Jugador' : 'Añadir Jugador'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Nombre</label>
                        <Input name="name" value={formData.name || ''} onChange={handleChange} required className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                        <Input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">DNI (Contraseña)</label>
                            <Input name="dni" value={formData.dni || ''} onChange={handleChange} required className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Celular</label>
                            <Input name="phone" value={formData.phone || ''} onChange={handleChange} required className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Posición</label>
                            <Input name="position" value={formData.position || ''} onChange={handleChange} className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Dorsal</label>
                            <Input type="number" name="jersey_number" value={formData.jersey_number || ''} onChange={handleChange} className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Rol</label>
                            <select name="role" value={formData.role || 'member'} onChange={handleChange} className="w-full bg-slate-800 border-slate-700 text-white h-10 px-3 rounded-md text-sm">
                                <option value="member">Jugador</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Estado</label>
                            <select name="status" value={formData.status || 'active'} onChange={handleChange} className="w-full bg-slate-800 border-slate-700 text-white h-10 px-3 rounded-md text-sm">
                                <option value="active">Activo</option>
                                <option value="inactive">Inactivo</option>
                            </select>
                        </div>
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full bg-accent text-white font-bold mt-4">
                        {isPending ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};
