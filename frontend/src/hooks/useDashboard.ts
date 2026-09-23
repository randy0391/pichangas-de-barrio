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
