import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Post, PaginatedResponse } from '@/types';

export const usePublicPosts = (page = 1) => {
  return useQuery({
    queryKey: ['posts', page],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Post>>(`/posts?page=${page}`);
      return data;
    },
  });
};

export const usePost = (slug: string) => {
  return useQuery({
    queryKey: ['posts', slug],
    queryFn: async () => {
      const { data } = await api.get<Post>(`/posts/${slug}`);
      return (data as any).data || data;
    },
    enabled: !!slug,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postData: FormData | Partial<Post>) => {
      const { data } = await api.post('/posts', postData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData | Partial<Post> }) => {
      if (data instanceof FormData) {
        data.append('_method', 'PUT');
        const { data: response } = await api.post(`/posts/${id}`, data);
        return response;
      } else {
        const { data: response } = await api.put(`/posts/${id}`, data);
        return response;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};
