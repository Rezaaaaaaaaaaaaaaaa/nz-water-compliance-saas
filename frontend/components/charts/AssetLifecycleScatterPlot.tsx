/**
 * Asset Lifecycle Scatter Plot Component
 *
 * Scatter plot visualization showing asset age vs condition with
 * replacement/maintenance recommendations
 */

"use client";

import { useState, useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Label,
} from "recharts";

export interface AssetDataPoint {
  id: string;
  name: string;
  type:
    | "Treatment Plant"
    | "Reservoir"
    | "Pump Station"
    | "Pipeline"
    | "Bore"
    | "Other";
  age: number; // years
  condition: number; // 1-5 scale
  maintenanceCost: number;
  replacementCost: number;
  criticality: "low" | "medium" | "high" | "critical";
  lastInspection?: string;
  nextScheduledMaintenance?: string;
}

interface AssetLifecycleScatterPlotProps {
  assets: AssetDataPoint[];
  height?: number;
  onAssetClick?: (asset: AssetDataPoint) => void;
}

const typeColors = {
  "Treatment Plant": "#3b82f6",
  Reservoir: "#10b981",
  "Pump Station": "#f59e0b",
  Pipeline: "#8b5cf6",
  Bore: "#06b6d4",
  Other: "#6b7280",
};

const criticalityConfig = {
  low: { label: "Low", color: "#6b7280" },
  medium: { label: "Medium", color: "#3b82f6" },
  high: { label: "High", color: "#f59e0b" },
  critical: { label: "Critical", color: "#ef4444" },
};

const conditionLabels = {
  5: "Excellent",
  4: "Good",
  3: "Fair",
  2: "Poor",
  1: "Very Poor",
};

