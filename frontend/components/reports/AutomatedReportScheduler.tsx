/**
 * Automated Report Scheduler Component
 *
 * Schedule and manage automated report generation with
 * flexible recurrence patterns, recipients, and delivery options
 */

"use client";

import { useState, useMemo } from "react";

export interface ScheduledReport {
  id: string;
  name: string;
  reportType: string;
  description?: string;
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "quarterly" | "custom";
    time: string; // HH:MM format
    dayOfWeek?: number; // 0-6 for Sunday-Saturday
    dayOfMonth?: number; // 1-31
    customCron?: string;
  };
  recipients: {
    id: string;
    name: string;
    email: string;
    role: string;
  }[];
  deliveryMethod: "email" | "sharepoint" | "sftp" | "webhook";
  format: "pdf" | "excel" | "csv" | "word";
  filters?: Record<string, unknown>;
  enabled: boolean;
  nextRun?: string;
  lastRun?: {
    date: string;
    status: "success" | "failed";
    error?: string;
  };
  createdBy: string;
  createdDate: string;
  lastModified: string;
  runCount?: number;
  successRate?: number;
}

interface AutomatedReportSchedulerProps {
  reports: ScheduledReport[];
  reportTypes: Array<{ id: string; label: string; description: string }>;
  onSave: (report: ScheduledReport) => void;
  onToggle: (reportId: string, enabled: boolean) => void;
  onDelete: (reportId: string) => void;
  onRunNow?: (reportId: string) => void;
}

const frequencyConfig = {
  daily: {
    label: "Daily",
    icon: "📅",
    description: "Run every day at specified time",
  },
  weekly: { label: "Weekly", icon: "📆", description: "Run once per week" },
  monthly: { label: "Monthly", icon: "🗓️", description: "Run once per month" },
  quarterly: {
    label: "Quarterly",
    icon: "📊",
    description: "Run every 3 months",
  },
  custom: {
    label: "Custom",
    icon: "⚙️",
    description: "Custom cron expression",
  },
};

const deliveryMethodConfig = {
  email: { label: "Email", icon: "📧", description: "Send via email" },
  sharepoint: {
    label: "SharePoint",
    icon: "📁",
    description: "Upload to SharePoint",
  },
  sftp: { label: "SFTP", icon: "🔐", description: "Transfer via SFTP" },
  webhook: { label: "Webhook", icon: "🔗", description: "POST to webhook URL" },
};

const formatConfig = {
  pdf: { label: "PDF", icon: "📄" },
  excel: { label: "Excel", icon: "📊" },
  csv: { label: "CSV", icon: "📋" },
  word: { label: "Word", icon: "📝" },
};

