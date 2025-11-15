# React Query Hooks - Usage Examples

This document provides practical examples of using React Query hooks in the NZ Water Compliance SaaS application.

## Dashboard Page Example

The dashboard page has been updated to use React Query hooks. See `frontend/app/dashboard/page.tsx` for the complete implementation.

```typescript
'use client';

import React from 'react';
import { useAssetStatistics } from '@/hooks/api/useAssets';
import { useDwsps } from '@/hooks/api/useDwsp';
import { useDocuments } from '@/hooks/api/useDocuments';
import { useReports } from '@/hooks/api/useReports';

export default function DashboardPage() {
  // Fetch data using React Query hooks
  const { data: assetStats, isLoading: assetsLoading } = useAssetStatistics();
  const { data: complianceData, isLoading: complianceLoading } = useDwsps({ limit: 1000 });
  const { data: documentsData, isLoading: documentsLoading } = useDocuments({ limit: 1 });
  const { data: reportsData, isLoading: reportsLoading } = useReports({ limit: 1 });

  // Combine loading states
  const loading = assetsLoading || complianceLoading || documentsLoading || reportsLoading;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1>Assets: {assetStats?.total}</h1>
      <h2>Compliance Plans: {complianceData?.total}</h2>
      {/* ... rest of the UI */}
    </div>
  );
}
```

## Asset Management Example

```typescript
'use client';

import { useState } from 'react';
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from '@/hooks/api';

export default function AssetManagementPage() {
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch assets with pagination
  const {
    data: assetsData,
    isLoading,
    error,
    refetch
  } = useAssets({
    limit,
    offset: page * limit
  });

  // Mutation hooks
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const deleteMutation = useDeleteAsset();

  const handleCreateAsset = async (assetData) => {
    try {
      await createMutation.mutateAsync(assetData);
      // No need to manually refetch - React Query automatically invalidates
      alert('Asset created successfully!');
    } catch (error) {
      alert('Failed to create asset');
    }
  };

  const handleUpdateAsset = async (id, updates) => {
    try {
      await updateMutation.mutateAsync({ id, data: updates });
      alert('Asset updated successfully!');
    } catch (error) {
      alert('Failed to update asset');
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!confirm('Are you sure?')) return;

    try {
      await deleteMutation.mutateAsync(id);
      alert('Asset deleted successfully!');
    } catch (error) {
      alert('Failed to delete asset');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <button onClick={() => handleCreateAsset({ name: 'New Asset', type: 'RESERVOIR' })}>
        Create Asset
      </button>

      {assetsData?.assets?.map(asset => (
        <div key={asset.id}>
          <h3>{asset.name}</h3>
          <button onClick={() => handleUpdateAsset(asset.id, { status: 'ACTIVE' })}>
            Update
          </button>
          <button onClick={() => handleDeleteAsset(asset.id)}>
            Delete
          </button>
        </div>
      ))}

      <Pagination
        currentPage={page}
        totalPages={Math.ceil((assetsData?.total || 0) / limit)}
        onPageChange={setPage}
      />
    </div>
  );
}
```

## Document Upload Example

```typescript
'use client';

import { useUploadDocument } from '@/hooks/api';

export default function DocumentUploadPage() {
  const uploadMutation = useUploadDocument();

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const document = await uploadMutation.mutateAsync({
        file,
        documentType: 'DWSP',
        metadata: {
          description: 'Uploaded via React Query',
          category: 'Compliance'
        }
      });

      console.log('Document uploaded:', document);
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file');
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={uploadMutation.isPending}
      />

      {uploadMutation.isPending && (
        <div>Uploading... {Math.round((uploadMutation.progress || 0) * 100)}%</div>
      )}

      {uploadMutation.isError && (
        <div>Error: {uploadMutation.error.message}</div>
      )}

      {uploadMutation.isSuccess && (
        <div>Upload complete!</div>
      )}
    </div>
  );
}
```

## DWSP Detail Page Example

```typescript
'use client';

import { useDwsp, useUpdateDwsp, useSubmitDwsp } from '@/hooks/api';
import { useParams } from 'next/navigation';

export default function DwspDetailPage() {
  const params = useParams();
  const dwspId = params.id as string;

  // Fetch DWSP details
  const { data: dwsp, isLoading, error } = useDwsp(dwspId);

  // Mutations
  const updateMutation = useUpdateDwsp();
  const submitMutation = useSubmitDwsp();

  const handleUpdate = async (updates) => {
    try {
      await updateMutation.mutateAsync({
        id: dwspId,
        data: updates
      });
      alert('DWSP updated successfully!');
    } catch (error) {
      alert('Failed to update DWSP');
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Submit this DWSP for approval?')) return;

    try {
      await submitMutation.mutateAsync(dwspId);
      alert('DWSP submitted successfully!');
    } catch (error) {
      alert('Failed to submit DWSP');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!dwsp) return <NotFound />;

  return (
    <div>
      <h1>{dwsp.title}</h1>
      <p>Status: {dwsp.status}</p>

      <button
        onClick={() => handleUpdate({ title: 'Updated Title' })}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? 'Updating...' : 'Update Title'}
      </button>

      {dwsp.status === 'DRAFT' && (
        <button
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
        </button>
      )}
    </div>
  );
}
```

