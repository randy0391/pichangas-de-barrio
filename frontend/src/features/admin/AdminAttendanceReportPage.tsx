import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { 
    Download, 
    FileSpreadsheet, 
    Search, 
    X, 
    Calendar, 
    Users, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    HelpCircle,
    Copy,
    Filter,
    Shield,
    CalendarDays,
    MapPin,
    ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface AttendanceRow {
    id: number;
    user_id: number;
    user_name: string;
    user_nickname?: string | null;
    user_phone?: string | null;
    user_dni?: string | null;
    user_avatar?: string | null;
    match_role?: string;
    convocatoria_id: number;
    convocatoria_title: string;
    convocatoria_location?: string;
    match_date: string;
    raw_match_date?: string;
    attendance: 'presente' | 'tardanza' | 'falta' | 'pendiente';
}

interface AttendanceResponse {
    data: AttendanceRow[];
    stats: {
        total_count: number;
        presente_count: number;
        tardanza_count: number;
        falta_count: number;
        sin_marcar_count: number;
        attendance_rate: number;
    };
    convocatorias: { id: number; title: string; match_date: string }[];
}

export const AdminAttendanceReportPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConvocatoria, setSelectedConvocatoria] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'presente' | 'tardanza' | 'falta' | 'pendiente'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    // Fetch attendance report data
    const { data: response, isLoading } = useQuery<AttendanceResponse | AttendanceRow[]>({
        queryKey: ['attendance-report', selectedConvocatoria, statusFilter, searchQuery],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (selectedConvocatoria !== 'all') params.append('convocatoria_id', selectedConvocatoria);
            if (statusFilter !== 'all') params.append('attendance', statusFilter);
            if (searchQuery.trim()) params.append('search', searchQuery.trim());

            const { data } = await api.get(`/admin/attendance-report?${params.toString()}`);
            return data;
        }
    });

    const rows: AttendanceRow[] = useMemo(() => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        return response.data || [];
    }, [response]);

    const stats = useMemo(() => {
        if (response && !Array.isArray(response) && response.stats) {
            return response.stats;
        }
        const total = rows.length;
        const presentes = rows.filter(r => r.attendance === 'presente').length;
        const tardanzas = rows.filter(r => r.attendance === 'tardanza').length;
        const faltas = rows.filter(r => r.attendance === 'falta').length;
        const pendientes = rows.filter(r => !r.attendance || r.attendance === 'pendiente').length;
        const rate = total > 0 ? Math.round((presentes / total) * 100) : 0;
        return {
            total_count: total,
            presente_count: presentes,
            tardanza_count: tardanzas,
            falta_count: faltas,
            sin_marcar_count: pendientes,
            attendance_rate: rate
        };
    }, [response, rows]);

    const convocatorias = useMemo(() => {
        if (response && !Array.isArray(response) && response.convocatorias) {
            return response.convocatorias;
        }
        return [];
    }, [response]);

    // Client-side pagination over the rows
    const totalPages = Math.ceil(rows.length / pageSize) || 1;
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, currentPage, pageSize]);

    // Export to CSV function
    const exportCSV = () => {
        if (!rows.length) {
            toast.info('No hay datos para exportar');
            return;
        }
        
        let csvContent = "\uFEFF";
        csvContent += "Jugador;Apodo;DNI;Celular;Partido;Fecha;Rol;Estado\n";

        rows.forEach((row) => {
            const name = `"${row.user_name || 'Jugador'}"`;
            const nickname = `"${row.user_nickname || ''}"`;
            const dni = `"${row.user_dni || ''}"`;
            const phone = `"${row.user_phone || ''}"`;
            const title = `"${row.convocatoria_title || 'Sin titulo'}"`;
            const date = `"${row.match_date || ''}"`;
            const role = `"${row.match_role === 'portero' ? 'Portero' : 'Jugador'}"`;
            const attendance = `"${row.attendance ? row.attendance.toUpperCase() : 'SIN MARCAR'}"`;
            csvContent += `${name};${nickname};${dni};${phone};${title};${date};${role};${attendance}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `reporte_asistencias_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exportados ${rows.length} registros a Excel / CSV`);
    };

    // Copy summary for WhatsApp
    const copyReportSummary = () => {
        if (!rows.length) {
            toast.info('No hay registros para copiar');
            return;
        }

        const presentes = rows.filter(r => r.attendance === 'presente');
        const tardanzas = rows.filter(r => r.attendance === 'tardanza');
        const faltas = rows.filter(r => r.attendance === 'falta');

        let text = `📊 REPORTE DE ASISTENCIAS - PICHANGAS DE BARRIO\n`;
        text += `Total evaluados: ${rows.length}\n`;
        text += `✅ Presentes: ${presentes.length}\n`;
        text += `⏱️ Tardanzas: ${tardanzas.length}\n`;
        text += `❌ Faltas: ${faltas.length}\n\n`;

        if (tardanzas.length > 0) {
            text += `⏱️ TARDANZAS (Multa S/ 3.00):\n`;
            tardanzas.forEach((r, i) => {
                text += `${i + 1}. ${r.user_name} (${r.convocatoria_title})\n`;
            });
            text += `\n`;
        }

        if (faltas.length > 0) {
            text += `❌ FALTAS (Multa S/ 30.00):\n`;
            faltas.forEach((r, i) => {
                text += `${i + 1}. ${r.user_name} (${r.convocatoria_title})\n`;
            });
        }

        navigator.clipboard.writeText(text);
        toast.success('Resumen de asistencia copiado para WhatsApp');
    };

    if (isLoading && !rows.length) {
        return <div className="py-24 flex justify-center"><FootballSpinner /></div>;
    }

    return (
        <div className="space-y-8">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        Reporte de Asistencias
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Historial de asistencias, tardanzas, faltas y participación de todos los jugadores.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <Button 
                        onClick={copyReportSummary}
                        variant="outline"
                        className="h-12 px-4 rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs uppercase tracking-wider flex items-center gap-2"
                    >
                        <Copy size={16} /> Copiar Resumen
                    </Button>

                    <Button 
                        onClick={exportCSV} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 px-5 rounded-xl shadow-lg border-0 flex items-center gap-2 text-xs uppercase tracking-wider"
                    >
                        <FileSpreadsheet size={18} /> Exportar Excel / CSV
                    </Button>
                </div>
            </div>

            {/* KPIs Estadísticos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Registros</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total_count}</p>
                    <p className="text-[10px] text-slate-400">Convocatorias</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-500/20 shadow-md">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tasa Asistencia</p>
                        <CheckCircle2 size={14} className="text-emerald-500" />
                    </div>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.attendance_rate}%</p>
                    <p className="text-[10px] text-slate-400">Puntualidad global</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-lime-500/20 shadow-md">
                    <p className="text-[10px] font-bold text-lime-600 dark:text-lime-400 uppercase tracking-wider">Presentes</p>
                    <p className="text-2xl font-black text-lime-600 dark:text-lime-400 mt-1">{stats.presente_count}</p>
                    <p className="text-[10px] text-slate-400">Asistieron a tiempo</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-500/20 shadow-md">
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Tardanzas</p>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.tardanza_count}</p>
                    <p className="text-[10px] text-amber-500 font-bold">Multa S/ 3.00</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-red-500/20 shadow-md">
                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Faltas</p>
                    <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{stats.falta_count}</p>
                    <p className="text-[10px] text-red-500 font-bold">Multa S/ 30.00</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sin Marcar</p>
                    <p className="text-2xl font-black text-slate-500 dark:text-slate-400 mt-1">{stats.sin_marcar_count}</p>
                    <p className="text-[10px] text-slate-400">Pendientes de lista</p>
                </div>
            </div>

            {/* Barra de Filtros & Búsqueda */}
            <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                    {/* Tabs de Filtro de Estado */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                statusFilter === 'all'
                                    ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Todos ({stats.total_count})
                        </button>
                        <button
                            onClick={() => { setStatusFilter('presente'); setCurrentPage(1); }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                statusFilter === 'presente'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                        >
                            ✅ Presentes ({stats.presente_count})
                        </button>
                        <button
                            onClick={() => { setStatusFilter('tardanza'); setCurrentPage(1); }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                statusFilter === 'tardanza'
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                            }`}
                        >
                            ⏱️ Tardanzas ({stats.tardanza_count})
                        </button>
                        <button
                            onClick={() => { setStatusFilter('falta'); setCurrentPage(1); }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                statusFilter === 'falta'
                                    ? 'bg-red-500 text-white shadow-md'
                                    : 'text-red-500 hover:bg-red-500/10'
                            }`}
                        >
                            ❌ Faltas ({stats.falta_count})
                        </button>
                        <button
                            onClick={() => { setStatusFilter('pendiente'); setCurrentPage(1); }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                statusFilter === 'pendiente'
                                    ? 'bg-slate-600 text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-500/10'
                            }`}
                        >
                            ⏳ Sin Marcar ({stats.sin_marcar_count})
                        </button>
                    </div>

                    {/* Selector de Partido & Buscador */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 lg:max-w-xl">
                        {convocatorias.length > 0 && (
                            <select
                                value={selectedConvocatoria}
                                onChange={(e) => {
                                    setSelectedConvocatoria(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full sm:w-56 h-12 px-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
                            >
                                <option value="all">🏟️ Todos los Partidos</option>
                                {convocatorias.map(c => (
                                    <option key={c.id} value={String(c.id)}>
                                        {c.title} ({c.match_date})
                                    </option>
                                ))}
                            </select>
                        )}

                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                            <Input 
                                type="text" 
                                placeholder="Buscar por jugador, apodo, DNI o partido..." 
                                className="pl-11 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }} 
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de Reporte */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
                                <th className="p-4 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Jugador</th>
                                <th className="p-4 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Partido / Convocatoria</th>
                                <th className="p-4 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Fecha</th>
                                <th className="p-4 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Rol</th>
                                <th className="p-4 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Estado de Asistencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {paginatedRows.map((row: AttendanceRow, idx: number) => {
                                const isGoalkeeper = row.match_role === 'portero';

                                return (
                                    <tr 
                                        key={row.id || idx} 
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        {/* Jugador con Avatar */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300 shrink-0 overflow-hidden">
                                                    {row.user_avatar ? (
                                                        <img src={row.user_avatar} alt={row.user_name} className="w-full h-full object-cover" />
                                                    ) : isGoalkeeper ? (
                                                        '🧤'
                                                    ) : (
                                                        (row.user_name || 'J').charAt(0).toUpperCase()
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                            {row.user_name || 'Jugador'}
                                                        </span>
                                                        {row.user_nickname && (
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                                                                "{row.user_nickname}"
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                                                        {row.user_dni && <span>DNI: {row.user_dni}</span>}
                                                        {row.user_phone && <span>· 📱 {row.user_phone}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Partido */}
                                        <td className="p-4">
                                            <div>
                                                <span className="font-bold text-slate-900 dark:text-white text-sm block">
                                                    {row.convocatoria_title}
                                                </span>
                                                {row.convocatoria_location && (
                                                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <MapPin size={12} className="text-emerald-500 shrink-0" />
                                                        <span className="truncate max-w-xs">{row.convocatoria_location}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Fecha */}
                                        <td className="p-4 whitespace-nowrap">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
                                                <CalendarDays size={14} className="text-primary" />
                                                {row.match_date}
                                            </span>
                                        </td>

                                        {/* Rol */}
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                                isGoalkeeper 
                                                    ? 'bg-amber-400/15 text-amber-600 dark:text-amber-400 border border-amber-400/30' 
                                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                            }`}>
                                                {isGoalkeeper ? '🧤 Arquero' : '⚽ Jugador'}
                                            </span>
                                        </td>

                                        {/* Estado de Asistencia */}
                                        <td className="p-4 whitespace-nowrap">
                                            {row.attendance === 'presente' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                                    <CheckCircle2 size={14} /> Presente (A tiempo)
                                                </span>
                                            )}

                                            {row.attendance === 'tardanza' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                                    <Clock size={14} /> Tardanza · Multa S/ 3.00
                                                </span>
                                            )}

                                            {row.attendance === 'falta' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                                                    <AlertCircle size={14} /> Falta · Multa S/ 30.00
                                                </span>
                                            )}

                                            {(!row.attendance || row.attendance === 'pendiente') && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                                    <HelpCircle size={14} /> Sin Marcar
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}

                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center text-slate-500">
                                        <Users size={40} className="mx-auto mb-3 opacity-30 text-emerald-500" />
                                        <p className="font-bold text-base text-slate-700 dark:text-slate-300">
                                            No se encontraron registros de asistencia
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Prueba cambiando los filtros de búsqueda o el partido seleccionado.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-center">
                        <Pagination 
                            currentPage={currentPage} 
                            lastPage={totalPages} 
                            onPageChange={setCurrentPage} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
