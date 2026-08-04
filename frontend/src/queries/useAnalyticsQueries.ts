import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsService.getSummary(),
  });
}

export function useWeeklyAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'weekly'],
    queryFn: () => analyticsService.getWeekly(),
  });
}

export function useStudyPatterns() {
  return useQuery({
    queryKey: ['analytics', 'patterns'],
    queryFn: () => analyticsService.getPatterns(),
  });
}
