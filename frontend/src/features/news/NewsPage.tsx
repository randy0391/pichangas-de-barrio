import React, { useState } from 'react';
import { motion } from 'motion/react';
import { usePublicPosts } from '@/hooks/usePosts';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Post } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { CalendarDays, ArrowRight, ExternalLink } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

export const NewsPage = () => {
    const [page, setPage] = useState(1);
    const { data: postsResponse, isLoading } = usePublicPosts(page);
    const [filter, setFilter] = useState('Todas');
    const tabs = ['Todas', 'noticia', 'anuncio', 'novedad'];
    
    const posts = postsResponse?.data || [];
    const meta = postsResponse?.meta;
    const filtered = filter === 'Todas' ? posts : posts.filter((p: Post) => p.category === filter);

    if (isLoading && !posts.length) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight mb-2">
                        Noticias del <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Club</span>
                    </h1>
                    <p className="text-slate-400 text-lg">Mantente al tanto de los últimos fichajes, partidos y novedades.</p>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                    {tabs.map(t => (
                        <button 
                            key={t} 
                            onClick={() => setFilter(t)} 
                            className={`px-5 py-2 rounded-full capitalize font-bold text-sm transition-all border-2 ${
                                filter === t 
                                ? 'bg-primary border-primary text-slate-900 shadow-[0_0_15px_rgba(0,210,255,0.4)]' 
                                : 'bg-transparent border-slate-700 text-slate-300 hover:border-slate-500'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((post: Post, index: number) => (
                    <motion.div 
                        key={post.id} 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group"
                    >
                        <Link to={`/noticias/${post.slug}`} className="block h-full">
                            <div className="h-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] group-hover:border-primary/50 flex flex-col">
                                
                                <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    {post.featured_image ? (
                                        <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex justify-center items-center text-slate-300 dark:text-slate-700">
                                            <span className="text-6xl">⚽</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-accent/90 hover:bg-accent text-white border-0 font-bold px-3 py-1 text-xs uppercase tracking-wider backdrop-blur-md">
                                            {post.category}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <CalendarDays size={14} />
                                            {format(new Date(post.created_at || Date.now()), 'dd MMM yyyy', { locale: es })}
                                        </div>
                                        {post.link && (
                                            <div className="flex items-center gap-1.5 text-lime-500">
                                                <ExternalLink size={14} /> Enlace
                                            </div>
                                        )}
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                        {post.title}
                                    </h3>
                                    
                                    <p className="text-slate-600 dark:text-slate-400 line-clamp-3 mb-6 flex-1 text-sm">
                                        {post.content}
                                    </p>
                                    
                                    <div className="mt-auto flex items-center text-primary font-bold text-sm uppercase tracking-wide group-hover:text-accent transition-colors">
                                        Leer más <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
            
            {filtered.length === 0 && (
                <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800">
                    <p className="text-slate-400 text-lg">No hay noticias en esta categoría.</p>
                </div>
            )}

            {meta && meta.last_page > 1 && (
                <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={setPage} />
            )}
        </div>
    );
};
