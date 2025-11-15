/**
 * React Query hooks for Reports Management
 *
 * Provides hooks for report operations with caching and state management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';

// Query keys for report operations
export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (params?: any) => [...reportKeys.lists(), { params }] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
  monthly: (year: number, month: number) => [...reportKeys.all, 'monthly', year, month] as const,
  quarterly: (year: number, quarter: number) => [...reportKeys.all, 'quarterly', year, quarter] as const,
  annual: (year: number) => [...reportKeys.all, 'annual', year] as const,
};

/**
 * Hook to fetch a list of reports
 *
 * @param params - Query parameters (filters, pagination, etc.)
 * @returns Query result with reports list
 */
export function useReports(params?: any) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: async () => {
      const response = await reportsApi.list(params);
      return response;
    },
  });
}

/**
 * Hook to fetch a single report by ID
 *
 * @param id - Report ID
 * @param enabled - Whether the query should run
 * @returns Query result with report details
 */
export function useReport(id: string, enabled = true) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: async () => {
      const response = await reportsApi.get(id);
      return response.data?.report || response.report || response;
    },
    enabled: enabled && !!id,
  });
}

/**
 * Hook to generate a monthly report
 *
 * @param year - Year
 * @param month - Month (1-12)
 * @param enabled - Whether the query should run
 * @returns Query result with generated monthly report
 */
export function useMonthlyReport(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: reportKeys.monthly(year, month),
    queryFn: async () => {
      const response = await reportsApi.generateMonthly(year, month);
      return response.data?.report || response.report || response;
    },
    enabled: enabled && !!year && !!month,
    staleTime: 1 * 60 * 1000, // 1 minute - reports can be regenerated frequently
  });
}

/**
 * Hook to generate a quarterly report
 *
 * @param year - Year
 * @param quarter - Quarter (1-4)
 * @param enabled - Whether the query should run
 * @returns Query result with generated quarterly report
 */
export function useQuarterlyReport(year: number, quarter: number, enabled = true) {
  return useQuery({
    queryKey: reportKeys.quarterly(year, quarter),
    queryFn: async () => {
      const response = await reportsApi.generateQuarterly(year, quarter);
      return response.data?.report || response.report || response;
    },
    enabled: enabled && !!year && !!quarter,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to generate an annual report
 *
 * @param year - Year
 * @param enabled - Whether the query should run
 * @returns Query result with generated annual report
 */
export function useAnnualReport(year: number, enabled = true) {
  return useQuery({
    queryKey: reportKeys.annual(year),
    queryFn: async () => {
      const response = await reportsApi.generateAnnual(year);
      return response.data?.report || response.report || response;
    },
    enabled: enabled && !!year,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create a new report
 *
 * @returns Mutation for creating a report
 */
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await reportsApi.create(data);
      return response.data?.report || response.report || response;
    },
    onSuccess: () => {
      // Invalidate report lists to refetch fresh data
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

/**
 * Hook to submit a report
 *
 * @returns Mutation for submitting a report
 */
export function useSubmitReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await reportsApi.submit(id);
      return response.data?.report || response.report || response;
    },
    onSuccess: (_, id) => {
      // Invalidate the specific report to show new status
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
      // Invalidate report lists to update the status in lists
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

/**
 * Hook to delete a report
 *
 * @returns Mutation for deleting a report
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await reportsApi.delete(id);
      return response;
    },
    onSuccess: (_, id) => {
      // Remove the report from cache
      queryClient.removeQueries({ queryKey: reportKeys.detail(id) });
      // Invalidate report lists
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}
