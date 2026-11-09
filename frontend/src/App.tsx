import React, { useEffect, useState } from 'react';
import { AppRouter } from './routes/AppRouter';
import { Toaster } from 'sonner';
import api from './lib/axios';
import { useAuthStore } from './stores/authStore';
import { FootballSpinner } from './components/ui/FootballSpinner';
import { MaintenancePage } from './components/MaintenancePage';

const OWNER_PHONE = '955006789';

function App() {
  const { fetchUser } = useAuthStore();
  const [init, setInit] = useState(false);
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    let active = true;

    const refreshMaintenance = async () => {
      try {
        const response = await api.get('/maintenance-status');
        if (!active) return;
        const phone = (useAuthStore.getState().user?.phone || '').replace(/\D/g, '');
        setMaintenance(Boolean(response.data.maintenance) && phone !== OWNER_PHONE);
      } catch {
        // If status cannot be checked, do not lock users out based on a network error.
      }
    };

    const initialize = async () => {
      await fetchUser();
      await refreshMaintenance();
      if (active) setInit(true);
    };

    void initialize();
    const interval = window.setInterval(() => void refreshMaintenance(), 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [fetchUser]);

  if (!init) {
    return <FootballSpinner variant="fullscreen" label="Iniciando Pichangas de Barrio" />;
  }

  // The owner can open the login page during maintenance and authenticate.
  if (maintenance && window.location.pathname !== '/login') {
    return <MaintenancePage />;
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
