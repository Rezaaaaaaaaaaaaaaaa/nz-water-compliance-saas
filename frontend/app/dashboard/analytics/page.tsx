'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui';

interface DashboardData {
  overview: {
    totalAssets: number;
    criticalAssets: number;
    activeDWSPs: number;
    pendingReports: number;
    overdueItems: number;
    recentIncidents: number;
    complianceScore: number;
  };
  assets: {
    byRiskLevel: Array<{ riskLevel: string; count: number }>;
    byCondition: Array<{ condition: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
    criticalAssets: Array<{
      id: string;
      name: string;
      type: string;
      condition: string;
      riskLevel: string;
    }>;
  };
  documents: {
    totalDocuments: number;
    byType: Array<{ type: string; count: number }>;
    recentUploads: number;
    storageUsedMB: number;
  };
  dwspTrends: {
    trends: Array<{
      month: string;
      total: number;
      approved: number;
      rejected: number;
    }>;
  };
  users: {
    activeUsersLast30Days: number;
    topContributors: Array<{
      userId: string;
      userName: string;
      activityCount: number;
    }>;
  };
}

export default function AnalyticsPage() {
  const toast = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const response = await apiClient.get('/analytics/dashboard');
      setData(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(type: 'assets' | 'documents' | 'compliance-overview', format: string = 'csv') {
    try {
      setExporting(true);
      const response = await apiClient.get(`/export/${type}?format=${format}`, {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'text/plain'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Export completed successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>

        {/* Compliance Score Skeleton */}
        <div className="bg-gray-200 rounded-lg h-40"></div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 rounded-lg h-64"></div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadDashboardData}
          className="mt-2 text-red-700 underline hover:text-red-900"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { overview, assets, documents, dwspTrends, users } = data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your compliance management
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('assets')}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {exporting ? 'Exporting...' : 'Export Assets'}
          </button>
          <button
            onClick={() => handleExport('compliance-overview')}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {exporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* Compliance Score Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium opacity-90">Overall Compliance Score</h2>
            <p className="text-5xl font-bold mt-2">{overview.complianceScore}</p>
            <p className="text-sm opacity-75 mt-1">out of 100</p>
          </div>
          <div className="text-right">
            <div className="w-32 h-32 relative">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(overview.complianceScore / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                {overview.complianceScore}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Assets"
          value={overview.totalAssets}
          color="bg-blue-500"
          icon="📦"
        />
        <StatCard
          title="Critical Assets"
          value={overview.criticalAssets}
          color="bg-red-500"
          icon="⚠️"
        />
        <StatCard
          title="Active DWSPs"
          value={overview.activeDWSPs}
          color="bg-green-500"
          icon="✓"
        />
        <StatCard
          title="Pending Reports"
          value={overview.pendingReports}
          color="bg-yellow-500"
          icon="📄"
        />
        <StatCard
          title="Overdue Items"
          value={overview.overdueItems}
          color="bg-red-600"
          icon="⏰"
        />
        <StatCard
          title="Recent Incidents"
          value={overview.recentIncidents}
          color="bg-orange-500"
          icon="⚡"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets by Risk Level */}
        <ChartCard title="Assets by Risk Level">
          <BarChart
            data={assets.byRiskLevel.map((item) => ({
              label: item.riskLevel,
              value: item.count,
              color: getRiskLevelColor(item.riskLevel),
            }))}
          />
        </ChartCard>

        {/* Assets by Condition */}
        <ChartCard title="Assets by Condition">
          <BarChart
            data={assets.byCondition.map((item) => ({
              label: item.condition.replace(/_/g, ' '),
              value: item.count,
              color: getConditionColor(item.condition),
            }))}
          />
        </ChartCard>
      </div>

      {/* Documents Section */}
      <ChartCard title="Document Management">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{documents.totalDocuments}</p>
            <p className="text-sm text-gray-600">Total Documents</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{documents.recentUploads}</p>
            <p className="text-sm text-gray-600">Last 30 Days</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{documents.storageUsedMB} MB</p>
            <p className="text-sm text-gray-600">Storage Used</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">
              {documents.byType.length}
            </p>
            <p className="text-sm text-gray-600">Document Types</p>
          </div>
        </div>
        <div className="space-y-2">
          {documents.byType.map((item) => (
            <div key={item.type} className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-600">{item.type}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${(item.count / documents.totalDocuments) * 100}%`,
                  }}
                />
              </div>
              <div className="w-12 text-right text-sm font-medium">{item.count}</div>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* DWSP Trends */}
      {dwspTrends.trends.length > 0 && (
        <ChartCard title="DWSP Submission Trends (Last 12 Months)">
          <div className="h-64 flex items-end justify-between gap-2">
            {dwspTrends.trends.map((item) => {
              const maxValue = Math.max(...dwspTrends.trends.map((t) => t.total));
              const height = maxValue > 0 ? (item.total / maxValue) * 100 : 0;

              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex-1 flex flex-col justify-end w-full">
                    <div
                      className="bg-green-500 rounded-t"
                      style={{ height: `${(item.approved / item.total) * height || 0}%` }}
                      title={`Approved: ${item.approved}`}
                    />
                    <div
                      className="bg-yellow-500"
                      style={{
                        height: `${((item.total - item.approved - item.rejected) / item.total) * height || 0}%`,
                      }}
                      title={`Pending: ${item.total - item.approved - item.rejected}`}
                    />
                    <div
                      className="bg-red-500 rounded-b"
                      style={{ height: `${(item.rejected / item.total) * height || 0}%` }}
                      title={`Rejected: ${item.rejected}`}
                    />
                  </div>
                  <div className="text-xs text-gray-600 transform -rotate-45 origin-top-left">
                    {item.month}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span>Rejected</span>
            </div>
          </div>
        </ChartCard>
      )}

      {/* User Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="User Activity">
          <div className="text-center mb-4">
            <p className="text-4xl font-bold text-blue-600">{users.activeUsersLast30Days}</p>
            <p className="text-gray-600">Active users in last 30 days</p>
          </div>
        </ChartCard>

        <ChartCard title="Top Contributors">
          <div className="space-y-3">
            {users.topContributors.map((user, index) => (
              <div key={user.userId} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{user.userName}</p>
                  <p className="text-sm text-gray-500">{user.activityCount} activities</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Critical Assets Table */}
      {assets.criticalAssets.length > 0 && (
        <ChartCard title="Critical Assets Requiring Attention">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.criticalAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {asset.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {asset.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          asset.condition === 'VERY_POOR'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {asset.condition.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          asset.riskLevel === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : asset.riskLevel === 'HIGH'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {asset.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
    </div>
  );
}

// Reusable Components

function StatCard({
  title,
  value,
  color,
  icon,
}: {
  title: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function BarChart({
  data,
}: {
  data: Array<{ label: string; value: number; color: string }>;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-32 text-sm text-gray-600">{item.label}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
            <div
              className={`${item.color} h-full rounded-full flex items-center justify-end px-3 text-white text-sm font-medium`}
              style={{
                width: `${Math.max((item.value / maxValue) * 100, 5)}%`,
              }}
            >
              {item.value > 0 && item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getRiskLevelColor(level: string): string {
  switch (level) {
    case 'CRITICAL':
      return 'bg-red-600';
    case 'HIGH':
      return 'bg-orange-500';
    case 'MEDIUM':
      return 'bg-yellow-500';
    case 'LOW':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
}

function getConditionColor(condition: string): string {
  switch (condition) {
    case 'VERY_POOR':
      return 'bg-red-600';
    case 'POOR':
      return 'bg-orange-500';
    case 'FAIR':
      return 'bg-yellow-500';
    case 'GOOD':
      return 'bg-green-500';
    case 'EXCELLENT':
      return 'bg-green-600';
    default:
      return 'bg-gray-500';
  }
}
