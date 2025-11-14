/**
 * Asset Condition Heat Map Component
 *
 * Multi-dimensional heat map showing asset condition distribution
 * across region, type, and age bands
 */

"use client";

import { useState } from "react";

interface AssetConditionData {
  region: string;
  assetType: string;
  ageBand: string;
  count: number;
  averageCondition: number; // 1-5 scale (5=Excellent, 1=Very Poor)
  maintenanceCost: number;
}

interface AssetConditionHeatMapProps {
  data: AssetConditionData[];
  viewMode?: "region-type" | "region-age" | "type-age";
  width?: number;
  height?: number;
}

const conditionColors = {
  5: { color: "#10b981", label: "Excellent" },
  4: { color: "#84cc16", label: "Good" },
  3: { color: "#f59e0b", label: "Fair" },
  2: { color: "#f97316", label: "Poor" },
  1: { color: "#ef4444", label: "Very Poor" },
};

const regions = [
  "Auckland",
  "Wellington",
  "Canterbury",
  "Waikato",
  "Otago",
  "Bay of Plenty",
  "Manawatu-Whanganui",
  "Other",
];

const assetTypes = [
  "Treatment Plant",
  "Reservoir",
  "Pump Station",
  "Pipeline",
  "Bore",
  "Other",
];

const ageBands = [
  "0-5 years",
  "6-10 years",
  "11-20 years",
  "21-30 years",
  "31-50 years",
  "50+ years",
];

