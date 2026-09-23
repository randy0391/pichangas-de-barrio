import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { User } from '@/types';
import { User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

interface MemberViewDialogProps {
    member: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const MemberViewDialog = ({ member, open, onOpenChange }: MemberViewDialogProps) => {
    if (!member) return null;

    const calculateAge = (birthDate: string | null | undefined) => {
        if (!birthDate) return 'N/A';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return `${age} años`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-slate-950 border-slate-800 text-white p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-slate-900 to-black p-8 flex flex-col items-center border-b border-slate-800 relative">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(0,210,255,0.15),transparent_50%)]"></div>
                    
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-900 flex items-center justify-center shadow-2xl relative z-10 shrink-0">
                        {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover shrink-0" />
                        ) : (
                            <UserIcon size={48} className="text-slate-500" />
                        )}
                    </div>
                    
                    <h2 className="mt-4 text-2xl font-black text-center relative z-10">{member.name}</h2>
                    {member.nickname && (
                        <p className="text-primary font-bold tracking-widest uppercase text-sm mt-1 relative z-10">"{member.nickname}"</p>
                    )}
                    <div className="flex gap-2 mt-3 relative z-10">
                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest">{member.role}</span>
                        <span className="px-3 py-1 bg-accent/20 text-accent border border-accent/30 rounded-full text-xs font-bold uppercase tracking-widest">{member.position || 'Sin Posición'}</span>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">DNI</p>
                            <p className="font-medium">{member.dni || 'No registrado'}</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Celular</p>
                            <p className="font-medium">{member.phone || 'No registrado'}</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Edad</p>
                            <p className="font-medium">{calculateAge(member.birth_date)}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{member.birth_date ? format(new Date(member.birth_date), 'dd/MM/yyyy') : ''}</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Grupo Sanguíneo</p>
                            <p className="font-medium text-red-400">{member.blood_type || 'Desconocido'}</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-center">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Dorsal</p>
                            <p className="font-medium text-lime-400 font-black text-2xl">{member.jersey_number ? `#${member.jersey_number}` : 'N/A'}</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-center">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Email</p>
                            <p className="font-medium text-xs truncate" title={member.email}>{member.email}</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
