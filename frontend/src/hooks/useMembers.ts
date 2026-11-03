import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '@/lib/axios';
import { User, PaginatedResponse } from '@/types';

export interface MemberFilters {
  role?: string;
  position?: string;
  status?: string;
  is_approved?: string;
}

export interface MemberStats {
  total: number; admins: number; jugadores: number; porteros: number;
  pendientes: number; inactivos: number; activos: number;
}

export const useMemberStats = () => useQuery({
  queryKey: ['member-stats'],
  queryFn: async () => {
    const { data } = await api.get<{ stats: MemberStats }>('/members/stats');
    return data.stats;
  },
  staleTime: 1000 * 30,
});

export const useMembers = (page = 1, search = '', limit = 15, filters?: MemberFilters) => useQuery({
  queryKey: ['members', page, search, limit, filters],
  queryFn: async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search.trim()) params.append('search', search.trim());
    if (filters?.role) params.append('role', filters.role);
    if (filters?.position) params.append('position', filters.position);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.is_approved) params.append('is_approved', filters.is_approved);
    const { data } = await api.get<PaginatedResponse<User>>(`/members?${params.toString()}`);
    return data;
  },
  placeholderData: keepPreviousData,
});

export const useAllMembers = (enabled = true) => useQuery({
  queryKey: ['members', 'all'],
  queryFn: async () => {
    const { data } = await api.get<{ data: User[] }>('/members?all=true');
    return data.data || [];
  },
  staleTime: 1000 * 60 * 3,
  enabled,
});

export const useMember = (id: number) => useQuery({
  queryKey: ['members', id],
  queryFn: async () => {
    const { data } = await api.get<User>(`/members/${id}`);
    return (data as any).data || data;
  },
  enabled: !!id,
});

const invalidateMemberData = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['members'] });
  queryClient.invalidateQueries({ queryKey: ['member-stats'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const { data: response } = await api.post('/members', data);
      return response;
    },
    onSuccess: () => invalidateMemberData(queryClient),
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<User> }) => {
      const { data: response } = await api.put(`/members/${id}`, data);
      return response;
    },
    onSuccess: () => invalidateMemberData(queryClient),
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/members/${id}`);
    },
    onSuccess: () => invalidateMemberData(queryClient),
  });
};
