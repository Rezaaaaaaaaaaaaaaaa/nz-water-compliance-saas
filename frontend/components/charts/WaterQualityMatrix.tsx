/**
 * Water Quality Parameter Matrix Component
 *
 * Comprehensive matrix showing water quality test results across
 * multiple parameters, sites, and time periods with compliance status
 */

"use client";

import { useState, useMemo } from "react";

export interface WaterQualityTest {
  id: string;
  siteId: string;
  siteName: string;
  parameter: string;
  value: number;
  unit: string;
  testDate: string;
  limit: number;
  targetRange?: { min: number; max: number };
  isCompliant: boolean;
  exceedancePercentage?: number; // How much over/under limit
}

interface WaterQualityMatrixProps {
  tests: WaterQualityTest[];
  viewMode?: "site-parameter" | "time-parameter";
  groupByMonth?: boolean;
}

const parameterInfo: Record<
  string,
  { unit: string; description: string; criticalLimit: number }
> = {
  "E. coli": {
    unit: "CFU/100mL",
    description: "Bacterial contamination indicator",
    criticalLimit: 1.0,
  },
  "Total Coliforms": {
    unit: "CFU/100mL",
    description: "General water quality indicator",
    criticalLimit: 10.0,
  },
  Turbidity: {
    unit: "NTU",
    description: "Water clarity measurement",
    criticalLimit: 5.0,
  },
  pH: {
    unit: "",
    description: "Acidity/alkalinity level",
    criticalLimit: 8.5,
  },
  "Free Chlorine": {
    unit: "mg/L",
    description: "Disinfection residual",
    criticalLimit: 5.0,
  },
  "Total Chlorine": {
    unit: "mg/L",
    description: "Total chlorine residual",
    criticalLimit: 5.0,
  },
  Temperature: {
    unit: "°C",
    description: "Water temperature",
    criticalLimit: 25.0,
  },
  Conductivity: {
    unit: "µS/cm",
    description: "Dissolved solids indicator",
    criticalLimit: 1000.0,
  },
  Nitrate: {
    unit: "mg/L",
    description: "Nitrogen contamination",
    criticalLimit: 50.0,
  },
  Fluoride: {
    unit: "mg/L",
    description: "Fluoridation level",
    criticalLimit: 1.5,
  },
};

