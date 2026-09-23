import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuthStore } from '@/stores/authStore';
import { LayoutDashboard, Calendar, History, Users, User, Settings, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FootballSpinner } from '@/components/ui/FootballSpinner';

export const DashboardLayout = ({ children, isAdmin = false }: { children?: React.ReactNode, isAdmin?: boolean }) => {
  const location = useLocation();
  const { user, isLoading } = useAuthStore();
  
  const userLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Convocatorias', path: '/convocatorias', icon: Calendar },
    { name: 'Mis Participaciones', path: '/mis-participaciones', icon: History },
    { name: 'Miembros', path: '/miembros', icon: Users },
    { name: 'Mi Perfil', path: '/perfil', icon: User },
  ];

  const adminLinks = [
    { name: 'Centro de Comando', path: '/admin', icon: LayoutDashboard },
    { name: 'Noticias', path: '/admin/noticias', icon: Settings },
    { name: 'Eventos', path: '/admin/eventos', icon: Calendar },
    { name: 'Gestión Convocatorias', path: '/admin/convocatorias', icon: Calendar },
    { name: 'Galerías', path: '/admin/galeria', icon: Image },
    { name: 'Gestión Miembros', path: '/admin/miembros', icon: Users },
    { name: 'Mis Participaciones', path: '/mis-participaciones', icon: History },
    { name: 'Mi Perfil', path: '/perfil', icon: User },
  ];

  const links = user?.role === 'admin' ? adminLinks : userLinks;

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <Navbar />
        <div className="flex-grow flex items-center justify-center pt-16">
          <FootballSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <div className="flex-grow flex pt-[72px] flex-col md:flex-row">
        
        {/* Mobile Navigation Bar (Horizontal Scroll) */}
        <div className="md:hidden bg-slate-950 border-b border-slate-800 sticky top-[72px] z-40 w-full overflow-x-auto no-scrollbar shadow-md">
          <nav className="flex items-center px-2 py-2 space-x-2 w-max">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = link.path === '/admin' || link.path === '/dashboard' 
                ? location.pathname === link.path 
                : (location.pathname === link.path || location.pathname.startsWith(`${link.path}/`));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-300 font-bold text-xs tracking-wide whitespace-nowrap',
                    isActive ? 'text-slate-900 bg-gradient-to-r from-lime-400 to-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-slate-900" : "text-slate-500")} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Sidebar */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 hidden md:flex flex-col relative z-10 shadow-2xl shrink-0">
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-8 p-4 bg-slate-900 rounded-2xl border border-slate-800">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent text-white rounded-full flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(0,210,255,0.3)]">
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-bold text-white leading-tight line-clamp-1">{user.name || 'Usuario'}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mt-1">{user.role || 'miembro'}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = link.path === '/admin' || link.path === '/dashboard' 
                ? location.pathname === link.path 
                : (location.pathname === link.path || location.pathname.startsWith(`${link.path}/`));
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm tracking-wide group relative overflow-hidden',
                      isActive ? 'text-slate-900 bg-gradient-to-r from-lime-400 to-lime-300 shadow-[0_0_15px_rgba(163,230,53,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-slate-900 rounded-l-xl"></div>}
                    <Icon className={cn("h-5 w-5", isActive ? "text-slate-900" : "text-slate-500 group-hover:text-primary transition-colors")} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="mt-auto p-6">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">⚽</div>
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Temporada</div>
                <div className="text-white font-black text-sm">2026 Abierta</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-grow p-4 md:p-8 overflow-x-hidden relative min-w-0">
            {/* Soft grid background pattern */}
            <div className="absolute inset-0 z-0 opacity-5 dark:opacity-10 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            <div className="relative z-10 max-w-7xl mx-auto w-full">
                {children || <Outlet />}
            </div>
        </main>
      </div>
    </div>
  );
};

export const AdminLayout = () => {
  return <DashboardLayout isAdmin={true} />;
};
