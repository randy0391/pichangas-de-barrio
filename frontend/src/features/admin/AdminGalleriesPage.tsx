import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGalleries, useCreateGallery, useDeleteGallery, useUpdateGallery } from '@/hooks/useGalleries';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Gallery } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Image as ImageIcon, Trash2, Edit, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage, formatFileSize } from '@/lib/imageCompressor';

export const AdminGalleriesPage = () => {
    const { data: galleries = [], isLoading } = useGalleries();
    const { mutate: createGallery, isPending: isCreating } = useCreateGallery();
    const { mutate: updateGallery, isPending: isUpdating } = useUpdateGallery();
    const { mutate: deleteGallery } = useDeleteGallery();
    
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ title: '', description: '', cover_image: null as File | null });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    const openCreateForm = () => {
        setEditingId(null);
        setForm({ title: '', description: '', cover_image: null });
        setPreviewUrl(null);
        setShowForm(true);
    };

    const openEditForm = (g: Gallery) => {
        setEditingId(g.id);
        setForm({ title: g.title, description: g.description || '', cover_image: null });
        setPreviewUrl(g.cover_image || null);
        setShowForm(true);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Generate immediate preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        if (file.size > 1.5 * 1024 * 1024) {
            setIsOptimizing(true);
            try {
                const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85 });
                setForm(prev => ({ ...prev, cover_image: compressed }));
                toast.info(`Foto optimizada de ${formatFileSize(file.size)} a ${formatFileSize(compressed.size)} para subida rapida.`);
            } catch {
                setForm(prev => ({ ...prev, cover_image: file }));
            } finally {
                setIsOptimizing(false);
            }
        } else {
            setForm(prev => ({ ...prev, cover_image: file }));
        }
    };

    const handleRemoveImage = () => {
        setForm(prev => ({ ...prev, cover_image: null }));
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getErrorMessage = (err: any, fallback: string) => {
        const errors = err?.response?.data?.errors;
        if (errors && typeof errors === 'object') {
            const firstKey = Object.keys(errors)[0];
            if (firstKey && Array.isArray(errors[firstKey]) && errors[firstKey][0]) {
                return errors[firstKey][0];
            }
        }
        return err?.response?.data?.message || fallback;
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        
        const fd = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                fd.append(key, value.toString());
            }
        });
        if ((form as any).cover_image instanceof File) {
            fd.set('cover_image', (form as any).cover_image);
        }

        if (editingId) {
            updateGallery({ id: editingId, data: fd }, {
                onSuccess: () => {
                    toast.success('Galería actualizada con éxito');
                    setShowForm(false);
                },
                onError: (err: any) => toast.error(getErrorMessage(err, 'Error al actualizar galería'))
            });
        } else {
            createGallery(fd as any, {
                onSuccess: () => {
                    toast.success('Galería creada con éxito');
                    setShowForm(false);
                },
                onError: (err: any) => toast.error(getErrorMessage(err, 'Error al crear galería'))
            });
        }
    };

    const handleDelete = (id: number) => {
        toast('¿Estás seguro de eliminar esta galería y todas sus fotos?', {
            action: {
                label: 'Eliminar',
                onClick: () => {
                    deleteGallery(id, {
                        onSuccess: () => toast.success('Galería eliminada'),
                        onError: (err: any) => toast.error(getErrorMessage(err, 'Error al eliminar galería'))
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
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Gestionar Galerías</h1>
                    <p className="text-slate-500 dark:text-slate-400">Organiza las fotos y recuerdos históricos del club.</p>
                </div>
                <Button onClick={openCreateForm} className="bg-gradient-to-r from-accent to-pink-500 text-white border-0 font-bold uppercase tracking-wider rounded-xl shadow-lg">
                    <Plus className="mr-2 h-5 w-5" /> Nueva Galería
                </Button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase">{editingId ? 'Editar Galería' : 'Crear Galería'}</h2>
                                <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X /></button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Título</label>
                                    <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ej: Final Copa 2026" required className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Descripción</label>
                                    <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Breve descripción..." className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                        <span>📸 Imagen de Portada (Opcional - hasta 15MB)</span>
                                        {isOptimizing && (
                                            <span className="text-accent flex items-center text-xs normal-case">
                                                <Sparkles size={14} className="mr-1 animate-spin" /> Optimizando...
                                            </span>
                                        )}
                                    </label>
                                    <Input 
                                        type="file" 
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer" 
                                    />
                                    
                                    {previewUrl && (
                                        <div className="mt-3 flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl">
                                            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                                    {form.cover_image?.name || 'Portada actual de la galería'}
                                                </p>
                                                {form.cover_image && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                        Tamaño: <span className="font-semibold text-emerald-500">{formatFileSize(form.cover_image.size)}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                onClick={handleRemoveImage}
                                                className="shrink-0 h-9 px-3 rounded-xl border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold"
                                            >
                                                <Trash2 size={14} className="mr-1" /> Quitar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <Button 
                                type="submit" 
                                disabled={isCreating || isUpdating || isOptimizing} 
                                className="w-full h-14 bg-gradient-to-r from-accent to-pink-500 text-white font-black uppercase tracking-widest rounded-xl shadow-lg border-0 text-lg disabled:opacity-50"
                            >
                                {isOptimizing ? '✨ Optimizando foto...' : (isCreating || isUpdating ? 'Guardando...' : (editingId ? '💾 Guardar Cambios' : '📸 Crear Galería'))}
                            </Button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Título de Galería</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Archivos</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(galleries as Gallery[]).map((g, i) => (
                                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            {g.cover_image ? (
                                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                                                    <img src={g.cover_image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                                                    <ImageIcon size={20} />
                                                </div>
                                            )}
                                            <span className="font-bold text-slate-900 dark:text-white">{g.title}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs">{g.media_count} archivos</span>
                                    </td>
                                    <td className="p-5 text-right space-x-2">
                                        <Link to={`/admin/galeria/${g.id}`}>
                                            <Button variant="outline" className="border-accent/30 text-accent hover:bg-accent/10 hover:border-accent rounded-xl h-9 px-3 mr-2 font-bold text-xs uppercase">
                                                Ver / Subir Fotos
                                            </Button>
                                        </Link>
                                        <Button variant="outline" onClick={() => openEditForm(g)} className="border-slate-300 dark:border-slate-700 rounded-xl h-9 px-3">
                                            <Edit size={16} className="text-slate-600 dark:text-slate-400" />
                                        </Button>
                                        <Button variant="outline" onClick={() => handleDelete(g.id)} className="border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl h-9 px-3">
                                            <Trash2 size={16} className="text-red-500" />
                                        </Button>
                                    </td>
                                </motion.tr>
                            ))}
                            {(galleries as Gallery[]).length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-500 italic">No hay galerías creadas.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
