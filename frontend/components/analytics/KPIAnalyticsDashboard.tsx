/**
 * KPI Analytics Dashboard Component
 *
 * Real-time KPI tracking with targets, trends, and alerts
 * for water compliance and operational metrics
 */

"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export interface KPI {
  id: string;
  name: string;
  category: "compliance" | "operational" | "quality" | "financial" | "safety";
  currentValue: number;
  target: number;
  unit: string;
  trend: "up" | "down" | "stable";
  changePercent: number;
  status: "critical" | "warning" | "good" | "excellent";
  historicalData: {
    date: string;
    value: number;
    target?: number;
  }[];
  lastUpdated: string;
  higherIsBetter?: boolean;
}

interface KPIAnalyticsDashboardProps {
  kpis: KPI[];
  timeRange: "7d" | "30d" | "90d" | "1y";
  onTimeRangeChange: (range: "7d" | "30d" | "90d" | "1y") => void;
}

const categoryConfig = {
  compliance: {
    label: "Compliance",
    icon: "📋",
    color: "#3b82f6",
    bgColor: "#dbeafe",
  },
  operational: {
    label: "Operational",
    icon: "⚙️",
    color: "#10b981",
    bgColor: "#d1fae5",
  },
  quality: {
    label: "Quality",
    icon: "💧",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
  },
  financial: {
    label: "Financial",
    icon: "💰",
    color: "#f59e0b",
    bgColor: "#fef3c7",
  },
  safety: { label: "Safety", icon: "🛡️", color: "#ef4444", bgColor: "#fee2e2" },
};

const statusConfig = {
  critical: {
    label: "Critical",
    color: "#ef4444",
    bgColor: "#fee2e2",
    icon: "🚨",
  },
  warning: {
    label: "Warning",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    icon: "⚠️",
  },
  good: { label: "Good", color: "#10b981", bgColor: "#d1fae5", icon: "✓" },
  excellent: {
    label: "Excellent",
    color: "#3b82f6",
    bgColor: "#dbeafe",
    icon: "⭐",
  },
};

