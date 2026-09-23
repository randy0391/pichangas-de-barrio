import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Menu, X, User as UserIcon, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { isAuthenticated, isAdmin, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Noticias', path: '/noticias' },
    { name: 'Calendario', path: '/eventos' },
    { name: 'Galería', path: '/galeria' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#070b14]/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-white/5 py-3' : 'bg-[#070b14] shadow-md border-b border-white/5 py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
                <div className="absolute inset-0 bg-primary rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity"></div>
                <img src="/logo.jpg" alt="Pichangas de Barrio FC" className="relative h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-primary object-cover" />
            </div>
            <span className="font-black text-lg md:text-xl tracking-tighter hidden lg:block text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-lime-400 transition-all uppercase">
                Pichangas de Barrio FC
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className="relative px-4 py-2 group">
                <span className={`relative z-10 font-bold uppercase tracking-wider text-sm transition-colors ${isActive(link.path) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                    {link.name}
                </span>
                {isActive(link.path) && (
                    <motion.div layoutId="navbar-indicator" className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-lime-400" />
                )}
                <div className="absolute inset-0 bg-white/5 rounded-lg scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all"></div>
              </Link>
            ))}
            
            <div className="ml-4 pl-4 border-l border-white/10 flex items-center space-x-4">
                {isAuthenticated ? (
                <>
                    {isAdmin() && (
                    <Link to="/admin">
                        <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-white uppercase tracking-wider font-bold text-xs">
                            Admin
                        </Button>
                    </Link>
                    )}
                    <Link to="/perfil">
                        <Button className="bg-white/10 hover:bg-white/20 text-white border-0 uppercase tracking-wider font-bold text-xs backdrop-blur-md">
                            <UserIcon className="w-4 h-4 mr-2" /> Mi Perfil
                        </Button>
                    </Link>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-accent transition-colors p-2 rounded-full hover:bg-accent/10">
                        <LogOut className="w-5 h-5" />
                    </button>
                </>
                ) : (
                <>
                    <Link to="/login" className="text-slate-300 hover:text-white uppercase tracking-wider font-bold text-xs px-4 transition-colors">
                        Ingresar
                    </Link>
                    <Link to="/registro">
                        <Button className="bg-gradient-to-r from-primary to-accent text-white border-0 hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,210,255,0.3)] uppercase tracking-wider font-bold text-xs rounded-full px-6">
                            Unirse
                        </Button>
                    </Link>
                </>
                )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none p-2 bg-white/5 rounded-lg border border-white/10">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 w-full bg-[#070b14]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block text-xl font-black uppercase tracking-wider ${isActive(link.path) ? 'text-transparent bg-clip-text bg-gradient-to-r from-primary to-lime-400' : 'text-slate-400'}`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="pt-6 mt-6 border-t border-white/10 flex flex-col space-y-4">
                  {isAuthenticated ? (
                    <>
                      <Link to="/perfil" onClick={() => setIsOpen(false)}>
                          <Button className="w-full bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-slate-900 uppercase font-black tracking-wider py-6">
                              Mi Perfil
                          </Button>
                      </Link>
                      {isAdmin() && (
                          <Link to="/admin" onClick={() => setIsOpen(false)}>
                              <Button className="w-full bg-accent/20 text-accent border border-accent/50 hover:bg-accent hover:text-white uppercase font-black tracking-wider py-6">
                                  Panel de Admin
                              </Button>
                          </Link>
                      )}
                      <Button variant="outline" onClick={handleLogout} className="w-full border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white uppercase font-bold tracking-wider py-6">
                          Cerrar Sesión
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full border-slate-700 text-white bg-slate-800 hover:bg-slate-700 uppercase font-bold tracking-wider py-6">
                              Ingresar
                          </Button>
                      </Link>
                      <Link to="/registro" onClick={() => setIsOpen(false)}>
                          <Button className="w-full bg-gradient-to-r from-primary to-accent text-white border-0 uppercase font-black tracking-wider py-6 shadow-lg shadow-primary/20">
                              Unirse al Equipo
                          </Button>
                      </Link>
                    </>
                  )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
