import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DashboardLayout, AdminLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Public Pages
import { HomePage } from '@/features/home/HomePage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { OldPlayerRegisterPage } from '@/features/auth/OldPlayerRegisterPage';
import { NewsPage } from '@/features/news/NewsPage';
import { NewsDetailPage } from '@/features/news/NewsDetailPage';
import { EventsPage } from '@/features/events/EventsPage';
import { GalleryPage } from '@/features/gallery/GalleryPage';
import { GalleryDetailPage } from '@/features/gallery/GalleryDetailPage';

// Dashboard Pages
import { UserDashboardPage } from '@/features/dashboard/UserDashboardPage';
import { ConvocatoriasPage } from '@/features/convocatorias/ConvocatoriasPage';
import { ConvocatoriaDetailPage } from '@/features/convocatorias/ConvocatoriaDetailPage';
import { MisParticipacionesPage } from '@/features/convocatorias/MisParticipacionesPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { MyFinesPage } from '@/features/profile/MyFinesPage';
import { MembersPage } from '@/features/members/MembersPage';

// Admin Pages
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage';
import { AdminPostsPage } from '@/features/admin/AdminPostsPage';
import { AdminEventsPage } from '@/features/admin/AdminEventsPage';
import { AdminConvocatoriasPage } from '@/features/admin/AdminConvocatoriasPage';
import { AdminGalleriesPage } from '@/features/admin/AdminGalleriesPage';
import { AdminGalleryDetailPage } from '@/features/admin/AdminGalleryDetailPage';
import { AdminMembersPage } from '@/features/admin/AdminMembersPage';
import { AdminFinesPage } from '@/features/admin/AdminFinesPage';
import { AdminAttendanceReportPage } from '@/features/admin/AdminAttendanceReportPage';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/registro-antiguos" element={<OldPlayerRegisterPage />} />
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/noticias" element={<NewsPage />} />
        <Route path="/noticias/:slug" element={<NewsDetailPage />} />
        <Route path="/eventos" element={<EventsPage />} />
        <Route path="/galeria" element={<GalleryPage />} />
        <Route path="/galeria/:id" element={<GalleryDetailPage />} />
      </Route>

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<UserDashboardPage />} />
        <Route path="/convocatorias" element={<ConvocatoriasPage />} />
        <Route path="/convocatorias/:id" element={<ConvocatoriaDetailPage />} />
        <Route path="/mis-participaciones" element={<MisParticipacionesPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/mis-multas" element={<MyFinesPage />} />
        <Route path="/miembros" element={<MembersPage />} />
      </Route>

      <Route element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/multas" element={<AdminFinesPage />} />
        <Route path="/admin/asistencias" element={<AdminAttendanceReportPage />} />
        <Route path="/admin/noticias" element={<AdminPostsPage />} />
        <Route path="/admin/eventos" element={<AdminEventsPage />} />
        <Route path="/admin/convocatorias" element={<AdminConvocatoriasPage />} />
        <Route path="/admin/galeria" element={<AdminGalleriesPage />} />
        <Route path="/admin/galeria/:id" element={<AdminGalleryDetailPage />} />
        <Route path="/admin/miembros" element={<AdminMembersPage />} />
      </Route>
    </Routes>
  );
};
