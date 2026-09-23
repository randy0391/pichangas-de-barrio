const fs = require('fs');
const path = require('path');

const write = (filepath, content) => {
    fs.writeFileSync(path.join(__dirname, filepath), content.trim() + '\n');
};

write('src/features/news/NewsPage.tsx', `
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { usePublicPosts } from '@/hooks/usePosts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export const NewsPage = () => {
    const { data: postsRes, isLoading } = usePublicPosts();
    const posts = postsRes?.data || [];
    const [filter, setFilter] = useState('Todas');
    const tabs = ['Todas', 'noticia', 'anuncio', 'novedad'];
    
    const filtered = filter === 'Todas' ? posts : posts.filter(p => p.category === filter);

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Noticias</h1>
            <div className="flex gap-2 mb-6">
                {tabs.map(t => (
                    <button key={t} onClick={() => setFilter(t)} className={\`px-4 py-2 rounded \${filter === t ? 'bg-green-800 text-white' : 'bg-gray-200'}\`}>
                        {t}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filtered.map(post => (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Link to={\`/noticias/\${post.slug}\`}>
                            <Card className="h-full hover:shadow-lg transition-shadow">
                                {post.featured_image && <img src={post.featured_image} alt={post.title} className="w-full h-48 object-cover" />}
                                <CardHeader>
                                    <Badge>{post.category}</Badge>
                                    <CardTitle className="mt-2">{post.title}</CardTitle>
                                    <div className="text-sm text-gray-500">{format(new Date(post.created_at || Date.now()), 'PPP', { locale: es })}</div>
                                </CardHeader>
                                <CardContent>
                                    <p className="line-clamp-3">{post.content}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
`);

write('src/features/events/EventsPage.tsx', `
import React, { useState } from 'react';
import { usePublicEvents } from '@/hooks/useEvents';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin } from 'lucide-react';

export const EventsPage = () => {
    const { data: eventsRes, isLoading } = usePublicEvents();
    const events = eventsRes?.data || [];
    const { user } = useAuthStore();
    const [filter, setFilter] = useState<'proximo' | 'completado'>('proximo');

    const filtered = events.filter(e => e.status === filter);

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Eventos</h1>
            <div className="flex gap-2 mb-6">
                <button onClick={() => setFilter('proximo')} className={\`px-4 py-2 rounded \${filter === 'proximo' ? 'bg-green-800 text-white' : 'bg-gray-200'}\`}>Próximos</button>
                <button onClick={() => setFilter('completado')} className={\`px-4 py-2 rounded \${filter === 'completado' ? 'bg-green-800 text-white' : 'bg-gray-200'}\`}>Completados</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map(event => (
                    <Card key={event.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle>{event.title}</CardTitle>
                                <Badge>{event.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4 text-gray-600">{event.description}</p>
                            <div className="flex items-center gap-2 text-sm mb-2">
                                <MapPin size={16} /> {event.location}
                            </div>
                            <div className="text-sm font-semibold mb-4">
                                {format(new Date(event.event_date + 'T' + event.event_time), 'PPP p', { locale: es })}
                            </div>
                            {user && filter === 'proximo' && (
                                <Button>Registrarse</Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
`);

write('src/features/gallery/GalleryPage.tsx', `
import React from 'react';
import { useGalleries } from '@/hooks/useGalleries';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Link } from 'react-router-dom';

export const GalleryPage = () => {
    const { data: galleriesRes, isLoading } = useGalleries();
    const galleries = galleriesRes?.data || [];

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Galería</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {galleries.map(gallery => (
                    <Link to={\`/galeria/\${gallery.id}\`} key={gallery.id}>
                        <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                            <img src={gallery.cover_image || '/placeholder.jpg'} alt={gallery.title} className="w-full h-48 object-cover" />
                            <CardHeader>
                                <CardTitle>{gallery.title}</CardTitle>
                                <p className="text-sm text-gray-500">{gallery.media_count || 0} archivos</p>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
};
`);

write('src/features/gallery/GalleryDetailPage.tsx', `
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGallery } from '@/hooks/useGalleries';
import { Button } from '@/components/ui/Button';

export const GalleryDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: gallery, isLoading } = useGallery(Number(id));

    if (isLoading) return <div>Cargando...</div>;
    if (!gallery) return <div>No encontrada</div>;

    return (
        <div className="container mx-auto p-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">Volver</Button>
            <h1 className="text-3xl font-bold mb-2">{gallery.title}</h1>
            <p className="text-gray-600 mb-6">{gallery.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gallery.media?.map(m => (
                    <div key={m.id} className="aspect-square bg-gray-100 rounded overflow-hidden">
                        {m.type === 'foto' ? (
                            <img src={m.file_path} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <video src={m.file_path} controls className="w-full h-full object-cover" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
`);

