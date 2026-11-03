import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard, Trophy, Users, User, Image, AlertCircle,
  History, Newspaper, CalendarDays, Wallet, ClipboardCheck,
  LogOut, Menu, X, ChevronRight, PanelLeftOpen, PanelLeftClose, ShieldCheck, Sparkles, Award
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
  const [sidebarExpandedAll, setSidebarExpandedAll] = useState(false);
  const [hoveredSidebarLink, setHoveredSidebarLink] = useState<{ name: string; top: number } | null>(null);

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

  const { data: walletData } = useQuery<{ wallet: { balance: string } }>({
    queryKey: ['my-wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet');
      return res.data;
    },
    enabled: !!user
  });

  const { data: pendingWallets } = useQuery<{ data: any[] }>({
    queryKey: ['admin-wallets-pending'],
    queryFn: async () => {
      const res = await api.get('/admin/wallets/pending');
      return (res.data as any).data ? res.data : { data: res.data };
    },
    enabled: user?.role === 'admin'
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <FootballSpinner />
      </div>
    );
  }

  const pendingCount = pendingWallets?.data?.length || 0;

  const sections = (user?.role === 'admin' ? adminSections : userSections).map(section => ({
    ...section,
    links: section.links.map(link => {
      if (link.name === 'Billeteras' && user?.role === 'admin' && pendingCount > 0) {
        return { ...link, badge: String(pendingCount) };
      }
      return link;
    })
  }));

  const walletBalance = walletData?.wallet?.balance !== undefined 
    ? parseFloat(walletData.wallet.balance).toFixed(2) 
    : null;

  // Formatted display name (first name + first last name or first 2 words)
  const getDisplayName = () => {
    if (user.nombres) {
      const first = user.nombres.trim().split(' ')[0];
      const last = user.apellido_paterno ? user.apellido_paterno.trim().split(' ')[0] : '';
      return `${first} ${last}`.trim();
    }
    if (user.name) {
      const words = user.name.trim().split(/\s+/);
      return words.slice(0, 2).join(' ');
    }
    return 'Usuario';
  };

  const displayName = getDisplayName();

  return (
    <div className="pdb-shell min-h-screen flex flex-col bg-slate-950 font-sans antialiased selection:bg-lime-400 selection:text-slate-950">
      {/* ===== Top Header Bar ===== */}
      <header className="pdb-header fixed top-0 left-0 right-0 z-50 bg-[#080d19]/95 backdrop-blur-xl border-b border-cyan-400/15 shadow-lg shadow-black/20 h-16">
        <div className="flex items-center justify-between h-full px-3.5 sm:px-6">
          {/* Left: Brand Logo + Club Name */}
          <Link 
            to={user.role === 'admin' ? '/admin' : '/dashboard'} 
            className="flex items-center space-x-3 group"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-lime-400/20 blur-sm opacity-70 group-hover:opacity-100 group-hover:bg-lime-400/40 transition-all"></div>
              <img 
                src="/logo.jpg" 
                alt="Pichangas de Barrio FC" 
                className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-lime-400/80 object-cover shadow-sm" 
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-base tracking-tight text-white uppercase group-hover:text-lime-300 transition-colors">
                  Pichangas de Barrio
                </span>
                <span className="bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(163,230,53,0.3)]">
                  FC
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                {user.role === 'admin' ? 'Panel de Administración' : 'Comunidad de Jugadores'}
              </span>
            </div>
          </Link>

          {/* Right: Wallet Chip + User Profile Capsule + Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Wallet Balance Capsule */}
            <Link 
              to="/billetera" 
              className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-800 px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all border border-lime-400/30 hover:border-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.08)] group" 
              title="Mi Billetera Digital"
            >
              <div className="p-1 rounded-full bg-lime-400/15 group-hover:bg-lime-400 text-lime-400 group-hover:text-slate-950 transition-all">
                <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold hidden sm:block leading-none">
                  Saldo
                </span>
                <span className="text-xs sm:text-sm font-black text-white group-hover:text-lime-300 font-mono tracking-tight leading-tight">
                  {walletBalance !== null ? `S/ ${walletBalance}` : 'S/ ...'}
                </span>
              </div>
            </Link>

            {/* Top Bar User Pill (Links to profile) */}
            <Link 
              to="/perfil"
              className="hidden md:flex items-center space-x-2.5 p-1 sm:pr-3 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all group"
              title="Ver mi perfil"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400/20 to-emerald-500/20 border border-lime-400/40 flex items-center justify-center overflow-hidden shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lime-400 font-black text-xs">{displayName.charAt(0)?.toUpperCase()}</span>
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#060913] shadow-[0_0_4px_#10b981]"></span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white group-hover:text-lime-300 transition-colors max-w-[130px] truncate leading-tight">
                  {displayName}
                </span>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wider leading-none",
                  user.role === 'admin' ? "text-amber-400" : "text-lime-400"
                )}>
                  {user.role === 'admin' ? '👑 Admin' : '⚽ Jugador'}
                </span>
              </div>
            </Link>

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2 bg-slate-900/90 hover:bg-slate-800 rounded-xl border border-slate-700/80 transition-colors"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-lime-400" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Desktop logout */}
            <button 
              onClick={handleLogout} 
              className="hidden md:flex text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all p-2 rounded-xl"
              title="Cerrar Sesión"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== Mobile Slide-down Menu ===== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 pt-16">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="absolute left-0 top-16 bottom-0 w-[min(88vw,360px)] bg-[#080d19] border-r border-cyan-400/20 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shadow-2xl">
            <div className="p-4 space-y-4">
              {/* Mobile User Profile Card */}
              <Link
                to="/perfil"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 p-3 bg-gradient-to-r from-slate-900/90 to-slate-900/50 rounded-2xl border border-slate-800 hover:border-lime-400/40 transition-all"
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 border-2 border-lime-400/40 flex items-center justify-center overflow-hidden shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lime-400 font-black text-sm">{displayName.charAt(0)?.toUpperCase()}</span>
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#060913]"></span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-white text-sm truncate">{displayName}</p>
                  {user.nickname && (
                    <p className="text-xs font-bold text-lime-400 truncate">"{user.nickname}"</p>
                  )}
                  <span className={cn(
                    "inline-flex items-center text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5",
                    user.role === 'admin' 
                      ? "bg-amber-400/10 text-amber-300 border border-amber-400/30" 
                      : "bg-lime-400/10 text-lime-400 border border-lime-400/30"
                  )}>
                    {user.role === 'admin' ? '👑 Administrador' : '⚽ Jugador Oficial'}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500" />
              </Link>

              {/* Sections */}
              {sections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <div className="flex items-center space-x-2 px-2 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400/70 shadow-[0_0_6px_#a3e635]"></span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{section.title}</p>
                    <div className="flex-1 h-[1px] bg-slate-800/80"></div>
                  </div>
                  <div className="space-y-1 pt-1">
                    {section.links.map((link) => {
                      const Icon = link.icon;
                      const active = isActive(link.path);
                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'relative flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all font-bold text-sm tracking-wide',
                            active 
                              ? 'bg-slate-800/90 text-white border border-lime-400/40 shadow-[0_0_15px_rgba(163,230,53,0.12)]' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-900/70'
                          )}
                        >
                          {active && (
                            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-lime-400 shadow-[0_0_8px_#a3e635]" />
                          )}
                          <Icon className={cn(
                            "h-4.5 w-4.5 shrink-0", 
                            active ? "text-lime-400 drop-shadow-[0_0_6px_rgba(163,230,53,0.5)]" : "text-slate-400"
                          )} />
                          <span className="flex-1 truncate">{link.name}</span>
                          {link.badge && (
                            <span className="bg-red-500 text-white text-[10px] font-black rounded-full px-2 py-0.5 leading-none shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse">
                              {link.badge}
                            </span>
                          )}
                          {active && !link.badge && (
                            <ChevronRight className="h-4 w-4 text-lime-400/70" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Logout in mobile menu */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 font-bold text-sm w-full transition-all"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Main Content Area ===== */}
      <div className="flex-grow flex pt-16 pb-16 md:pb-0">
        {/* ===== Desktop Sidebar ===== */}
        <aside
          onMouseLeave={() => setSidebarExpandedAll(false)}
          className={cn("pdb-sidebar bg-[#080d19] border-r border-cyan-400/15 hidden md:flex flex-col shrink-0 fixed top-16 bottom-0 left-0 z-30 overflow-y-auto overflow-x-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden transition-all duration-300", sidebarExpandedAll ? "w-64" : "w-[84px]")}
        >
          <div className={cn("py-3 flex-grow", sidebarExpandedAll ? "px-3.5" : "px-2")}>
            <div className={cn("flex mb-4", sidebarExpandedAll ? "justify-end" : "justify-center")}>
              <button
                type="button"
                onClick={() => setSidebarExpandedAll(true)}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-300/50 transition-all"
                aria-label="Expandir todo el menú"
                title="Expandir todo el menú"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
            </div>

            {/* VIP Club Member Card at Top of Sidebar */}
            <Link 
              to="/perfil"
              className={cn("flex items-center p-3 bg-gradient-to-br from-[#111c2e] to-[#0b1220] border border-white/10 hover:border-cyan-400/40 rounded-2xl mb-4 shadow-lg relative group transition-all duration-300", sidebarExpandedAll ? "space-x-3" : "justify-center")}
              title="Ver mi perfil"
            >
              {/* Subtle neon glow on card corner */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-lime-400/5 rounded-full blur-xl group-hover:bg-lime-400/10 transition-all pointer-events-none"></div>

              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-xl bg-slate-800 border-2 border-lime-400/40 group-hover:border-lime-400 group-hover:scale-105 transition-all shadow-md flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lime-400 font-black text-sm">{displayName.charAt(0)?.toUpperCase()}</span>
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#060913] shadow-[0_0_6px_#10b981]"></span>
              </div>
              
              {sidebarExpandedAll && <div className="min-w-0 flex-1">
                <p className="font-black text-white text-sm leading-tight group-hover:text-cyan-300 transition-colors truncate">
                  {displayName}
                </p>
                {user.nickname ? (
                  <p className="text-[11px] font-bold text-lime-400 truncate">
                    "{user.nickname}"
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {user.email}
                  </p>
                )}
                <div className="mt-1">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    user.role === 'admin' 
                      ? "bg-amber-400/10 text-amber-300 border-amber-400/30" 
                      : "bg-lime-400/10 text-lime-400 border-lime-400/30"
                  )}>
                    {user.role === 'admin' ? (
                      <>
                        <ShieldCheck className="w-2.5 h-2.5" /> Admin
                      </>
                    ) : (
                      <>
                        <Award className="w-2.5 h-2.5" /> Jugador
                      </>
                    )}
                  </span>
                </div>
              </div>}

              {sidebarExpandedAll && <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />}
            </Link>
            
            {/* Nav sections */}
            <nav className="space-y-4">
              {sections.map((section) => (
                <div key={section.title} className="space-y-1">
                  {/* Modern Section Header */}
                  <div className={cn("flex items-center space-x-2 pt-2 pb-1", sidebarExpandedAll ? "px-3" : "justify-center")}>
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400/70 shadow-[0_0_6px_#a3e635]"></span>
                    {sidebarExpandedAll && <><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{section.title}</p><div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent"></div></>}
                  </div>

                  {/* Links */}
                  <div className="space-y-0.5 pt-0.5">
                    {section.links.map((link) => {
                      const Icon = link.icon;
                      const active = isActive(link.path);
                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setSidebarExpandedAll(false)}
                          title={undefined}
                          onMouseEnter={(event) => {
                            if (!sidebarExpandedAll) {
                              const rect = event.currentTarget.getBoundingClientRect();
                              setHoveredSidebarLink({ name: link.name, top: rect.top + rect.height / 2 });
                            }
                          }}
                          onMouseLeave={() => setHoveredSidebarLink(null)}
                          className={cn(
                            'relative flex items-center rounded-xl font-bold text-[13px] tracking-wide transition-all duration-200 group border',
                            sidebarExpandedAll ? 'flex-row space-x-3 px-3.5 py-2.5' : 'justify-center w-12 mx-auto py-3',
                            active
                              ? 'bg-gradient-to-r from-fuchsia-500/15 to-cyan-400/10 text-white border-fuchsia-400/40 shadow-[inset_3px_0_0_#f00091,0_8px_22px_rgba(0,0,0,.18)]'
                              : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5 hover:border-white/10'
                          )}
                        >
                          {/* Active Neon Bar Indicator */}
                          {active && (
                            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-lime-400 shadow-[0_0_10px_#a3e635]" />
                          )}

                          {/* Icon */}
                          <Icon className={cn(
                            "h-[18px] w-[18px] shrink-0 transition-all", 
                            active 
                              ? "text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.6)]" 
                              : "text-slate-400 group-hover:text-lime-400 group-hover:scale-110"
                          )} />

                          {/* Text */}
                          <span className={cn("min-w-0", sidebarExpandedAll ? "flex-1 truncate" : "hidden")}>{link.name}</span>

                          {/* Badge or chevron */}
                          {link.badge ? (
                            <span className="bg-red-500 text-white text-[10px] font-black rounded-full px-2 py-0.5 leading-none shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse">
                              {link.badge}
                            </span>
                          ) : active && sidebarExpandedAll ? (
                            <ChevronRight className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          
          {/* Sidebar footer */}
          <div className={cn("border-t border-white/10 bg-black/20", sidebarExpandedAll ? "p-3.5" : "p-2")}>
            <button
              onClick={handleLogout}
              className={cn("flex items-center rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all font-bold text-xs uppercase tracking-wider w-full group", sidebarExpandedAll ? "space-x-3 px-3.5 py-2.5" : "justify-center p-3")} title="Cerrar Sesión"
            >
              <LogOut className="h-[18px] w-[18px] text-slate-400 group-hover:text-red-400 group-hover:-translate-x-0.5 transition-all" />
              {sidebarExpandedAll && <span>Cerrar Sesión</span>}
            </button>
            <div className={cn("px-3 pt-3 items-center justify-between text-[10px] text-slate-500 font-mono", sidebarExpandedAll ? "flex" : "hidden")}>
              <span>PDB FC • 2026</span>
              <span className="text-lime-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> CLUB
              </span>
            </div>
          </div>
        </aside>

        {!sidebarExpandedAll && hoveredSidebarLink && (
          <div
            className="hidden md:block fixed left-[94px] z-[60] -translate-y-1/2 pointer-events-none"
            style={{ top: hoveredSidebarLink.top }}
          >
            <div className="relative rounded-lg border border-cyan-300/30 bg-[#101b2d] px-3.5 py-2 text-xs font-extrabold tracking-wide text-white shadow-[0_8px_28px_rgba(0,0,0,.55)] whitespace-nowrap">
              <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-l border-b border-cyan-300/30 bg-[#101b2d]" />
              {hoveredSidebarLink.name}
            </div>
          </div>
        )}

        {/* ===== Page Content ===== */}
        <main className={cn("pdb-main flex-grow overflow-x-hidden relative min-w-0 transition-all duration-300", sidebarExpandedAll ? "md:ml-64" : "md:ml-[84px]")}>
          {/* Subtle grid background */}
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="pdb-content relative z-10 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* ===== Mobile Bottom Tab Bar ===== */}
      <nav className="pdb-mobile-nav md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#080d19]/95 backdrop-blur-2xl border-t border-fuchsia-500/25 shadow-[0_-12px_35px_rgba(0,0,0,.35)] safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            const isWalletTab = tab.name === 'Billeteras' || tab.name === 'Billetera';
            const showBadge = isWalletTab && user.role === 'admin' && pendingCount > 0;

            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all relative',
                  active ? 'text-white' : 'text-slate-500 hover:text-white'
                )}
              >
                {active && (
                  <span className="absolute top-0 w-10 h-[3px] bg-gradient-to-r from-fuchsia-500 to-cyan-300 rounded-full shadow-[0_0_10px_rgba(0,201,232,.55)]" />
                )}
                <div className="relative">
                  <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,201,232,.5)]")} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center border border-slate-950 animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <span className={cn("text-[10px] tracking-wide", active ? "font-black text-white" : "font-semibold")}>
                  {tab.name}
                </span>
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
