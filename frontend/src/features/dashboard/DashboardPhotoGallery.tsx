import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useClubPhotos, ClubPhoto } from '@/hooks/useGalleries';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Camera, 
    Images, 
    Sparkles, 
    ChevronRight, 
    ChevronLeft, 
    X, 
    Maximize2, 
    ExternalLink, 
    Calendar,
    ArrowRight,
    Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const DashboardPhotoGallery = () => {
    const { data, isLoading } = useClubPhotos();
    const photos = data?.photos || [];
    const galleries = data?.galleries || [];

    const [selectedAlbumId, setSelectedAlbumId] = useState<number | 'all'>('all');
    const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

    // Filter photos by selected album
    const filteredPhotos = selectedAlbumId === 'all'
        ? photos
        : photos.filter(p => p.galleryId === selectedAlbumId);

    const activePhoto = activePhotoIndex !== null ? filteredPhotos[activePhotoIndex] : null;

    // Keyboard navigation for Lightbox
    useEffect(() => {
        if (activePhotoIndex === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setActivePhotoIndex(null);
            } else if (e.key === 'ArrowRight') {
                setActivePhotoIndex((prev) => (prev !== null ? (prev + 1) % filteredPhotos.length : 0));
            } else if (e.key === 'ArrowLeft') {
                setActivePhotoIndex((prev) => (prev !== null ? (prev - 1 + filteredPhotos.length) % filteredPhotos.length : 0));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activePhotoIndex, filteredPhotos.length]);

    const formatPhotoDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
            return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        } catch {
            return '';
        }
    };

    if (isLoading) {
        return (
            <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 sm:p-8 animate-pulse space-y-4">
                <div className="h-6 w-48 bg-slate-800 rounded-xl"></div>
                <div className="h-4 w-72 bg-slate-800/60 rounded-xl"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-[4/3] bg-slate-800/80 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!photos.length && !galleries.length) {
        return null;
    }

    return (
        <section className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 rounded-3xl border border-slate-800/90 shadow-2xl p-5 sm:p-7 space-y-6 relative overflow-hidden">
            {/* Ambient decorative lighting */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-lime-400/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-400/10 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Header & Direct Actions */}
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/30 text-[11px] font-black uppercase tracking-wider">
                            <Camera className="w-3.5 h-3.5" /> Fotos Oficiales del Club
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                            • {photos.length} fotos
                        </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        Galería de Fotos
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                        Revive las mejores jugadas, celebraciones y momentos de los partidos subidos por la directiva.
                    </p>
                </div>

                <Link to="/galeria" className="shrink-0">
                    <Button 
                        variant="outline"
                        className="bg-slate-950/80 hover:bg-slate-800 border-slate-700 hover:border-lime-400/50 text-white hover:text-lime-400 font-black text-xs uppercase tracking-wider rounded-2xl h-11 px-4 flex items-center gap-2 transition-all shadow-md group"
                    >
                        <span>Ver Todos los Álbumes</span>
                        <ArrowRight className="w-4 h-4 text-lime-400 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>

            {/* Album Filter Tabs */}
            {galleries.length > 1 && (
                <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
                    <button
                        onClick={() => setSelectedAlbumId('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                            selectedAlbumId === 'all'
                                ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/20'
                                : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                    >
                        Todas ({photos.length})
                    </button>
                    {galleries.map((g) => (
                        <button
                            key={g.id}
                            onClick={() => setSelectedAlbumId(g.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                selectedAlbumId === g.id
                                    ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/20'
                                    : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                        >
                            <span>{g.title}</span>
                            {g.media_count ? (
                                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                    selectedAlbumId === g.id ? 'bg-slate-900 text-lime-400' : 'bg-slate-800 text-slate-400'
                                }`}>
                                    {g.media_count}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>
            )}

            {/* Photo Cards Grid */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {filteredPhotos.slice(0, 10).map((photo, index) => (
                    <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.04 }}
                        onClick={() => setActivePhotoIndex(index)}
                        className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-lime-400/60 shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(163,230,53,0.2)]"
                    >
                        <img 
                            src={photo.url} 
                            alt={photo.caption || photo.galleryTitle}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />

                        {/* Top Badge: Album Title */}
                        <div className="absolute top-2 left-2 z-10">
                            <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-slate-200 border border-white/10 truncate max-w-[140px] block">
                                {photo.galleryTitle}
                            </span>
                        </div>

                        {/* Dark Gradient Overlay & Hover Actions */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                            <div className="flex items-center justify-between text-white">
                                <span className="text-[11px] font-bold text-lime-400 flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> Ver foto
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                    {formatPhotoDate(photo.createdAt)}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick footer banner */}
            <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800/80">
                <span className="flex items-center gap-2 text-center sm:text-left">
                    <Sparkles className="w-4 h-4 text-lime-400 shrink-0" />
                    Haz clic sobre cualquier foto para verla en pantalla completa o descargarla.
                </span>

                <Link 
                    to="/galeria"
                    className="text-lime-400 hover:text-lime-300 font-black uppercase tracking-wider text-xs flex items-center gap-1 transition-colors"
                >
                    <span>Ir a la Galería Oficial</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* ===== Full-Screen Lightbox Modal ===== */}
            {activePhoto && typeof document !== 'undefined' && ReactDOM.createPortal(
                <AnimatePresence>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActivePhotoIndex(null)}
                        className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
                    >
                        {/* Lightbox Top Bar */}
                        <div className="flex items-center justify-between gap-4 w-full z-10" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-0.5">
                                <span className="text-xs font-black uppercase tracking-wider text-lime-400 flex items-center gap-1.5">
                                    <Camera className="w-3.5 h-3.5" /> {activePhoto.galleryTitle}
                                </span>
                                <p className="text-xs text-slate-400">
                                    Foto {activePhotoIndex! + 1} de {filteredPhotos.length} • {formatPhotoDate(activePhoto.createdAt)}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link 
                                    to={`/galeria/${activePhoto.galleryId}`}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-slate-700"
                                >
                                    <span>Ver Álbum</span>
                                    <ExternalLink className="w-3 h-3" />
                                </Link>

                                <button
                                    onClick={() => setActivePhotoIndex(null)}
                                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors"
                                    title="Cerrar (Esc)"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Lightbox Main Image & Navigation Arrows */}
                        <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            {/* Prev Button */}
                            {filteredPhotos.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActivePhotoIndex((prev) => (prev !== null ? (prev - 1 + filteredPhotos.length) % filteredPhotos.length : 0));
                                    }}
                                    className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-lime-400 hover:text-slate-950 text-white border border-slate-700/80 transition-all backdrop-blur-md shadow-xl"
                                    title="Foto anterior (←)"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                            )}

                            {/* Active Photo */}
                            <motion.img 
                                key={activePhoto.url}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                src={activePhoto.url} 
                                alt={activePhoto.caption || activePhoto.galleryTitle}
                                className="max-h-[75vh] sm:max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800/80 select-none"
                            />

                            {/* Next Button */}
                            {filteredPhotos.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActivePhotoIndex((prev) => (prev !== null ? (prev + 1) % filteredPhotos.length : 0));
                                    }}
                                    className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-lime-400 hover:text-slate-950 text-white border border-slate-700/80 transition-all backdrop-blur-md shadow-xl"
                                    title="Siguiente foto (→)"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            )}
                        </div>

                        {/* Lightbox Bottom Controls */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-2xl mx-auto z-10" onClick={(e) => e.stopPropagation()}>
                            <div className="text-center sm:text-left">
                                {activePhoto.galleryDescription && (
                                    <p className="text-xs text-slate-300 line-clamp-1">
                                        {activePhoto.galleryDescription}
                                    </p>
                                )}
                            </div>

                            <a
                                href={activePhoto.url}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-lime-400/20 transition-all"
                            >
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Ver en HD / Descargar</span>
                            </a>
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </section>
    );
};
