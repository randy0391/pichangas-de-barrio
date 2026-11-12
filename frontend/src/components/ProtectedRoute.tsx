import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
  allowInactive = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowInactive?: boolean;
}) => {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuthStore();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!requireAdmin && !allowInactive && user?.role === 'member' && user.status === 'inactive') {
    return <Navigate to="/reactivacion" replace />;
  }

  if (allowInactive && (user?.role !== 'member' || user.status !== 'inactive')) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};
