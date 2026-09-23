import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePost } from '@/hooks/usePosts';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'motion/react';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { ArrowLeft, CalendarDays, User, Tag, ExternalLink, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export const NewsDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { data: post, isLoading } = usePost(slug as string);

    if (isLoading) return <div className="py-32 flex justify-center"><FootballSpinner /></div>;
    
    if (!post) return (
        <div className="py-32 text-center text-slate-400">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">Noticia no encontrada</h2>
            <p>La noticia que buscas no existe o ha sido eliminada.</p>
            <Button variant="outline" onClick={() => navigate(-1)} className="mt-6 font-bold uppercase tracking-wider">
                Volver
            </Button>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Button 
                    variant="outline" 
                    onClick={() => navigate(-1)} 
                    className="mb-8 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full pl-4 pr-6 uppercase font-bold text-xs tracking-wider"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Noticias
                </Button>
            </motion.div>

            <motion.article 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
                {/* Header Image Area */}
                <div className="relative w-full h-[400px] md:h-[500px] bg-slate-100 dark:bg-slate-800 group overflow-hidden">
                    {post.featured_image ? (
                        <>
                            <img 
                                src={post.featured_image} 
                                alt={post.title} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                            />
                            {/* Gradient Overlay for text readability if needed */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-80" />
                        </>
                    ) : (
                        <div className="w-full h-full flex justify-center items-center bg-gradient-to-br from-slate-800 to-slate-900">
                            <span className="text-9xl opacity-20">⚽</span>
                        </div>
                    )}
                    
                    {/* Floating Title Content */}
                    <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-10">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <Badge className="bg-primary/90 text-slate-900 font-black px-4 py-1.5 uppercase tracking-widest text-xs border-0 backdrop-blur-md">
                                {post.category || 'Noticia'}
                            </Badge>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-lg line-clamp-4">
                            {post.title}
                        </h1>
                    </div>
                </div>

                {/* Metadata Bar */}
                <div className="flex flex-wrap items-center gap-6 px-8 md:px-12 py-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                        <User size={16} className="text-accent" />
                        <span className="uppercase tracking-wider">{post.author?.name || 'Administrador'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-primary" />
                        <span className="uppercase tracking-wider">
                            {format(new Date(post.created_at || Date.now()), 'dd MMMM yyyy', { locale: es })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <Tag size={16} className="text-lime-400" />
                        <span className="uppercase tracking-wider">Pichangas FC</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 md:p-12">
                    <div className="prose prose-lg prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                        {/* If the content is just plain text with line breaks, we can split it. If it's HTML, we use dangerouslySetInnerHTML. 
                            Assuming it's plain text since the original just did {post.content} */}
                        {post.content.split('\n').map((paragraph: string, idx: number) => (
                            <p key={idx} className="mb-6 leading-relaxed text-lg">
                                {paragraph}
                            </p>
                        ))}
                        
                        {post.link && (
                            <div className="mt-12 bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <ExternalLink size={16} /> Enlace Adjunto
                               </h3>
                                {post.link.includes('facebook.com') ? (
                                    <div className="flex justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden" style={{ minHeight: '300px' }}>
                                        <iframe 
                                            src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(post.link)}&show_text=true&width=500`}
                                            width="500"
                                            height="500"
                                            style={{ border: 'none', overflow: 'hidden' }}
                                            scrolling="no"
                                            frameBorder="0"
                                            allowFullScreen={true}
                                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                        ></iframe>
                                    </div>
                                ) : (
                                    <a 
                                        href={post.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="group flex flex-col sm:flex-row bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-lime-500 hover:shadow-lg hover:shadow-lime-500/10 transition-all duration-300 overflow-hidden"
                                    >
                                        {post.link_image ? (
                                            <div className="w-full sm:w-48 h-48 sm:h-auto shrink-0 overflow-hidden">
                                                <img src={post.link_image} alt={post.link_title || "Enlace"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        ) : (
                                            <div className="w-full sm:w-48 h-48 sm:h-auto bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                <ExternalLink size={32} className="text-slate-400" />
                                            </div>
                                        )}
                                        <div className="p-6 flex flex-col justify-center flex-1 overflow-hidden">
                                            <h4 className="font-black text-slate-900 dark:text-white text-lg mb-2 group-hover:text-lime-500 transition-colors line-clamp-2 uppercase">
                                                {post.link_title || 'Contenido Externo'}
                                            </h4>
                                            <p className="text-slate-500 text-sm line-clamp-3 mb-4">
                                                {post.link_description || post.link}
                                            </p>
                                            <div className="mt-auto flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider gap-1">
                                                <ExternalLink size={12} /> {(post.link.match(/https?:\/\/(www\.)?([^\/]+)/i) || [])[2] || 'Enlace'}
                                            </div>
                                        </div>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.article>
        </div>
    );
};