## Analytics Dashboard Example

```typescript
'use client';

import { useDashboardAnalytics, useAssetAnalytics, useComplianceAnalytics } from '@/hooks/api';
import { useState } from 'react';

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: '2025-01-01',
    endDate: '2025-12-31'
  });

  // Fetch analytics data
  const { data: dashboardData } = useDashboardAnalytics(dateRange);
  const { data: assetData } = useAssetAnalytics();
  const { data: complianceData } = useComplianceAnalytics();

  return (
    <div>
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
      />

      <div className="grid grid-cols-3 gap-4">
        <div>
          <h2>Dashboard Metrics</h2>
          <pre>{JSON.stringify(dashboardData, null, 2)}</pre>
        </div>

        <div>
          <h2>Asset Analytics</h2>
          <pre>{JSON.stringify(assetData, null, 2)}</pre>
        </div>

        <div>
          <h2>Compliance Analytics</h2>
          <pre>{JSON.stringify(complianceData, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
```

## Report Generation Example

```typescript
'use client';

import { useMonthlyReport, useQuarterlyReport, useAnnualReport } from '@/hooks/api';
import { useState } from 'react';

export default function ReportGeneratorPage() {
  const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(1);
  const [quarter, setQuarter] = useState(1);

  // Conditionally fetch based on report type
  const {
    data: monthlyReport,
    isLoading: monthlyLoading
  } = useMonthlyReport(year, month, reportType === 'monthly');

  const {
    data: quarterlyReport,
    isLoading: quarterlyLoading
  } = useQuarterlyReport(year, quarter, reportType === 'quarterly');

  const {
    data: annualReport,
    isLoading: annualLoading
  } = useAnnualReport(year, reportType === 'annual');

  const isLoading = monthlyLoading || quarterlyLoading || annualLoading;

  let reportData;
  if (reportType === 'monthly') reportData = monthlyReport;
  if (reportType === 'quarterly') reportData = quarterlyReport;
  if (reportType === 'annual') reportData = annualReport;

  return (
    <div>
      <select value={reportType} onChange={(e) => setReportType(e.target.value as any)}>
        <option value="monthly">Monthly</option>
        <option value="quarterly">Quarterly</option>
        <option value="annual">Annual</option>
      </select>

      <input
        type="number"
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
      />

      {reportType === 'monthly' && (
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      )}

      {reportType === 'quarterly' && (
        <select value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>
          {[1,2,3,4].map(q => (
            <option key={q} value={q}>Q{q}</option>
          ))}
        </select>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ReportViewer data={reportData} />
      )}
    </div>
  );
}
```

## Authentication Example

```typescript
'use client';

import { useLogin, useRegister, useLogout, useCurrentUser } from '@/hooks/api';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  // Get current user
  const { data: user, isLoading: userLoading } = useCurrentUser();

  // Auth mutations
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const handleLogin = async (email: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ email, password });
      router.push('/dashboard');
    } catch (error) {
      alert('Login failed');
    }
  };

  const handleRegister = async (formData) => {
    try {
      await registerMutation.mutateAsync(formData);
      router.push('/dashboard');
    } catch (error) {
      alert('Registration failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      // Automatically redirects to /login
    } catch (error) {
      alert('Logout failed');
    }
  };

  if (userLoading) return <LoadingSpinner />;

  if (user) {
    return (
      <div>
        <p>Welcome, {user.firstName}!</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div>
      <LoginForm onSubmit={handleLogin} loading={loginMutation.isPending} />
      <RegisterForm onSubmit={handleRegister} loading={registerMutation.isPending} />
    </div>
  );
}
```

## Infinite Scroll Example

```typescript
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { assetsApi } from '@/lib/api';
import { assetKeys } from '@/hooks/api';

export default function InfiniteAssetList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: assetKeys.lists(),
    queryFn: ({ pageParam = 0 }) => assetsApi.list({
      limit: 20,
      offset: pageParam
    }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + (page.assets?.length || 0), 0);
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    initialPageParam: 0,
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.assets?.map(asset => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading more...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## Prefetching Data Example

```typescript
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { assetKeys } from '@/hooks/api';
import { assetsApi } from '@/lib/api';
import Link from 'next/link';

export default function AssetList() {
  const queryClient = useQueryClient();
  const { data: assets } = useAssets();

  // Prefetch asset details on hover for instant navigation
  const prefetchAsset = (assetId: string) => {
    queryClient.prefetchQuery({
      queryKey: assetKeys.detail(assetId),
      queryFn: () => assetsApi.get(assetId),
    });
  };

  return (
    <div>
      {assets?.assets?.map(asset => (
        <Link
          key={asset.id}
          href={`/dashboard/assets/${asset.id}`}
          onMouseEnter={() => prefetchAsset(asset.id)}
        >
          <div>{asset.name}</div>
        </Link>
      ))}
    </div>
  );
}
```