export function AssetConditionHeatMap({
  data,
  viewMode = "region-type",
  width = 900,
  height = 500,
}: AssetConditionHeatMapProps) {
  const [selectedView, setSelectedView] = useState<
    "region-type" | "region-age" | "type-age"
  >(viewMode);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Determine rows and columns based on view mode
  const getRowsAndCols = () => {
    switch (selectedView) {
      case "region-type":
        return {
          rows: regions,
          cols: assetTypes,
          rowKey: "region",
          colKey: "assetType",
        };
      case "region-age":
        return {
          rows: regions,
          cols: ageBands,
          rowKey: "region",
          colKey: "ageBand",
        };
      case "type-age":
        return {
          rows: assetTypes,
          cols: ageBands,
          rowKey: "assetType",
          colKey: "ageBand",
        };
      default:
        return {
          rows: regions,
          cols: assetTypes,
          rowKey: "region",
          colKey: "assetType",
        };
    }
  };

  const { rows, cols, rowKey, colKey } = getRowsAndCols();

  // Create matrix from data
  const matrix: Map<string, AssetConditionData> = new Map();
  data.forEach((item) => {
    const key = `${item[rowKey as keyof AssetConditionData]}:${item[colKey as keyof AssetConditionData]}`;
    matrix.set(key, item);
  });

  // Calculate cell dimensions
  const cellWidth = (width - 200) / cols.length;
  const cellHeight = (height - 100) / rows.length;

  // Get condition color
  const getConditionColor = (avgCondition: number): string => {
    const rounded = Math.round(avgCondition);
    return (
      conditionColors[rounded as keyof typeof conditionColors]?.color ||
      "#9ca3af"
    );
  };

  // Get max count for opacity scaling
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Calculate statistics
  const totalAssets = data.reduce((sum, d) => sum + d.count, 0);
  const avgCondition =
    data.reduce((sum, d) => sum + d.averageCondition * d.count, 0) /
    totalAssets;
  const totalMaintenanceCost = data.reduce(
    (sum, d) => sum + d.maintenanceCost,
    0,
  );

  const conditionCounts = {
    excellent: data
      .filter((d) => d.averageCondition >= 4.5)
      .reduce((sum, d) => sum + d.count, 0),
    good: data
      .filter((d) => d.averageCondition >= 3.5 && d.averageCondition < 4.5)
      .reduce((sum, d) => sum + d.count, 0),
    fair: data
      .filter((d) => d.averageCondition >= 2.5 && d.averageCondition < 3.5)
      .reduce((sum, d) => sum + d.count, 0),
    poor: data
      .filter((d) => d.averageCondition >= 1.5 && d.averageCondition < 2.5)
      .reduce((sum, d) => sum + d.count, 0),
    veryPoor: data
      .filter((d) => d.averageCondition < 1.5)
      .reduce((sum, d) => sum + d.count, 0),
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              Asset Condition Analysis
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Condition distribution across {totalAssets.toLocaleString()}{" "}
              assets
            </p>
          </div>

          {/* View Mode Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView("region-type")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedView === "region-type"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Region × Type
            </button>
            <button
              onClick={() => setSelectedView("region-age")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedView === "region-age"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Region × Age
            </button>
            <button
              onClick={() => setSelectedView("type-age")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedView === "type-age"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Type × Age
            </button>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Assets</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {totalAssets.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Avg Condition</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {avgCondition.toFixed(2)} / 5.0
            </p>
          </div>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">
              Needs Attention
            </p>
            <p className="text-2xl font-bold text-orange-700 mt-1">
              {(
                conditionCounts.poor + conditionCounts.veryPoor
              ).toLocaleString()}
            </p>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">
              Est. Maintenance
            </p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              ${(totalMaintenanceCost / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>
      </div>

      {/* Heat Map */}
      <div className="overflow-x-auto">
        <svg
          width={width}
          height={height}
          className="border-2 border-gray-200 rounded-lg bg-white"
        >
          {/* Column headers */}
          {cols.map((col, colIndex) => (
            <text
              key={`col-${colIndex}`}
              x={200 + colIndex * cellWidth + cellWidth / 2}
              y={40}
              textAnchor="middle"
              className="text-xs font-semibold fill-gray-700"
            >
              {col}
            </text>
          ))}

          {/* Row headers */}
          {rows.map((row, rowIndex) => (
            <text
              key={`row-${rowIndex}`}
              x={10}
              y={70 + rowIndex * cellHeight + cellHeight / 2}
              textAnchor="start"
              alignmentBaseline="middle"
              className="text-xs font-semibold fill-gray-700"
            >
              {row}
            </text>
          ))}

          {/* Heat map cells */}
          {rows.map((row, rowIndex) =>
            cols.map((col, colIndex) => {
              const key = `${row}:${col}`;
              const cellData = matrix.get(key);
              const count = cellData?.count || 0;
              const avgCondition = cellData?.averageCondition || 0;
              const color = getConditionColor(avgCondition);
              const opacity = count > 0 ? 0.4 + (count / maxCount) * 0.6 : 0.1;
              const isHovered = hoveredCell === key;

              return (
                <g key={key}>
                  {/* Cell background */}
                  <rect
                    x={200 + colIndex * cellWidth}
                    y={60 + rowIndex * cellHeight}
                    width={cellWidth - 2}
                    height={cellHeight - 2}
                    fill={count > 0 ? color : "#f3f4f6"}
                    opacity={isHovered ? 1 : opacity}
                    className="transition-opacity cursor-pointer"
                    rx={4}
                    onMouseEnter={() => setHoveredCell(key)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <title>
                      {row} - {col}
                      {"\n"}Assets: {count}
                      {"\n"}Avg Condition: {avgCondition.toFixed(2)} / 5.0
                      {cellData?.maintenanceCost &&
                        `\nMaintenance: $${(cellData.maintenanceCost / 1000).toFixed(0)}k`}
                    </title>
                  </rect>

                  {/* Cell value */}
                  {count > 0 && (
                    <>
                      <text
                        x={200 + colIndex * cellWidth + cellWidth / 2}
                        y={60 + rowIndex * cellHeight + cellHeight / 2 - 6}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        className="text-sm font-bold fill-white pointer-events-none"
                        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                      >
                        {count}
                      </text>
                      <text
                        x={200 + colIndex * cellWidth + cellWidth / 2}
                        y={60 + rowIndex * cellHeight + cellHeight / 2 + 8}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        className="text-xs fill-white pointer-events-none"
                        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                      >
                        {avgCondition.toFixed(1)}
                      </text>
                    </>
                  )}
                </g>
              );
            }),
          )}
        </svg>
      </div>

      {/* Legend and Distribution */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        {/* Condition Legend */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Condition Scale
          </h4>
          <div className="space-y-2">
            {Object.entries(conditionColors)
              .reverse()
              .map(([score, { color, label }]) => (
                <div key={score} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded border-2 border-white shadow"
                    style={{ backgroundColor: color }}
                  ></div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">
                      {label}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({score}/5)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Condition Distribution */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Condition Distribution
          </h4>
          <div className="space-y-2">
            {[
              {
                label: "Excellent",
                count: conditionCounts.excellent,
                color: "#10b981",
              },
              { label: "Good", count: conditionCounts.good, color: "#84cc16" },
              { label: "Fair", count: conditionCounts.fair, color: "#f59e0b" },
              { label: "Poor", count: conditionCounts.poor, color: "#f97316" },
              {
                label: "Very Poor",
                count: conditionCounts.veryPoor,
                color: "#ef4444",
              },
            ].map(({ label, count, color }) => {
              const percentage =
                totalAssets > 0 ? (count / totalAssets) * 100 : 0;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{label}</span>
                    <span className="font-semibold text-gray-800">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-semibold text-yellow-800 mb-2">Key Insights</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {conditionCounts.veryPoor > 0 && (
                <li>
                  • {conditionCounts.veryPoor} assets in very poor condition
                  require immediate attention
                </li>
              )}
              {avgCondition < 3.0 && (
                <li>
                  • Overall asset condition ({avgCondition.toFixed(2)}) is below
                  acceptable standards
                </li>
              )}
              {conditionCounts.excellent + conditionCounts.good >
                totalAssets * 0.7 && (
                <li>
                  •{" "}
                  {(
                    ((conditionCounts.excellent + conditionCounts.good) /
                      totalAssets) *
                    100
                  ).toFixed(0)}
                  % of assets are in good or excellent condition
                </li>
              )}
              <li>
                • Estimated annual maintenance budget: $
                {(totalMaintenanceCost / 1000000).toFixed(2)}M
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