write('src/features/dashboard/UserDashboardPage.tsx', `
import React from 'react';
import { motion } from 'motion/react';
import { useUserDashboard } from '@/hooks/useDashboard';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export const UserDashboardPage = () => {
    const { data: dashboard, isLoading } = useUserDashboard();
    const { user } = useAuthStore();

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div className="container mx-auto p-4 space-y-6">
            <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-bold">
                Bienvenido, {user?.name}
            </motion.h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardHeader><CardTitle>Convocatorias Próximas</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{dashboard?.upcoming_convocatorias.length || 0}</CardContent></Card>
                <Card><CardHeader><CardTitle>Eventos Registrados</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{dashboard?.upcoming_events.length || 0}</CardContent></Card>
                <Card><CardHeader><CardTitle>Total Participaciones</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{dashboard?.total_participations}</CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h2 className="text-xl font-bold mb-4">Próximas Convocatorias</h2>
                    <div className="space-y-4">
                        {dashboard?.upcoming_convocatorias.map((c: any) => (
                            <Card key={c.id}>
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold">{c.title}</h3>
                                        <p className="text-sm text-gray-500">{c.match_date} - {c.match_time}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-4">Próximos Eventos</h2>
                    <div className="space-y-4">
                        {dashboard?.upcoming_events.map((e: any) => (
                            <Card key={e.id}>
                                <CardContent className="p-4">
                                    <h3 className="font-bold">{e.title}</h3>
                                    <p className="text-sm text-gray-500">{e.event_date} - {e.event_time}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
`);

write('src/features/convocatorias/ConvocatoriasPage.tsx', `
import React from 'react';
import { useConvocatorias, useConfirmar, useRechazar } from '@/hooks/useConvocatorias';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export const ConvocatoriasPage = () => {
    const { data: convsRes, isLoading } = useConvocatorias();
    const convocatorias = convsRes?.data || [];
    const { mutate: confirmar } = useConfirmar();
    const { mutate: rechazar } = useRechazar();

    const handleConfirm = (id: number) => {
        confirmar(id, { onSuccess: () => toast.success('Confirmado exitosamente') });
    };
    
    const handleReject = (id: number) => {
        rechazar(id, { onSuccess: () => toast.success('Rechazado exitosamente') });
    };

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Convocatorias</h1>
            <div className="space-y-4">
                {convocatorias.map(c => (
                    <Card key={c.id}>
                        <CardContent className="p-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Link to={\`/convocatorias/\${c.id}\`}><h3 className="text-xl font-bold hover:underline">{c.title}</h3></Link>
                                    <Badge>{c.status}</Badge>
                                </div>
                                <p className="text-gray-600">{c.match_date} a las {c.match_time} | {c.location}</p>
                                {c.rival && <p className="text-sm text-gray-500 mt-1">Rival: {c.rival}</p>}
                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: \`\${Math.min(100, ((c.confirmed_count||0) / (c.max_players||1)) * 100)}%\` }}></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{c.confirmed_count} / {c.max_players} confirmados</p>
                            </div>
                            <div className="flex gap-2">
                                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleConfirm(c.id)}>Confirmar</Button>
                                <Button variant="destructive" onClick={() => handleReject(c.id)}>No puedo</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
`);

write('src/features/convocatorias/ConvocatoriaDetailPage.tsx', `
import React from 'react';
import { useParams } from 'react-router-dom';
import { useConvocatoria, useConfirmar, useRechazar } from '@/hooks/useConvocatorias';
import { motion } from 'motion/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const ConvocatoriaDetailPage = () => {
    const { id } = useParams();
    const { data: c, isLoading } = useConvocatoria(Number(id));
    const { mutate: confirmar } = useConfirmar();
    const { mutate: rechazar } = useRechazar();

    if (isLoading) return <div>Cargando...</div>;
    if (!c) return <div>No encontrada</div>;

    const confirmados = c.confirmaciones?.filter(p => p.status === 'confirmado') || [];
    const rechazados = c.confirmaciones?.filter(p => p.status === 'rechazado') || [];
    const pendientes = c.confirmaciones?.filter(p => p.status === 'pendiente') || [];

    return (
        <div className="container mx-auto p-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{c.title}</h1>
                <p className="text-gray-600">{c.match_date} - {c.match_time} | {c.location}</p>
                <div className="flex gap-2 mt-4">
                    <Button className="bg-green-600" onClick={() => confirmar(c.id, { onSuccess: () => toast.success('Confirmado') })}>Confirmar</Button>
                    <Button variant="destructive" onClick={() => rechazar(c.id, { onSuccess: () => toast.success('Rechazado') })}>Rechazar</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-bold text-green-800 mb-4">✅ Confirmados ({confirmados.length})</h3>
                    <div className="space-y-2">
                        {confirmados.map(p => (
                            <div key={p.id} className="flex items-center gap-2">
                                <Avatar><AvatarImage src={p.user?.avatar || ''}/><AvatarFallback>{p.user?.name?.[0]}</AvatarFallback></Avatar>
                                <div>
                                    <p className="text-sm font-semibold">{p.user?.name}</p>
                                    <p className="text-xs text-gray-500">{p.user?.position} - #{p.user?.jersey_number}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="font-bold text-red-800 mb-4">❌ Rechazados ({rechazados.length})</h3>
                    <div className="space-y-2">
                        {rechazados.map(p => (
                            <div key={p.id} className="flex items-center gap-2">
                                <Avatar><AvatarFallback>{p.user?.name?.[0]}</AvatarFallback></Avatar>
                                <p className="text-sm font-semibold">{p.user?.name}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h3 className="font-bold text-yellow-800 mb-4">⏳ Pendientes ({pendientes.length})</h3>
                    <div className="space-y-2">
                        {pendientes.map(p => (
                            <div key={p.id} className="flex items-center gap-2">
                                <Avatar><AvatarFallback>{p.user?.name?.[0]}</AvatarFallback></Avatar>
                                <p className="text-sm font-semibold">{p.user?.name}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
`);

