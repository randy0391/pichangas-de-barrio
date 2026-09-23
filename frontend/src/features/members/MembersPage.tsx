import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useMembers } from '@/hooks/useMembers';
import { Input } from '@/components/ui/Input';
import { User } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Search, Shield, User as UserIcon } from 'lucide-react';

import { Pagination } from '@/components/ui/Pagination';

export const MembersPage = () => {
    const [page, setPage] = useState(1);
    const { data: response, isLoading } = useMembers(page);
    const [search, setSearch] = useState('');
    const [position, setPosition] = useState('todos');

    const members = response?.data || [];
    const meta = response?.meta;

    const filtered = (members as User[]).filter(m => 
        (position === 'todos' || m.position === position) &&
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading && !members.length) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    const getPositionColor = (pos: string) => {
        switch(pos?.toLowerCase()) {
            case 'portero': return 'bg-yellow-500 text-yellow-950';
            case 'defensa': return 'bg-blue-500 text-blue-950';
            case 'medio': return 'bg-lime-500 text-lime-950';
            case 'delantero': return 'bg-accent text-white';
            default: return 'bg-slate-700 text-white';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                        Plantel <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-lime-500">Oficial</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Conoce a los jugadores que sudan la camiseta.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Buscar jugador..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 rounded-xl focus-visible:ring-primary"
                        />
                    </div>
                    <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select 
                            className="w-full sm:w-48 pl-10 pr-4 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                            value={position} 
                            onChange={e => setPosition(e.target.value)}
                        >
                            <option value="todos">Todas las posiciones</option>
                            <option value="portero">Porteros</option>
                            <option value="defensa">Defensas</option>
                            <option value="medio">Mediocampistas</option>
                            <option value="delantero">Delanteros</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((m: User, index: number) => (
                    <motion.div 
                        key={m.id} 
                        initial={{opacity:0, y:20}} 
                        animate={{opacity:1, y:0}}
                        transition={{ delay: index * 0.05 }}
                    >
                        {/* Player Card Layout */}
                        <div className="group relative bg-white dark:bg-slate-900 rounded-3xl p-1 overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(0,210,255,0.2)] transition-all duration-300">
                            {/* Glowing border effect on hover */}
                            <div className="absolute inset-0 bg-gradient-to-b from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                            
                            <div className="relative h-full bg-slate-50 dark:bg-[#0b1221] rounded-[1.4rem] p-6 flex flex-col items-center text-center z-10 border border-slate-200 dark:border-slate-800 group-hover:border-transparent">
                                
                                {/* Top Badges */}
                                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                    <span className={`text-[0.65rem] font-black uppercase tracking-widest px-2 py-1 rounded ${getPositionColor(m.position)}`}>
                                        {m.position || 'Jugador'}
                                    </span>
                                    {m.jersey_number && (
                                        <span className="text-2xl font-black text-slate-300 dark:text-slate-700 italic">#{m.jersey_number}</span>
                                    )}
                                </div>

                                {/* Avatar */}
                                <div className="mt-8 mb-4 relative">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-200 dark:border-slate-800 group-hover:border-primary transition-colors bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 aspect-square">
                                        {m.avatar ? (
                                            <img src={m.avatar} alt={m.name} className="w-full h-full object-cover shrink-0" />
                                        ) : (
                                            <UserIcon size={40} className="text-slate-400 dark:text-slate-600" />
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-slate-50 dark:border-[#0b1221]">
                                        ⚽
                                    </div>
                                </div>

                                {/* Info */}
                                <h3 className="font-black text-xl text-slate-900 dark:text-white mb-1">{m.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{m.role || 'Miembro'}</p>
                                
                                {m.bio && (
                                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                                        "{m.bio}"
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <UserIcon className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Plantel no encontrado</h3>
                    <p className="text-slate-500 dark:text-slate-400">No hay jugadores que coincidan con tu búsqueda.</p>
                </div>
            )}

            {meta && meta.last_page > 1 && (
                <div className="mt-8">
                    <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={setPage} />
                </div>
            )}
        </div>
    );
};
