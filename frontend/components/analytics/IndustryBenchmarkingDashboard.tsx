/**
 * Industry Benchmarking Dashboard Component
 *
 * Comprehensive dashboard for comparing performance against
 * industry standards, regional peers, and historical data
 */

"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

export interface BenchmarkCategory {
  id: string;
  name: string;
  metrics: BenchmarkMetric[];
}

export interface BenchmarkMetric {
  id: string;
  name: string;
  unit: string;
  yourValue: number;
  industryAverage: number;
  industryMedian: number;
  topQuartile: number;
  regionalAverage: number;
  previousYear?: number;
  trend?: "improving" | "declining" | "stable";
  higherIsBetter?: boolean;
}

export interface PerformanceScore {
  category: string;
  score: number; // 0-100
  weight: number; // relative importance
}

interface IndustryBenchmarkingDashboardProps {
  categories: BenchmarkCategory[];
  utilityName: string;
  region: string;
  lastUpdated: string;
}

export function IndustryBenchmarkingDashboard({
  categories,
  utilityName,
  region,
  lastUpdated,
}: IndustryBenchmarkingDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0]?.id || "all",
  );
  const [viewMode, setViewMode] = useState<"overview" | "detailed" | "trends">(
    "overview",
  );

  // Calculate overall performance score
  const overallScore = useMemo(() => {
    const allMetrics = categories.flatMap((c) => c.metrics);
    if (allMetrics.length === 0) return 0;

    const scores = allMetrics.map((m) => {
      const range = m.topQuartile - m.industryAverage;
      if (range === 0) return 50;

      const position =
        m.higherIsBetter !== false
          ? ((m.yourValue - m.industryAverage) / range) * 50 + 50
          : ((m.industryAverage - m.yourValue) / range) * 50 + 50;

      return Math.max(0, Math.min(100, position));
    });

    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }, [categories]);

  // Performance by category
  const categoryScores = useMemo(() => {
    return categories.map((category) => {
      const scores = category.metrics.map((m) => {
        const range = m.topQuartile - m.industryAverage;
        if (range === 0) return 50;

        const position =
          m.higherIsBetter !== false
            ? ((m.yourValue - m.industryAverage) / range) * 50 + 50
            : ((m.industryAverage - m.yourValue) / range) * 50 + 50;

        return Math.max(0, Math.min(100, position));
      });

      const avgScore =
        scores.reduce((sum, s) => sum + s, 0) / (scores.length || 1);

      return {
        category: category.name,
        score: avgScore,
        "Industry Avg": 50,
        "Top Quartile": 75,
      };
    });
  }, [categories]);

  // Radar chart data
  const radarData = useMemo(() => {
    return categories.slice(0, 6).map((category) => {
      const avgMetric =
        category.metrics.reduce((sum, m) => sum + m.yourValue, 0) /
        (category.metrics.length || 1);
      const industryAvg =
        category.metrics.reduce((sum, m) => sum + m.industryAverage, 0) /
        (category.metrics.length || 1);

      return {
        category: category.name,
        "Your Utility": avgMetric,
        "Industry Average": industryAvg,
      };
    });
  }, [categories]);

  // Get selected category metrics
  const displayedMetrics = useMemo(() => {
    if (selectedCategory === "all") {
      return categories.flatMap((c) => c.metrics);
    }
    return categories.find((c) => c.id === selectedCategory)?.metrics || [];
  }, [selectedCategory, categories]);

  // Statistics
  const stats = useMemo(() => {
    const allMetrics = categories.flatMap((c) => c.metrics);
    const aboveAverage = allMetrics.filter((m) =>
      m.higherIsBetter !== false
        ? m.yourValue >= m.industryAverage
        : m.yourValue <= m.industryAverage,
    ).length;
    const topQuartileMetrics = allMetrics.filter((m) =>
      m.higherIsBetter !== false
        ? m.yourValue >= m.topQuartile
        : m.yourValue <= m.topQuartile,
    ).length;
    const improving = allMetrics.filter((m) => m.trend === "improving").length;

    return {
      totalMetrics: allMetrics.length,
      aboveAverage,
      topQuartileMetrics,
      improving,
      percentAboveAverage: (aboveAverage / (allMetrics.length || 1)) * 100,
    };
  }, [categories]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Industry Benchmarking
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {utilityName} • {region} • Updated{" "}
              {new Date(lastUpdated).toLocaleDateString("en-NZ")}
            </p>
          </div>

          {/* Overall Score */}
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">
              {overallScore.toFixed(0)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Overall Score</p>
            <div className="flex items-center gap-1 mt-2">
              {overallScore >= 75 ? (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                  Excellent
                </span>
              ) : overallScore >= 50 ? (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">
                  Good
                </span>
              ) : (
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded font-semibold">
                  Needs Improvement
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-600 font-medium">Total Metrics</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {stats.totalMetrics}
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-xs text-green-600 font-medium">Above Average</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {stats.aboveAverage} ({stats.percentAboveAverage.toFixed(0)}%)
            </p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <p className="text-xs text-purple-600 font-medium">Top Quartile</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {stats.topQuartileMetrics}
            </p>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <p className="text-xs text-orange-600 font-medium">Improving</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">
              {stats.improving}
            </p>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("overview")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === "overview"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setViewMode("detailed")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === "detailed"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📈 Detailed
          </button>
          <button
            onClick={() => setViewMode("trends")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === "trends"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📉 Trends
          </button>
        </div>

        {viewMode === "detailed" && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Overview Mode */}
      {viewMode === "overview" && (
        <div className="grid grid-cols-2 gap-6">
          {/* Performance by Category */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Performance by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryScores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#3b82f6" name="Your Score" />
                <Bar
                  dataKey="Industry Avg"
                  fill="#94a3b8"
                  name="Industry Avg"
                />
                <Bar
                  dataKey="Top Quartile"
                  fill="#10b981"
                  name="Top Quartile"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Comparison */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Multi-Dimensional Comparison
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis />
                <Radar
                  name="Your Utility"
                  dataKey="Your Utility"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Industry Average"
                  dataKey="Industry Average"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.4}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Mode */}
      {viewMode === "detailed" && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Detailed Metrics
            {selectedCategory !== "all" &&
              ` - ${categories.find((c) => c.id === selectedCategory)?.name}`}
          </h3>

          <div className="space-y-3">
            {displayedMetrics.map((metric) => {
              const performancePercent =
                metric.higherIsBetter !== false
                  ? ((metric.yourValue - metric.industryAverage) /
                      metric.industryAverage) *
                    100
                  : ((metric.industryAverage - metric.yourValue) /
                      metric.industryAverage) *
                    100;

              const isAboveAverage = performancePercent >= 0;

              return (
                <div
                  key={metric.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {metric.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-blue-600">
                          {metric.yourValue.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {metric.unit}
                        </span>
                        {metric.trend && (
                          <span
                            className={`text-xs px-2 py-1 rounded font-semibold ${
                              metric.trend === "improving"
                                ? "bg-green-100 text-green-700"
                                : metric.trend === "declining"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {metric.trend === "improving"
                              ? "↗ Improving"
                              : metric.trend === "declining"
                                ? "↘ Declining"
                                : "→ Stable"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`px-3 py-2 rounded-lg ${
                        isAboveAverage
                          ? "bg-green-50 text-green-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      <p className="text-xs font-semibold">
                        {isAboveAverage ? "✓" : "!"}{" "}
                        {isAboveAverage ? "Above" : "Below"} Average
                      </p>
                      <p className="text-lg font-bold mt-1">
                        {performancePercent > 0 ? "+" : ""}
                        {performancePercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Comparison Bars */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-28">
                        Your Value:
                      </span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(metric.yourValue / metric.topQuartile) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-16 text-right">
                        {metric.yourValue.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-28">
                        Industry Avg:
                      </span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-400"
                          style={{
                            width: `${(metric.industryAverage / metric.topQuartile) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-16 text-right">
                        {metric.industryAverage.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-28">
                        Top Quartile:
                      </span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${(metric.topQuartile / metric.topQuartile) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-16 text-right">
                        {metric.topQuartile.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-28">
                        Regional Avg:
                      </span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500"
                          style={{
                            width: `${(metric.regionalAverage / metric.topQuartile) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-16 text-right">
                        {metric.regionalAverage.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trends Mode */}
      {viewMode === "trends" && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Year-over-Year Trends
          </h3>
          <div className="grid grid-cols-2 gap-6">
            {displayedMetrics.slice(0, 4).map((metric) => {
              if (!metric.previousYear) return null;

              const trendData = [
                {
                  year: "Previous Year",
                  "Your Value": metric.previousYear,
                  "Industry Avg": metric.industryAverage * 0.95,
                },
                {
                  year: "Current Year",
                  "Your Value": metric.yourValue,
                  "Industry Avg": metric.industryAverage,
                },
              ];

              return (
                <div
                  key={metric.id}
                  className="border-2 border-gray-200 rounded-lg p-4"
                >
                  <h4 className="font-semibold text-gray-800 mb-3">
                    {metric.name}
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Your Value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Industry Avg"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        dot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
