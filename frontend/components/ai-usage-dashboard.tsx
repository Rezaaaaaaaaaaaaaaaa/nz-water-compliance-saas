'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Zap, BarChart3, Loader2 } from 'lucide-react';

interface UsageStats {
  quota: {
    tier: string;
    maxRequests: number;
    requestCount: number;
    maxTokens: number;
    tokenCount: number;
    maxCostCents: number;
    costCents: number;
    chatRequestCount: number;
    documentAnalysisCount: number;
    waterQualityAnalysisCount: number;
    reportGenerationCount: number;
  };
  summary: {
    requestsUsed: number;
    requestsRemaining: number;
    tokensUsed: number;
    tokensRemaining: number;
    costUsed: number;
    costRemaining: number;
    percentUsed: number;
  };
  recentLogs: Array<{
    feature: string;
    operation: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
    createdAt: string;
  }>;
}

export function AIUsageDashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/usage', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-600';
    if (percent >= 75) return 'bg-yellow-600';
    return 'bg-blue-600';
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'PREMIUM':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'BASIC':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FREE':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">Error loading usage statistics: {error}</p>
        <button
          onClick={fetchUsageStats}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Usage Dashboard</h2>
          <p className="text-gray-600 mt-1">Monitor your AI feature usage and quota</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Current Tier:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTierBadgeColor(stats.quota.tier)}`}>
            {stats.quota.tier}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Requests */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Requests</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.summary.requestsUsed}
            <span className="text-lg text-gray-400">/{stats.quota.maxRequests}</span>
          </p>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(stats.summary.percentUsed)}`}
              style={{ width: `${Math.min(stats.summary.percentUsed, 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {stats.summary.requestsRemaining} remaining
          </p>
        </div>

        {/* Tokens */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Tokens</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.summary.tokensUsed.toLocaleString()}
            <span className="text-lg text-gray-400">
              /{stats.quota.maxTokens.toLocaleString()}
            </span>
          </p>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor((stats.summary.tokensUsed / stats.quota.maxTokens) * 100)}`}
              style={{ width: `${Math.min((stats.summary.tokensUsed / stats.quota.maxTokens) * 100, 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {stats.summary.tokensRemaining.toLocaleString()} remaining
          </p>
        </div>

        {/* Cost */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">Cost</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${(stats.summary.costUsed / 100).toFixed(2)}
            <span className="text-lg text-gray-400">
              /${(stats.quota.maxCostCents / 100).toFixed(0)}
            </span>
          </p>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor((stats.summary.costUsed / stats.quota.maxCostCents) * 100)}`}
              style={{ width: `${Math.min((stats.summary.costUsed / stats.quota.maxCostCents) * 100, 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            ${(stats.summary.costRemaining / 100).toFixed(2)} remaining
          </p>
        </div>

        {/* Usage Percentage */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Usage</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.summary.percentUsed}%
          </p>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(stats.summary.percentUsed)}`}
              style={{ width: `${Math.min(stats.summary.percentUsed, 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            of monthly quota
          </p>
        </div>
      </div>

      {/* Feature Usage Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Feature Usage Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">💬 Compliance Assistant</p>
            <p className="text-2xl font-bold text-gray-900">{stats.quota.chatRequestCount}</p>
            <p className="text-xs text-gray-500">requests this month</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">📄 DWSP Analysis</p>
            <p className="text-2xl font-bold text-gray-900">{stats.quota.documentAnalysisCount}</p>
            <p className="text-xs text-gray-500">analyses this month</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">🔬 Water Quality</p>
            <p className="text-2xl font-bold text-gray-900">{stats.quota.waterQualityAnalysisCount}</p>
            <p className="text-xs text-gray-500">analyses this month</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">📊 Report Generation</p>
            <p className="text-2xl font-bold text-gray-900">{stats.quota.reportGenerationCount}</p>
            <p className="text-xs text-gray-500">reports this month</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Feature</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Operation</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Tokens</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Cost</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.recentLogs.slice(0, 10).map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{log.feature}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.operation}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {(log.inputTokens + log.outputTokens).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    ${(log.estimatedCost / 100).toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.recentLogs.length === 0 && (
            <p className="text-center py-8 text-gray-500">No AI usage yet this month</p>
          )}
        </div>
      </div>

      {/* Upgrade Prompt (if near limits) */}
      {stats.summary.percentUsed >= 75 && stats.quota.tier === 'FREE' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-yellow-900 mb-2">⚠️ Approaching Quota Limit</h3>
          <p className="text-yellow-700 mb-4">
            You've used {stats.summary.percentUsed}% of your FREE tier quota. Consider upgrading to continue using AI features.
          </p>
          <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold">
            Upgrade to BASIC or PREMIUM
          </button>
        </div>
      )}
    </div>
  );
}
