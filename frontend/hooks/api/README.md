# React Query API Hooks

This directory contains React Query hooks for managing server state in the NZ Water Compliance SaaS application.

## Overview

React Query is configured with the following defaults:
- **Stale Time**: 5 minutes (data is considered fresh for 5 minutes)
- **Cache Time**: 10 minutes (inactive data is garbage collected after 10 minutes)
- **Refetch on Window Focus**: Disabled (prevents unnecessary refetches when switching tabs)
- **Retry Logic**: Failed requests retry up to 3 times with exponential backoff (excluding 4xx errors)

## Available Hooks

### Authentication (`useAuth.ts`)

```typescript
import { useCurrentUser, useLogin, useRegister, useLogout } from '@/hooks/api';

// Get current user
const { data: user, isLoading } = useCurrentUser();

// Login
const loginMutation = useLogin();
await loginMutation.mutateAsync({ email, password });

// Register
const registerMutation = useRegister();
await registerMutation.mutateAsync({ email, password, firstName, lastName });

// Logout
const logoutMutation = useLogout();
await logoutMutation.mutateAsync();
```

### Assets (`useAssets.ts`)

```typescript
import { useAssets, useAsset, useAssetStatistics, useCreateAsset, useUpdateAsset, useDeleteAsset } from '@/hooks/api';

// List assets
const { data: assets, isLoading } = useAssets({ limit: 10, offset: 0 });

// Get single asset
const { data: asset } = useAsset(assetId);

// Get asset statistics
const { data: stats } = useAssetStatistics();

// Create asset
const createMutation = useCreateAsset();
await createMutation.mutateAsync({ name: 'New Asset', type: 'RESERVOIR' });

// Update asset
const updateMutation = useUpdateAsset();
await updateMutation.mutateAsync({ id: assetId, data: { name: 'Updated Name' } });

// Delete asset
const deleteMutation = useDeleteAsset();
await deleteMutation.mutateAsync(assetId);
```

### Documents (`useDocuments.ts`)

```typescript
import { useDocuments, useDocument, useUploadDocument, useDeleteDocument } from '@/hooks/api';

// List documents
const { data: documents } = useDocuments({ limit: 20 });

// Get single document
const { data: document } = useDocument(documentId);

// Upload document (handles full workflow)
const uploadMutation = useUploadDocument();
await uploadMutation.mutateAsync({
  file: fileObject,
  documentType: 'DWSP',
  metadata: { description: 'Document description' }
});

// Delete document
const deleteMutation = useDeleteDocument();
await deleteMutation.mutateAsync(documentId);
```

### DWSP (Compliance Plans) (`useDwsp.ts`)

```typescript
import { useDwsps, useDwsp, useCreateDwsp, useUpdateDwsp, useSubmitDwsp } from '@/hooks/api';

// List DWSPs
const { data: dwsps } = useDwsps({ status: 'DRAFT' });

// Get single DWSP
const { data: dwsp } = useDwsp(dwspId);

// Create DWSP
const createMutation = useCreateDwsp();
await createMutation.mutateAsync({ title: 'New DWSP', description: 'Description' });

// Update DWSP
const updateMutation = useUpdateDwsp();
await updateMutation.mutateAsync({ id: dwspId, data: { title: 'Updated Title' } });

// Submit DWSP
const submitMutation = useSubmitDwsp();
await submitMutation.mutateAsync(dwspId);
```

### Reports (`useReports.ts`)

```typescript
import { useReports, useReport, useMonthlyReport, useCreateReport } from '@/hooks/api';

// List reports
const { data: reports } = useReports();

// Get single report
const { data: report } = useReport(reportId);

// Generate monthly report
const { data: monthlyReport } = useMonthlyReport(2025, 1); // January 2025

// Create custom report
const createMutation = useCreateReport();
await createMutation.mutateAsync({ type: 'COMPLIANCE', period: 'Q1' });
```

### Analytics (`useAnalytics.ts`)

```typescript
import { useDashboardAnalytics, useComplianceAnalytics, useAssetAnalytics } from '@/hooks/api';

// Dashboard analytics
const { data: dashboardData } = useDashboardAnalytics({
  startDate: '2025-01-01',
  endDate: '2025-12-31'
});

// Compliance analytics
const { data: complianceData } = useComplianceAnalytics();

// Asset analytics
const { data: assetData } = useAssetAnalytics();
```

## Query Keys

Each hook module exports query keys for advanced usage:

```typescript
import { assetKeys, queryClient } from '@/hooks/api';

// Invalidate all asset queries
queryClient.invalidateQueries({ queryKey: assetKeys.all });

// Invalidate specific asset
queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });

// Prefetch data
queryClient.prefetchQuery({
  queryKey: assetKeys.list({ limit: 10 }),
  queryFn: () => assetsApi.list({ limit: 10 })
});
```

## Error Handling

All hooks automatically handle errors using the global error interceptor. You can also handle errors locally:

```typescript
const { data, error, isError } = useAssets();

if (isError) {
  console.error('Failed to load assets:', error);
}

// Or with mutations
const createMutation = useCreateAsset();

createMutation.mutate(
  { name: 'New Asset' },
  {
    onError: (error) => {
      console.error('Failed to create asset:', error);
    },
    onSuccess: (data) => {
      console.log('Asset created:', data);
    }
  }
);
```

## Loading States

```typescript
const { data, isLoading, isFetching, isRefetching } = useAssets();

// isLoading: true on initial load
// isFetching: true whenever data is being fetched (including refetches)
// isRefetching: true when refetching data after initial load
```

## Optimistic Updates

Example of optimistic updates for better UX:

```typescript
const queryClient = useQueryClient();
const updateMutation = useUpdateAsset();

updateMutation.mutate(
  { id: assetId, data: updates },
  {
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: assetKeys.detail(variables.id) });

      // Snapshot the previous value
      const previousAsset = queryClient.getQueryData(assetKeys.detail(variables.id));

      // Optimistically update
      queryClient.setQueryData(assetKeys.detail(variables.id), (old) => ({
        ...old,
        ...variables.data
      }));

      return { previousAsset };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        assetKeys.detail(variables.id),
        context.previousAsset
      );
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) });
    }
  }
);
```

## DevTools

React Query DevTools are enabled in development mode. Access them via the floating icon in the bottom-right corner of the screen.

## Best Practices

1. **Use the hooks**: Always use the provided hooks instead of calling the API directly
2. **Handle loading states**: Show loading indicators while data is being fetched
3. **Handle errors**: Provide user-friendly error messages
4. **Invalidate wisely**: Use query invalidation to keep data fresh after mutations
5. **Leverage caching**: Take advantage of automatic caching to reduce unnecessary requests
6. **Use query keys**: Export and reuse query keys for consistency

## Example: Complete CRUD Flow

```typescript
function AssetManager() {
  const { data: assets, isLoading } = useAssets();
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const deleteMutation = useDeleteAsset();

  const handleCreate = async (data) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Asset created successfully');
    } catch (error) {
      toast.error('Failed to create asset');
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      toast.success('Asset updated successfully');
    } catch (error) {
      toast.error('Failed to update asset');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Asset deleted successfully');
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div>
      {assets.map(asset => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onUpdate={(data) => handleUpdate(asset.id, data)}
          onDelete={() => handleDelete(asset.id)}
        />
      ))}
      <CreateAssetForm onSubmit={handleCreate} />
    </div>
  );
}
```