export function KPIAnalyticsDashboard({
  kpis,
  timeRange,
  onTimeRangeChange,
}: KPIAnalyticsDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "charts">("grid");

  // Filter KPIs
  const filteredKPIs = useMemo(() => {
    if (selectedCategory === "all") return kpis;
    return kpis.filter((kpi) => kpi.category === selectedCategory);
  }, [kpis, selectedCategory]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = kpis.length;
    const critical = kpis.filter((k) => k.status === "critical").length;
    const warning = kpis.filter((k) => k.status === "warning").length;
    const onTarget = kpis.filter(
      (k) => k.status === "good" || k.status === "excellent",
    ).length;
    const improving = kpis.filter((k) =>
      k.higherIsBetter !== false ? k.trend === "up" : k.trend === "down",
    ).length;

    const avgPerformance =
      kpis.reduce((sum, k) => {
        const performance = (k.currentValue / k.target) * 100;
        return sum + performance;
      }, 0) / (total || 1);

    return { total, critical, warning, onTarget, improving, avgPerformance };
  }, [kpis]);

  // Get KPI performance indicator
  const getPerformancePercent = (kpi: KPI) => {
    return ((kpi.currentValue - kpi.target) / kpi.target) * 100;
  };

  // Selected KPI detail
  const selectedKPIData = kpis.find((k) => k.id === selectedKPI);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              KPI Analytics Dashboard
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Real-time performance tracking and trend analysis
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(["7d", "30d", "90d", "1y"] as const).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                  timeRange === range
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {range === "7d" && "7 Days"}
                {range === "30d" && "30 Days"}
                {range === "90d" && "90 Days"}
                {range === "1y" && "1 Year"}
              </button>
            ))}
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-600 font-medium">Total KPIs</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {stats.total}
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-xs text-red-600 font-medium">Critical</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {stats.critical}
            </p>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <p className="text-xs text-orange-600 font-medium">Warning</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">
              {stats.warning}
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-xs text-green-600 font-medium">On Target</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {stats.onTarget}
            </p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <p className="text-xs text-purple-600 font-medium">
              Avg Performance
            </p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {stats.avgPerformance.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {stats.critical > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚨</span>
            <div>
              <h4 className="font-semibold text-red-800">
                Critical KPIs Require Attention
              </h4>
              <p className="text-sm text-red-700 mt-1">
                {stats.critical} KPI{stats.critical !== 1 ? "s are" : " is"} in
                critical status
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📊 Grid View
          </button>
          <button
            onClick={() => setViewMode("charts")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === "charts"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📈 Charts View
          </button>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
        >
          <option value="all">All Categories</option>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <option key={key} value={key}>
              {config.icon} {config.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 gap-4">
          {filteredKPIs.map((kpi) => {
            const categoryInfo = categoryConfig[kpi.category];
            const statusInfo = statusConfig[kpi.status];
            const performancePercent = getPerformancePercent(kpi);

            return (
              <div
                key={kpi.id}
                onClick={() => setSelectedKPI(kpi.id)}
                className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                style={{
                  borderLeftWidth: "6px",
                  borderLeftColor: statusInfo.color,
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{categoryInfo.icon}</span>
                      <h4 className="font-semibold text-gray-800">
                        {kpi.name}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600">
                      {categoryInfo.label}
                    </p>
                  </div>

                  <div
                    className="px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"
                    style={{
                      backgroundColor: statusInfo.bgColor,
                      color: statusInfo.color,
                    }}
                  >
                    <span>{statusInfo.icon}</span>
                    <span>{statusInfo.label}</span>
                  </div>
                </div>

                {/* Current Value */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-800">
                      {kpi.currentValue.toFixed(1)}
                    </span>
                    <span className="text-lg text-gray-600">{kpi.unit}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600">
                      Target: {kpi.target.toFixed(1)} {kpi.unit}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        performancePercent >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {performancePercent > 0 ? "+" : ""}
                      {performancePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min(100, (kpi.currentValue / kpi.target) * 100)}%`,
                        backgroundColor: statusInfo.color,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Trend & Change */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-2xl ${
                        kpi.trend === "up"
                          ? "text-green-600"
                          : kpi.trend === "down"
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {kpi.trend === "up"
                        ? "↗"
                        : kpi.trend === "down"
                          ? "↘"
                          : "→"}
                    </span>
                    <div>
                      <p className="text-xs text-gray-600">
                        {kpi.trend === "up"
                          ? "Increasing"
                          : kpi.trend === "down"
                            ? "Decreasing"
                            : "Stable"}
                      </p>
                      <p
                        className={`text-sm font-semibold ${
                          kpi.changePercent > 0
                            ? "text-green-600"
                            : kpi.changePercent < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {kpi.changePercent > 0 ? "+" : ""}
                        {kpi.changePercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Updated{" "}
                    {new Date(kpi.lastUpdated).toLocaleDateString("en-NZ")}
                  </p>
                </div>

                {/* Mini Sparkline */}
                <div className="mt-4 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpi.historicalData.slice(-7)}>
                      <defs>
                        <linearGradient
                          id={`gradient-${kpi.id}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={statusInfo.color}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={statusInfo.color}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={statusInfo.color}
                        fill={`url(#gradient-${kpi.id})`}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts View */}
      {viewMode === "charts" && (
        <div className="space-y-6">
          {/* Overview Chart */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              KPI Performance Overview
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={filteredKPIs.map((kpi) => ({
                  name:
                    kpi.name.length > 20
                      ? kpi.name.substring(0, 20) + "..."
                      : kpi.name,
                  Current: kpi.currentValue,
                  Target: kpi.target,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Current" fill="#3b82f6" />
                <Bar dataKey="Target" fill="#94a3b8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Individual KPI Trends */}
          <div className="grid grid-cols-2 gap-6">
            {filteredKPIs.slice(0, 4).map((kpi) => {
              const statusInfo = statusConfig[kpi.status];
              return (
                <div
                  key={kpi.id}
                  className="bg-white rounded-lg border-2 border-gray-200 p-6"
                >
                  <h4 className="font-semibold text-gray-800 mb-4">
                    {kpi.name}
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={kpi.historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) =>
                          new Date(date).toLocaleDateString("en-NZ", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(date) =>
                          new Date(date).toLocaleDateString("en-NZ")
                        }
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={statusInfo.color}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Actual"
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 4 }}
                        name="Target"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Detail Modal */}
      {selectedKPIData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedKPI(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b-2 border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedKPIData.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {categoryConfig[selectedKPIData.category].label}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedKPI(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Detailed Trend Chart */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">
                  Historical Trend
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedKPIData.historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString("en-NZ")
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) =>
                        new Date(date).toLocaleDateString("en-NZ")
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      name="Actual Value"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium">Current</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">
                    {selectedKPIData.currentValue.toFixed(1)}{" "}
                    {selectedKPIData.unit}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium">Target</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">
                    {selectedKPIData.target.toFixed(1)} {selectedKPIData.unit}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium">Change</p>
                  <p
                    className={`text-xl font-bold mt-1 ${
                      selectedKPIData.changePercent > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedKPIData.changePercent > 0 ? "+" : ""}
                    {selectedKPIData.changePercent.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium">Status</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">
                    {statusConfig[selectedKPIData.status].label}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
