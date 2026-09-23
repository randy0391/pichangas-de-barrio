import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12 mt-auto border-t border-slate-800 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-full border border-primary shadow-[0_0_8px_rgba(0,210,255,0.4)]" />
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary via-accent to-lime-500 bg-clip-text text-transparent">PDB FC</span>
            </div>
            <p className="text-slate-400 text-sm">
              El club de fútbol más grande del barrio. Pasión, garra y corazón en cada partido. Demuestra tu talento en la cancha.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-lime-400">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/noticias" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-accent">●</span> Noticias</Link></li>
              <li><Link to="/eventos" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-accent">●</span> Eventos</Link></li>
              <li><Link to="/galeria" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-accent">●</span> Galería</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Contacto</h3>
            <p className="text-sm text-slate-300 mb-2">
              Únete a nosotros en nuestros próximos encuentros. Inscríbete en las convocatorias.
            </p>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-10 pt-8 text-center text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center">
          <p>© 2026 Pichangas de Barrio FC. Todos los derechos reservados.</p>
          <div className="mt-4 md:mt-0 flex gap-4 text-2xl">
            ⚽ 🏆 🥅
          </div>
        </div>
      </div>
    </footer>
  );
}
