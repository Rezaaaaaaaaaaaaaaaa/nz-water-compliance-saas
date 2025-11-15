/**
 * React Query hooks for Asset Management
 *
 * Provides hooks for asset operations with caching and state management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from '@/lib/api';

// Query keys for asset operations
export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (params?: any) => [...assetKeys.lists(), { params }] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  statistics: () => [...assetKeys.all, 'statistics'] as const,
};

/**
 * Hook to fetch a list of assets
 *
 * @param params - Query parameters (filters, pagination, etc.)
 * @returns Query result with assets list
 */
export function useAssets(params?: any) {
  return useQuery({
    queryKey: assetKeys.list(params),
    queryFn: async () => {
      const response = await assetsApi.list(params);
      return response;
    },
  });
}

/**
 * Hook to fetch a single asset by ID
 *
 * @param id - Asset ID
 * @param enabled - Whether the query should run
 * @returns Query result with asset details
 */
export function useAsset(id: string, enabled = true) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: async () => {
      const response = await assetsApi.get(id);
      return response.data?.asset || response.asset || response;
    },
    enabled: enabled && !!id,
  });
}

/**
 * Hook to fetch asset statistics
 *
 * @returns Query result with asset statistics
 */
export function useAssetStatistics() {
  return useQuery({
    queryKey: assetKeys.statistics(),
    queryFn: async () => {
      const response = await assetsApi.statistics();
      return response.data?.statistics || response;
    },
  });
}

/**
 * Hook to create a new asset
 *
 * @returns Mutation for creating an asset
 */
export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await assetsApi.create(data);
      return response.data?.asset || response.asset || response;
    },
    onSuccess: () => {
      // Invalidate asset lists and statistics to refetch fresh data
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.statistics() });
    },
  });
}

/**
 * Hook to update an existing asset
 *
 * @returns Mutation for updating an asset
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await assetsApi.update(id, data);
      return response.data?.asset || response.asset || response;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific asset detail
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) });
      // Invalidate asset lists and statistics
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.statistics() });
    },
  });
}

/**
 * Hook to delete an asset
 *
 * @returns Mutation for deleting an asset
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await assetsApi.delete(id);
      return response;
    },
    onSuccess: (_, id) => {
      // Remove the asset from cache
      queryClient.removeQueries({ queryKey: assetKeys.detail(id) });
      // Invalidate asset lists and statistics
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.statistics() });
    },
  });
}
