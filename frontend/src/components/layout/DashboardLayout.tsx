import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard, Trophy, Users, User, Image, AlertCircle,
  History, Newspaper, CalendarDays, Wallet, ClipboardCheck,
  LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

interface SidebarSection {
  title: string;
  links: { name: string; path: string; icon: any; badge?: string }[];
}

// Admin sidebar sections
const adminSections: SidebarSection[] = [
  {
    title: 'GESTION',
    links: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Convocatorias', path: '/admin/convocatorias', icon: Trophy },
      { name: 'Miembros', path: '/admin/miembros', icon: Users },
      { name: 'Multas', path: '/admin/multas', icon: AlertCircle },
      { name: 'Billeteras', path: '/admin/billeteras', icon: Wallet },
      { name: 'Asistencias', path: '/admin/asistencias', icon: ClipboardCheck },
    ]
  },
  {
    title: 'CONTENIDO',
    links: [
      { name: 'Noticias', path: '/admin/noticias', icon: Newspaper },
      { name: 'Eventos', path: '/admin/eventos', icon: CalendarDays },
      { name: 'Galerias', path: '/admin/galeria', icon: Image },
    ]
  },
  {
    title: 'MI CUENTA',
    links: [
      { name: 'Mis Participaciones', path: '/mis-participaciones', icon: History },
      { name: 'Mi Billetera', path: '/billetera', icon: Wallet },
      { name: 'Mi Perfil', path: '/perfil', icon: User },
    ]
  }
];

