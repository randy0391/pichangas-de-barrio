import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Convocatoria } from '@/types';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const AdminAttendanceReportPage = () => {
    // We fetch all convocatorias for the report
    const { data: reportData, isLoading } = useQuery({
        queryKey: ['attendance-report'],
        queryFn: async () => {
            const { data } = await api.get('/admin/attendance-report');
            return data;
        }
    });

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    // Export to CSV function
    const exportCSV = () => {
        if (!reportData) return;
        
        // Agregar BOM para que Excel reconozca los caracteres especiales (tildes)
        let csvContent = "\uFEFF";
        // Usamos punto y coma para que el Excel en español lo separe en columnas
        csvContent += "Jugador;Partido;Fecha;Asistencia\n";

        reportData.forEach((row: any) => {
            const name = `"${row.user_name}"`;
            const title = `"${row.convocatoria_title}"`;
            const date = `"${row.match_date}"`;
            const attendance = `"${row.attendance || 'Sin marcar'}"`;
            csvContent += `${name};${title};${date};${attendance}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "reporte_asistencias.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Reporte de Asistencias</h1>
                    <p className="text-slate-500 dark:text-slate-400">Revisa el historial de asistencia de todos los jugadores.</p>
                </div>
                <Button onClick={exportCSV} className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-6 rounded-xl flex items-center gap-2">
                    <FileSpreadsheet /> Exportar Excel / CSV
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Jugador</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Partido</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {reportData?.map((row: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 font-bold">{row.user_name}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">{row.convocatoria_title}</td>
                                    <td className="p-4 text-slate-500 text-sm">{row.match_date}</td>
                                    <td className="p-4 font-bold text-sm uppercase">
                                        {row.attendance === 'presente' && <span className="text-lime-500">✅ Presente</span>}
                                        {row.attendance === 'tardanza' && <span className="text-orange-500">⏱️ Tardanza</span>}
                                        {row.attendance === 'falta' && <span className="text-red-500">❌ Falta</span>}
                                        {(!row.attendance || row.attendance === 'pendiente') && <span className="text-slate-400">Sin marcar</span>}
                                    </td>
                                </tr>
                            ))}
                            {(!reportData || reportData.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">No hay registros de asistencia.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
