import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Convocatoria, PaginatedResponse } from '@/types';

export const useConvocatorias = (page = 1) => {
  return useQuery({
    queryKey: ['convocatorias', page],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Convocatoria>>(`/convocatorias?page=${page}`);
      return data;
    },
  });
};

export const useConvocatoria = (id: number) => {
  return useQuery({
    queryKey: ['convocatoria', id],
    queryFn: async () => {
      const { data } = await api.get<Convocatoria>(`/convocatorias/${id}`);
      return (data as any).data || data;
    },
    enabled: !!id,
  });
};

export const useMisConvocatorias = (page = 1) => {
  return useQuery({
    queryKey: ['mis-convocatorias', page],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<any>>(`/convocatorias/mis-convocatorias?page=${page}`);
      return (data as any).data || data;
    },
  });
};

export const useConfirmar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const { data } = await api.post(`/convocatorias/${id}/confirmar`, formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['convocatoria'] });
      queryClient.invalidateQueries({ queryKey: ['mis-convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useRechazar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/convocatorias/${id}/rechazar`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['convocatoria'] });
      queryClient.invalidateQueries({ queryKey: ['mis-convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useSortearEquipos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/convocatorias/${id}/sortear`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['convocatoria'] });
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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateConvocatoria = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Convocatoria> }) => {
      const { data: res } = await api.put<Convocatoria>(`/convocatorias/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['convocatoria'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteConvocatoria = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/convocatorias/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useRemoveConfirmacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: number; userId: number }) => {
      await api.delete(`/convocatorias/${id}/confirmaciones/${userId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['convocatoria'] });
      queryClient.invalidateQueries({ queryKey: ['convocatoria', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['mis-convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
