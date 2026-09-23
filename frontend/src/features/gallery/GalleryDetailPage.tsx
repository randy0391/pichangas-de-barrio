import React from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useGallery } from '@/hooks/useGalleries';
import { Button } from '@/components/ui/Button';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { motion } from 'motion/react';
import { ArrowLeft, Image as ImageIcon, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MediaItem = ({ m, index }: { m: any, index: number }) => {
    const [error, setError] = React.useState(false);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 shadow-md hover:shadow-xl transition-all duration-300 w-full h-full ${index % 7 === 0 ? 'md:col-span-2 md:row-span-2' : 'col-span-1 row-span-1'}`}
        >
            {m.type === 'foto' ? (
                (m.file_path && !error) ? (
                    <img 
                        src={m.file_path} 
                        alt="" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        onError={() => setError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/5 dark:bg-slate-900/50">
                        <span className="text-5xl opacity-20 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 mb-2">⚽</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">No disponible</span>
                    </div>
                )
            ) : (
                <video src={m.file_path} controls className="w-full h-full object-cover" />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </motion.div>
    );
};

export const GalleryDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: gallery, isLoading } = useGallery(Number(id));
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;
    if (!gallery) return <div className="py-20 text-center text-white text-2xl font-bold">Galería no encontrada</div>;

    const mediaList = gallery.media || [];
    const selectedMedia = selectedIndex !== null ? mediaList[selectedIndex] : null;

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIndex !== null) {
            setSelectedIndex((selectedIndex + 1) % mediaList.length);
        }
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIndex !== null) {
            setSelectedIndex((selectedIndex - 1 + mediaList.length) % mediaList.length);
        }
    };

    return (
        <div className="min-h-screen pb-12">
            {/* Immersive Header */}
            <div className="relative pt-32 pb-16 px-4 mb-12 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-slate-900">
                    {gallery.cover_image ? (
                        <>
                            <img src={gallery.cover_image} alt="" className="w-full h-full object-cover opacity-30" />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#070b14]/80 to-[#070b14]"></div>
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.03)_2px,transparent_2px)] bg-[size:4rem_4rem] opacity-50"></div>
                    )}
                </div>

                <div className="container mx-auto relative z-10">
                    <Button 
                        variant="outline" 
                        onClick={() => navigate(-1)} 
                        className="mb-8 border-white/20 text-white hover:bg-white hover:text-slate-900 rounded-full pl-4 pr-6 uppercase font-bold text-xs tracking-wider transition-all backdrop-blur-md bg-white/5"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Galerías
                    </Button>
                    
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                                <ImageIcon size={14} /> {gallery.media_count || mediaList.length || 0} Archivos
                            </span>
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                                <CalendarDays size={14} /> {format(new Date(gallery.created_at || Date.now()), 'dd MMM yyyy', { locale: es })}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-4 leading-none drop-shadow-lg">
                            {gallery.title}
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed drop-shadow-md">
                            {gallery.description}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Media Grid */}
            <div className="container mx-auto px-4">
                <div className="bg-white dark:bg-slate-900/50 backdrop-blur-sm p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl">
                    {mediaList.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[150px] md:auto-rows-[200px] grid-flow-dense">
                            {mediaList.map((m: any, index: number) => (
                                <div key={m.id} onClick={() => setSelectedIndex(index)} className="cursor-pointer">
                                    <MediaItem m={m} index={index} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <ImageIcon className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aún no hay fotos</h3>
                            <p className="text-slate-500 dark:text-slate-400">Las fotos y videos de este álbum se subirán pronto.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedMedia && typeof document !== 'undefined' && ReactDOM.createPortal(
                <motion.div 
                    key="lightbox-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                    onClick={() => setSelectedIndex(null)}
                >
                    <button 
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-50 p-2"
                        onClick={() => setSelectedIndex(null)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    {/* Prev Button */}
                    {mediaList.length > 1 && (
                        <button 
                            className="absolute left-4 md:left-12 text-white/50 hover:text-white transition-colors z-50 p-4 bg-black/20 hover:bg-black/40 rounded-full"
                            onClick={handlePrev}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                    )}
                    
                    <motion.div 
                        key={selectedMedia.id}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative max-w-5xl w-full max-h-[90vh] flex justify-center items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {selectedMedia.type === 'foto' ? (
                            <img 
                                src={selectedMedia.file_path} 
                                alt="Vista completa" 
                                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                            />
                        ) : (
                            <video 
                                src={selectedMedia.file_path} 
                                controls 
                                autoPlay 
                                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" 
                            />
                        )}
                    </motion.div>

                    {/* Next Button */}
                    {mediaList.length > 1 && (
                        <button 
                            className="absolute right-4 md:right-12 text-white/50 hover:text-white transition-colors z-50 p-4 bg-black/20 hover:bg-black/40 rounded-full"
                            onClick={handleNext}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    )}
                </motion.div>,
                document.body
            )}
        </div>
    );
};
