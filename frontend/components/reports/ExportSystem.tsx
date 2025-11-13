/**
 * Export System Component
 *
 * Multi-format export system supporting PDF, Excel, CSV, and Word
 * with customizable templates and batch export capabilities
 */

"use client";

import { useState, useMemo } from "react";

export interface ExportFormat {
  type: "pdf" | "excel" | "csv" | "word" | "json";
  label: string;
  icon: string;
  description: string;
  options: ExportOption[];
}

export interface ExportOption {
  id: string;
  label: string;
  type: "boolean" | "select" | "text" | "number";
  defaultValue: unknown;
  options?: { value: string; label: string }[];
}

export interface ExportJob {
  id: string;
  name: string;
  format: ExportFormat["type"];
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  dataSource: string;
  filters?: Record<string, unknown>;
  createdDate: string;
  completedDate?: string;
  fileSize?: string;
  downloadUrl?: string;
  error?: string;
}

interface ExportSystemProps {
  dataSources: Array<{
    id: string;
    label: string;
    description: string;
    recordCount: number;
  }>;
  exportHistory?: ExportJob[];
  onExport: (config: {
    format: ExportFormat["type"];
    dataSource: string;
    options: Record<string, unknown>;
  }) => Promise<void>;
  onDownload?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
}

const exportFormats: ExportFormat[] = [
  {
    type: "pdf",
    label: "PDF Document",
    icon: "📄",
    description: "Professional formatted document for printing",
    options: [
      {
        id: "pageSize",
        label: "Page Size",
        type: "select",
        defaultValue: "A4",
        options: [
          { value: "A4", label: "A4" },
          { value: "Letter", label: "Letter" },
          { value: "Legal", label: "Legal" },
        ],
      },
      {
        id: "orientation",
        label: "Orientation",
        type: "select",
        defaultValue: "portrait",
        options: [
          { value: "portrait", label: "Portrait" },
          { value: "landscape", label: "Landscape" },
        ],
      },
      {
        id: "includeCharts",
        label: "Include Charts",
        type: "boolean",
        defaultValue: true,
      },
      {
        id: "includeImages",
        label: "Include Images",
        type: "boolean",
        defaultValue: true,
      },
      {
        id: "compression",
        label: "Compression",
        type: "select",
        defaultValue: "medium",
        options: [
          { value: "none", label: "None" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
        ],
      },
    ],
  },
  {
    type: "excel",
    label: "Excel Spreadsheet",
    icon: "📊",
    description: "Structured data for analysis and manipulation",
    options: [
      {
        id: "includeFormulas",
        label: "Include Formulas",
        type: "boolean",
        defaultValue: true,
      },
      {
        id: "includeFormatting",
        label: "Include Formatting",
        type: "boolean",
        defaultValue: true,
      },
      {
        id: "sheetPerCategory",
        label: "Separate Sheet per Category",
        type: "boolean",
        defaultValue: false,
      },
      {
        id: "includeSummary",
        label: "Include Summary Sheet",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
  {
    type: "csv",
    label: "CSV File",
    icon: "📋",
    description: "Simple comma-separated values for data import",
    options: [
      {
        id: "delimiter",
        label: "Delimiter",
        type: "select",
        defaultValue: ",",
        options: [
          { value: ",", label: "Comma (,)" },
          { value: ";", label: "Semicolon (;)" },
          { value: "\t", label: "Tab" },
        ],
      },
      {
        id: "includeHeaders",
        label: "Include Headers",
        type: "boolean",
        defaultValue: true,
      },
      {
        id: "encoding",
        label: "Encoding",
        type: "select",
        defaultValue: "utf8",
        options: [
          { value: "utf8", label: "UTF-8" },
          { value: "ascii", label: "ASCII" },
        ],
      },
    ],
  },
  {
    type: "word",
    label: "Word Document",
    icon: "📝",
    description: "Editable document with rich formatting",
    options: [
      {
        id: "includeStyles",
        label: "Include Styles",
        type: "boolean",
        defaultValue: true,
      },
      {
        id: "includeTOC",
        label: "Include Table of Contents",
        type: "boolean",
        defaultValue: true,
      },
      {
        id: "includePageNumbers",
        label: "Include Page Numbers",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
  {
    type: "json",
    label: "JSON Data",
    icon: "{ }",
    description: "Raw data for API integration and processing",
    options: [
      {
        id: "formatted",
        label: "Formatted (Pretty Print)",
        type: "boolean",
        defaultValue: true,
      },
      {
        id: "includeMetadata",
        label: "Include Metadata",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
];

export function ExportSystem({
  dataSources,
  exportHistory = [],
  onExport,
  onDownload,
  onDelete,
}: ExportSystemProps) {
  const [selectedFormat, setSelectedFormat] =
    useState<ExportFormat["type"]>("pdf");
  const [selectedDataSource, setSelectedDataSource] = useState<string>(
    dataSources[0]?.id || "",
  );
  const [exportOptions, setExportOptions] = useState<Record<string, unknown>>(
    {},
  );
  const [exportName, setExportName] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<"new" | "history">("new");

  // Get current format config
  const currentFormat = exportFormats.find((f) => f.type === selectedFormat)!;

  // Initialize options when format changes
  useMemo(() => {
    const defaultOptions: Record<string, unknown> = {};
    currentFormat.options.forEach((opt) => {
      defaultOptions[opt.id] = opt.defaultValue;
    });
    setExportOptions(defaultOptions);
  }, [selectedFormat, currentFormat]);

  // Handle export
  const handleExport = async () => {
    if (!selectedDataSource || !exportName) return;

    setIsExporting(true);
    try {
      await onExport({
        format: selectedFormat,
        dataSource: selectedDataSource,
        options: exportOptions,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const total = exportHistory.length;
    const completed = exportHistory.filter(
      (j) => j.status === "completed",
    ).length;
    const failed = exportHistory.filter((j) => j.status === "failed").length;
    const processing = exportHistory.filter(
      (j) => j.status === "processing",
    ).length;

    return { total, completed, failed, processing };
  }, [exportHistory]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Export System</h2>
            <p className="text-sm text-gray-600 mt-1">
              Export data in multiple formats for reporting and analysis
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("new")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === "new"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              📤 New Export
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === "history"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              📋 History ({stats.total})
            </button>
          </div>
        </div>

        {/* Statistics */}
        {viewMode === "history" && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium">Total Exports</p>
              <p className="text-xl font-bold text-blue-700 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-600 font-medium">Completed</p>
              <p className="text-xl font-bold text-green-700 mt-1">
                {stats.completed}
              </p>
            </div>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
              <p className="text-xs text-orange-600 font-medium">Processing</p>
              <p className="text-xl font-bold text-orange-700 mt-1">
                {stats.processing}
              </p>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-600 font-medium">Failed</p>
              <p className="text-xl font-bold text-red-700 mt-1">
                {stats.failed}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Export View */}
      {viewMode === "new" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Format Selection */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Select Export Format
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {exportFormats.map((format) => (
                  <button
                    key={format.type}
                    onClick={() => setSelectedFormat(format.type)}
                    className={`p-4 text-left rounded-lg border-2 transition-all ${
                      selectedFormat === format.type
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{format.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {format.label}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {format.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Data Source Selection */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Select Data Source
              </h3>
              <div className="space-y-2">
                {dataSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => setSelectedDataSource(source.id)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedDataSource === source.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {source.label}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {source.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">
                          {source.recordCount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">records</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Export Options
              </h3>

              {/* Export Name */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Export Name
                </label>
                <input
                  type="text"
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  placeholder="My Export"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Format-specific options */}
              <div className="space-y-3">
                {currentFormat.options.map((option) => (
                  <div key={option.id}>
                    {option.type === "boolean" && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={exportOptions[option.id] as boolean}
                          onChange={(e) =>
                            setExportOptions({
                              ...exportOptions,
                              [option.id]: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {option.label}
                        </span>
                      </label>
                    )}

                    {option.type === "select" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {option.label}
                        </label>
                        <select
                          value={exportOptions[option.id] as string}
                          onChange={(e) =>
                            setExportOptions({
                              ...exportOptions,
                              [option.id]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        >
                          {option.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={!selectedDataSource || !exportName || isExporting}
                className={`w-full mt-6 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  !selectedDataSource || !exportName || isExporting
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {isExporting ? "⏳ Exporting..." : "📤 Export Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export History View */}
      {viewMode === "history" && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Export History
          </h3>

          {exportHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-gray-600">No exports yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exportHistory.map((job) => {
                const format = exportFormats.find((f) => f.type === job.format);
                const statusConfig = {
                  pending: {
                    color: "text-gray-700",
                    bg: "bg-gray-100",
                    icon: "⏳",
                  },
                  processing: {
                    color: "text-blue-700",
                    bg: "bg-blue-100",
                    icon: "⚙️",
                  },
                  completed: {
                    color: "text-green-700",
                    bg: "bg-green-100",
                    icon: "✓",
                  },
                  failed: {
                    color: "text-red-700",
                    bg: "bg-red-100",
                    icon: "✗",
                  },
                };
                const status = statusConfig[job.status];

                return (
                  <div
                    key={job.id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-3xl">{format?.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {job.name}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-600">
                              {format?.label}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded font-semibold ${status.bg} ${status.color}`}
                            >
                              {status.icon} {job.status}
                            </span>
                            <span className="text-xs text-gray-600">
                              {new Date(job.createdDate).toLocaleDateString(
                                "en-NZ",
                              )}
                            </span>
                          </div>

                          {job.status === "processing" && (
                            <div className="mt-3">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all"
                                  style={{ width: `${job.progress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {job.progress}% complete
                              </p>
                            </div>
                          )}

                          {job.error && (
                            <p className="text-xs text-red-600 mt-2">
                              {job.error}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {job.status === "completed" && onDownload && (
                          <button
                            onClick={() => onDownload(job.id)}
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                          >
                            ⬇️ Download
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(job.id)}
                            className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
