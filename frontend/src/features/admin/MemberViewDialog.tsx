import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { User } from '@/types';
import { 
    User as UserIcon, 
    Shield, 
    MessageCircle, 
    Mail, 
    Phone, 
    IdCard, 
    Calendar, 
    Droplet, 
    Trophy, 
    AlertTriangle,
    X
} from 'lucide-react';
import { format } from 'date-fns';

interface MemberViewDialogProps {
    member: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (member: User) => void;
}

export const MemberViewDialog = ({ member, open, onOpenChange, onEdit }: MemberViewDialogProps) => {
    if (!member) return null;

    const calculateAge = (birthDate: string | null | undefined) => {
        if (!birthDate) return 'No registrada';
        try {
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return `${age} años`;
        } catch {
            return 'No registrada';
        }
    };

    const getPositionBadge = (pos?: string | null) => {
        switch (pos) {
            case 'portero':
                return { label: 'Portero / Arquero', icon: '🧤', color: 'bg-amber-400/20 text-amber-500 border-amber-400/30' };
            case 'defensa':
                return { label: 'Defensa', icon: '🛡️', color: 'bg-blue-400/20 text-blue-500 border-blue-400/30' };
            case 'medio':
                return { label: 'Mediocampista', icon: '⚙️', color: 'bg-emerald-400/20 text-emerald-500 border-emerald-400/30' };
            case 'delantero':
                return { label: 'Delantero', icon: '⚡', color: 'bg-red-400/20 text-red-500 border-red-400/30' };
            default:
                return { label: 'Sin Posición', icon: '⚽', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-700' };
        }
    };

    const pos = getPositionBadge(member.position);

    const getWhatsAppUrl = () => {
        if (!member.phone) return null;
        let clean = member.phone.replace(/\D/g, '');
        if (clean.length === 9) clean = '51' + clean;
        const msg = encodeURIComponent(`Hola ${member.full_name || member.name}, te escribimos desde la administración de Pichangas de Barrio.`);
        return `https://wa.me/${clean}?text=${msg}`;
    };

    const whatsappUrl = getWhatsAppUrl();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-0 overflow-hidden rounded-3xl shadow-2xl">
                {/* Header Deportivo tipo cromo */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-6 md:p-8 flex flex-col items-center relative border-b border-slate-800">
                    <button 
                        onClick={() => onOpenChange(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl"
                    >
                        <X size={20} />
                    </button>

                    {/* Avatar con Dorsal */}
                    <div className="relative">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl overflow-hidden border-4 border-slate-700/80 bg-slate-800 flex items-center justify-center shadow-2xl">
                            {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-3xl font-black text-white">
                                    {(member.name || member.nombres || 'J').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {member.jersey_number && (
                            <span className="absolute -bottom-2 -right-2 bg-primary text-slate-950 font-black text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900">
                                #{member.jersey_number}
                            </span>
                        )}
                    </div>

                    {/* Nombre y Apodo */}
                    <h2 className="mt-4 text-xl md:text-2xl font-black text-center text-white tracking-tight leading-tight">
                        {member.full_name || member.name}
                    </h2>
                    {member.nickname && (
                        <p className="text-primary font-black tracking-widest uppercase text-xs mt-1">
                            "{member.nickname}"
                        </p>
                    )}

                    {/* Badges de Rol y Posición */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${pos.color} flex items-center gap-1`}>
                            <span>{pos.icon}</span> {pos.label}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            member.role === 'admin' 
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                            {member.role === 'admin' ? '🛡️ Administrador' : '⚽ Jugador'}
                        </span>
                    </div>
                </div>

                {/* Contenido / Datos de la Ficha Técnica */}
                <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
                    {/* Alerta de Multas si tiene */}
                    {member.has_pending_multas && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold">
                            <AlertTriangle size={18} className="shrink-0" />
                            <span>Este jugador tiene multas pendientes de pago registradas.</span>
                        </div>
                    )}

                    {/* Grid de Datos */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <IdCard size={13} /> DNI
                            </p>
                            <p className="font-bold text-slate-900 dark:text-white">{member.dni || 'No registrado'}</p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Phone size={13} /> Celular
                            </p>
                            <p className="font-bold text-slate-900 dark:text-white">{member.phone || 'No registrado'}</p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 col-span-2">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Mail size={13} /> Correo Electrónico
                            </p>
                            <p className="font-bold text-slate-900 dark:text-white truncate">{member.email}</p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Calendar size={13} /> Edad
                            </p>
                            <p className="font-bold text-slate-900 dark:text-white">{calculateAge(member.birth_date)}</p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Droplet size={13} className="text-red-500" /> Grupo Sanguíneo
                            </p>
                            <p className="font-black text-red-500">{member.blood_type || 'Desconocido'}</p>
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        {whatsappUrl && (
                            <a 
                                href={whatsappUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex-1"
                            >
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow">
                                    <MessageCircle size={16} /> Enviar WhatsApp
                                </Button>
                            </a>
                        )}

                        {onEdit && (
                            <Button 
                                variant="outline"
                                onClick={() => {
                                    onOpenChange(false);
                                    onEdit(member);
                                }}
                                className="h-11 px-4 rounded-xl border-slate-300 dark:border-slate-700 text-xs font-bold uppercase tracking-wider"
                            >
                                Editar Jugador
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
