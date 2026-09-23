const fs = require('fs');
const path = require('path');

const write = (filepath, content) => {
    fs.writeFileSync(path.join(__dirname, filepath), content.trim() + '\n');
};

write('src/hooks/useConvocatorias.ts', `
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Convocatoria, PaginatedResponse } from '@/types';

export const useConvocatorias = (page = 1) => {
  return useQuery({
    queryKey: ['convocatorias', page],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Convocatoria>>(\`/convocatorias?page=\${page}\`);
      return (data as any).data || data;
    },
  });
};

export const useConvocatoria = (id: number) => {
  return useQuery({
    queryKey: ['convocatorias', id],
    queryFn: async () => {
      const { data } = await api.get<Convocatoria>(\`/convocatorias/\${id}\`);
      return (data as any).data || data;
    },
    enabled: !!id,
  });
};

export const useMisConvocatorias = (page = 1) => {
  return useQuery({
    queryKey: ['mis-convocatorias', page],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<any>>(\`/convocatorias/mis-participaciones?page=\${page}\`);
      return (data as any).data || data;
    },
  });
};

export const useConfirmar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(\`/convocatorias/\${id}/confirmar\`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['mis-convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useRechazar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(\`/convocatorias/\${id}/rechazar\`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['mis-convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useCreateConvocatoria = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Convocatoria>) => {
      const { data } = await api.post<Convocatoria>('/convocatorias', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
    },
  });
};

export const useUpdateConvocatoria = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Convocatoria> }) => {
      const { data: res } = await api.put<Convocatoria>(\`/convocatorias/\${id}\`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
    },
  });
};

export const useDeleteConvocatoria = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(\`/convocatorias/\${id}\`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
    },
  });
};
`);

write('src/hooks/useDashboard.ts', `
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { DashboardStats, AdminDashboardStats } from '@/types';

export const useUserDashboard = () => {
  return useQuery({
    queryKey: ['dashboard', 'user'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/dashboard/user');
      return (data as any).data || data;
    },
  });
};

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => {
      const { data } = await api.get<AdminDashboardStats>('/dashboard/admin');
      return (data as any).data || data;
    },
  });
};
`);

write('src/hooks/useEvents.ts', `
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Event, PaginatedResponse } from '@/types';

export const usePublicEvents = (page = 1) => {
  return useQuery({
    queryKey: ['events', page],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Event>>(\`/events?page=\${page}\`);
      return (data as any).data || data;
    },
  });
};

export const useEvent = (id: number) => {
  return useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      const { data } = await api.get<Event>(\`/events/\${id}\`);
      return (data as any).data || data;
    },
    enabled: !!id,
  });
};
`);

write('src/hooks/useGalleries.ts', `
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Gallery, PaginatedResponse } from '@/types';

export const useGalleries = (page = 1) => {
  return useQuery({
    queryKey: ['galleries', page],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Gallery>>(\`/galleries?page=\${page}\`);
      return (data as any).data || data;
    },
  });
};

export const useGallery = (id: number) => {
  return useQuery({
    queryKey: ['galleries', id],
    queryFn: async () => {
      const { data } = await api.get<Gallery>(\`/galleries/\${id}\`);
      return (data as any).data || data;
    },
    enabled: !!id,
  });
};
`);

write('src/hooks/useMembers.ts', `
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { User, PaginatedResponse } from '@/types';

export const useMembers = (page = 1) => {
  return useQuery({
    queryKey: ['members', page],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<User>>(\`/members?page=\${page}\`);
      return (data as any).data || data;
    },
  });
};

export const useMember = (id: number) => {
  return useQuery({
    queryKey: ['members', id],
    queryFn: async () => {
      const { data } = await api.get<User>(\`/members/\${id}\`);
      return (data as any).data || data;
    },
    enabled: !!id,
  });
};
`);

write('src/hooks/usePosts.ts', `
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Post, PaginatedResponse } from '@/types';

export const usePublicPosts = (page = 1) => {
  return useQuery({
    queryKey: ['posts', page],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Post>>(\`/posts?page=\${page}\`);
      return (data as any).data || data;
    },
  });
};

export const usePost = (slug: string) => {
  return useQuery({
    queryKey: ['posts', slug],
    queryFn: async () => {
      const { data } = await api.get<Post>(\`/posts/\${slug}\`);
      return (data as any).data || data;
    },
    enabled: !!slug,
  });
};
`);