export function WaterQualityMatrix({
  tests,
  viewMode = "site-parameter",
}: WaterQualityMatrixProps) {
  const [selectedView, setSelectedView] = useState<
    "site-parameter" | "time-parameter"
  >(viewMode);
  const [filterCompliance, setFilterCompliance] = useState<
    "all" | "compliant" | "non-compliant"
  >("all");

  // Get unique sites
  const sites = useMemo(() => {
    const siteSet = new Set(tests.map((t) => t.siteName));
    return Array.from(siteSet).sort();
  }, [tests]);

  // Get parameters from tests
  const parameters = useMemo(() => {
    const paramSet = new Set(tests.map((t) => t.parameter));
    return Array.from(paramSet).sort();
  }, [tests]);

  // Group tests by site and parameter
  const testMatrix = useMemo(() => {
    const matrix: Map<string, WaterQualityTest[]> = new Map();

    tests.forEach((test) => {
      const key = `${test.siteName}:${test.parameter}`;
      if (!matrix.has(key)) {
        matrix.set(key, []);
      }
      matrix.get(key)!.push(test);
    });

    return matrix;
  }, [tests]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTests = tests.length;
    const compliantTests = tests.filter((t) => t.isCompliant).length;
    const nonCompliantTests = totalTests - compliantTests;
    const complianceRate =
      totalTests > 0 ? (compliantTests / totalTests) * 100 : 0;

    const criticalExceedances = tests.filter(
      (t) =>
        !t.isCompliant && t.exceedancePercentage && t.exceedancePercentage > 50,
    ).length;

    const parameterStats = parameters.map((param) => {
      const paramTests = tests.filter((t) => t.parameter === param);
      const paramCompliant = paramTests.filter((t) => t.isCompliant).length;
      const paramRate =
        paramTests.length > 0 ? (paramCompliant / paramTests.length) * 100 : 0;

      return {
        parameter: param,
        total: paramTests.length,
        compliant: paramCompliant,
        rate: paramRate,
      };
    });

    return {
      totalTests,
      compliantTests,
      nonCompliantTests,
      complianceRate,
      criticalExceedances,
      parameterStats,
    };
  }, [tests, parameters]);

  // Get latest test for each site-parameter combination
  const getLatestTest = (
    siteName: string,
    parameter: string,
  ): WaterQualityTest | undefined => {
    const key = `${siteName}:${parameter}`;
    const testList = testMatrix.get(key);
    if (!testList || testList.length === 0) return undefined;

    return testList.reduce((latest, test) =>
      new Date(test.testDate) > new Date(latest.testDate) ? test : latest,
    );
  };

  // Get compliance color
  const getComplianceColor = (test?: WaterQualityTest) => {
    if (!test) return { bg: "#f3f4f6", text: "#9ca3af", border: "#e5e7eb" };

    if (test.isCompliant) {
      return { bg: "#d1fae5", text: "#065f46", border: "#10b981" };
    }

    const exceedance = test.exceedancePercentage || 0;
    if (exceedance > 100) {
      return { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" }; // Critical
    } else if (exceedance > 50) {
      return { bg: "#fed7aa", text: "#9a3412", border: "#f97316" }; // High
    } else {
      return { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" }; // Medium
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              Water Quality Parameter Matrix
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive view of {tests.length.toLocaleString()} test results
              across {sites.length} sites
            </p>
          </div>

          {/* View Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView("site-parameter")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedView === "site-parameter"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Site × Parameter
            </button>
            <button
              onClick={() => setSelectedView("time-parameter")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedView === "time-parameter"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Timeline View
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Tests</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {stats.totalTests.toLocaleString()}
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Compliant</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {stats.compliantTests.toLocaleString()}
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Non-Compliant</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {stats.nonCompliantTests.toLocaleString()}
            </p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">
              Compliance Rate
            </p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {stats.complianceRate.toFixed(1)}%
            </p>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">
              Critical Issues
            </p>
            <p className="text-2xl font-bold text-orange-700 mt-1">
              {stats.criticalExceedances}
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex gap-2">
            {(
              [
                { value: "all" as const, label: "All Tests" },
                { value: "compliant" as const, label: "Compliant Only" },
                {
                  value: "non-compliant" as const,
                  label: "Non-Compliant Only",
                },
              ] as const
            ).map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterCompliance(filter.value)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  filterCompliance === filter.value
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Matrix View */}
      {selectedView === "site-parameter" && (
        <div className="overflow-x-auto">
          <table className="w-full border-2 border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r-2 border-gray-200 sticky left-0 bg-gray-100 z-10">
                  Site / Parameter
                </th>
                {parameters.map((param) => (
                  <th
                    key={param}
                    className="px-3 py-3 text-center text-xs font-semibold text-gray-700 border-r border-gray-200 min-w-[120px]"
                  >
                    <div>{param}</div>
                    <div className="text-xs font-normal text-gray-500 mt-1">
                      {parameterInfo[param]?.unit || ""}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites.map((site, siteIndex) => (
                <tr
                  key={site}
                  className={siteIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td
                    className="px-4 py-3 text-sm font-medium text-gray-800 border-r-2 border-gray-200 sticky left-0 z-10"
                    style={{
                      backgroundColor:
                        siteIndex % 2 === 0 ? "white" : "#f9fafb",
                    }}
                  >
                    {site}
                  </td>
                  {parameters.map((param) => {
                    const test = getLatestTest(site, param);
                    const colors = getComplianceColor(test);

                    return (
                      <td
                        key={`${site}-${param}`}
                        className="px-3 py-3 text-center border-r border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: colors.bg,
                          borderLeftWidth: "3px",
                          borderLeftColor: colors.border,
                        }}
                        title={
                          test
                            ? `${test.value} ${test.unit}\nLimit: ${test.limit}\nDate: ${new Date(test.testDate).toLocaleDateString()}`
                            : "No data"
                        }
                      >
                        {test ? (
                          <>
                            <div
                              className="text-sm font-bold"
                              style={{ color: colors.text }}
                            >
                              {test.value.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {test.isCompliant ? "✓" : "✗"}{" "}
                              {new Date(test.testDate).toLocaleDateString(
                                "en-NZ",
                                { month: "short", day: "numeric" },
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Parameter Statistics */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Parameter Compliance Summary
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {stats.parameterStats.map((paramStat) => {
            const info = parameterInfo[paramStat.parameter];
            return (
              <div
                key={paramStat.parameter}
                className="bg-white border-2 border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-semibold text-gray-800">
                      {paramStat.parameter}
                    </h5>
                    {info && (
                      <p className="text-xs text-gray-500 mt-1">
                        {info.description} • Limit: {info.criticalLimit}{" "}
                        {info.unit}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${
                        paramStat.rate >= 95
                          ? "text-green-600"
                          : paramStat.rate >= 80
                            ? "text-orange-600"
                            : "text-red-600"
                      }`}
                    >
                      {paramStat.rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {paramStat.compliant} / {paramStat.total}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${paramStat.rate}%`,
                      backgroundColor:
                        paramStat.rate >= 95
                          ? "#10b981"
                          : paramStat.rate >= 80
                            ? "#f59e0b"
                            : "#ef4444",
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Compliance Status Legend
        </h4>
        <div className="flex items-center gap-6">
          {[
            { label: "Compliant", bg: "#d1fae5", border: "#10b981" },
            { label: "Minor Exceedance", bg: "#fef3c7", border: "#f59e0b" },
            { label: "Moderate Exceedance", bg: "#fed7aa", border: "#f97316" },
            { label: "Critical Exceedance", bg: "#fee2e2", border: "#ef4444" },
            { label: "No Data", bg: "#f3f4f6", border: "#e5e7eb" },
          ].map(({ label, bg, border }) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border-2"
                style={{ backgroundColor: bg, borderColor: border }}
              ></div>
              <span className="text-xs text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
