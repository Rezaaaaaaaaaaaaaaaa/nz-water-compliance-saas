/**
 * Approval Workflow Funnel Chart Component
 *
 * Visualizes the approval pipeline showing progression through stages
 * with drop-off rates and bottleneck identification
 */

"use client";

import { useMemo } from "react";

export interface FunnelStage {
  id: string;
  name: string;
  count: number;
  avgDuration?: string; // e.g., "2.5 days"
  approvalRate?: number; // % that move to next stage
  bottleneck?: boolean;
  items?: {
    id: string;
    title: string;
    status: "pending" | "approved" | "rejected";
    daysInStage: number;
  }[];
}

interface ApprovalFunnelChartProps {
  stages: FunnelStage[];
  title?: string;
  workflowType?: "DWSP" | "Asset" | "Document" | "General";
  height?: number;
  onStageClick?: (stage: FunnelStage) => void;
}

const workflowColors = {
  DWSP: { primary: "#3b82f6", secondary: "#93c5fd", light: "#dbeafe" },
  Asset: { primary: "#10b981", secondary: "#6ee7b7", light: "#d1fae5" },
  Document: { primary: "#8b5cf6", secondary: "#c4b5fd", light: "#ede9fe" },
  General: { primary: "#6b7280", secondary: "#d1d5db", light: "#f3f4f6" },
};

