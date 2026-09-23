import React, { useState } from 'react';
import { usePublicPosts, useCreatePost, useDeletePost, useUpdatePost } from '@/hooks/usePosts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Post } from '@/types';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit, Megaphone, X } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/Pagination';

export const AdminPostsPage = () => {
    const [page, setPage] = useState(1);
    const { data: postsResponse, isLoading } = usePublicPosts(page);
    const { mutate: createPost, isPending: isCreating } = useCreatePost();
    const { mutate: updatePost, isPending: isUpdating } = useUpdatePost();
    const { mutate: deletePost } = useDeletePost();
    
    const posts = postsResponse?.data || [];
    const meta = postsResponse?.meta;

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ title: '', content: '', category: 'noticia', status: 'publicado', featured_image: null as File | null, link: '' });

    if (isLoading && !posts.length) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

    const openCreateForm = () => {
        setEditingId(null);
        setForm({ title: '', content: '', category: 'noticia', status: 'publicado', featured_image: null, link: '' });
        setShowForm(true);
    };

    const openEditForm = (p: Post) => {
        setEditingId(p.id);
        setForm({ title: p.title, content: p.content, category: p.category, status: p.status || 'publicado', featured_image: null, link: (p as any).link || '' });
        setShowForm(true);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        
        const fd = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                fd.append(key, value.toString());
            }
        });
        if ((form as any).featured_image instanceof File) {
            fd.set('featured_image', (form as any).featured_image);
        }

        if (editingId) {
            updatePost({ id: editingId, data: fd }, {
                onSuccess: () => {
                    toast.success('Noticia actualizada');
                    setShowForm(false);
                },
                onError: () => toast.error('Error al actualizar noticia')
            });
        } else {
            createPost(fd as any, {
                onSuccess: () => {
                    toast.success('Noticia publicada');
                    setShowForm(false);
                },
                onError: () => toast.error('Error al publicar noticia')
            });
        }
    };

    const handleDelete = (id: number) => {
        toast('¿Seguro que deseas eliminar esta noticia?', {
            action: {
                label: 'Eliminar',
                onClick: () => {
                    deletePost(id, {
                        onSuccess: () => toast.success('Noticia eliminada'),
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
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Gestionar Noticias</h1>
                    <p className="text-slate-500 dark:text-slate-400">Publica comunicados, resúmenes de partidos y novedades.</p>
                </div>
                <Button onClick={openCreateForm} className="bg-gradient-to-r from-lime-400 to-lime-500 text-slate-900 border-0 font-black uppercase tracking-wider rounded-xl shadow-lg">
                    <Plus className="mr-2 h-5 w-5" /> Nueva Noticia
                </Button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase">{editingId ? 'Editar Noticia' : 'Publicar Noticia'}</h2>
                                <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X /></button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Título de la Noticia (Opcional si usas Enlace)</label>
                                    <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ej: Gran victoria de Pichangas FC" className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Categoría</label>
                                    <select 
                                        className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 appearance-none cursor-pointer" 
                                        value={form.category} 
                                        onChange={e => setForm({...form, category: e.target.value})}
                                    >
                                        <option value="noticia">Noticia</option>
                                        <option value="anuncio">Anuncio</option>
                                        <option value="novedad">Novedad</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Contenido (Opcional si usas Enlace)</label>
                                    <Textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Escribe aquí el contenido de la noticia..." className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl min-h-[150px]" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">🔗 Enlace (Facebook, YouTube, etc) [Opcional]</label>
                                    <Input value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="https://www.facebook.com/..." className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">📸 Imagen Destacada (Opcional)</label>
                                    <Input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) setForm({...form, featured_image: file as any});
                                        }}
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-12 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-lime-50 file:text-lime-700 hover:file:bg-lime-100" 
                                    />
                                </div>
                            </div>
                            
                            <Button type="submit" disabled={isCreating || isUpdating} className="w-full h-14 bg-gradient-to-r from-lime-400 to-lime-500 text-slate-900 font-black uppercase tracking-widest rounded-xl shadow-lg border-0 text-lg">
                                {isCreating || isUpdating ? 'Guardando...' : (editingId ? '💾 Guardar Cambios' : '📢 Publicar Noticia')}
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
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Título de Noticia</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs">Categoría</th>
                                <th className="p-5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(posts as Post[]).map((p, i) => (
                                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-lime-400/10 text-lime-600 dark:text-lime-400 flex items-center justify-center">
                                                <Megaphone size={20} />
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{p.title}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">{p.category}</span>
                                    </td>
                                    <td className="p-5 text-right space-x-2 whitespace-nowrap">
                                        <Button variant="outline" onClick={() => openEditForm(p)} className="border-slate-300 dark:border-slate-700 rounded-xl h-9 px-3">
                                            <Edit size={16} className="text-slate-600 dark:text-slate-400" />
                                        </Button>
                                        <Button variant="outline" onClick={() => handleDelete(p.id)} className="border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl h-9 px-3">
                                            <Trash2 size={16} className="text-red-500" />
                                        </Button>
                                    </td>
                                </motion.tr>
                            ))}
                            {(posts as Post[]).length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-500 italic">No hay noticias publicadas.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {meta && meta.last_page > 1 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={setPage} />
                    </div>
                )}
            </div>
        </div>
    );
};
