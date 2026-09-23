import React from 'react';
import { useEvent, useRemoveEventRegistration } from '@/hooks/useEvents';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { User, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const AdminEventRegistrationsModal = ({ eventId, onClose }: { eventId: number | null, onClose: () => void }) => {
    const { data: event, isLoading, refetch } = useEvent(eventId || 0);
    const { mutate: removeRegistration } = useRemoveEventRegistration();

    // Force refetch when modal opens
    React.useEffect(() => {
        if (eventId) {
            refetch();
        }
    }, [eventId, refetch]);

    const handleRemove = (userId: number) => {
        if (!eventId) return;
        toast('¿Seguro que deseas eliminar a este participante?', {
            action: {
                label: 'Eliminar',
                onClick: () => {
                    removeRegistration({ eventId, userId }, {
                        onSuccess: () => toast.success('Participante eliminado'),
                        onError: () => toast.error('Error al eliminar participante')
                    });
                }
            },
            cancel: { label: 'Cancelar', onClick: () => {} },
            style: { background: '#ef4444', color: 'white', border: 'none' }
        });
    };

    return (
        <Dialog open={!!eventId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase flex items-center gap-2">
                        <User className="text-primary" /> Participantes Inscritos
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-10 flex justify-center"><FootballSpinner /></div>
                ) : !event ? (
                    <div className="py-10 text-center text-slate-400">Evento no encontrado</div>
                ) : (
                    <div className="space-y-6 mt-4">
                        <div className="flex justify-between items-center px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-700">
                            <span className="font-bold text-slate-300">Total Inscritos</span>
                            <span className="text-xl font-black text-lime-400">
                                {event.registrations?.length || 0} / {event.max_participants || '∞'}
                            </span>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
                            {event.registrations && event.registrations.length > 0 ? (
                                event.registrations.map((reg: any) => (
                                    <div key={reg.id} className="flex justify-between items-center p-4 bg-slate-800 rounded-xl border border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">
                                                {reg.user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{reg.user?.name}</p>
                                                <p className="text-xs text-slate-400">{reg.user?.email} • {reg.user?.phone}</p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => handleRemove(reg.user_id)} 
                                            className="border-red-900/50 hover:bg-red-900/20 text-red-500 rounded-xl h-10 px-3"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-slate-500 italic">
                                    Aún no hay participantes inscritos en este evento.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