export function AutomatedReportScheduler({
  reports,
  reportTypes,
  onSave,
  onToggle,
  onDelete,
  onRunNow,
}: AutomatedReportSchedulerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(
    null,
  );
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Filter reports
  const filteredReports = useMemo(() => {
    if (selectedFilter === "all") return reports;
    return reports.filter((r) =>
      selectedFilter === "active" ? r.enabled : !r.enabled,
    );
  }, [reports, selectedFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = reports.length;
    const active = reports.filter((r) => r.enabled).length;
    const inactive = reports.filter((r) => !r.enabled).length;
    const failedLast = reports.filter(
      (r) => r.lastRun?.status === "failed",
    ).length;
    const avgSuccessRate =
      reports.reduce((sum, r) => sum + (r.successRate || 0), 0) / (total || 1);

    return { total, active, inactive, failedLast, avgSuccessRate };
  }, [reports]);

  // Get next run time display
  const getNextRunDisplay = (report: ScheduledReport) => {
    if (!report.nextRun) return "Not scheduled";
    const nextRun = new Date(report.nextRun);
    const now = new Date();
    const diffMs = nextRun.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 1) {
      return `In ${diffDays} days`;
    } else if (diffHours > 1) {
      return `In ${diffHours} hours`;
    } else if (diffMs > 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `In ${diffMins} minutes`;
    } else {
      return "Overdue";
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Automated Report Scheduler
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Schedule recurring reports with automated delivery
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            ➕ New Schedule
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-600 font-medium">Total Schedules</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {stats.total}
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-xs text-green-600 font-medium">Active</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {stats.active}
            </p>
          </div>

          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-medium">Inactive</p>
            <p className="text-2xl font-bold text-gray-700 mt-1">
              {stats.inactive}
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-xs text-red-600 font-medium">Failed Last Run</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {stats.failedLast}
            </p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <p className="text-xs text-purple-600 font-medium">
              Avg Success Rate
            </p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {stats.avgSuccessRate.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedFilter === filter
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {filter === "all" && "All Schedules"}
              {filter === "active" && "Active"}
              {filter === "inactive" && "Inactive"}
            </button>
          ))}
        </div>
      </div>

      {/* Scheduled Reports List */}
      <div className="space-y-3">
        {filteredReports.map((report) => {
          const frequencyInfo = frequencyConfig[report.schedule.frequency];
          const deliveryInfo = deliveryMethodConfig[report.deliveryMethod];
          const formatInfo = formatConfig[report.format];
          const nextRunDisplay = getNextRunDisplay(report);

          return (
            <div
              key={report.id}
              className={`bg-white border-2 rounded-lg p-6 transition-all ${
                report.enabled
                  ? "border-gray-200 hover:shadow-md"
                  : "border-gray-300 bg-gray-50 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between">
                {/* Report Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{frequencyInfo.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {report.name}
                      </h4>
                      {report.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {report.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Schedule Details */}
                  <div className="flex items-center gap-6 mt-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Frequency:</span>
                      <span className="font-semibold text-gray-800">
                        {frequencyInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-semibold text-gray-800">
                        {report.schedule.time}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Format:</span>
                      <span className="font-semibold text-gray-800">
                        {formatInfo.icon} {formatInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-semibold text-gray-800">
                        {deliveryInfo.icon} {deliveryInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Recipients:</span>
                      <span className="font-semibold text-gray-800">
                        {report.recipients.length}{" "}
                        {report.recipients.length === 1 ? "person" : "people"}
                      </span>
                    </div>
                  </div>

                  {/* Status & Next Run */}
                  <div className="flex items-center gap-6 mt-3">
                    <div
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        report.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {report.enabled ? "✓ Active" : "○ Inactive"}
                    </div>

                    {report.nextRun && report.enabled && (
                      <div className="text-sm">
                        <span className="text-gray-600">Next run:</span>{" "}
                        <span className="font-semibold text-blue-600">
                          {nextRunDisplay}
                        </span>
                      </div>
                    )}

                    {report.lastRun && (
                      <div className="text-sm">
                        <span className="text-gray-600">Last run:</span>{" "}
                        <span
                          className={`font-semibold ${
                            report.lastRun.status === "success"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {report.lastRun.status === "success" ? "✓" : "✗"}{" "}
                          {new Date(report.lastRun.date).toLocaleDateString(
                            "en-NZ",
                          )}
                        </span>
                      </div>
                    )}

                    {report.successRate !== undefined &&
                      report.runCount &&
                      report.runCount > 0 && (
                        <div className="text-sm">
                          <span className="text-gray-600">Success rate:</span>{" "}
                          <span className="font-semibold text-gray-800">
                            {report.successRate.toFixed(0)}%
                          </span>
                          <span className="text-gray-500 ml-1">
                            ({report.runCount} runs)
                          </span>
                        </div>
                      )}
                  </div>

                  {/* Last Run Error */}
                  {report.lastRun?.status === "failed" &&
                    report.lastRun.error && (
                      <div className="mt-3 p-2 bg-red-50 border-l-4 border-red-500 rounded">
                        <p className="text-xs text-red-700">
                          <span className="font-semibold">Last error:</span>{" "}
                          {report.lastRun.error}
                        </p>
                      </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-6">
                  {onRunNow && report.enabled && (
                    <button
                      onClick={() => onRunNow(report.id)}
                      className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Run now"
                    >
                      ▶️
                    </button>
                  )}

                  <button
                    onClick={() => setEditingReport(report)}
                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Edit"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => onToggle(report.id, !report.enabled)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      report.enabled
                        ? "text-orange-600 bg-orange-50 hover:bg-orange-100"
                        : "text-green-600 bg-green-50 hover:bg-green-100"
                    }`}
                    title={report.enabled ? "Disable" : "Enable"}
                  >
                    {report.enabled ? "⏸️" : "▶️"}
                  </button>

                  <button
                    onClick={() => onDelete(report.id)}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredReports.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-gray-200">
            <p className="text-2xl mb-2">📅</p>
            <p className="text-gray-600">
              {selectedFilter === "all"
                ? "No scheduled reports yet"
                : `No ${selectedFilter} schedules`}
            </p>
            {selectedFilter === "all" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create First Schedule
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingReport) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowCreateModal(false);
            setEditingReport(null);
          }}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b-2 border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingReport ? "Edit Schedule" : "Create New Schedule"}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingReport(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Report Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Schedule Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Weekly Compliance Report"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Report Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Report Type
                  </label>
                  <select className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">
                    {reportTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Frequency
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(frequencyConfig).map(([key, config]) => (
                      <button
                        key={key}
                        className="p-3 text-left rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{config.icon}</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {config.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format & Delivery */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Format
                    </label>
                    <select className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">
                      {Object.entries(formatConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.icon} {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Delivery Method
                    </label>
                    <select className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">
                      {Object.entries(deliveryMethodConfig).map(
                        ([key, config]) => (
                          <option key={key} value={key}>
                            {config.icon} {config.label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>

                {/* Recipients */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Recipients
                  </label>
                  <div className="p-4 border-2 border-gray-300 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Recipients management would go here
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingReport(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                  {editingReport ? "Save Changes" : "Create Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