// User sidebar sections
const userSections: SidebarSection[] = [
  {
    title: 'PRINCIPAL',
    links: [
      { name: 'Inicio', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Convocatorias', path: '/convocatorias', icon: Trophy },
      { name: 'Mis Participaciones', path: '/mis-participaciones', icon: History },
    ]
  },
  {
    title: 'COMUNIDAD',
    links: [
      { name: 'Noticias', path: '/noticias', icon: Newspaper },
      { name: 'Eventos', path: '/eventos', icon: CalendarDays },
      { name: 'Galeria', path: '/galeria', icon: Image },
      { name: 'Miembros', path: '/miembros', icon: Users },
    ]
  },
  {
    title: 'MI CUENTA',
    links: [
      { name: 'Mi Billetera', path: '/billetera', icon: Wallet },
      { name: 'Mis Multas', path: '/mis-multas', icon: AlertCircle },
      { name: 'Mi Perfil', path: '/perfil', icon: User },
    ]
  }
];

// Mobile bottom tabs
const userMobileTabs = [
  { name: 'Inicio', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Pichangas', path: '/convocatorias', icon: Trophy },
  { name: 'Billetera', path: '/billetera', icon: Wallet },
  { name: 'Perfil', path: '/perfil', icon: User },
];

const adminMobileTabs = [
  { name: 'Panel', path: '/admin', icon: LayoutDashboard },
  { name: 'Pichangas', path: '/admin/convocatorias', icon: Trophy },
  { name: 'Billeteras', path: '/admin/billeteras', icon: Wallet },
  { name: 'Perfil', path: '/perfil', icon: User },
];

export const DashboardLayout = ({ children, isAdmin = false }: { children?: React.ReactNode, isAdmin?: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = user?.role === 'admin' ? adminSections : userSections;
  const mobileTabs = user?.role === 'admin' ? adminMobileTabs : userMobileTabs;

  const isActive = (path: string) => {
    if (path === '/admin' || path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <FootballSpinner />
      </div>
    );
  }

  const { data: walletData } = useQuery<{ wallet: { balance: string } }>({
    queryKey: ['my-wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet');
      return res.data;
    },
    enabled: !!user
  });

  const walletBalance = walletData?.wallet?.balance !== undefined 
    ? parseFloat(walletData.wallet.balance).toFixed(2) 
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* ===== Top Header Bar ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#070b14] border-b border-slate-800 h-16">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left: Logo + App name */}
          <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center space-x-3 group">
            <img src="/logo.jpg" alt="PDB" className="h-9 w-9 rounded-full border-2 border-primary object-cover" />
            <span className="font-black text-base tracking-tighter text-white hidden sm:block uppercase">
              Pichangas de Barrio FC
            </span>
          </Link>

          {/* Right: User info + Logout */}
          <div className="flex items-center space-x-3">
            {/* Wallet balance badge */}
            <Link to="/billetera" className="hidden sm:flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors border border-slate-700/60 shadow-sm" title="Ver mi Billetera">
              <Wallet className="h-4 w-4 text-lime-400" />
              <span className="text-sm font-black text-lime-400">
                {walletBalance !== null ? `S/ ${walletBalance}` : 'S/ ...'}
              </span>
            </Link>

            {/* User avatar + name */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center overflow-hidden shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">{user.name?.charAt(0)?.toUpperCase() || '?'}</span>
                )}
              </div>
              <span className="text-sm font-bold text-white hidden md:block max-w-[120px] truncate">{user.name || 'Usuario'}</span>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2 bg-slate-800 rounded-lg border border-slate-700"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Desktop logout */}
            <button onClick={handleLogout} className="hidden md:flex text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-800">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== Mobile Slide-down Menu ===== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 pt-16">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative bg-slate-950 border-b border-slate-800 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="p-4 space-y-4">
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-2">{section.title}</p>
                  <div className="space-y-1">
                    {section.links.map((link) => {
                      const Icon = link.icon;
                      const active = isActive(link.path);
                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-sm',
                            active ? 'text-slate-900 bg-lime-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          )}
                        >
                          <Icon className={cn("h-4 w-4", active ? "text-slate-900" : "text-slate-500")} />
                          <span>{link.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Logout in mobile menu */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-400/10 font-semibold text-sm w-full"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesion</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Main Content Area ===== */}
      <div className="flex-grow flex pt-16 pb-16 md:pb-0">
        {/* ===== Desktop Sidebar ===== */}
        <aside className="w-60 bg-[#070b14] border-r border-slate-800 hidden md:flex flex-col shrink-0 fixed top-16 bottom-0 left-0 z-30 overflow-y-auto">
          <div className="p-4 flex-grow">
            {/* User card */}
            <div className="flex items-center space-x-3 mb-6 p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name?.charAt(0)?.toUpperCase() || '?'
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-sm leading-tight truncate">{user.name || 'Usuario'}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{user.role === 'admin' ? 'Administrador' : 'Jugador'}</p>
              </div>
            </div>
            
            {/* Nav sections */}
            <nav className="space-y-5">
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-3">{section.title}</p>
                  <div className="space-y-0.5">
                    {section.links.map((link) => {
                      const Icon = link.icon;
                      const active = isActive(link.path);
                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          className={cn(
                            'flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-semibold text-[13px] tracking-wide group relative',
                            active
                              ? 'text-slate-900 bg-gradient-to-r from-lime-400 to-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.2)]'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          )}
                        >
                          <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-slate-900" : "text-slate-500 group-hover:text-primary transition-colors")} />
                          <span className="truncate">{link.name}</span>
                          {link.badge && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{link.badge}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          
          {/* Sidebar footer */}
          <div className="p-4 border-t border-slate-800/50">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all font-semibold text-[13px] w-full"
            >
              <LogOut className="h-[18px] w-[18px]" />
              <span>Cerrar Sesion</span>
            </button>
          </div>
        </aside>

        {/* ===== Page Content ===== */}
        <main className="flex-grow md:ml-60 overflow-x-hidden relative min-w-0">
          {/* Subtle grid background */}
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* ===== Mobile Bottom Tab Bar ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070b14] border-t border-slate-800 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  'flex flex-col items-center justify-center space-y-1 flex-1 py-1 transition-colors',
                  active ? 'text-lime-400' : 'text-slate-500'
                )}
              >
                <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_rgba(163,230,53,0.4)]")} />
                <span className="text-[10px] font-bold tracking-wide">{tab.name}</span>
                {active && <div className="w-1 h-1 rounded-full bg-lime-400"></div>}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export const AdminLayout = () => {
  return <DashboardLayout isAdmin={true} />;
};