write('src/features/convocatorias/MisParticipacionesPage.tsx', `
import React from 'react';
import { useMisConvocatorias } from '@/hooks/useConvocatorias';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const MisParticipacionesPage = () => {
    const { data: participacionesRes, isLoading } = useMisConvocatorias();
    const participaciones = participacionesRes?.data || [];

    if (isLoading) return <div>Cargando...</div>;

    if (participaciones.length === 0) return <div className="p-8 text-center text-gray-500">No hay participaciones.</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Mis Participaciones</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {participaciones.map((p: any) => (
                    <Card key={p.id}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold">{p.convocatoria?.title}</h3>
                                <p className="text-sm text-gray-500">{p.convocatoria?.match_date}</p>
                            </div>
                            <Badge variant={p.status === 'confirmado' ? 'default' : p.status === 'rechazado' ? 'destructive' : 'secondary'}>
                                {p.status}
                            </Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
`);

write('src/features/members/MembersPage.tsx', `
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useMembers } from '@/hooks/useMembers';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

export const MembersPage = () => {
    const { data: membersRes, isLoading } = useMembers();
    const members = membersRes?.data || [];
    const [search, setSearch] = useState('');
    const [position, setPosition] = useState('todos');

    const filtered = members.filter(m => 
        (position === 'todos' || m.position === position) &&
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Miembros del Club</h1>
            <div className="flex gap-4 mb-6">
                <Input placeholder="Buscar por nombre..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
                <select className="border rounded p-2" value={position} onChange={e => setPosition(e.target.value)}>
                    <option value="todos">Todas las posiciones</option>
                    <option value="portero">Portero</option>
                    <option value="defensa">Defensa</option>
                    <option value="medio">Medio</option>
                    <option value="delantero">Delantero</option>
                </select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filtered.map(m => (
                    <motion.div key={m.id} initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}}>
                        <Card className="text-center hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <Avatar className="w-20 h-20 mx-auto mb-4"><AvatarImage src={m.avatar || ''}/><AvatarFallback>{m.name[0]}</AvatarFallback></Avatar>
                                <h3 className="font-bold">{m.name}</h3>
                                <Badge className="mt-2">{m.position}</Badge>
                                {m.jersey_number && <p className="text-lg font-bold text-gray-400 mt-2">#{m.jersey_number}</p>}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
`);

write('src/features/admin/AdminDashboardPage.tsx', `
import React from 'react';
import { useAdminDashboard } from '@/hooks/useDashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export const AdminDashboardPage = () => {
    const { data: stats, isLoading } = useAdminDashboard();

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Dashboard Admin</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card><CardHeader><CardTitle>Total Miembros</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats?.total_members}</CardContent></Card>
                <Card><CardHeader><CardTitle>Convocatorias Activas</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats?.active_convocatorias}</CardContent></Card>
                <Card><CardHeader><CardTitle>Total Eventos</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats?.total_events}</CardContent></Card>
                <Card><CardHeader><CardTitle>Total Posts</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats?.total_posts}</CardContent></Card>
            </div>
        </div>
    );
};
`);