export function ApprovalFunnelChart({
  stages,
  title = "Approval Pipeline",
  workflowType = "General",
  height = 600,
  onStageClick,
}: ApprovalFunnelChartProps) {
  const colors = workflowColors[workflowType];

  // Calculate statistics
  const stats = useMemo(() => {
    if (stages.length === 0) return null;

    const totalStarted = stages[0].count;
    const totalCompleted = stages[stages.length - 1].count;
    const overallConversionRate =
      totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

    // Calculate drop-off between stages
    const dropOffs = stages.slice(0, -1).map((stage, index) => {
      const nextStage = stages[index + 1];
      const dropOff = stage.count - nextStage.count;
      const dropOffRate = stage.count > 0 ? (dropOff / stage.count) * 100 : 0;
      return {
        fromStage: stage.name,
        toStage: nextStage.name,
        dropOff,
        dropOffRate,
      };
    });

    // Find biggest bottleneck
    const maxDropOff = dropOffs.reduce(
      (max, curr) => (curr.dropOffRate > max.dropOffRate ? curr : max),
      dropOffs[0],
    );

    // Calculate total time in pipeline
    const totalDays = stages.reduce((sum, stage) => {
      if (stage.avgDuration) {
        const days = parseFloat(stage.avgDuration);
        return sum + (isNaN(days) ? 0 : days);
      }
      return sum;
    }, 0);

    return {
      totalStarted,
      totalCompleted,
      overallConversionRate,
      dropOffs,
      maxDropOff,
      totalDays,
    };
  }, [stages]);

  // Calculate funnel dimensions
  const maxWidth = 800;
  const minWidth = 200;
  const stageHeight = (height - 100) / stages.length;

  const getFunnelWidth = (count: number): number => {
    if (!stats) return maxWidth;
    const ratio = count / stats.totalStarted;
    return minWidth + (maxWidth - minWidth) * ratio;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {workflowType} approval workflow analysis
            </p>
          </div>

          {stats && (
            <div className="text-right">
              <div
                className="text-3xl font-bold"
                style={{ color: colors.primary }}
              >
                {stats.overallConversionRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Approval Rate</div>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <div
              className="rounded-lg p-4 border-2"
              style={{
                backgroundColor: colors.light,
                borderColor: colors.secondary,
              }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: colors.primary }}
              >
                Started
              </p>
              <p
                className="text-2xl font-bold mt-1"
                style={{ color: colors.primary }}
              >
                {stats.totalStarted}
              </p>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Approved</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {stats.totalCompleted}
              </p>
            </div>

            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium">Dropped</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {stats.totalStarted - stats.totalCompleted}
              </p>
            </div>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-600 font-medium">
                Avg Duration
              </p>
              <p className="text-2xl font-bold text-orange-700 mt-1">
                {stats.totalDays.toFixed(0)} days
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Funnel Visualization */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <svg width={maxWidth + 200} height={height}>
          {stages.map((stage, index) => {
            const width = getFunnelWidth(stage.count);
            const x = (maxWidth + 200 - width) / 2;
            const y = index * stageHeight;
            const nextStage = stages[index + 1];
            const nextWidth = nextStage
              ? getFunnelWidth(nextStage.count)
              : width;

            // Calculate trapezoid points
            const points = `
              ${x},${y}
              ${x + width},${y}
              ${(maxWidth + 200 - nextWidth) / 2 + nextWidth},${y + stageHeight}
              ${(maxWidth + 200 - nextWidth) / 2},${y + stageHeight}
            `;

            const dropOff = nextStage ? stage.count - nextStage.count : 0;
            const dropOffRate =
              stage.count > 0 ? (dropOff / stage.count) * 100 : 0;

            // Determine color intensity based on position in funnel
            const opacity = 0.5 + (index / stages.length) * 0.5;

            return (
              <g key={stage.id}>
                {/* Funnel stage */}
                <polygon
                  points={points}
                  fill={colors.primary}
                  opacity={opacity}
                  stroke="white"
                  strokeWidth="3"
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => onStageClick?.(stage)}
                >
                  <title>
                    {stage.name}
                    {"\n"}Count: {stage.count}
                    {stage.avgDuration &&
                      `\nAvg Duration: ${stage.avgDuration}`}
                    {stage.approvalRate &&
                      `\nApproval Rate: ${stage.approvalRate.toFixed(1)}%`}
                  </title>
                </polygon>

                {/* Stage label */}
                <text
                  x={maxWidth / 2 + 100}
                  y={y + stageHeight / 2 - 15}
                  textAnchor="middle"
                  className="font-bold text-white text-lg pointer-events-none"
                  style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                >
                  {stage.name}
                </text>

                {/* Stage count */}
                <text
                  x={maxWidth / 2 + 100}
                  y={y + stageHeight / 2 + 5}
                  textAnchor="middle"
                  className="font-bold text-white text-2xl pointer-events-none"
                  style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                >
                  {stage.count}
                </text>

                {/* Stage duration */}
                {stage.avgDuration && (
                  <text
                    x={maxWidth / 2 + 100}
                    y={y + stageHeight / 2 + 25}
                    textAnchor="middle"
                    className="text-sm text-white pointer-events-none"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                  >
                    ⏱ {stage.avgDuration}
                  </text>
                )}

                {/* Drop-off indicator */}
                {nextStage && dropOff > 0 && (
                  <>
                    {/* Drop-off arrow */}
                    <line
                      x1={x - 40}
                      y1={y + stageHeight}
                      x2={x - 40}
                      y2={y + stageHeight + 20}
                      stroke="#ef4444"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />

                    {/* Drop-off label */}
                    <text
                      x={x - 80}
                      y={y + stageHeight + 15}
                      textAnchor="end"
                      className="text-sm font-semibold fill-red-600"
                    >
                      -{dropOff} ({dropOffRate.toFixed(1)}%)
                    </text>

                    {/* Bottleneck warning */}
                    {dropOffRate > 30 && (
                      <g>
                        <circle
                          cx={x - 120}
                          cy={y + stageHeight + 15}
                          r="12"
                          fill="#ef4444"
                        />
                        <text
                          x={x - 120}
                          y={y + stageHeight + 20}
                          textAnchor="middle"
                          className="text-xs font-bold fill-white"
                        >
                          !
                        </text>
                      </g>
                    )}
                  </>
                )}

                {/* Bottleneck badge */}
                {stage.bottleneck && (
                  <rect
                    x={x + width + 20}
                    y={y + stageHeight / 2 - 15}
                    width="90"
                    height="30"
                    fill="#ef4444"
                    rx="15"
                  >
                    <title>Identified bottleneck</title>
                  </rect>
                )}
                {stage.bottleneck && (
                  <text
                    x={x + width + 65}
                    y={y + stageHeight / 2 + 5}
                    textAnchor="middle"
                    className="text-xs font-bold fill-white pointer-events-none"
                  >
                    ⚠️ Bottleneck
                  </text>
                )}
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Stage Details */}
      <div className="mt-8 space-y-4">
        <h4 className="text-lg font-semibold text-gray-800">Stage Breakdown</h4>

        {stages.map((stage, index) => {
          const nextStage = stages[index + 1];
          const dropOff = nextStage ? stage.count - nextStage.count : 0;
          const dropOffRate =
            stage.count > 0 ? (dropOff / stage.count) * 100 : 0;

          return (
            <div
              key={stage.id}
              className={`bg-white border-2 rounded-lg p-4 ${
                stage.bottleneck
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800 text-lg">
                      {stage.name}
                    </h5>
                    {stage.avgDuration && (
                      <p className="text-sm text-gray-600">
                        Avg time in stage: {stage.avgDuration}
                      </p>
                    )}
                  </div>
                  {stage.bottleneck && (
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                      ⚠️ BOTTLENECK
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">
                    {stage.count}
                  </div>
                  <div className="text-xs text-gray-500">items</div>
                </div>
              </div>

              {/* Drop-off info */}
              {nextStage && dropOff > 0 && (
                <div
                  className={`mt-3 p-3 rounded-lg ${
                    dropOffRate > 30
                      ? "bg-red-100 border-2 border-red-300"
                      : "bg-yellow-50 border-2 border-yellow-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold ${
                        dropOffRate > 30 ? "text-red-700" : "text-yellow-700"
                      }`}
                    >
                      {dropOffRate > 30 ? "⚠️ High drop-off" : "⚠️ Drop-off"} to
                      next stage
                    </span>
                    <span
                      className={`font-bold ${
                        dropOffRate > 30 ? "text-red-800" : "text-yellow-800"
                      }`}
                    >
                      -{dropOff} items ({dropOffRate.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )}

              {/* Sample items */}
              {stage.items && stage.items.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 mb-2 font-medium">
                    Items in this stage ({stage.items.length}):
                  </p>
                  <div className="space-y-2">
                    {stage.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded"
                      >
                        <span className="text-gray-700">{item.title}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">
                            {item.daysInStage} days
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              item.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : item.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {stage.items.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{stage.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Insights */}
      {stats && stats.maxDropOff && (
        <div className="mt-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="font-semibold text-orange-800 mb-2">
                Key Insights
              </h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>
                  • Biggest bottleneck: {stats.maxDropOff.fromStage} →{" "}
                  {stats.maxDropOff.toStage} (
                  {stats.maxDropOff.dropOffRate.toFixed(1)}% drop-off)
                </li>
                <li>
                  • Overall approval rate:{" "}
                  {stats.overallConversionRate.toFixed(1)}% (
                  {stats.totalCompleted} out of {stats.totalStarted} items)
                </li>
                <li>
                  • Average pipeline duration: {stats.totalDays.toFixed(0)} days
                </li>
                {stats.overallConversionRate < 50 && (
                  <li>
                    ⚠️ Low approval rate indicates significant process
                    improvements needed
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
