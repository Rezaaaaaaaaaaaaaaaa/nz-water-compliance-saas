/**
 * React Query hooks for Authentication
 *
 * Provides hooks for authentication operations with caching and state management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';

// Query keys for auth operations
export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'current-user'] as const,
};

/**
 * Hook to get the current authenticated user
 *
 * @param enabled - Whether the query should run (default: true)
 * @returns Query result with user data
 */
export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async () => {
      const response = await authApi.getCurrentUser();
      return response.data?.user || response.user;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once for auth checks
  });
}

/**
 * Hook to handle user login
 *
 * @returns Mutation for login operation
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const response = await authApi.login(email, password);
      const accessToken = response.data?.accessToken || response.accessToken;
      const userData = response.data?.user || response.user;

      // Store token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', accessToken);
      }

      return userData;
    },
    onSuccess: (userData) => {
      // Update the current user cache
      queryClient.setQueryData(authKeys.currentUser(), userData);
    },
  });
}

/**
 * Hook to handle user registration
 *
 * @returns Mutation for registration operation
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      organizationName?: string;
      organizationType?: string;
    }) => {
      const response = await authApi.register(data);
      const accessToken = response.data?.accessToken || response.accessToken;
      const userData = response.data?.user || response.user;

      // Store token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', accessToken);
      }

      return userData;
    },
    onSuccess: (userData) => {
      // Update the current user cache
      queryClient.setQueryData(authKeys.currentUser(), userData);
    },
  });
}

/**
 * Hook to handle user logout
 *
 * @returns Mutation for logout operation
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authApi.logout();
    },
    onSettled: () => {
      // Clear all cached data on logout
      queryClient.clear();

      // Remove token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    },
  });
}

/**
 * Hook to refresh the current user data
 *
 * @returns Function to manually refresh user data
 */
export function useRefreshUser() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
}
