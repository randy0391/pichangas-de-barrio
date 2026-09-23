import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Gallery, PaginatedResponse } from '@/types';

export const useGalleries = (page = 1) => {
  return useQuery({
    queryKey: ['galleries', page],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Gallery>>(`/galleries?page=${page}`);
      return (data as any).data || data;
    },
  });
};

export const useGallery = (id: number) => {
  return useQuery({
    queryKey: ['gallery', id],
    queryFn: async () => {
      const { data } = await api.get<Gallery>(`/galleries/${id}`);
      return (data as any).data || data;
    },
    enabled: !!id,
  });
};

export const useCreateGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (galleryData: FormData | Partial<Gallery>) => {
      const { data } = await api.post('/galleries', galleryData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useUpdateGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData | Partial<Gallery> }) => {
      if (data instanceof FormData) {
        data.append('_method', 'PUT');
        const { data: response } = await api.post(`/galleries/${id}`, data);
        return response;
      } else {
        const { data: response } = await api.put(`/galleries/${id}`, data);
        return response;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useDeleteGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/galleries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useUploadMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/media/upload', formData);
      return data;
    },
    onSuccess: (_, variables) => {
      const galleryId = variables.get('gallery_id');
      queryClient.invalidateQueries({ queryKey: ['gallery', Number(galleryId)] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
    }
  });
};

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, galleryId }: { id: number, galleryId: number }) => {
      await api.delete(`/media/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gallery', variables.galleryId] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
    }
  });
};
