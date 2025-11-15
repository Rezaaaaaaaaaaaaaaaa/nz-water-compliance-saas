# React Query Setup - Implementation Summary

## Overview

React Query has been successfully configured for state management in the NZ Water Compliance SaaS frontend application. This document summarizes the implementation.

## What Was Implemented

### 1. Query Client Configuration
**File**: `frontend/lib/queryClient.ts`

Configured with optimized settings:
- **Stale Time**: 5 minutes (data stays fresh for 5 minutes)
- **Cache Time (gcTime)**: 10 minutes (unused data is garbage collected after 10 minutes)
- **Refetch on Window Focus**: Disabled (prevents unnecessary API calls when switching tabs)
- **Retry Logic**:
  - Queries retry up to 3 times for 5xx errors and network issues
  - 4xx client errors don't retry (they're usually permanent errors)
  - Exponential backoff delay (1s, 2s, 4s, etc.)
  - Mutations retry once

### 2. Query Provider
**File**: `frontend/providers/QueryProvider.tsx`

A client-side provider component that:
- Wraps the application with `QueryClientProvider`
- Includes React Query DevTools in development mode
- Makes React Query available throughout the app

### 3. Root Layout Integration
**File**: `frontend/app/layout.tsx`

Updated to include the QueryProvider in the component tree:
```
<QueryProvider>
  <ToastProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ToastProvider>
</QueryProvider>
```

### 4. Custom API Hooks

Created comprehensive hooks for all major API operations:

#### Authentication (`frontend/hooks/api/useAuth.ts`)
- `useCurrentUser()` - Fetch current user data
- `useLogin()` - Login mutation
- `useRegister()` - Registration mutation
- `useLogout()` - Logout mutation
- `useRefreshUser()` - Manually refresh user data

#### Assets (`frontend/hooks/api/useAssets.ts`)
- `useAssets(params?)` - List assets with filters
- `useAsset(id)` - Get single asset
- `useAssetStatistics()` - Get asset statistics
- `useCreateAsset()` - Create new asset
- `useUpdateAsset()` - Update asset
- `useDeleteAsset()` - Delete asset

#### Documents (`frontend/hooks/api/useDocuments.ts`)
- `useDocuments(params?)` - List documents
- `useDocument(id)` - Get single document
- `useDocumentDownloadUrl(id)` - Get download URL
- `useRequestUploadUrl()` - Request S3 upload URL
- `useCreateDocument()` - Create document record
- `useDeleteDocument()` - Delete document
- `useUploadDocument()` - Complete upload workflow (request URL + upload + create record)

#### DWSP/Compliance (`frontend/hooks/api/useDwsp.ts`)
- `useDwsps(params?)` - List compliance plans
- `useDwsp(id)` - Get single DWSP
- `useCreateDwsp()` - Create DWSP
- `useUpdateDwsp()` - Update DWSP
- `useValidateDwsp()` - Validate DWSP
- `useSubmitDwsp()` - Submit for approval
- `useDeleteDwsp()` - Delete DWSP

#### Reports (`frontend/hooks/api/useReports.ts`)
- `useReports(params?)` - List reports
- `useReport(id)` - Get single report
- `useMonthlyReport(year, month)` - Generate monthly report
- `useQuarterlyReport(year, quarter)` - Generate quarterly report
- `useAnnualReport(year)` - Generate annual report
- `useCreateReport()` - Create custom report
- `useSubmitReport()` - Submit report
- `useDeleteReport()` - Delete report

#### Analytics (`frontend/hooks/api/useAnalytics.ts`)
- `useDashboardAnalytics(params?)` - Dashboard overview
- `useComplianceAnalytics(params?)` - Compliance metrics
- `useAssetAnalytics(params?)` - Asset metrics
- `useDocumentAnalytics(params?)` - Document metrics
- `useActivityTimeline(params?)` - Activity feed
- `useDwspTrends(params?)` - DWSP trends over time
- `useUserActivity(params?)` - User activity metrics
- `useSystemAnalytics()` - System health metrics

### 5. Updated Dashboard Page
**File**: `frontend/app/dashboard/page.tsx`

The dashboard has been refactored to use React Query hooks:

**Before (Direct API Calls)**:
```typescript
const [stats, setStats] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadDashboardData();
}, []);

const loadDashboardData = async () => {
  try {
    const [assetsData, complianceData, documentsData, reportsData] =
      await Promise.all([...]);
    setStats({ ... });
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

**After (React Query Hooks)**:
```typescript
const { data: assetStats, isLoading: assetsLoading } = useAssetStatistics();
const { data: complianceData, isLoading: complianceLoading } = useDwsps({ limit: 1000 });
const { data: documentsData, isLoading: documentsLoading } = useDocuments({ limit: 1 });
const { data: reportsData, isLoading: reportsLoading } = useReports({ limit: 1 });

