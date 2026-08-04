import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService, CreateSessionPayload } from '../services/sessionService';

export function useActiveSession() {
  return useQuery({
    queryKey: ['sessions', 'active'],
    queryFn: () => sessionService.getActiveSession(),
    refetchInterval: 10000, // check active session status every 10s
  });
}

export function useSessions(page = 1, perPage = 10, status?: string) {
  return useQuery({
    queryKey: ['sessions', { page, perPage, status }],
    queryFn: () => sessionService.getSessions(page, perPage, status),
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSessionPayload) => sessionService.createSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, title }: { id: string; action: string; title?: string }) =>
      sessionService.updateSession(id, action, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
