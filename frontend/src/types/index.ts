export interface User {
  id: number;
  name: string;
  email: string;
  dni: string | null;
  phone: string | null;
  position: 'portero' | 'defensa' | 'medio' | 'delantero' | null;
  jersey_number: number | null;
  avatar: string | null;
  bio: string | null;
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
  is_approved: boolean;
  payment_receipt: string | null;
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  featured_image: string | null;
  link: string | null;
  link_title?: string | null;
  link_description?: string | null;
  link_image?: string | null;
  category: 'noticia' | 'anuncio' | 'novedad';
  status: 'borrador' | 'publicado';
  published_at: string | null;
  author: User;
  media: Media[];
  created_at: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  event_date: string;
  event_time: string;
  cover_image: string | null;
  max_participants: number | null;
  status: 'proximo' | 'completado' | 'cancelado';
  creator: User;
  registrations_count: number;
  is_registered?: boolean;
  registrations?: { id: number; user_id: number; registered_at: string; user?: User }[];
  created_at: string;
}

export interface Confirmacion {
  id: number;
  status: 'confirmado' | 'rechazado' | 'pendiente';
  match_role: 'jugador' | 'portero';
  team_number: number | null;
  notes: string | null;
  confirmed_at: string | null;
  payment_receipt: string | null;
  user: User;
}

export interface Convocatoria {
  id: number;
  title: string;
  description: string;
  location: string;
  match_date: string;
  match_time: string;
  max_players: number;
  num_teams: number;
  rival: string | null;
  status: 'abierta' | 'cerrada' | 'completada' | 'cancelada';
  creator: User;
  confirmed_count: number;
  rejected_count: number;
  pending_count: number;
  porteros_count: number;
  confirmaciones?: Confirmacion[];
  my_confirmation?: Confirmacion | null;
  created_at: string;
}

export interface Gallery {
  id: number;
  title: string;
  description: string | null;
  cover_image: string | null;
  media_count: number;
  media?: Media[];
  created_at: string;
}

export interface Media {
  id: number;
  type: 'foto' | 'video';
  file_path: string;
  thumbnail_path: string | null;
  title: string | null;
  caption: string | null;
  sort_order: number;
}

export interface DashboardStats {
  upcoming_convocatorias: Convocatoria[];
  my_events: Event[];
  my_confirmations: Confirmacion[];
  stats: {
    total_participations: number;
    upcoming_convocatorias_count: number;
    upcoming_events_count: number;
    registered_events: number;
  };
}

export interface AdminDashboardStats {
  stats: {
    total_members: number;
    total_admins: number;
    active_convocatorias: number;
    total_convocatorias: number;
    total_events: number;
    upcoming_events: number;
    total_posts: number;
    published_posts: number;
  };
  recent_convocatorias: Convocatoria[];
  recent_confirmations: Confirmacion[];
  recent_members: { id: number; name: string; email: string; position: string | null; created_at: string }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
