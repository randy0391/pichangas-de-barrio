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

    const getMaintenanceStatus = async (): Promise<boolean | null> => {
      try {
        const response = await api.get('/maintenance-status');
        return Boolean(response.data.maintenance);
      } catch {
        // Keep the last known maintenance state when the status cannot be checked.
        return null;
      }
    };

    const applyMaintenanceStatus = (isMaintenanceActive: boolean) => {
      if (!active) return;
      const phone = (useAuthStore.getState().user?.phone || '').replace(/\D/g, '');
      setMaintenance(isMaintenanceActive && phone !== OWNER_PHONE);
    };

    const refreshMaintenance = async () => {
      const isMaintenanceActive = await getMaintenanceStatus();
      if (isMaintenanceActive !== null) {
        applyMaintenanceStatus(isMaintenanceActive);
      }
    };

    const initialize = async () => {
      // Session validation and public maintenance status are independent requests.
      // Run them together so a slow response from either service does not delay the other.
      const [, isMaintenanceActive] = await Promise.all([
        fetchUser(),
        getMaintenanceStatus(),
      ]);

      if (isMaintenanceActive !== null) {
        applyMaintenanceStatus(isMaintenanceActive);
      }
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