const loading = assetsLoading || complianceLoading || documentsLoading || reportsLoading;
```

**Benefits**:
- ✅ Automatic caching - data is cached for 5 minutes
- ✅ Automatic refetching - stale data is automatically refreshed
- ✅ No manual state management - React Query handles it
- ✅ Built-in loading and error states
- ✅ Parallel requests - all queries run concurrently
- ✅ Cache invalidation - mutations automatically refresh related data

### 6. Central Export Point
**File**: `frontend/hooks/api/index.ts`

All hooks are exported from a single file for easy imports:
```typescript
import { useAssets, useCreateAsset, useDeleteAsset } from '@/hooks/api';
```

### 7. Documentation

Created comprehensive documentation:
- `frontend/hooks/api/README.md` - Complete hook reference and best practices
- `frontend/hooks/api/EXAMPLES.md` - Real-world usage examples
- `REACT_QUERY_SETUP.md` - This implementation summary

## Key Features

### Automatic Cache Management
- Data is cached automatically
- Smart invalidation after mutations
- Configurable stale/cache times per query

### Optimistic Updates Ready
- Infrastructure in place for optimistic UI updates
- Easy to implement per mutation

### Error Handling
- Global error interceptor in API client
- Per-hook error handling support
- Proper TypeScript error types

### Loading States
- `isLoading` - Initial load
- `isFetching` - Any fetch (including background)
- `isRefetching` - Background refetch
- `isPending` - Mutation in progress

### DevTools Integration
- React Query DevTools enabled in development
- Visual query/mutation debugging
- Cache inspection

## Usage Examples

### Basic Query
```typescript
const { data, isLoading, error } = useAssets();

if (isLoading) return <Loading />;
if (error) return <Error />;
return <AssetList assets={data.assets} />;
```

### Mutation
```typescript
const createMutation = useCreateAsset();

await createMutation.mutateAsync({
  name: 'New Asset',
  type: 'RESERVOIR'
});
// Asset list automatically refetches!
```

### Conditional Fetching
```typescript
const { data } = useAsset(assetId, !!assetId); // Only fetch if assetId exists
```

### Pagination
```typescript
const [page, setPage] = useState(0);
const { data } = useAssets({
  limit: 20,
  offset: page * 20
});
```

## Migration Guide

To migrate existing pages to React Query:

1. **Replace `useState` and `useEffect` with hooks**:
   ```typescript
   // Before
   const [data, setData] = useState(null);
   useEffect(() => { loadData(); }, []);

   // After
   const { data } = useAssets();
   ```

2. **Replace direct API calls with mutations**:
   ```typescript
   // Before
   await assetsApi.create(data);
   await loadData(); // manual refetch

   // After
   const createMutation = useCreateAsset();
   await createMutation.mutateAsync(data);
   // automatic refetch!
   ```

3. **Use provided loading states**:
   ```typescript
   // Before
   const [loading, setLoading] = useState(true);

   // After
   const { isLoading } = useAssets();
   ```

## Performance Benefits

1. **Reduced API Calls**: Cached data prevents unnecessary requests
2. **Parallel Fetching**: Multiple queries run simultaneously
3. **Background Updates**: Stale data is refreshed in the background
4. **Deduplication**: Identical requests are automatically deduplicated
5. **Prefetching**: Data can be prefetched for instant navigation

## Next Steps

Consider implementing:

1. **Optimistic Updates**: Update UI before API response for better UX
2. **Infinite Queries**: For long lists with infinite scroll
3. **Polling**: Auto-refresh critical data at intervals
4. **Prefetching**: Prefetch data on hover/focus for instant navigation
5. **Suspense Mode**: Use React Suspense for better loading states (when stable)

## Files Created

```
frontend/
├── lib/
│   └── queryClient.ts              # Query client configuration
├── providers/
│   └── QueryProvider.tsx           # Provider component
├── hooks/
│   └── api/
│       ├── index.ts                # Central exports
│       ├── useAuth.ts              # Authentication hooks
│       ├── useAssets.ts            # Asset management hooks
│       ├── useDocuments.ts         # Document management hooks
│       ├── useDwsp.ts              # DWSP/compliance hooks
│       ├── useReports.ts           # Report hooks
│       ├── useAnalytics.ts         # Analytics hooks
│       ├── README.md               # Documentation
│       └── EXAMPLES.md             # Usage examples
└── app/
    ├── layout.tsx                  # Updated with QueryProvider
    └── dashboard/
        └── page.tsx                # Updated to use hooks

REACT_QUERY_SETUP.md                # This file
```

## Testing

To verify the setup works:

1. Start the development server: `npm run dev`
2. Open the dashboard page: `http://localhost:3000/dashboard`
3. Open React Query DevTools (bottom-right corner)
4. Watch queries execute and cache in real-time

## Support

For questions or issues:
- See `frontend/hooks/api/README.md` for detailed hook documentation
- See `frontend/hooks/api/EXAMPLES.md` for practical examples
- Check React Query docs: https://tanstack.com/query/latest
- Review the dashboard implementation in `frontend/app/dashboard/page.tsx`

## Summary

React Query is now fully integrated into the NZ Water Compliance SaaS frontend:
- ✅ Query client configured with optimal settings
- ✅ Provider integrated into app layout
- ✅ 40+ hooks created for all API operations
- ✅ Dashboard migrated to use React Query
- ✅ Comprehensive documentation provided
- ✅ DevTools enabled for debugging

The application now has enterprise-grade state management with automatic caching, background updates, and optimal performance.
