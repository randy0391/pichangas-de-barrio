import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Trophy, Calendar, Users, MapPin, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';

export const HomePage = () => {
  const { isAuthenticated } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['home-data'],
    queryFn: async () => {
      const { data } = await api.get('/home-data');
      return data;
    }
  });

  const stats = data?.stats || {
    active_players: 0,
    games_played: 0,
    total_assists: 0,
    fields: 1
  };

  const nextMatch = data?.next_match;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[#070b14] h-screen pt-20 flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
            {/* Stadium Background */}
            <div 
                className="absolute inset-0 opacity-[0.15] mix-blend-luminosity"
                style={{ 
                    backgroundImage: "url('https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2070&auto=format&fit=crop')", 
                    backgroundPosition: 'center', 
                    backgroundSize: 'cover' 
                }}
            ></div>
            {/* Gradient Overlays for smooth blending */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#070b14]/80 via-transparent to-[#070b14]"></div>
            
            {/* Neon Glows */}
            <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-[128px] opacity-30"></div>
            <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-accent rounded-full mix-blend-screen filter blur-[128px] opacity-30"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-left"
            >
              <div className="inline-block px-4 py-1.5 rounded-full border border-lime-400/30 bg-lime-400/10 text-lime-400 font-semibold text-xs mb-4 uppercase tracking-widest backdrop-blur-sm">
                Temporada 2026 Abierta
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight uppercase tracking-tighter">
                Jugamos con el<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-lime-400">
                  Corazón en la Mano
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl font-medium leading-relaxed">
                Únete a Pichangas de Barrio FC. Inscríbete en los partidos semanales, revisa las alineaciones y sé el goleador que necesitamos.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <Link to="/convocatorias">
                    <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent text-white border-0 hover:scale-105 transition-transform text-base px-6 py-5 rounded-tl-xl rounded-br-xl shadow-[0_0_20px_rgba(0,210,255,0.4)] uppercase font-black tracking-wider">
                      Ver Convocatorias
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login">
                    <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent text-white border-0 hover:scale-105 transition-transform text-base px-6 py-5 rounded-tl-xl rounded-br-xl shadow-[0_0_20px_rgba(0,210,255,0.4)] uppercase font-black tracking-wider">
                      Iniciar Sesión
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Link to="/eventos">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-slate-700 text-white bg-slate-900/50 hover:bg-slate-800 transition-all text-lg px-8 py-7 rounded-tl-2xl rounded-br-2xl uppercase font-bold tracking-wider backdrop-blur-md">
                    Ver Calendario
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block h-[400px]"
            >
               {/* Abstract decorative cards */}
               <div className="absolute top-10 right-10 w-64 h-80 bg-gradient-to-br from-primary/80 to-accent/80 rounded-3xl transform rotate-12 backdrop-blur-xl border border-white/20 shadow-2xl z-0"></div>
               
               {nextMatch ? (
                   <div className="absolute top-20 right-20 w-72 h-96 bg-slate-900 rounded-3xl transform rotate-6 border border-slate-700 shadow-2xl z-10 flex flex-col p-6 overflow-hidden">
                      <div className="flex justify-between items-center mb-6">
                          <div className="text-lime-400 font-bold text-sm uppercase">Próximo Partido</div>
                          <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></div>
                      </div>
                      <h3 className="text-white font-black text-2xl mb-1 truncate" title={nextMatch.title}>{nextMatch.title}</h3>
                      <p className="text-slate-400 text-sm mb-6">{nextMatch.match_date} - {nextMatch.match_time}hrs</p>
                      
                      <div className="bg-slate-800 rounded-xl p-4 mb-4 flex justify-between items-center border border-slate-700">
                          <div className="text-center w-full">
                              <div className="font-bold text-white text-lg">PDB</div>
                              <div className="text-xs text-primary">Local</div>
                          </div>
                          {nextMatch.rival && (
                              <>
                                  <div className="text-2xl font-black text-slate-500 mx-2">VS</div>
                                  <div className="text-center w-full">
                                      <div className="font-bold text-white text-lg truncate" title={nextMatch.rival}>{nextMatch.rival}</div>
                                      <div className="text-xs text-accent">Visita</div>
                                  </div>
                              </>
                          )}
                      </div>

                      <div className="mt-auto">
                        <div className="flex justify-between text-xs text-slate-400 mb-2 font-bold">
                            <span>Confirmados</span>
                            <span>{nextMatch.confirmed_count}/{nextMatch.max_players}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-primary to-lime-400 h-2 rounded-full transition-all duration-1000" 
                                style={{ width: `${Math.min(100, Math.round((nextMatch.confirmed_count / nextMatch.max_players) * 100))}%` }}
                            ></div>
                        </div>
                      </div>
                   </div>
               ) : (
                   <div className="absolute top-20 right-20 w-72 h-96 bg-slate-900 rounded-3xl transform rotate-6 border border-slate-700 shadow-2xl z-10 flex flex-col p-6 overflow-hidden justify-center items-center text-center">
                        <div className="text-6xl mb-4">⚽</div>
                        <h3 className="text-white font-black text-2xl mb-2">No hay partidos</h3>
                        <p className="text-slate-400 text-sm">Pronto abriremos una nueva convocatoria. ¡Mantente atento!</p>
                   </div>
               )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section with Diagonal Cut */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900 relative z-20 [clip-path:polygon(0_5%,100%_0,100%_100%,0_100%)] md:[clip-path:polygon(0_10%,100%_0,100%_100%,0_100%)] mt-[-4rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Los Números <span className="text-primary">No Mienten</span></h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto mt-4 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Users, label: 'Jugadores Activos', value: `${stats.active_players}+` },
              { icon: Calendar, label: 'Partidos Jugados', value: `${stats.games_played}` },
              { icon: Trophy, label: 'Asistencias', value: `${stats.total_assists}` },
            ].map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8 rounded-[2rem] bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-xl hover:border-primary/50 dark:hover:border-primary/50 transition-colors group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-100 dark:from-slate-700 to-transparent rounded-bl-full -z-10 group-hover:from-primary/10 transition-colors"></div>
                <stat.icon className="h-12 w-12 mx-auto text-primary mb-6 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-4xl font-black text-slate-900 dark:text-white mb-2">{stat.value}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">¿Por qué unirte a <span className="text-accent">Nosotros?</span></h2>
            <div className="w-24 h-1 bg-gradient-to-r from-accent to-primary mx-auto mt-4 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">⚽</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 uppercase">Partidos Frecuentes</h3>
              <p className="text-slate-500 dark:text-slate-400">Organizamos pichangas todas las semanas. Siempre tendrás un lugar donde demostrar tu talento.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 uppercase">Gran Comunidad</h3>
              <p className="text-slate-500 dark:text-slate-400">Más que un equipo, somos una familia. Conoce gente nueva, haz amigos y disfruta del tercer tiempo.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-lime-400/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 uppercase">Torneos Internos</h3>
              <p className="text-slate-500 dark:text-slate-400">Competimos sanamente. Sorteamos equipos, sumamos puntos y premiamos al goleador de la temporada.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section (Only for guests) */}
      {!isAuthenticated && (
        <section className="relative py-32 bg-slate-900 overflow-hidden">
          <div className="absolute inset-0 z-0">
              {/* Background image of players celebrating */}
              <div 
                  className="absolute inset-0 opacity-[0.25] mix-blend-luminosity transform scale-105 hover:scale-100 transition-transform duration-1000"
                  style={{ 
                      backgroundImage: "url('https://images.unsplash.com/photo-1518605363189-985c4a9740a6?q=80&w=2074&auto=format&fit=crop')", 
                      backgroundPosition: 'center', 
                      backgroundSize: 'cover' 
                  }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/80 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 mix-blend-overlay"></div>
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase tracking-tighter mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  ¿Listo para sudar la camiseta?
                </h2>
                <p className="text-xl md:text-2xl text-slate-300 mb-10 font-medium max-w-2xl mx-auto leading-relaxed">
                  Regístrate ahora, completa tu perfil y apúntate a nuestra próxima convocatoria. <span className="text-primary font-bold">¡Te estamos esperando en la cancha!</span>
                </p>
                <Link to="/registro">
                    <Button className="h-16 px-12 bg-gradient-to-r from-primary to-lime-500 text-slate-950 border-0 hover:from-lime-400 hover:to-primary font-black uppercase tracking-widest rounded-full text-xl transition-all hover:scale-110 shadow-[0_0_40px_rgba(0,210,255,0.4)]">
                        Crear mi cuenta
                    </Button>
                </Link>
              </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};
