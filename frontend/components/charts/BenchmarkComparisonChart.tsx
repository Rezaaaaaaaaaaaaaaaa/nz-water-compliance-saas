/**
 * Benchmark Comparison Chart Component
 *
 * Compares organizational metrics against industry benchmarks,
 * regional averages, and peer organizations
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

export interface BenchmarkMetric {
  category: string;
  yourScore: number;
  industryAverage: number;
  regionalAverage: number;
  topPerformer: number;
  unit?: string;
  higherIsBetter?: boolean;
}

interface BenchmarkComparisonChartProps {
  metrics: BenchmarkMetric[];
  organizationName?: string;
  region?: string;
  viewMode?: "bar" | "radar";
  height?: number;
}

export function BenchmarkComparisonChart({
  metrics,
  organizationName = "Your Organization",
  region = "National",
  viewMode: initialViewMode = "bar",
  height = 500,
}: BenchmarkComparisonChartProps) {
  const [selectedView, setSelectedView] = useState<"bar" | "radar">(
    initialViewMode,
  );

  // Calculate performance statistics
  const stats = useMemo(() => {
    const totalMetrics = metrics.length;
    const aboveIndustry = metrics.filter((m) =>
      m.higherIsBetter !== false
        ? m.yourScore > m.industryAverage
        : m.yourScore < m.industryAverage,
    ).length;
    const aboveRegional = metrics.filter((m) =>
      m.higherIsBetter !== false
        ? m.yourScore > m.regionalAverage
        : m.yourScore < m.regionalAverage,
    ).length;
    const matchingTop = metrics.filter((m) =>
      m.higherIsBetter !== false
        ? m.yourScore >= m.topPerformer * 0.95
        : m.yourScore <= m.topPerformer * 1.05,
    ).length;

    const avgGapToIndustry =
      metrics.reduce((sum, m) => {
        const gap =
          m.higherIsBetter !== false
            ? ((m.yourScore - m.industryAverage) / m.industryAverage) * 100
            : ((m.industryAverage - m.yourScore) / m.industryAverage) * 100;
        return sum + gap;
      }, 0) / totalMetrics;

    const avgGapToTop =
      metrics.reduce((sum, m) => {
        const gap =
          m.higherIsBetter !== false
            ? ((m.yourScore - m.topPerformer) / m.topPerformer) * 100
            : ((m.topPerformer - m.yourScore) / m.topPerformer) * 100;
        return sum + gap;
      }, 0) / totalMetrics;

    return {
      totalMetrics,
      aboveIndustry,
      aboveRegional,
      matchingTop,
      avgGapToIndustry,
      avgGapToTop,
    };
  }, [metrics]);

  // Prepare data for radar chart
  const radarData = useMemo(() => {
    return metrics.map((m) => ({
      category: m.category,
      "Your Score": m.yourScore,
      "Industry Avg": m.industryAverage,
      "Regional Avg": m.regionalAverage,
      "Top Performer": m.topPerformer,
    }));
  }, [metrics]);

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
      payload: { category: string; unit?: string };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">
          <p className="font-bold text-gray-800 mb-2">{data.category}</p>
          <div className="space-y-1 text-sm">
            {payload.map(
              (
                entry: { name: string; value: number; color: string },
                index: number,
              ) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-gray-600">{entry.name}:</span>
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: entry.color }}
                  >
                    {entry.value.toFixed(1)}
                    {data.unit || "%"}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Get performance indicator
  const getPerformanceIndicator = (metric: BenchmarkMetric) => {
    const comparison =
      metric.higherIsBetter !== false
        ? metric.yourScore >= metric.industryAverage
        : metric.yourScore <= metric.industryAverage;

    if (comparison) {
      return { icon: "✅", color: "text-green-600", label: "Above Average" };
    } else {
      const gap = Math.abs(
        ((metric.yourScore - metric.industryAverage) / metric.industryAverage) *
          100,
      );
      if (gap > 20) {
        return {
          icon: "🔴",
          color: "text-red-600",
          label: "Needs Improvement",
        };
      } else {
        return { icon: "⚠️", color: "text-orange-600", label: "Below Average" };
      }
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              Benchmark Analysis
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {organizationName} vs {region} Industry Standards
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView("bar")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedView === "bar"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              📊 Bar Chart
            </button>
            <button
              onClick={() => setSelectedView("radar")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedView === "radar"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              🎯 Radar Chart
            </button>
          </div>
        </div>

        {/* Performance Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Above Industry</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {stats.aboveIndustry}/{stats.totalMetrics}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {((stats.aboveIndustry / stats.totalMetrics) * 100).toFixed(0)}%
              of metrics
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Above Regional</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {stats.aboveRegional}/{stats.totalMetrics}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {((stats.aboveRegional / stats.totalMetrics) * 100).toFixed(0)}%
              of metrics
            </p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Industry Gap</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                stats.avgGapToIndustry >= 0 ? "text-green-700" : "text-red-700"
              }`}
            >
              {stats.avgGapToIndustry >= 0 ? "+" : ""}
              {stats.avgGapToIndustry.toFixed(1)}%
            </p>
            <p className="text-xs text-purple-600 mt-1">vs industry avg</p>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">
              Top Performer Gap
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                stats.avgGapToTop >= -10 ? "text-green-700" : "text-orange-700"
              }`}
            >
              {stats.avgGapToTop >= 0 ? "+" : ""}
              {stats.avgGapToTop.toFixed(1)}%
            </p>
            <p className="text-xs text-orange-600 mt-1">vs top performers</p>
          </div>
        </div>
      </div>

      {/* Bar Chart View */}
      {selectedView === "bar" && (
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={metrics}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="category"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{
                  value: "Score (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontWeight: "bold" },
                }}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />

              <Bar dataKey="yourScore" name={organizationName} fill="#3b82f6" />
              <Bar
                dataKey="industryAverage"
                name="Industry Average"
                fill="#6b7280"
              />
              <Bar
                dataKey="regionalAverage"
                name={`${region} Average`}
                fill="#8b5cf6"
              />
              <Bar dataKey="topPerformer" name="Top Performer" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Radar Chart View */}
      {selectedView === "radar" && (
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar
                name={organizationName}
                dataKey="Your Score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Radar
                name="Industry Average"
                dataKey="Industry Avg"
                stroke="#6b7280"
                fill="#6b7280"
                fillOpacity={0.3}
              />
              <Radar
                name={`${region} Average`}
                dataKey="Regional Avg"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
              />
              <Radar
                name="Top Performer"
                dataKey="Top Performer"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Metrics Table */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Detailed Comparison
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full border-2 border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-200">
                  Metric
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">
                  Your Score
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">
                  Industry Avg
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">
                  {region} Avg
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">
                  Top Performer
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => {
                const indicator = getPerformanceIndicator(metric);
                return (
                  <tr
                    key={metric.category}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 border-r border-gray-200">
                      {metric.category}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-blue-700 border-r border-gray-200">
                      {metric.yourScore.toFixed(1)}
                      {metric.unit || "%"}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600 border-r border-gray-200">
                      {metric.industryAverage.toFixed(1)}
                      {metric.unit || "%"}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600 border-r border-gray-200">
                      {metric.regionalAverage.toFixed(1)}
                      {metric.unit || "%"}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-green-600 border-r border-gray-200">
                      {metric.topPerformer.toFixed(1)}
                      {metric.unit || "%"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg">{indicator.icon}</span>
                        <span
                          className={`text-xs font-semibold ${indicator.color}`}
                        >
                          {indicator.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💪</div>
            <div>
              <h4 className="font-semibold text-green-800 mb-2">Strengths</h4>
              <ul className="text-sm text-green-700 space-y-1">
                {metrics
                  .filter((m) =>
                    m.higherIsBetter !== false
                      ? m.yourScore > m.industryAverage
                      : m.yourScore < m.industryAverage,
                  )
                  .slice(0, 3)
                  .map((m) => (
                    <li key={m.category}>
                      • {m.category}:{" "}
                      {Math.abs(
                        ((m.yourScore - m.industryAverage) /
                          m.industryAverage) *
                          100,
                      ).toFixed(0)}
                      % {m.yourScore > m.industryAverage ? "above" : "below"}{" "}
                      average
                    </li>
                  ))}
                {metrics.filter((m) =>
                  m.higherIsBetter !== false
                    ? m.yourScore > m.industryAverage
                    : m.yourScore < m.industryAverage,
                ).length === 0 && (
                  <li className="text-yellow-700">
                    No metrics above industry average
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Improvement Areas */}
        <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🎯</div>
            <div>
              <h4 className="font-semibold text-orange-800 mb-2">
                Improvement Opportunities
              </h4>
              <ul className="text-sm text-orange-700 space-y-1">
                {metrics
                  .filter((m) =>
                    m.higherIsBetter !== false
                      ? m.yourScore < m.industryAverage
                      : m.yourScore > m.industryAverage,
                  )
                  .sort((a, b) => {
                    const gapA = Math.abs(
                      ((a.yourScore - a.industryAverage) / a.industryAverage) *
                        100,
                    );
                    const gapB = Math.abs(
                      ((b.yourScore - b.industryAverage) / b.industryAverage) *
                        100,
                    );
                    return gapB - gapA;
                  })
                  .slice(0, 3)
                  .map((m) => (
                    <li key={m.category}>
                      • {m.category}:{" "}
                      {Math.abs(
                        ((m.yourScore - m.industryAverage) /
                          m.industryAverage) *
                          100,
                      ).toFixed(0)}
                      % gap to close
                    </li>
                  ))}
                {metrics.filter((m) =>
                  m.higherIsBetter !== false
                    ? m.yourScore < m.industryAverage
                    : m.yourScore > m.industryAverage,
                ).length === 0 && (
                  <li className="text-green-700">
                    All metrics meet or exceed industry standards
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
