import React, { useState, useMemo } from 'react';
import { useMultas, useApproveMulta, useRejectMulta, useDeleteMulta } from '@/hooks/useMultas';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { 
    Check, 
    X, 
    Eye, 
    FileText, 
    AlertTriangle, 
    Search, 
    Copy, 
    MessageCircle, 
    Trash2, 
    Calendar, 
    Clock, 
    DollarSign, 
    Users, 
    CheckCircle2, 
    Clock3, 
    AlertCircle,
    User as UserIcon,
    ArrowUpRight
} from 'lucide-react';
import { Multa } from '@/types';
import { motion, AnimatePresence } from 'motion/react';

export const AdminFinesPage = () => {
    const { data: multas = [], isLoading } = useMultas();
    const { mutate: approve, isPending: isApproving } = useApproveMulta();
    const { mutate: reject, isPending: isRejecting } = useRejectMulta();
    const { mutate: deleteMulta, isPending: isDeleting } = useDeleteMulta();

    const [activeTab, setActiveTab] = useState<'pendientes' | 'en_revision' | 'pagadas' | 'todas'>('pendientes');
    const [searchTerm, setSearchTerm] = useState('');
    const [reasonFilter, setReasonFilter] = useState<'all' | 'tardanza' | 'falta'>('all');
    const [viewVoucherUrl, setViewVoucherUrl] = useState<string | null>(null);

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    const pendientes = multas.filter(m => m.status === 'pendiente');
    const enRevision = multas.filter(m => m.status === 'en_revision');
    const pagadas = multas.filter(m => m.status === 'pagada');

    // Totales calculados
    const totalDeudaPendiente = pendientes.reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
    const totalEnRevision = enRevision.reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
    const totalRecaudado = pagadas.reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
    const deudoresUnicos = new Set(pendientes.map(m => m.user?.id || m.id)).size;

    // Filtrado de multas según tab, búsqueda y motivo
    const filteredMultas = multas.filter(m => {
        // Filtro por pestaña
        if (activeTab === 'pendientes' && m.status !== 'pendiente') return false;
        if (activeTab === 'en_revision' && m.status !== 'en_revision') return false;
        if (activeTab === 'pagadas' && m.status !== 'pagada') return false;

        // Filtro por motivo
        if (reasonFilter !== 'all') {
            const reasonLower = (m.reason || '').toLowerCase();
            if (!reasonLower.includes(reasonFilter)) return false;
        }

        // Búsqueda por texto (nombre, apellido, apodo, título de convocatoria)
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            const userName = (m.user?.full_name || m.user?.name || `${m.user?.nombres || ''} ${m.user?.apellido_paterno || ''}`).toLowerCase();
            const nickname = (m.user?.nickname || '').toLowerCase();
            const convocatoriaTitle = (m.convocatoria?.title || '').toLowerCase();
            const reason = (m.reason || '').toLowerCase();

            return (
                userName.includes(term) ||
                nickname.includes(term) ||
                convocatoriaTitle.includes(term) ||
                reason.includes(term)
            );
        }

        return true;
    });

    const handleApprove = (m: Multa) => {
        const playerName = m.user?.full_name || m.user?.name || 'este jugador';
        toast(`¿Marcar multa de ${playerName} como PAGADA? (S/. ${m.amount})`, {
            action: {
                label: 'Confirmar Pago',
                onClick: () => approve({ id: m.id }, { 
                    onSuccess: () => toast.success(`Multa de ${playerName} marcada como pagada con éxito`) 
                })
            },
            cancel: { label: 'Cancelar', onClick: () => {} }
        });
    };

    const handleReject = (m: Multa) => {
        const playerName = m.user?.full_name || m.user?.name || 'este jugador';
        toast(`¿Rechazar el comprobante de ${playerName}? El comprobante será eliminado y volverá a estado pendiente.`, {
            action: {
                label: 'Rechazar',
                onClick: () => reject({ id: m.id }, { 
                    onSuccess: () => toast.success('Comprobante rechazado') 
                })
            },
            cancel: { label: 'Cancelar', onClick: () => {} },
            style: { background: '#ef4444', color: 'white', border: 'none' }
        });
    };

    const handleDelete = (m: Multa) => {
        const playerName = m.user?.full_name || m.user?.name || 'este jugador';
        toast(`¿Anular/eliminar definitivamente esta multa de ${playerName} (${m.reason} - S/. ${m.amount})?`, {
            action: {
                label: 'Eliminar',
                onClick: () => deleteMulta(m.id, { 
                    onSuccess: () => toast.success('Multa eliminada del sistema') 
                })
            },
            cancel: { label: 'Cancelar', onClick: () => {} },
            style: { background: '#ef4444', color: 'white', border: 'none' }
        });
    };

    // Copiar lista de deudores en formato texto para compartir en WhatsApp
    const copyDebtorsList = () => {
        if (pendientes.length === 0) {
            toast.info('No hay multas pendientes para copiar.');
            return;
        }

        const lines = [
            `📋 *LISTA DE MULTAS PENDIENTES - PICHANGAS DE BARRIO*`,
            `📅 Fecha de reporte: ${new Date().toLocaleDateString('es-PE')}`,
            `-------------------------------------------`
        ];

        pendientes.forEach((m, idx) => {
            const name = m.user?.full_name || m.user?.name || `${m.user?.nombres || ''} ${m.user?.apellido_paterno || ''}`.trim() || 'Jugador';
            const nickname = m.user?.nickname ? ` (${m.user.nickname})` : '';
            const reason = m.reason || 'Multa';
            const match = m.convocatoria?.title ? ` - ${m.convocatoria.title}` : '';
            lines.push(`${idx + 1}. *${name}*${nickname}: S/. ${parseFloat(m.amount).toFixed(2)} (${reason}${match})`);
        });

        lines.push(`-------------------------------------------`);
        lines.push(`💰 *Total por cobrar:* S/. ${totalDeudaPendiente.toFixed(2)}`);
        lines.push(`👥 *Total jugadores morosos:* ${deudoresUnicos}`);
        lines.push(``);
        lines.push(`📲 *Yape:* 960735653`);
        lines.push(`👤 *Titular:* MARCO ANTONIO LOPEZ LLANOS`);
        lines.push(`_Por favor regularizar antes de la próxima convocatoria._`);

        navigator.clipboard.writeText(lines.join('\n'));
        toast.success('¡Lista de multas copiada al portapapeles! Ya puedes pegarla en WhatsApp.');
    };

    const getWhatsAppReminderUrl = (m: Multa) => {
        if (!m.user?.phone) return null;
        let cleanPhone = m.user.phone.replace(/\D/g, '');
        if (cleanPhone.length === 9) cleanPhone = '51' + cleanPhone;
        const name = m.user.full_name || m.user.name || m.user.nombres || 'compañero';
        const matchTitle = m.convocatoria?.title ? ` del partido "${m.convocatoria.title}"` : '';
        const msg = encodeURIComponent(
            `Hola ${name}, te saludamos de Pichangas de Barrio. Tienes una multa pendiente de S/. ${parseFloat(m.amount).toFixed(2)} por ${m.reason}${matchTitle}. Puedes pagarlo por Yape al 960735653 (MARCO ANTONIO LOPEZ LLANOS) y subir tu comprobante en la app. ¡Gracias!`
        );
        return `https://wa.me/${cleanPhone}?text=${msg}`;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Gestión de Multas
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Control detallado de quién debe, quién pagó y comprobantes por faltas o tardanzas.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <Button 
                        onClick={copyDebtorsList}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg border-0 flex items-center gap-2 h-11 px-4 text-sm uppercase tracking-wider"
                    >
                        <Copy size={16} /> Copiar Lista para WhatsApp
                    </Button>
                </div>
            </div>

            {/* Tarjetas de Resumen (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Deuda Pendiente */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-red-200 dark:border-red-900/30 shadow-lg flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Por Cobrar</p>
                        <p className="text-2xl font-black text-red-500">S/. {totalDeudaPendiente.toFixed(2)}</p>
                        <p className="text-xs text-slate-400 truncate">{pendientes.length} multas sin pagar</p>
                    </div>
                </div>

                {/* Jugadores Deudores */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-amber-200 dark:border-amber-900/30 shadow-lg flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Users size={24} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jugadores en Falta</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{deudoresUnicos}</p>
                        <p className="text-xs text-slate-400 truncate">Deben regularizar</p>
                    </div>
                </div>

                {/* Vouchers en Revisión */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-yellow-200 dark:border-yellow-900/30 shadow-lg flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
                        <FileText size={24} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">En Revisión</p>
                        <p className="text-2xl font-black text-yellow-500">{enRevision.length}</p>
                        <p className="text-xs text-slate-400 truncate">S/. {totalEnRevision.toFixed(2)} por verificar</p>
                    </div>
                </div>

                {/* Total Recaudado / Pagado */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-lime-200 dark:border-lime-900/30 shadow-lg flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-lime-500/10 text-lime-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={24} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Cobrado</p>
                        <p className="text-2xl font-black text-lime-500">S/. {totalRecaudado.toFixed(2)}</p>
                        <p className="text-xs text-slate-400 truncate">{pagadas.length} multas saldadas</p>
                    </div>
                </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                    {/* Tabs de Estado */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setActiveTab('pendientes')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === 'pendientes'
                                    ? 'bg-red-500 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <AlertTriangle size={14} />
                            Pendientes ({pendientes.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('en_revision')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === 'en_revision'
                                    ? 'bg-yellow-500 text-slate-950 shadow-md font-black'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <FileText size={14} />
                            En Revisión ({enRevision.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('pagadas')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === 'pagadas'
                                    ? 'bg-lime-500 text-slate-950 shadow-md font-black'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Check size={14} />
                            Pagadas ({pagadas.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('todas')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                activeTab === 'todas'
                                    ? 'bg-slate-800 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Todas ({multas.length})
                        </button>
                    </div>

                    {/* Filtro por tipo de infracción */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase hidden sm:inline">Tipo:</span>
                        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setReasonFilter('all')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                                    reasonFilter === 'all'
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setReasonFilter('tardanza')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                                    reasonFilter === 'tardanza'
                                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                                        : 'text-slate-500 hover:text-amber-500'
                                }`}
                            >
                                <Clock size={12} /> Tardanza (S/. 3)
                            </button>
                            <button
                                onClick={() => setReasonFilter('falta')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                                    reasonFilter === 'falta'
                                        ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                                        : 'text-slate-500 hover:text-red-500'
                                }`}
                            >
                                <AlertCircle size={12} /> Falta (S/. 30)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Input de Búsqueda */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nombre de jugador, apodo o convocatoria..."
                        className="pl-11 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')} 
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Listado Detallado de Multas */}
            <div className="space-y-4">
                {filteredMultas.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xl">
                        <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3 opacity-80" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {searchTerm 
                                ? 'No se encontraron multas con ese criterio de búsqueda' 
                                : activeTab === 'pendientes' 
                                    ? '¡Excelente! No hay multas pendientes por cobrar.' 
                                    : activeTab === 'en_revision'
                                        ? 'No hay comprobantes pendientes de revisión.'
                                        : 'No hay registros en esta sección.'}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                            {searchTerm ? 'Intenta buscando con otro nombre o término.' : 'Todo se encuentra al día.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredMultas.map(m => {
                            const isTardanza = (m.reason || '').toLowerCase().includes('tardanza');
                            const isFalta = (m.reason || '').toLowerCase().includes('falta');
                            const isPendiente = m.status === 'pendiente';
                            const isEnRevision = m.status === 'en_revision';
                            const isPagada = m.status === 'pagada';

                            const playerName = m.user?.full_name || m.user?.name || `${m.user?.nombres || ''} ${m.user?.apellido_paterno || ''}`.trim() || 'Jugador no identificado';
                            const nickname = m.user?.nickname;
                            const whatsappUrl = getWhatsAppReminderUrl(m);

                            return (
                                <motion.div 
                                    key={m.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border shadow-xl transition-all ${
                                        isEnRevision 
                                            ? 'border-yellow-400/50 dark:border-yellow-500/30 ring-2 ring-yellow-400/20' 
                                            : isPendiente
                                                ? 'border-slate-200 dark:border-slate-800 hover:border-red-500/30'
                                                : 'border-slate-200 dark:border-slate-800/80 opacity-90'
                                    }`}
                                >
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                        
                                        {/* Bloque Izquierdo: Jugador, Avatar y Convocatoria */}
                                        <div className="flex items-start gap-4 min-w-0 flex-1">
                                            {/* Avatar */}
                                            <div className="relative shrink-0">
                                                {m.user?.avatar ? (
                                                    <img 
                                                        src={m.user.avatar} 
                                                        alt={playerName} 
                                                        className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-black text-xl border-2 border-slate-300 dark:border-slate-700 shadow-sm">
                                                        {playerName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                {m.user?.jersey_number && (
                                                    <span className="absolute -bottom-1 -right-1 bg-primary text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">
                                                        {m.user.jersey_number}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Info del Jugador y Convocatoria */}
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                                        {playerName}
                                                    </h3>
                                                    {nickname && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                            "{nickname}"
                                                        </span>
                                                    )}
                                                    {m.user?.phone && (
                                                        <span className="text-xs text-slate-400 font-medium">
                                                            📱 {m.user.phone}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Partido y Fecha */}
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                        ⚽ {m.convocatoria?.title || 'Partido'}
                                                    </span>
                                                    {m.convocatoria?.match_date && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={13} className="text-slate-400" />
                                                            {m.convocatoria.match_date}
                                                            {m.convocatoria.match_time && ` • ${m.convocatoria.match_time}`}
                                                        </span>
                                                    )}
                                                    {m.convocatoria?.location && (
                                                        <span className="truncate max-w-[200px]">
                                                            📍 {m.convocatoria.location}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Notas del admin si existen */}
                                                {m.admin_notes && (
                                                    <p className="text-xs italic text-slate-400 pt-1">
                                                        Nota: "{m.admin_notes}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bloque Central: Monto, Infracción y Comprobante */}
                                        <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-start border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                                            {/* Comprobante en miniatura si existe */}
                                            {m.payment_receipt && (
                                                <div 
                                                    onClick={() => setViewVoucherUrl(m.payment_receipt)}
                                                    className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-yellow-400/50 cursor-pointer group shadow hover:scale-105 transition-all"
                                                    title="Clic para ver comprobante"
                                                >
                                                    <img src={m.payment_receipt} alt="Voucher" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Eye size={16} className="text-white" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Infracción y Monto */}
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-1.5 mb-1">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                                        isFalta 
                                                            ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20' 
                                                            : isTardanza
                                                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                                    }`}>
                                                        {isFalta && <AlertCircle size={12} />}
                                                        {isTardanza && <Clock size={12} />}
                                                        {m.reason}
                                                    </span>
                                                </div>
                                                
                                                <div className={`text-2xl font-black ${
                                                    isPagada 
                                                        ? 'text-lime-600 dark:text-lime-400' 
                                                        : isEnRevision
                                                            ? 'text-yellow-600 dark:text-yellow-400'
                                                            : 'text-red-600 dark:text-red-500'
                                                }`}>
                                                    S/. {parseFloat(m.amount).toFixed(2)}
                                                </div>

                                                <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                                                    isPagada 
                                                        ? 'text-lime-500' 
                                                        : isEnRevision
                                                            ? 'text-yellow-500'
                                                            : 'text-red-500'
                                                }`}>
                                                    {isPagada ? '✓ Pagada' : isEnRevision ? '⏳ Por revisar' : '⚠️ Debe pagar'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Bloque Derecho: Acciones de Gestión */}
                                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                                            {/* Botón de WhatsApp para cobrar si tiene teléfono y está pendiente */}
                                            {isPendiente && whatsappUrl && (
                                                <a 
                                                    href={whatsappUrl} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs uppercase tracking-wider transition-colors"
                                                    title="Enviar recordatorio por WhatsApp"
                                                >
                                                    <MessageCircle size={15} /> Cobrar
                                                </a>
                                            )}

                                            {/* Acciones para pendientes */}
                                            {isPendiente && (
                                                <Button
                                                    onClick={() => handleApprove(m)}
                                                    disabled={isApproving}
                                                    className="flex-1 sm:flex-none bg-lime-500 hover:bg-lime-600 text-slate-950 font-bold h-10 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow"
                                                >
                                                    <Check size={16} /> Marcar Pagada
                                                </Button>
                                            )}

                                            {/* Acciones para en revisión */}
                                            {isEnRevision && (
                                                <>
                                                    <Button
                                                        onClick={() => handleApprove(m)}
                                                        disabled={isApproving}
                                                        className="flex-1 sm:flex-none bg-lime-500 hover:bg-lime-600 text-slate-950 font-black h-10 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow"
                                                    >
                                                        <Check size={16} /> Aprobar
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleReject(m)}
                                                        disabled={isRejecting}
                                                        variant="outline"
                                                        className="flex-1 sm:flex-none border-red-500/50 text-red-500 hover:bg-red-500/10 font-bold h-10 px-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                                                    >
                                                        <X size={16} /> Rechazar
                                                    </Button>
                                                </>
                                            )}

                                            {/* Ver Voucher botón si hay imagen */}
                                            {m.payment_receipt && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setViewVoucherUrl(m.payment_receipt)}
                                                    className="h-10 px-3 rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                                                    title="Ver comprobante"
                                                >
                                                    <Eye size={15} />
                                                </Button>
                                            )}

                                            {/* Anular/Eliminar Multa */}
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDelete(m)}
                                                disabled={isDeleting}
                                                className="h-10 px-3 rounded-xl border-red-200 dark:border-red-900/30 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                                title="Anular multa por error"
                                            >
                                                <Trash2 size={15} />
                                            </Button>
                                        </div>

                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal para ver Voucher en Grande */}
            <AnimatePresence>
                {viewVoucherUrl && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setViewVoucherUrl(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95 }} 
                            animate={{ scale: 1 }} 
                            exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()} 
                            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
                        >
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    <FileText className="text-yellow-500" /> Comprobante de Pago
                                </h3>
                                <button 
                                    onClick={() => setViewVoucherUrl(null)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="rounded-2xl overflow-hidden bg-slate-950 max-h-[70vh] flex items-center justify-center border border-slate-800">
                                <img 
                                    src={viewVoucherUrl} 
                                    alt="Comprobante completo" 
                                    className="max-h-[70vh] w-auto object-contain"
                                />
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <a 
                                    href={viewVoucherUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                >
                                    Abrir en tamaño original <ArrowUpRight size={14} />
                                </a>
                                <Button 
                                    onClick={() => setViewVoucherUrl(null)} 
                                    className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl h-10 px-5 text-xs uppercase"
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
