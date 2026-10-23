import React, { useState } from 'react';
import { 
    useRecurringSchedules, 
    useUpdateRecurringSchedule, 
    useGenerateRecurringConvocatorias 
} from '@/hooks/useConvocatorias';
import { RecurringSchedule } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
    Calendar, 
    Clock, 
    DollarSign, 
    MapPin, 
    Users, 
    Zap, 
    Sparkles, 
    X, 
    Check, 
    Edit2, 
    Save, 
    Repeat,
    ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminRecurringScheduleDialog: React.FC<Props> = ({ isOpen, onClose }) => {
    const { data: scheduleData, isLoading } = useRecurringSchedules();
    const { mutate: updateSchedule, isPending: isUpdating } = useUpdateRecurringSchedule();
    const { mutate: generateConvs, isPending: isGenerating } = useGenerateRecurringConvocatorias();

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<RecurringSchedule>>({});
    const [weeksAhead, setWeeksAhead] = useState(4);

    if (!isOpen) return null;

    const schedules: RecurringSchedule[] = scheduleData?.data || [];

    const handleStartEdit = (item: RecurringSchedule) => {
        setEditingId(item.id);
        setEditForm({
            title: item.title,
            match_time: item.match_time.slice(0, 5),
            cost_per_player: Number(item.cost_per_player),
            location: item.location,
            max_players: item.max_players,
            num_teams: item.num_teams,
            is_active: item.is_active,
        });
    };

    const handleSaveEdit = (id: number) => {
        updateSchedule({ id, data: editForm }, {
            onSuccess: () => {
                toast.success('Horario recurrente guardado correctamente.');
                setEditingId(null);
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.message || 'Error al actualizar horario.');
            }
        });
    };

    const handleToggleActive = (item: RecurringSchedule) => {
        updateSchedule({ id: item.id, data: { is_active: !item.is_active } }, {
            onSuccess: () => {
                toast.success(`${item.day_name}: ${!item.is_active ? 'Activado' : 'Desactivado'}`);
            }
        });
    };

    const handleGenerateNow = () => {
        generateConvs(weeksAhead);
    };

    const getDayTheme = (dayOfWeek: number) => {
        switch (dayOfWeek) {
            case 2: // Martes
                return {
                    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
                    border: 'border-cyan-500/30',
                    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.1)]',
                    accent: 'text-cyan-400',
                };
            case 4: // Jueves
                return {
                    badge: 'bg-lime-500/10 text-lime-400 border-lime-500/30',
                    border: 'border-lime-500/30',
                    glow: 'shadow-[0_0_15px_rgba(163,230,53,0.1)]',
                    accent: 'text-lime-400',
                };
            case 6: // Sabado
                return {
                    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    border: 'border-amber-500/30',
                    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]',
                    accent: 'text-amber-400',
                };
            default:
                return {
                    badge: 'bg-slate-800 text-white border-slate-700',
                    border: 'border-slate-800',
                    glow: '',
                    accent: 'text-white',
                };
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20">
                                <Repeat className="w-5 h-5 animate-spin-slow" />
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                                Convocatorias Automáticas y Recurrentes
                            </h3>
                        </div>
                        <p className="text-sm text-slate-400">
                            Configura los días oficiales de pichanga fija (Martes, Jueves y Sábados) y genera las fechas futuras con 1 clic.
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Quick Generator Action Box */}
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 rounded-2xl border border-lime-400/30 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <Zap className="w-4 h-4 text-lime-400 animate-pulse" />
                            <span className="text-sm font-black text-white uppercase tracking-wider">
                                Generador Rápido de Fechas Futuras
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Genera automáticamente todos los Martes, Jueves y Sábados activos evitando fechas duplicadas.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                            <span className="text-xs text-slate-400 font-bold">Semanas:</span>
                            <select 
                                value={weeksAhead} 
                                onChange={(e) => setWeeksAhead(Number(e.target.value))}
                                className="bg-transparent text-white font-black text-xs outline-none cursor-pointer"
                            >
                                <option value={2} className="bg-slate-900">2 semanas</option>
                                <option value={3} className="bg-slate-900">3 semanas</option>
                                <option value={4} className="bg-slate-900">4 semanas (1 mes)</option>
                                <option value={6} className="bg-slate-900">6 semanas</option>
                                <option value={8} className="bg-slate-900">8 semanas</option>
                            </select>
                        </div>

                        <Button 
                            onClick={handleGenerateNow} 
                            disabled={isGenerating}
                            className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-lime-400/20 flex items-center gap-2 whitespace-nowrap"
                        >
                            <Sparkles className="w-4 h-4" />
                            {isGenerating ? 'Generando...' : '⚡ Generar Ahora'}
                        </Button>
                    </div>
                </div>

                {/* Recurring days list */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Plantillas Semanales Oficiales
                    </h4>

                    {isLoading ? (
                        <div className="py-8 text-center text-slate-500 text-sm">Cargando plantillas...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {schedules.map((item) => {
                                const theme = getDayTheme(item.day_of_week);
                                const isEditingThis = editingId === item.id;

                                return (
                                    <div 
                                        key={item.id} 
                                        className={`bg-slate-950/70 rounded-2xl border ${theme.border} p-5 space-y-4 relative transition-all ${theme.glow}`}
                                    >
                                        {/* Day header & toggle */}
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${theme.badge}`}>
                                                    {item.day_name}
                                                </span>
                                                <button
                                                    onClick={() => handleToggleActive(item)}
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                                                        item.is_active 
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                                            : 'bg-slate-800 text-slate-500 border-slate-700'
                                                    }`}
                                                >
                                                    {item.is_active ? 'Activo' : 'Pausado'}
                                                </button>
                                            </div>

                                            {!isEditingThis ? (
                                                <button 
                                                    onClick={() => handleStartEdit(item)}
                                                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                                    title="Modificar precio o datos de este día"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => setEditingId(null)}
                                                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                                    title="Cancelar edición"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {isEditingThis ? (
                                            /* Edit Form Mode */
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Título</label>
                                                    <Input 
                                                        value={editForm.title || ''} 
                                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                        className="h-8 text-xs bg-slate-900 border-slate-800"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Costo (S/)</label>
                                                        <Input 
                                                            type="number"
                                                            step="0.5"
                                                            value={editForm.cost_per_player || 0} 
                                                            onChange={(e) => setEditForm({ ...editForm, cost_per_player: Number(e.target.value) })}
                                                            className="h-8 text-xs bg-slate-900 border-slate-800 font-bold text-lime-400"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Hora</label>
                                                        <Input 
                                                            type="time"
                                                            value={editForm.match_time || '20:00'} 
                                                            onChange={(e) => setEditForm({ ...editForm, match_time: e.target.value })}
                                                            className="h-8 text-xs bg-slate-900 border-slate-800"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Cancha / Ubicación</label>
                                                    <Input 
                                                        value={editForm.location || ''} 
                                                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                                        className="h-8 text-xs bg-slate-900 border-slate-800"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Jugadores</label>
                                                        <Input 
                                                            type="number"
                                                            value={editForm.max_players || 14} 
                                                            onChange={(e) => setEditForm({ ...editForm, max_players: Number(e.target.value) })}
                                                            className="h-8 text-xs bg-slate-900 border-slate-800"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Equipos</label>
                                                        <Input 
                                                            type="number"
                                                            value={editForm.num_teams || 2} 
                                                            onChange={(e) => setEditForm({ ...editForm, num_teams: Number(e.target.value) })}
                                                            className="h-8 text-xs bg-slate-900 border-slate-800"
                                                        />
                                                    </div>
                                                </div>

                                                <Button 
                                                    onClick={() => handleSaveEdit(item.id)}
                                                    disabled={isUpdating}
                                                    className="w-full bg-lime-400 hover:bg-lime-500 text-slate-950 font-black text-xs uppercase tracking-wider py-2 rounded-xl flex items-center justify-center gap-1.5"
                                                >
                                                    <Save className="w-3.5 h-3.5" />
                                                    {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                                                </Button>
                                            </div>
                                        ) : (
                                            /* View Mode */
                                            <div className="space-y-3">
                                                <div>
                                                    <h5 className="font-black text-white text-sm truncate">{item.title}</h5>
                                                    <p className="text-[11px] text-slate-400 line-clamp-1">{item.location}</p>
                                                </div>

                                                {/* Price highlight capsule */}
                                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                                                    <span className="text-xs text-slate-400 font-bold">Costo por cupo:</span>
                                                    <span className={`text-base font-mono font-black ${theme.accent}`}>
                                                        S/ {Number(item.cost_per_player).toFixed(2)}
                                                    </span>
                                                </div>

                                                {/* Match specs */}
                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                                                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/50">
                                                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                        <span className="font-bold text-slate-200">{item.match_time.slice(0, 5)} hrs</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/50">
                                                        <Users className="w-3.5 h-3.5 text-slate-500" />
                                                        <span className="font-bold text-slate-200">{item.max_players} jugadores</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer instructions */}
                <div className="pt-2 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                    <span>Las convocatorias se crean con estado "Abierta" para que los jugadores se inscriban de inmediato.</span>
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold uppercase"
                    >
                        Cerrar
                    </Button>
                </div>
            </div>
        </div>
    );
};
