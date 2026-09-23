import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Camera, Save, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

export const ProfilePage = () => {
    const { user, fetchUser } = useAuthStore();
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', position: 'medio', jersey_number: '', bio: '', birth_date: '', blood_type: '', nickname: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '', email: user.email || '', phone: user.phone || '',
                position: user.position || 'medio', jersey_number: user.jersey_number?.toString() || '', bio: user.bio || '',
                birth_date: user.birth_date || '', blood_type: user.blood_type || '', nickname: user.nickname || ''
            });
        }
    }, [user]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            toast.loading('Subiendo foto...', { id: 'avatar-upload' });
            await api.post('/user/avatar', formData);
            await fetchUser();
            toast.success('¡Foto actualizada!', { id: 'avatar-upload' });
        } catch (error) {
            toast.error('Error al subir la foto', { id: 'avatar-upload' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put('/user', formData);
            await fetchUser();
            toast.success('Perfil actualizado correctamente');
        } catch (error) {
            toast.error('Error al actualizar el perfil');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header Banner */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-[2rem] p-8 mb-8 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary/20 to-transparent skew-x-12"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 bg-slate-800 flex items-center justify-center shadow-xl">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon size={48} className="text-slate-500" />
                            )}
                        </div>
                        <input 
                            type="file" 
                            id="avatar-upload" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleAvatarUpload}
                        />
                        <button 
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                            className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                            <Camera size={20} />
                        </button>
                    </div>
                    
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{user?.name}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                                {user?.role || 'Miembro'}
                            </span>
                            <span className="px-3 py-1 bg-accent/20 text-accent border border-accent/30 rounded-full text-xs font-bold uppercase tracking-widest">
                                {formData.position}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Form Form */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-200 dark:border-slate-800"
            >
                <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Ficha Técnica</h2>
                    <p className="text-slate-500 dark:text-slate-400">Actualiza tus datos para que el equipo pueda contactarte.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nombre Completo</label>
                            <Input 
                                placeholder="Tu nombre" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 rounded-xl focus-visible:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Correo Electrónico</label>
                            <Input 
                                type="email" 
                                placeholder="Email" 
                                value={formData.email} 
                                disabled 
                                className="bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 h-12 rounded-xl cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Teléfono de Contacto</label>
                            <Input 
                                placeholder="+51 999 999 999" 
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 rounded-xl focus-visible:ring-primary"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Posición</label>
                                <select 
                                    className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer" 
                                    value={formData.position} 
                                    onChange={e => setFormData({...formData, position: e.target.value as any})}
                                >
                                    <option value="portero">Portero</option>
                                    <option value="defensa">Defensa</option>
                                    <option value="medio">Medio</option>
                                    <option value="delantero">Delantero</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Dorsal</label>
                                <Input 
                                    placeholder="Ej: 10" 
                                    type="number"
                                    value={formData.jersey_number} 
                                    onChange={e => setFormData({...formData, jersey_number: e.target.value})}
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 rounded-xl focus-visible:ring-primary font-bold"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Fecha de Nacimiento</label>
                                <Input 
                                    type="date"
                                    value={formData.birth_date} 
                                    onChange={e => setFormData({...formData, birth_date: e.target.value})}
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 rounded-xl focus-visible:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Grupo Sanguíneo</label>
                                <Input 
                                    placeholder="Ej: O+" 
                                    value={formData.blood_type} 
                                    onChange={e => setFormData({...formData, blood_type: e.target.value})}
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 rounded-xl focus-visible:ring-primary"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Apodo (Cómo te dicen)</label>
                            <Input 
                                placeholder="Ej: El Mago, El Tanque..." 
                                value={formData.nickname} 
                                onChange={e => setFormData({...formData, nickname: e.target.value})}
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 rounded-xl focus-visible:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Biografía del Jugador</label>
                        <Textarea 
                            placeholder="Cuéntanos un poco sobre ti, tu estilo de juego o tu trayectoria..." 
                            value={formData.bio} 
                            onChange={e => setFormData({...formData, bio: e.target.value})}
                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 min-h-[120px] rounded-xl focus-visible:ring-primary resize-none p-4"
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={isSaving} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold uppercase tracking-widest rounded-xl h-14 px-8 shadow-[0_0_15px_rgba(0,210,255,0.3)] border-0">
                            {isSaving ? 'Actualizando...' : <><Save className="mr-2 h-5 w-5" /> Actualizar Ficha</>}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