write('src/features/admin/AdminPostsPage.tsx', `
import React from 'react';
import { usePublicPosts } from '@/hooks/usePosts';
import { Button } from '@/components/ui/Button';

export const AdminPostsPage = () => {
    const { data: postsRes, isLoading } = usePublicPosts();
    const posts = postsRes?.data || [];

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between mb-6">
                <h1 className="text-3xl font-bold">Gestionar Posts</h1>
                <Button>Crear Post</Button>
            </div>
            <table className="w-full text-left bg-white rounded shadow">
                <thead><tr><th className="p-4 border-b">Título</th><th className="p-4 border-b">Categoría</th><th className="p-4 border-b">Estado</th><th className="p-4 border-b">Acciones</th></tr></thead>
                <tbody>
                    {posts.map(p => (
                        <tr key={p.id}>
                            <td className="p-4 border-b">{p.title}</td>
                            <td className="p-4 border-b">{p.category}</td>
                            <td className="p-4 border-b">{p.status}</td>
                            <td className="p-4 border-b"><Button variant="outline" size="sm">Editar</Button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
`);

write('src/features/admin/AdminEventsPage.tsx', `
import React from 'react';
import { usePublicEvents } from '@/hooks/useEvents';
import { Button } from '@/components/ui/Button';

export const AdminEventsPage = () => {
    const { data: eventsRes, isLoading } = usePublicEvents();
    const events = eventsRes?.data || [];

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between mb-6">
                <h1 className="text-3xl font-bold">Gestionar Eventos</h1>
                <Button>Crear Evento</Button>
            </div>
            <table className="w-full text-left bg-white rounded shadow">
                <thead><tr><th className="p-4 border-b">Título</th><th className="p-4 border-b">Fecha</th><th className="p-4 border-b">Estado</th><th className="p-4 border-b">Acciones</th></tr></thead>
                <tbody>
                    {events.map(e => (
                        <tr key={e.id}>
                            <td className="p-4 border-b">{e.title}</td>
                            <td className="p-4 border-b">{e.event_date} {e.event_time}</td>
                            <td className="p-4 border-b">{e.status}</td>
                            <td className="p-4 border-b"><Button variant="outline" size="sm">Editar</Button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
`);

write('src/features/admin/AdminConvocatoriasPage.tsx', `
import React from 'react';
import { useConvocatorias } from '@/hooks/useConvocatorias';
import { Button } from '@/components/ui/Button';

export const AdminConvocatoriasPage = () => {
    const { data: convsRes, isLoading } = useConvocatorias();
    const convs = convsRes?.data || [];

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between mb-6">
                <h1 className="text-3xl font-bold">Gestionar Convocatorias</h1>
                <Button>Crear Convocatoria</Button>
            </div>
            <table className="w-full text-left bg-white rounded shadow">
                <thead><tr><th className="p-4 border-b">Título</th><th className="p-4 border-b">Fecha</th><th className="p-4 border-b">Confirmados</th><th className="p-4 border-b">Acciones</th></tr></thead>
                <tbody>
                    {convs.map(c => (
                        <tr key={c.id}>
                            <td className="p-4 border-b">{c.title}</td>
                            <td className="p-4 border-b">{c.match_date}</td>
                            <td className="p-4 border-b">{c.confirmed_count} / {c.max_players}</td>
                            <td className="p-4 border-b"><Button variant="outline" size="sm">Editar</Button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
`);

write('src/features/admin/AdminGalleriesPage.tsx', `
import React from 'react';
import { useGalleries } from '@/hooks/useGalleries';
import { Button } from '@/components/ui/Button';

export const AdminGalleriesPage = () => {
    const { data: galleriesRes, isLoading } = useGalleries();
    const galleries = galleriesRes?.data || [];

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between mb-6">
                <h1 className="text-3xl font-bold">Gestionar Galerías</h1>
                <Button>Crear Galería</Button>
            </div>
            <table className="w-full text-left bg-white rounded shadow">
                <thead><tr><th className="p-4 border-b">Título</th><th className="p-4 border-b">Archivos</th><th className="p-4 border-b">Acciones</th></tr></thead>
                <tbody>
                    {galleries.map(g => (
                        <tr key={g.id}>
                            <td className="p-4 border-b">{g.title}</td>
                            <td className="p-4 border-b">{g.media_count}</td>
                            <td className="p-4 border-b"><Button variant="outline" size="sm">Ver/Editar</Button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
`);

write('src/features/admin/AdminMembersPage.tsx', `
import React from 'react';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/Button';

export const AdminMembersPage = () => {
    const { data: membersRes, isLoading } = useMembers();
    const members = membersRes?.data || [];

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Gestionar Miembros</h1>
            <table className="w-full text-left bg-white rounded shadow">
                <thead><tr><th className="p-4 border-b">Nombre</th><th className="p-4 border-b">Email</th><th className="p-4 border-b">Rol</th><th className="p-4 border-b">Acciones</th></tr></thead>
                <tbody>
                    {members.map(m => (
                        <tr key={m.id}>
                            <td className="p-4 border-b">{m.name}</td>
                            <td className="p-4 border-b">{m.email}</td>
                            <td className="p-4 border-b">{m.role}</td>
                            <td className="p-4 border-b"><Button variant="outline" size="sm">Editar</Button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
`);