export function AssetLifecycleScatterPlot({
  assets,
  height = 500,
  onAssetClick,
}: AssetLifecycleScatterPlotProps) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCriticality, setSelectedCriticality] = useState<string>("all");

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (selectedType !== "all" && asset.type !== selectedType) return false;
      if (
        selectedCriticality !== "all" &&
        asset.criticality !== selectedCriticality
      )
        return false;
      return true;
    });
  }, [assets, selectedType, selectedCriticality]);

  // Group assets by quadrant
  const quadrants = useMemo(() => {
    const avgAge =
      filteredAssets.reduce((sum, a) => sum + a.age, 0) / filteredAssets.length;
    const avgCondition =
      filteredAssets.reduce((sum, a) => sum + a.condition, 0) /
      filteredAssets.length;

    return {
      newGood: filteredAssets.filter(
        (a) => a.age <= avgAge && a.condition >= avgCondition,
      ),
      newPoor: filteredAssets.filter(
        (a) => a.age <= avgAge && a.condition < avgCondition,
      ),
      oldGood: filteredAssets.filter(
        (a) => a.age > avgAge && a.condition >= avgCondition,
      ),
      oldPoor: filteredAssets.filter(
        (a) => a.age > avgAge && a.condition < avgCondition,
      ),
      avgAge,
      avgCondition,
    };
  }, [filteredAssets]);

  // Calculate statistics
  const stats = useMemo(() => {
    const replaceNow = filteredAssets.filter(
      (a) => a.age > 40 || a.condition <= 2,
    ).length;
    const maintainSoon = filteredAssets.filter(
      (a) => a.condition === 3 || (a.age > 25 && a.condition < 4),
    ).length;
    const goodCondition = filteredAssets.filter((a) => a.condition >= 4).length;
    const avgAge =
      filteredAssets.reduce((sum, a) => sum + a.age, 0) / filteredAssets.length;
    const avgCondition =
      filteredAssets.reduce((sum, a) => sum + a.condition, 0) /
      filteredAssets.length;
    const totalReplacementCost = filteredAssets
      .filter((a) => a.age > 40 || a.condition <= 2)
      .reduce((sum, a) => sum + a.replacementCost, 0);

    return {
      replaceNow,
      maintainSoon,
      goodCondition,
      avgAge,
      avgCondition,
      totalReplacementCost,
    };
  }, [filteredAssets]);

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: AssetDataPoint }>;
  }) => {
    if (active && payload && payload.length) {
      const asset = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">
          <p className="font-bold text-gray-800 mb-2">{asset.name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              <span className="font-semibold">Type:</span> {asset.type}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Age:</span> {asset.age} years
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Condition:</span>{" "}
              {conditionLabels[asset.condition as keyof typeof conditionLabels]}{" "}
              ({asset.condition}/5)
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Criticality:</span>{" "}
              {
                criticalityConfig[
                  asset.criticality as keyof typeof criticalityConfig
                ].label
              }
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Maintenance:</span> $
              {(asset.maintenanceCost / 1000).toFixed(0)}k/year
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Replacement:</span> $
              {(asset.replacementCost / 1000000).toFixed(2)}M
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              Asset Lifecycle Analysis
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Age vs condition scatter plot for {filteredAssets.length} assets
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Assets</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {filteredAssets.length}
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Replace Now</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {stats.replaceNow}
            </p>
            <p className="text-xs text-red-600 mt-1">
              ${(stats.totalReplacementCost / 1000000).toFixed(1)}M
            </p>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">Maintain Soon</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">
              {stats.maintainSoon}
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Good Condition</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {stats.goodCondition}
            </p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">
              Avg Age/Condition
            </p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {stats.avgAge.toFixed(0)}y / {stats.avgCondition.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Asset Type:
            </span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="all">All Types</option>
              {Object.keys(typeColors).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Criticality Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Criticality:
            </span>
            <select
              value={selectedCriticality}
              onChange={(e) => setSelectedCriticality(e.target.value)}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="all">All Levels</option>
              {Object.entries(criticalityConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scatter Plot */}
      <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              dataKey="age"
              name="Age"
              unit=" years"
              label={{
                value: "Asset Age (years)",
                position: "insideBottom",
                offset: -10,
                style: { fontWeight: "bold" },
              }}
            />
            <YAxis
              type="number"
              dataKey="condition"
              name="Condition"
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              label={{
                value: "Condition Score",
                angle: -90,
                position: "insideLeft",
                style: { fontWeight: "bold" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              content={() => (
                <div className="flex justify-center gap-6 mt-4">
                  {Object.entries(typeColors).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-xs text-gray-700">{type}</span>
                    </div>
                  ))}
                </div>
              )}
            />

            {/* Reference lines for quadrants */}
            <ReferenceLine
              x={quadrants.avgAge}
              stroke="#9ca3af"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
            <ReferenceLine
              y={quadrants.avgCondition}
              stroke="#9ca3af"
              strokeDasharray="5 5"
              strokeWidth={2}
            />

            {/* Threshold lines */}
            <ReferenceLine
              y={2}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="3 3"
            >
              <Label
                value="Replace Below"
                position="right"
                fill="#ef4444"
                fontSize={12}
              />
            </ReferenceLine>
            <ReferenceLine
              x={40}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="3 3"
            >
              <Label
                value="Consider Replacement"
                position="top"
                fill="#f59e0b"
                fontSize={12}
              />
            </ReferenceLine>

            {/* Scatter data by type */}
            {Object.entries(typeColors).map(([type, color]) => (
              <Scatter
                key={type}
                name={type}
                data={filteredAssets.filter((a) => a.type === type)}
                fill={color}
                onClick={(data) => onAssetClick?.(data)}
                style={{ cursor: "pointer" }}
              >
                {filteredAssets
                  .filter((a) => a.type === type)
                  .map((asset, index) => {
                    const size =
                      asset.criticality === "critical"
                        ? 120
                        : asset.criticality === "high"
                          ? 100
                          : asset.criticality === "medium"
                            ? 80
                            : 60;
                    return <Cell key={`cell-${index}`} r={size} />;
                  })}
              </Scatter>
            ))}
          </ScatterChart>
        </ResponsiveContainer>

        {/* Quadrant Labels */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">
              ✅ Optimal Zone ({quadrants.newGood.length} assets)
            </h4>
            <p className="text-sm text-green-700">
              Newer assets in good condition. Continue routine maintenance.
            </p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">
              🔧 Monitor & Maintain ({quadrants.oldGood.length} assets)
            </h4>
            <p className="text-sm text-blue-700">
              Aging but well-maintained. Plan for eventual replacement.
            </p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">
              ⚠️ Immediate Attention ({quadrants.newPoor.length} assets)
            </h4>
            <p className="text-sm text-yellow-700">
              Newer assets in poor condition. Investigate and repair promptly.
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">
              🚨 Replace Urgently ({quadrants.oldPoor.length} assets)
            </h4>
            <p className="text-sm text-red-700">
              Aging assets in poor condition. Prioritize for replacement.
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">
              Asset Management Recommendations
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • {stats.replaceNow} assets require immediate replacement (Est.
                ${(stats.totalReplacementCost / 1000000).toFixed(1)}M)
              </li>
              <li>
                • {stats.maintainSoon} assets need enhanced maintenance to
                prevent deterioration
              </li>
              <li>
                • {stats.goodCondition} assets in good condition - maintain
                current programs
              </li>
              <li>
                • Average asset age: {stats.avgAge.toFixed(0)} years (industry
                avg: 25-30 years)
              </li>
              {stats.avgCondition < 3 && (
                <li className="font-semibold">
                  ⚠️ Overall asset condition ({stats.avgCondition.toFixed(1)}/5)
                  requires strategic intervention
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600 mb-2 font-semibold">Note:</p>
        <p className="text-xs text-gray-600">
          • Bubble size indicates criticality (larger = more critical) •
          Condition scale: 5 = Excellent, 4 = Good, 3 = Fair, 2 = Poor, 1 = Very
          Poor • Assets below condition 2 or over 40 years should be considered
          for replacement
        </p>
      </div>
    </div>
  );
}
