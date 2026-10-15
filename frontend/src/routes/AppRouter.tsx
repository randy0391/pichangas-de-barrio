import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout, AdminLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { useAuthStore } from '@/stores/authStore';

// Auth Pages (standalone, no layout wrapper)
const LoginPage = React.lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('@/features/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const OldPlayerRegisterPage = React.lazy(() => import('@/features/auth/OldPlayerRegisterPage').then(m => ({ default: m.OldPlayerRegisterPage })));

// Dashboard Pages
const UserDashboardPage = React.lazy(() => import('@/features/dashboard/UserDashboardPage').then(m => ({ default: m.UserDashboardPage })));
const ConvocatoriasPage = React.lazy(() => import('@/features/convocatorias/ConvocatoriasPage').then(m => ({ default: m.ConvocatoriasPage })));
const ConvocatoriaDetailPage = React.lazy(() => import('@/features/convocatorias/ConvocatoriaDetailPage').then(m => ({ default: m.ConvocatoriaDetailPage })));
const MisParticipacionesPage = React.lazy(() => import('@/features/convocatorias/MisParticipacionesPage').then(m => ({ default: m.MisParticipacionesPage })));
const ProfilePage = React.lazy(() => import('@/features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const MyFinesPage = React.lazy(() => import('@/features/profile/MyFinesPage').then(m => ({ default: m.MyFinesPage })));
const MembersPage = React.lazy(() => import('@/features/members/MembersPage').then(m => ({ default: m.MembersPage })));
const NewsPage = React.lazy(() => import('@/features/news/NewsPage').then(m => ({ default: m.NewsPage })));
const NewsDetailPage = React.lazy(() => import('@/features/news/NewsDetailPage').then(m => ({ default: m.NewsDetailPage })));
const EventsPage = React.lazy(() => import('@/features/events/EventsPage').then(m => ({ default: m.EventsPage })));
const GalleryPage = React.lazy(() => import('@/features/gallery/GalleryPage').then(m => ({ default: m.GalleryPage })));
const GalleryDetailPage = React.lazy(() => import('@/features/gallery/GalleryDetailPage').then(m => ({ default: m.GalleryDetailPage })));
const WalletPage = React.lazy(() => import('@/features/wallet/WalletPage').then(m => ({ default: m.WalletPage })));

// Admin Pages
const AdminDashboardPage = React.lazy(() => import('@/features/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminPostsPage = React.lazy(() => import('@/features/admin/AdminPostsPage').then(m => ({ default: m.AdminPostsPage })));
const AdminEventsPage = React.lazy(() => import('@/features/admin/AdminEventsPage').then(m => ({ default: m.AdminEventsPage })));
const AdminConvocatoriasPage = React.lazy(() => import('@/features/admin/AdminConvocatoriasPage').then(m => ({ default: m.AdminConvocatoriasPage })));
const AdminGalleriesPage = React.lazy(() => import('@/features/admin/AdminGalleriesPage').then(m => ({ default: m.AdminGalleriesPage })));
const AdminGalleryDetailPage = React.lazy(() => import('@/features/admin/AdminGalleryDetailPage').then(m => ({ default: m.AdminGalleryDetailPage })));
const AdminMembersPage = React.lazy(() => import('@/features/admin/AdminMembersPage').then(m => ({ default: m.AdminMembersPage })));
const AdminFinesPage = React.lazy(() => import('@/features/admin/AdminFinesPage').then(m => ({ default: m.AdminFinesPage })));
const AdminAttendanceReportPage = React.lazy(() => import('@/features/admin/AdminAttendanceReportPage').then(m => ({ default: m.AdminAttendanceReportPage })));
const AdminWalletsPage = React.lazy(() => import('@/features/admin/AdminWalletsPage').then(m => ({ default: m.AdminWalletsPage })));

// Smart redirect: authenticated users go to dashboard, guests see login
const HomeRedirect = () => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  if (isLoading) return <FootballSpinner />;
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return <LoginPage />;
};

export const AppRouter = () => {
  return (
    <React.Suspense fallback={<FootballSpinner />}>
      <Routes>
        {/* Public: standalone pages (no layout) */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<HomeRedirect />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/registro-antiguos" element={<OldPlayerRegisterPage />} />

        {/* Protected: User Dashboard */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<UserDashboardPage />} />
          <Route path="/convocatorias" element={<ConvocatoriasPage />} />
          <Route path="/convocatorias/:id" element={<ConvocatoriaDetailPage />} />
          <Route path="/mis-participaciones" element={<MisParticipacionesPage />} />
          <Route path="/noticias" element={<NewsPage />} />
          <Route path="/noticias/:slug" element={<NewsDetailPage />} />
          <Route path="/eventos" element={<EventsPage />} />
          <Route path="/galeria" element={<GalleryPage />} />
          <Route path="/galeria/:id" element={<GalleryDetailPage />} />
          <Route path="/miembros" element={<MembersPage />} />
          <Route path="/billetera" element={<WalletPage />} />
          <Route path="/mis-multas" element={<MyFinesPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>

        {/* Protected: Admin */}
        <Route element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/convocatorias" element={<AdminConvocatoriasPage />} />
          <Route path="/admin/miembros" element={<AdminMembersPage />} />
          <Route path="/admin/multas" element={<AdminFinesPage />} />
          <Route path="/admin/billeteras" element={<AdminWalletsPage />} />
          <Route path="/admin/asistencias" element={<AdminAttendanceReportPage />} />
          <Route path="/admin/noticias" element={<AdminPostsPage />} />
          <Route path="/admin/eventos" element={<AdminEventsPage />} />
          <Route path="/admin/galeria" element={<AdminGalleriesPage />} />
          <Route path="/admin/galeria/:id" element={<AdminGalleryDetailPage />} />
        </Route>

        {/* Catch-all: redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
};
