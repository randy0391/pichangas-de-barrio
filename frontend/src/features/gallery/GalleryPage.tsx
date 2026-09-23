import React from 'react';
import { useGalleries } from '@/hooks/useGalleries';
import { Link } from 'react-router-dom';
import { Gallery } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { motion } from 'motion/react';
import { Camera, Image as ImageIcon } from 'lucide-react';

export const GalleryPage = () => {
    const { data: galleries = [], isLoading } = useGalleries();

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-full mb-4 text-accent">
                    <Camera size={32} />
                </div>
                <h1 className="text-5xl font-black text-white uppercase tracking-tight mb-4">
                    Nuestra <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Historia</span>
                </h1>
                <p className="text-slate-400 text-lg">Revive los mejores momentos de los partidos, torneos y celebraciones de la familia Pichangas de Barrio FC.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[300px]">
                {(galleries as Gallery[]).map((gallery, i) => (
                    <motion.div 
                        key={gallery.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`group relative overflow-hidden rounded-3xl shadow-xl ${i % 5 === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}
                    >
                        <Link to={`/galeria/${gallery.id}`} className="absolute inset-0 z-10">
                            <span className="sr-only">Ver {gallery.title}</span>
                        </Link>
                        
                        <div className="absolute inset-0 bg-slate-800">
                            {gallery.cover_image ? (
                                <img 
                                    src={gallery.cover_image} 
                                    alt={gallery.title} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                                    <span className="text-6xl opacity-20 group-hover:scale-125 transition-transform duration-500">⚽</span>
                                </div>
                            )}
                        </div>

                        {/* Gradient overlay for text */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                <ImageIcon size={16} />
                                <span>{gallery.media_count || 0} Archivos</span>
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">{gallery.title}</h3>
                            <p className="text-slate-300 line-clamp-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150">{gallery.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {galleries.length === 0 && (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800">
                    <p className="text-slate-400 text-lg">Aún no hay galerías publicadas.</p>
                </div>
            )}
        </div>
    );
};
