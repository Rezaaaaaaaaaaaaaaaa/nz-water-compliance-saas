/**
 * React Query hooks for Document Management
 *
 * Provides hooks for document operations with caching and state management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api';

// Query keys for document operations
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (params?: any) => [...documentKeys.lists(), { params }] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  downloadUrl: (id: string) => [...documentKeys.all, 'download-url', id] as const,
};

/**
 * Hook to fetch a list of documents
 *
 * @param params - Query parameters (filters, pagination, etc.)
 * @returns Query result with documents list
 */
export function useDocuments(params?: any) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: async () => {
      const response = await documentsApi.list(params);
      return response;
    },
  });
}

/**
 * Hook to fetch a single document by ID
 *
 * @param id - Document ID
 * @param enabled - Whether the query should run
 * @returns Query result with document details
 */
export function useDocument(id: string, enabled = true) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: async () => {
      const response = await documentsApi.get(id);
      return response.data?.document || response.document || response;
    },
    enabled: enabled && !!id,
  });
}

/**
 * Hook to get a document download URL
 *
 * @param id - Document ID
 * @param enabled - Whether the query should run
 * @returns Query result with download URL
 */
export function useDocumentDownloadUrl(id: string, enabled = true) {
  return useQuery({
    queryKey: documentKeys.downloadUrl(id),
    queryFn: async () => {
      const response = await documentsApi.getDownloadUrl(id);
      return response.data?.downloadUrl || response.downloadUrl || response;
    },
    enabled: enabled && !!id,
    staleTime: 0, // Download URLs expire quickly, don't cache them
    gcTime: 0, // Don't keep them in cache
  });
}

/**
 * Hook to request a presigned upload URL for a document
 *
 * @returns Mutation for requesting upload URL
 */
export function useRequestUploadUrl() {
  return useMutation({
    mutationFn: async (data: {
      fileName: string;
      fileSize: number;
      fileType: string;
      documentType: string;
    }) => {
      const response = await documentsApi.requestUploadUrl(data);
      return response.data || response;
    },
  });
}

/**
 * Hook to create a document record (after upload)
 *
 * @returns Mutation for creating a document
 */
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await documentsApi.create(data);
      return response.data?.document || response.document || response;
    },
    onSuccess: () => {
      // Invalidate document lists to refetch fresh data
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

/**
 * Hook to delete a document
 *
 * @returns Mutation for deleting a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await documentsApi.delete(id);
      return response;
    },
    onSuccess: (_, id) => {
      // Remove the document from cache
      queryClient.removeQueries({ queryKey: documentKeys.detail(id) });
      queryClient.removeQueries({ queryKey: documentKeys.downloadUrl(id) });
      // Invalidate document lists
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

/**
 * Hook for complete document upload workflow
 * 1. Request upload URL
 * 2. Upload file to S3
 * 3. Create document record
 *
 * @returns Mutation for the complete upload process
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();
  const requestUpload = useRequestUploadUrl();
  const createDocument = useCreateDocument();

  return useMutation({
    mutationFn: async ({
      file,
      documentType,
      metadata,
    }: {
      file: File;
      documentType: string;
      metadata?: any;
    }) => {
      // Step 1: Request upload URL
      const uploadData = await requestUpload.mutateAsync({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        documentType,
      });

      // Step 2: Upload to S3
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Step 3: Create document record
      const document = await createDocument.mutateAsync({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        documentType,
        s3Key: uploadData.s3Key,
        s3Bucket: uploadData.s3Bucket,
        ...metadata,
      });

      return document;
    },
    onSuccess: () => {
      // Invalidate document lists to show the new document
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}
