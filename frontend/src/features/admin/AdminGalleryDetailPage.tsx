import React, { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGallery, useUploadMedia, useDeleteMedia } from '@/hooks/useGalleries';
import { Button } from '@/components/ui/Button';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Trash2, ArrowLeft, Image as ImageIcon, Video } from 'lucide-react';
import { toast } from 'sonner';

export const AdminGalleryDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const galleryId = Number(id);
    const { data: gallery, isLoading } = useGallery(galleryId);
    const { mutateAsync: uploadMediaAsync, isPending: isUploading } = useUploadMedia();
    const { mutate: deleteMedia } = useDeleteMedia();
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;
    if (!gallery) return <div className="text-center py-20 text-white font-bold text-2xl">Galería no encontrada</div>;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const toastId = toast.loading(`Subiendo ${files.length} archivo(s)...`);
        
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('gallery_id', galleryId.toString());
            
            try {
                await uploadMediaAsync(formData);
                successCount++;
            } catch (err) {
                errorCount++;
            }
        }

        if (errorCount === 0) {
            toast.success(`${successCount} archivo(s) subido(s) correctamente`, { id: toastId });
        } else {
            toast.error(`${successCount} subidos, ${errorCount} fallaron`, { id: toastId });
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = (mediaId: number) => {
        toast('¿Eliminar este archivo?', {
            action: {
                label: 'Eliminar',
                onClick: () => {
                    deleteMedia({ id: mediaId, galleryId }, {
                        onSuccess: () => toast.success('Archivo eliminado'),
                        onError: () => toast.error('Error al eliminar')
                    });
                }
            },
            cancel: { label: 'Cancelar', onClick: () => {} },
            style: { background: '#ef4444', color: 'white', border: 'none' }
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link to="/admin/galeria" className="inline-flex items-center text-accent hover:text-accent/80 font-bold mb-2 transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> Volver a Galerías
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{gallery.title}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{gallery.description || 'Sin descripción'}</p>
                </div>
                
                <input 
                    type="file" 
                    multiple
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,video/*" 
                    onChange={handleFileSelect} 
                />
                <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isUploading}
                    className="bg-gradient-to-r from-accent to-pink-500 text-white border-0 font-black uppercase tracking-wider rounded-xl shadow-lg h-12 px-6"
                >
                    <Upload className="mr-2 h-5 w-5" /> 
                    {isUploading ? 'Subiendo...' : 'Subir Archivo'}
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xl min-h-[400px]">
                {(!gallery.media || gallery.media.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                        <ImageIcon size={64} className="mb-4 opacity-20" />
                        <p className="text-xl font-bold uppercase tracking-widest opacity-50">No hay fotos ni videos</p>
                        <p className="text-sm mt-2 opacity-50">Sube archivos usando el botón de arriba</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <AnimatePresence>
                            {gallery.media.map((item, i) => (
                                <motion.div 
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md"
                                >
                                    {item.type === 'video' ? (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                            <Video size={48} className="text-slate-600" />
                                        </div>
                                    ) : (
                                        <img src={item.file_path} alt={item.title || 'Media'} className="w-full h-full object-cover" />
                                    )}
                                    
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <button 
                                            onClick={() => handleDelete(item.id)}
                                            className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                    {item.type === 'video' && (
                                        <div className="absolute top-2 right-2 bg-slate-900/80 p-1.5 rounded-lg text-white backdrop-blur-md">
                                            <Video size={14} />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};
