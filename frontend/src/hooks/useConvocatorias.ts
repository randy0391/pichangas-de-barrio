import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Convocatoria, PaginatedResponse, RecurringSchedule } from '@/types';

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
      const res = await api.delete(`/convocatorias/${id}/confirmaciones/${userId}`);
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['convocatoria'] });
      queryClient.invalidateQueries({ queryKey: ['convocatoria', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['mis-convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-wallets-all'] });
      queryClient.invalidateQueries({ queryKey: ['my-wallet'] });
      if (data?.message) {
        toast.success(data.message);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al eliminar jugador de la convocatoria');
    }
  });
};

export const useAddPlayerToConvocatoria = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId, matchRole }: { id: number; userId: number; matchRole: 'jugador' | 'portero' }) => {
      const { data } = await api.post(`/convocatorias/${id}/add-player`, {
        user_id: userId,
        match_role: matchRole
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['convocatoria'] });
      queryClient.invalidateQueries({ queryKey: ['convocatoria', variables.id] });
    }
  });
};

export const useUpdatePlayerRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, userId, role }: { id: number; userId: number; role: 'jugador' | 'portero' }) => {
            const { data } = await api.put(`/convocatorias/${id}/confirmaciones/${userId}/role`, { match_role: role });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
            queryClient.invalidateQueries({ queryKey: ['convocatoria'] });
        }
    });
};

export const defaultFallbackSchedules: RecurringSchedule[] = [
  {
    id: 1,
    day_of_week: 2,
    day_name: 'Martes',
    title: 'Pichanga de los Martes',
    description: 'Pichanga oficial de los Martes en Pichangas de Barrio FC. Costo por cupo: S/ 15.00.',
    match_time: '20:00:00',
    cost_per_player: 15,
    location: 'Cancha Sintética Oficial',
    maps_url: null,
    max_players: 14,
    num_teams: 2,
    is_active: true,
    weeks_ahead: 4
  },
  {
    id: 2,
    day_of_week: 4,
    day_name: 'Jueves',
    title: 'Pichanga de los Jueves',
    description: 'Pichanga oficial de los Jueves en Pichangas de Barrio FC. Costo por cupo: S/ 15.00.',
    match_time: '20:00:00',
    cost_per_player: 15,
    location: 'Cancha Sintética Oficial',
    maps_url: null,
    max_players: 14,
    num_teams: 2,
    is_active: true,
    weeks_ahead: 4
  },
  {
    id: 3,
    day_of_week: 6,
    day_name: 'Sábado',
    title: 'Pichanga de los Sábados',
    description: 'Pichanga estelar de los Sábados en Pichangas de Barrio FC. Costo por cupo: S/ 18.00.',
    match_time: '18:00:00',
    cost_per_player: 18,
    location: 'Cancha Sintética Oficial',
    maps_url: null,
    max_players: 14,
    num_teams: 2,
    is_active: true,
    weeks_ahead: 4
  }
];

export const useRecurringSchedules = () => {
  return useQuery({
    queryKey: ['recurring-schedules'],
    queryFn: async () => {
      try {
        const { data } = await api.get<{ data: RecurringSchedule[]; summary: any }>('/recurring-schedules');
        if (data?.data && data.data.length > 0) {
          return data;
        }
      } catch (e) {
        // Fallback to default schedules if remote server is still deploying
      }
      return {
        data: defaultFallbackSchedules,
        summary: {
          martes: defaultFallbackSchedules[0],
          jueves: defaultFallbackSchedules[1],
          sabado: defaultFallbackSchedules[2],
        }
      };
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateRecurringSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RecurringSchedule> }) => {
      const res = await api.put(`/admin/recurring-schedules/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
    },
  });
};

async function generateClientSideRecurringConvocatorias(weeks: number) {
  // Fetch existing convocatorias to avoid duplicates
  const existingRes = await api.get('/convocatorias?per_page=100');
  const existingItems: any[] = existingRes.data?.data || existingRes.data || [];
  const existingDates = new Set(existingItems.map((c: any) => c.match_date ? c.match_date.slice(0, 10) : ''));

  const createdDates: any[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const templates = [
    { dayOfWeek: 2, dayName: 'Martes', title: 'Pichanga de los Martes', time: '20:00', cost: 15 },
    { dayOfWeek: 4, dayName: 'Jueves', title: 'Pichanga de los Jueves', time: '20:00', cost: 15 },
    { dayOfWeek: 6, dayName: 'Sábado', title: 'Pichanga de los Sábados', time: '18:00', cost: 18 },
  ];

  for (let w = 0; w <= weeks; w++) {
    for (const t of templates) {
      const currentDay = today.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const mondayThisWeek = new Date(today);
      mondayThisWeek.setDate(today.getDate() + diffToMonday);

      const targetDate = new Date(mondayThisWeek);
      targetDate.setDate(mondayThisWeek.getDate() + (w * 7) + (t.dayOfWeek - 1));

      if (targetDate.getTime() < today.getTime()) continue;

      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      if (!existingDates.has(dateStr)) {
        try {
          await api.post('/convocatorias', {
            title: t.title,
            description: `Pichanga oficial de los ${t.dayName} en Pichangas de Barrio FC. Costo por cupo: S/ ${t.cost.toFixed(2)}.`,
            location: 'Cancha Sintética Oficial',
            match_date: dateStr,
            match_time: t.time,
            max_players: 14,
            num_teams: 2,
            cost_per_player: t.cost,
            status: 'abierta'
          });
          existingDates.add(dateStr);
          createdDates.push({ date: dateStr, day: t.dayName, cost: t.cost });
        } catch {
          // Ignore individual error and continue
        }
      }
    }
  }

  return {
    created_count: createdDates.length,
    message: createdDates.length > 0 
      ? `Se generaron ${createdDates.length} convocatorias automáticamente para las próximas fechas.`
      : 'Todas las convocatorias de las próximas semanas ya están al día.',
    created_dates: createdDates
  };
}

export const useGenerateRecurringConvocatorias = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, number | void>({
    mutationFn: async (weeks = 4) => {
      const numWeeks = Number(weeks) || 4;
      try {
        const { data } = await api.post('/admin/convocatorias/generate-recurring', { weeks: numWeeks });
        return data;
      } catch (err: any) {
        // If route not found on remote backend yet (404), fallback to client-side generation
        if (err?.response?.status === 404) {
          return await generateClientSideRecurringConvocatorias(numWeeks);
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (data?.message) {
        toast.success(data.message);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al generar convocatorias');
    }
  });
};

