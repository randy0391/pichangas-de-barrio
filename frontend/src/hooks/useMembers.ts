import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { User, PaginatedResponse } from '@/types';

export const useMembers = (page = 1) => {
  return useQuery({
    queryKey: ['members', page],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<User>>(`/members?page=${page}`);
      return data;
    },
  });
};

export const useMember = (id: number) => {
  return useQuery({
    queryKey: ['members', id],
    queryFn: async () => {
      const { data } = await api.get<User>(`/members/${id}`);
      return (data as any).data || data;
    },
    enabled: !!id,
  });
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const { data: response } = await api.post(`/members`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<User> }) => {
      const { data: response } = await api.put(`/members/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};
