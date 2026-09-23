import { Navbar } from './Navbar';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer';

export const PublicLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      {/* Reliable CSS Background (No external images to fail) */}
      <div className="fixed inset-0 z-[-1] bg-[#070b14] overflow-hidden">
        {/* Subtle pitch/tactical grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.03)_2px,transparent_2px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]"></div>
        
        {/* Neon Glows based on logo colors */}
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px]"></div>
        <div className="absolute top-[30%] left-[60%] w-[30%] h-[30%] rounded-full bg-lime-400/10 blur-[100px]"></div>
      </div>
      
      <Navbar />
      <main className={`flex-grow relative z-10 ${isHome ? '' : 'pt-20'}`}>
        <div className="w-full min-h-[calc(100vh-5rem)]">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};
