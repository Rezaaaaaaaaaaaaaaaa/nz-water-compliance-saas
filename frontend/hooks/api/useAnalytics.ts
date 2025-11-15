/**
 * React Query hooks for Analytics
 *
 * Provides hooks for analytics and dashboard data with caching and state management
 */

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';

// Query keys for analytics operations
export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (params?: any) => [...analyticsKeys.all, 'dashboard', { params }] as const,
  compliance: (params?: any) => [...analyticsKeys.all, 'compliance', { params }] as const,
  assets: (params?: any) => [...analyticsKeys.all, 'assets', { params }] as const,
  documents: (params?: any) => [...analyticsKeys.all, 'documents', { params }] as const,
  activity: (params?: any) => [...analyticsKeys.all, 'activity', { params }] as const,
  dwspTrends: (params?: any) => [...analyticsKeys.all, 'dwsp-trends', { params }] as const,
  userActivity: (params?: any) => [...analyticsKeys.all, 'user-activity', { params }] as const,
  system: () => [...analyticsKeys.all, 'system'] as const,
};

/**
 * Hook to fetch dashboard analytics
 *
 * @param params - Query parameters (startDate, endDate)
 * @returns Query result with dashboard analytics
 */
export function useDashboardAnalytics(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: analyticsKeys.dashboard(params),
    queryFn: async () => {
      const response = await analyticsApi.getDashboard(params);
      return response.data || response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data updates frequently
  });
}

/**
 * Hook to fetch compliance overview analytics
 *
 * @param params - Query parameters
 * @returns Query result with compliance analytics
 */
export function useComplianceAnalytics(params?: any) {
  return useQuery({
    queryKey: analyticsKeys.compliance(params),
    queryFn: async () => {
      const response = await analyticsApi.getComplianceOverview(params);
      return response.data || response;
    },
  });
}

/**
 * Hook to fetch asset analytics
 *
 * @param params - Query parameters
 * @returns Query result with asset analytics
 */
export function useAssetAnalytics(params?: any) {
  return useQuery({
    queryKey: analyticsKeys.assets(params),
    queryFn: async () => {
      const response = await analyticsApi.getAssetAnalytics(params);
      return response.data || response;
    },
  });
}

/**
 * Hook to fetch document analytics
 *
 * @param params - Query parameters
 * @returns Query result with document analytics
 */
export function useDocumentAnalytics(params?: any) {
  return useQuery({
    queryKey: analyticsKeys.documents(params),
    queryFn: async () => {
      const response = await analyticsApi.getDocumentAnalytics(params);
      return response.data || response;
    },
  });
}

/**
 * Hook to fetch activity timeline
 *
 * @param params - Query parameters (limit, offset)
 * @returns Query result with activity timeline
 */
export function useActivityTimeline(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: analyticsKeys.activity(params),
    queryFn: async () => {
      const response = await analyticsApi.getActivityTimeline(params);
      return response.data?.activities || response.activities || response;
    },
    staleTime: 1 * 60 * 1000, // 1 minute - activity updates frequently
  });
}

/**
 * Hook to fetch DWSP trends
 *
 * @param params - Query parameters (startDate, endDate)
 * @returns Query result with DWSP trends
 */
export function useDwspTrends(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: analyticsKeys.dwspTrends(params),
    queryFn: async () => {
      const response = await analyticsApi.getDwspTrends(params);
      return response.data || response;
    },
  });
}

/**
 * Hook to fetch user activity analytics
 *
 * @param params - Query parameters
 * @returns Query result with user activity data
 */
export function useUserActivity(params?: any) {
  return useQuery({
    queryKey: analyticsKeys.userActivity(params),
    queryFn: async () => {
      const response = await analyticsApi.getUserActivity(params);
      return response.data || response;
    },
  });
}

/**
 * Hook to fetch system analytics
 *
 * @returns Query result with system analytics
 */
export function useSystemAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.system(),
    queryFn: async () => {
      const response = await analyticsApi.getSystemAnalytics();
      return response.data || response;
    },
    staleTime: 30 * 1000, // 30 seconds - system metrics update frequently
  });
}
