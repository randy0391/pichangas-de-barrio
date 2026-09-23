import React, { useEffect, useState } from 'react';
import { AppRouter } from './routes/AppRouter';
import { Toaster } from 'sonner';
import { useAuthStore } from './stores/authStore';
import { FootballSpinner } from './components/ui/FootballSpinner';

function App() {
  const { fetchUser } = useAuthStore();
  const [init, setInit] = useState(false);

  useEffect(() => {
    fetchUser().finally(() => setInit(true));
  }, [fetchUser]);

  if (!init) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <FootballSpinner />
      </div>
    );
  }

  return (
    <>
      <AppRouter />
      <Toaster 
        position="bottom-right" 
        richColors 
        expand={true} 
        toastOptions={{
          className: 'text-base font-bold shadow-2xl rounded-2xl p-4 border border-white/10 backdrop-blur-xl',
          style: { minWidth: '350px' }
        }} 
      />
    </>
  );
}

export default App;
