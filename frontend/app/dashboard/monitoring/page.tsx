'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export default function MonitoringDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadMonitoringData();
    // Refresh every 30 seconds
    const interval = setInterval(loadMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadMonitoringData() {
    try {
      setLoading(true);
      const [healthRes, metricsRes, logsRes] = await Promise.all([
        apiClient.get('/health'),
        apiClient.get('/analytics/metrics'),
        apiClient.get('/audit-logs', { params: { limit: 10 } }),
      ]);

      setSystemHealth(healthRes.data);
      setMetrics(metricsRes.data.data);
      setAuditLogs(logsRes.data.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'ok':
        return 'bg-green-500';
      case 'degraded':
      case 'warning':
        return 'bg-yellow-500';
      case 'unhealthy':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getHealthStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'ok':
        return 'Healthy';
      case 'degraded':
      case 'warning':
        return 'Degraded';
      case 'unhealthy':
      case 'error':
        return 'Unhealthy';
      default:
        return 'Unknown';
    }
  };

  if (loading && !systemHealth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
        <p className="text-gray-600 mt-1">Real-time system health and performance metrics</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">API Status</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {getHealthStatusText(systemHealth?.status || 'unknown')}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full ${getHealthStatusColor(systemHealth?.status)} animate-pulse`}></div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Database</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {getHealthStatusText(systemHealth?.database?.status || 'unknown')}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full ${getHealthStatusColor(systemHealth?.database?.status)}`}></div>
          </div>
          {systemHealth?.database?.responseTime && (
            <p className="text-xs text-gray-500 mt-2">
              Response: {systemHealth.database.responseTime}ms
            </p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Redis Cache</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {getHealthStatusText(systemHealth?.redis?.status || 'unknown')}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full ${getHealthStatusColor(systemHealth?.redis?.status)}`}></div>
          </div>
          {systemHealth?.redis?.responseTime && (
            <p className="text-xs text-gray-500 mt-2">
              Response: {systemHealth.redis.responseTime}ms
            </p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Storage (S3)</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {getHealthStatusText(systemHealth?.storage?.status || 'unknown')}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full ${getHealthStatusColor(systemHealth?.storage?.status)}`}></div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Performance</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Average Response Time</span>
                  <span className="font-medium text-gray-900">
                    {metrics.api?.avgResponseTime || 0}ms
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Requests (24h)</span>
                  <span className="font-medium text-gray-900">
                    {metrics.api?.totalRequests?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Error Rate</span>
                  <span className={`font-medium ${
                    (metrics.api?.errorRate || 0) > 5 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {(metrics.api?.errorRate || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cache Performance</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Hit Rate</span>
                  <span className="font-medium text-green-600">
                    {(metrics.cache?.hitRate || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${metrics.cache?.hitRate || 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Memory Used</span>
                  <span className="font-medium text-gray-900">
                    {metrics.cache?.memoryUsed || '0 MB'}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Connected Clients</span>
                  <span className="font-medium text-gray-900">
                    {metrics.cache?.connectedClients || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Performance</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Active Connections</span>
                  <span className="font-medium text-gray-900">
                    {metrics.database?.activeConnections || 0}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Query Time (avg)</span>
                  <span className="font-medium text-gray-900">
                    {metrics.database?.avgQueryTime || 0}ms
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Total Records</span>
                  <span className="font-medium text-gray-900">
                    {metrics.database?.totalRecords?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Resources</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">CPU Usage</span>
                <span className="font-medium text-gray-900">
                  {(systemHealth?.system?.cpuUsage || 0).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    (systemHealth?.system?.cpuUsage || 0) > 80 ? 'bg-red-500' :
                    (systemHealth?.system?.cpuUsage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemHealth?.system?.cpuUsage || 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Memory Usage</span>
                <span className="font-medium text-gray-900">
                  {(systemHealth?.system?.memoryUsage || 0).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    (systemHealth?.system?.memoryUsage || 0) > 80 ? 'bg-red-500' :
                    (systemHealth?.system?.memoryUsage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemHealth?.system?.memoryUsage || 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Disk Usage</span>
                <span className="font-medium text-gray-900">
                  {(systemHealth?.system?.diskUsage || 0).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    (systemHealth?.system?.diskUsage || 0) > 80 ? 'bg-red-500' :
                    (systemHealth?.system?.diskUsage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemHealth?.system?.diskUsage || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Background Jobs</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Active Jobs</span>
              <span className="text-lg font-semibold text-blue-600">
                {metrics?.jobs?.active || 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Completed (24h)</span>
              <span className="text-lg font-semibold text-green-600">
                {metrics?.jobs?.completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Failed (24h)</span>
              <span className="text-lg font-semibold text-red-600">
                {metrics?.jobs?.failed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Waiting</span>
              <span className="text-lg font-semibold text-yellow-600">
                {metrics?.jobs?.waiting || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button
            onClick={loadMonitoringData}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                        log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{log.entityType}</span>
                    </div>
                    {log.description && (
                      <p className="text-sm text-gray-600 mt-2">{log.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{log.user?.email || 'System'}</span>
                      <span>•</span>
                      <span>{log.ipAddress}</span>
                      <span>•</span>
                      <span>
                        {new Date(log.createdAt).toLocaleString('en-NZ', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Auto-refreshing every 30 seconds • Last updated: {new Date().toLocaleTimeString('en-NZ')}
        </p>
      </div>
    </div>
  );
}
