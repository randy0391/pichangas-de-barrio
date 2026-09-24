import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Multa } from '@/types';

export const useMultas = () => {
  return useQuery({
    queryKey: ['multas'],
    queryFn: async () => {
      const { data } = await api.get<Multa[]>(`/multas`);
      return data;
    },
  });
};

export const useUploadMultaReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, receipt }: { id: number; receipt: File }) => {
      const formData = new FormData();
      formData.append('receipt', receipt);
      const { data } = await api.post(`/multas/${id}/receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multas'] });
      queryClient.invalidateQueries({ queryKey: ['user'] }); // Might affect has_pending_multas
    }
  });
};

export const useApproveMulta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const { data } = await api.post(`/multas/${id}/approve`, { notes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multas'] });
    }
  });
};

export const useRejectMulta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const { data } = await api.post(`/multas/${id}/reject`, { notes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multas'] });
    }
  });
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
        confirmacionId, 
        attendance, 
        amount 
    }: { 
        confirmacionId: number; 
        attendance: 'presente' | 'tardanza' | 'falta'; 
        amount?: number 
    }) => {
      const { data } = await api.post(`/confirmaciones/${confirmacionId}/attendance`, { attendance, amount });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['convocatoria'] });
      queryClient.invalidateQueries({ queryKey: ['multas'] });
    }
  });
};
