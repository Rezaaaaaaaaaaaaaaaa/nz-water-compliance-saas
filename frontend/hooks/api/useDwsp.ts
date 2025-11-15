/**
 * React Query hooks for DWSP (Drinking Water Safety Plan) Management
 *
 * Provides hooks for compliance plan operations with caching and state management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dwspApi } from '@/lib/api';

// Query keys for DWSP operations
export const dwspKeys = {
  all: ['dwsp'] as const,
  lists: () => [...dwspKeys.all, 'list'] as const,
  list: (params?: any) => [...dwspKeys.lists(), { params }] as const,
  details: () => [...dwspKeys.all, 'detail'] as const,
  detail: (id: string) => [...dwspKeys.details(), id] as const,
};

/**
 * Hook to fetch a list of DWSPs (compliance plans)
 *
 * @param params - Query parameters (filters, pagination, etc.)
 * @returns Query result with DWSPs list
 */
export function useDwsps(params?: any) {
  return useQuery({
    queryKey: dwspKeys.list(params),
    queryFn: async () => {
      const response = await dwspApi.list(params);
      return response;
    },
  });
}

/**
 * Hook to fetch a single DWSP by ID
 *
 * @param id - DWSP ID
 * @param enabled - Whether the query should run
 * @returns Query result with DWSP details
 */
export function useDwsp(id: string, enabled = true) {
  return useQuery({
    queryKey: dwspKeys.detail(id),
    queryFn: async () => {
      const response = await dwspApi.get(id);
      return response.data?.compliancePlan || response.compliancePlan || response;
    },
    enabled: enabled && !!id,
  });
}

/**
 * Hook to create a new DWSP
 *
 * @returns Mutation for creating a DWSP
 */
export function useCreateDwsp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await dwspApi.create(data);
      return response.data?.compliancePlan || response.compliancePlan || response;
    },
    onSuccess: () => {
      // Invalidate DWSP lists to refetch fresh data
      queryClient.invalidateQueries({ queryKey: dwspKeys.lists() });
    },
  });
}

/**
 * Hook to update an existing DWSP
 *
 * @returns Mutation for updating a DWSP
 */
export function useUpdateDwsp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await dwspApi.update(id, data);
      return response.data?.compliancePlan || response.compliancePlan || response;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific DWSP detail
      queryClient.invalidateQueries({ queryKey: dwspKeys.detail(variables.id) });
      // Invalidate DWSP lists
      queryClient.invalidateQueries({ queryKey: dwspKeys.lists() });
    },
  });
}

/**
 * Hook to validate a DWSP
 *
 * @returns Mutation for validating a DWSP
 */
export function useValidateDwsp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await dwspApi.validate(id);
      return response.data || response;
    },
    onSuccess: (_, id) => {
      // Invalidate the specific DWSP to refresh validation status
      queryClient.invalidateQueries({ queryKey: dwspKeys.detail(id) });
    },
  });
}

/**
 * Hook to submit a DWSP for approval
 *
 * @returns Mutation for submitting a DWSP
 */
export function useSubmitDwsp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await dwspApi.submit(id);
      return response.data?.compliancePlan || response.compliancePlan || response;
    },
    onSuccess: (_, id) => {
      // Invalidate the specific DWSP detail to show new status
      queryClient.invalidateQueries({ queryKey: dwspKeys.detail(id) });
      // Invalidate DWSP lists to update the status in lists
      queryClient.invalidateQueries({ queryKey: dwspKeys.lists() });
    },
  });
}

/**
 * Hook to delete a DWSP
 *
 * @returns Mutation for deleting a DWSP
 */
export function useDeleteDwsp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await dwspApi.delete(id);
      return response;
    },
    onSuccess: (_, id) => {
      // Remove the DWSP from cache
      queryClient.removeQueries({ queryKey: dwspKeys.detail(id) });
      // Invalidate DWSP lists
      queryClient.invalidateQueries({ queryKey: dwspKeys.lists() });
    },
  });
}
