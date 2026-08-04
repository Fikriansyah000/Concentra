import { api } from './api';
import { AnalyticsSummary, WeeklyAnalytics, StudyPattern } from '../types';

export const analyticsService = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const res = await api.get('/analytics/summary');
    return res.data;
  },

  getWeekly: async (): Promise<WeeklyAnalytics> => {
    const res = await api.get('/analytics/weekly');
    return res.data;
  },

  getPatterns: async (): Promise<StudyPattern> => {
    const res = await api.get('/analytics/patterns');
    return res.data;
  },
};
