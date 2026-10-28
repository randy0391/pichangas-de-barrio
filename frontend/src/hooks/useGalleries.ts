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

export interface ClubPhoto {
  id: string | number;
  url: string;
  galleryId: number;
  galleryTitle: string;
  galleryDescription?: string | null;
  caption?: string | null;
  createdAt: string;
  type?: 'foto' | 'video';
}

export const useClubPhotos = () => {
  return useQuery({
    queryKey: ['club-photos'],
    queryFn: async () => {
      try {
        const { data: res } = await api.get<PaginatedResponse<Gallery>>('/galleries?per_page=20');
        const galleries: Gallery[] = (res as any)?.data || res || [];

        // For galleries that have media_count > 0 but media array was not returned in list
        const detailedGalleries = await Promise.all(
          galleries.map(async (g) => {
            if (g.media && g.media.length > 0) return g;
            if (g.media_count && g.media_count > 0) {
              try {
                const { data: full } = await api.get<Gallery>(`/galleries/${g.id}`);
                return (full as any)?.data || full || g;
              } catch {
                return g;
              }
            }
            return g;
          })
        );

        const photos: ClubPhoto[] = [];
        const seenUrls = new Set<string>();

        detailedGalleries.forEach((g) => {
          if (g.media && g.media.length > 0) {
            g.media.forEach((m) => {
              if (m.file_path && !seenUrls.has(m.file_path)) {
                seenUrls.add(m.file_path);
                photos.push({
                  id: `m-${m.id}`,
                  url: m.file_path,
                  galleryId: g.id,
                  galleryTitle: g.title,
                  galleryDescription: g.description,
                  caption: m.caption || m.title || g.title,
                  createdAt: (m as any).created_at || g.created_at,
                  type: m.type || 'foto'
                });
              }
            });
          }

          if (g.cover_image && !seenUrls.has(g.cover_image)) {
            seenUrls.add(g.cover_image);
            photos.push({
              id: `cover-${g.id}`,
              url: g.cover_image,
              galleryId: g.id,
              galleryTitle: g.title,
              galleryDescription: g.description,
              caption: g.title,
              createdAt: g.created_at,
              type: 'foto'
            });
          }
        });

        return {
          photos,
          galleries: detailedGalleries
        };
      } catch (err) {
        console.error('Error fetching club photos:', err);
        return { photos: [], galleries: [] };
      }
    },
    staleTime: 1000 * 60 * 3,
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
