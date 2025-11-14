/**
 * Milestone Tracker Component
 *
 * Comprehensive milestone tracking system for compliance goals,
 * certification targets, and regulatory deadlines
 */

"use client";

import { useState, useMemo } from "react";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  category:
    | "certification"
    | "compliance"
    | "infrastructure"
    | "training"
    | "audit";
  targetDate: string;
  completionDate?: string;
  status: "not_started" | "on_track" | "at_risk" | "delayed" | "completed";
  progress: number; // 0-100
  owner: {
    id: string;
    name: string;
    email: string;
  };
  dependencies?: string[]; // IDs of prerequisite milestones
  checkpoints?: {
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
    completedDate?: string;
  }[];
  metrics?: {
    label: string;
    current: number;
    target: number;
    unit: string;
  }[];
  impacts?: {
    type: "compliance" | "operational" | "financial";
    description: string;
    severity: "low" | "medium" | "high";
  }[];
  notes?: string;
}

interface MilestoneTrackerProps {
  milestones: Milestone[];
  onMilestoneClick?: (milestone: Milestone) => void;
  onMilestoneUpdate?: (milestoneId: string, progress: number) => void;
}

const categoryConfig = {
  certification: {
    label: "Certification",
    icon: "📜",
    color: "#3b82f6",
    bgColor: "#dbeafe",
  },
  compliance: {
    label: "Compliance",
    icon: "✅",
    color: "#10b981",
    bgColor: "#d1fae5",
  },
  infrastructure: {
    label: "Infrastructure",
    icon: "🏗️",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
  },
  training: {
    label: "Training",
    icon: "🎓",
    color: "#f59e0b",
    bgColor: "#fef3c7",
  },
  audit: {
    label: "Audit",
    icon: "🔍",
    color: "#ef4444",
    bgColor: "#fee2e2",
  },
};

const statusConfig = {
  not_started: {
    label: "Not Started",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    icon: "○",
  },
  on_track: {
    label: "On Track",
    color: "#10b981",
    bgColor: "#d1fae5",
    icon: "✓",
  },
  at_risk: {
    label: "At Risk",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    icon: "⚠️",
  },
  delayed: {
    label: "Delayed",
    color: "#ef4444",
    bgColor: "#fee2e2",
    icon: "⏰",
  },
  completed: {
    label: "Completed",
    color: "#10b981",
    bgColor: "#d1fae5",
    icon: "✅",
  },
};

export function MilestoneTracker({
  milestones,
  onMilestoneClick,
}: MilestoneTrackerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(
    null,
  );

  // Filter milestones
  const filteredMilestones = useMemo(() => {
    return milestones.filter((milestone) => {
      if (selectedCategory !== "all" && milestone.category !== selectedCategory)
        return false;
      if (selectedStatus !== "all" && milestone.status !== selectedStatus)
        return false;
      return true;
    });
  }, [milestones, selectedCategory, selectedStatus]);

  // Sort by target date
  const sortedMilestones = useMemo(() => {
    return [...filteredMilestones].sort(
      (a, b) =>
        new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime(),
    );
  }, [filteredMilestones]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter((m) => m.status === "completed").length;
    const onTrack = milestones.filter((m) => m.status === "on_track").length;
    const atRisk = milestones.filter((m) => m.status === "at_risk").length;
    const delayed = milestones.filter((m) => m.status === "delayed").length;
    const overallProgress =
      milestones.reduce((sum, m) => sum + m.progress, 0) /
      (milestones.length || 1);

    const upcomingDeadlines = milestones.filter((m) => {
      const daysUntil = Math.ceil(
        (new Date(m.targetDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return daysUntil >= 0 && daysUntil <= 30 && m.status !== "completed";
    }).length;

    return {
      total,
      completed,
      onTrack,
      atRisk,
      delayed,
      overallProgress,
      upcomingDeadlines,
    };
  }, [milestones]);

  // Get days until deadline
  const getDaysUntilDeadline = (targetDate: string): number => {
    return Math.ceil(
      (new Date(targetDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
  };

  // Get urgency color
  const getUrgencyColor = (milestone: Milestone): string => {
    if (milestone.status === "completed") return "#10b981";
    const daysUntil = getDaysUntilDeadline(milestone.targetDate);
    if (daysUntil < 0) return "#ef4444";
    if (daysUntil <= 7) return "#f59e0b";
    if (daysUntil <= 30) return "#3b82f6";
    return "#6b7280";
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Milestone Tracker
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Track compliance goals and certification targets
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === "timeline"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              📅 Timeline
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              📊 Grid
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {stats.total}
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Completed</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {stats.completed}
            </p>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
            <p className="text-sm text-emerald-600 font-medium">On Track</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {stats.onTrack}
            </p>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">At Risk</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">
              {stats.atRisk}
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Delayed</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {stats.delayed}
            </p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Progress</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {stats.overallProgress.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="all">All Statuses</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines Alert */}
      {stats.upcomingDeadlines > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-2xl">⏰</div>
            <div>
              <h4 className="font-semibold text-yellow-800">
                {stats.upcomingDeadlines} milestone
                {stats.upcomingDeadlines !== 1 ? "s" : ""} due within 30 days
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Review progress and ensure resources are allocated appropriately
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline View */}
      {viewMode === "timeline" && (
        <div className="space-y-4">
          {sortedMilestones.map((milestone) => {
            const categoryInfo = categoryConfig[milestone.category];
            const statusInfo = statusConfig[milestone.status];
            const daysUntil = getDaysUntilDeadline(milestone.targetDate);
            const isExpanded = expandedMilestone === milestone.id;
            const urgencyColor = getUrgencyColor(milestone);

            return (
              <div
                key={milestone.id}
                className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Milestone Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => {
                    setExpandedMilestone(isExpanded ? null : milestone.id);
                    onMilestoneClick?.(milestone);
                  }}
                  style={{
                    borderLeftWidth: "6px",
                    borderLeftColor: urgencyColor,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                          style={{
                            backgroundColor: categoryInfo.bgColor,
                            color: categoryInfo.color,
                          }}
                        >
                          {categoryInfo.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-lg">
                            {milestone.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {milestone.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: statusInfo.bgColor,
                              color: statusInfo.color,
                            }}
                          >
                            {statusInfo.icon} {statusInfo.label}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-800">
                              {milestone.progress}%
                            </div>
                            <div className="text-xs text-gray-500">
                              complete
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${milestone.progress}%`,
                            backgroundColor: statusInfo.color,
                          }}
                        ></div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Owner:</span>
                          <span>{milestone.owner.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Target:</span>
                          <span>
                            {new Date(milestone.targetDate).toLocaleDateString(
                              "en-NZ",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                          {daysUntil >= 0 &&
                            milestone.status !== "completed" && (
                              <span
                                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  daysUntil <= 7
                                    ? "bg-red-100 text-red-700"
                                    : daysUntil <= 30
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {daysUntil === 0
                                  ? "Due Today"
                                  : daysUntil === 1
                                    ? "Due Tomorrow"
                                    : `${daysUntil} days`}
                              </span>
                            )}
                          {daysUntil < 0 &&
                            milestone.status !== "completed" && (
                              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                {Math.abs(daysUntil)} days overdue
                              </span>
                            )}
                        </div>
                        {milestone.checkpoints && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Checkpoints:</span>
                            <span>
                              {
                                milestone.checkpoints.filter((c) => c.completed)
                                  .length
                              }
                              /{milestone.checkpoints.length}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button className="text-2xl text-gray-400 ml-4">
                      {isExpanded ? "▼" : "▶"}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-gray-50 border-t-2 border-gray-200">
                    {/* Checkpoints */}
                    {milestone.checkpoints &&
                      milestone.checkpoints.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-semibold text-gray-800 mb-3">
                            Checkpoints
                          </h5>
                          <div className="space-y-2">
                            {milestone.checkpoints.map((checkpoint) => (
                              <div
                                key={checkpoint.id}
                                className={`flex items-center justify-between p-3 rounded ${
                                  checkpoint.completed
                                    ? "bg-green-100 border border-green-300"
                                    : "bg-white border border-gray-200"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                      checkpoint.completed
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-200 text-gray-500"
                                    }`}
                                  >
                                    {checkpoint.completed ? "✓" : "○"}
                                  </div>
                                  <div>
                                    <p
                                      className={`text-sm font-medium ${
                                        checkpoint.completed
                                          ? "text-green-800 line-through"
                                          : "text-gray-800"
                                      }`}
                                    >
                                      {checkpoint.title}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      Due:{" "}
                                      {new Date(
                                        checkpoint.dueDate,
                                      ).toLocaleDateString("en-NZ")}
                                    </p>
                                  </div>
                                </div>
                                {checkpoint.completedDate && (
                                  <span className="text-xs text-green-600">
                                    Completed{" "}
                                    {new Date(
                                      checkpoint.completedDate,
                                    ).toLocaleDateString("en-NZ")}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Metrics */}
                    {milestone.metrics && milestone.metrics.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-800 mb-3">
                          Metrics
                        </h5>
                        <div className="grid grid-cols-3 gap-3">
                          {milestone.metrics.map((metric, idx) => {
                            const progress =
                              (metric.current / metric.target) * 100;
                            return (
                              <div
                                key={idx}
                                className="bg-white p-3 rounded border border-gray-200"
                              >
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  {metric.label}
                                </p>
                                <div className="flex items-baseline gap-2 mb-2">
                                  <span className="text-lg font-bold text-blue-700">
                                    {metric.current}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    / {metric.target} {metric.unit}
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500"
                                    style={{
                                      width: `${Math.min(progress, 100)}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Impacts */}
                    {milestone.impacts && milestone.impacts.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-800 mb-3">
                          Potential Impacts
                        </h5>
                        <div className="space-y-2">
                          {milestone.impacts.map((impact, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded border ${
                                impact.severity === "high"
                                  ? "bg-red-50 border-red-200"
                                  : impact.severity === "medium"
                                    ? "bg-orange-50 border-orange-200"
                                    : "bg-blue-50 border-blue-200"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-sm font-medium text-gray-700">
                                  {impact.type === "compliance"
                                    ? "⚖️"
                                    : impact.type === "operational"
                                      ? "⚙️"
                                      : "💰"}
                                </span>
                                <p className="text-sm text-gray-700">
                                  {impact.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {milestone.notes && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">
                          <span className="font-semibold">Notes:</span>{" "}
                          {milestone.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-3 gap-4">
          {sortedMilestones.map((milestone) => {
            const categoryInfo = categoryConfig[milestone.category];
            const statusInfo = statusConfig[milestone.status];
            const daysUntil = getDaysUntilDeadline(milestone.targetDate);

            return (
              <div
                key={milestone.id}
                onClick={() => onMilestoneClick?.(milestone)}
                className="bg-white border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all"
                style={{
                  borderTopWidth: "4px",
                  borderTopColor: categoryInfo.color,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl">{categoryInfo.icon}</div>
                  <div
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: statusInfo.bgColor,
                      color: statusInfo.color,
                    }}
                  >
                    {statusInfo.icon}
                  </div>
                </div>

                <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                  {milestone.title}
                </h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {milestone.description}
                </p>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-bold text-gray-800">
                      {milestone.progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${milestone.progress}%`,
                        backgroundColor: statusInfo.color,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium">Owner:</span>{" "}
                    {milestone.owner.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Target:</span>
                    <span>
                      {new Date(milestone.targetDate).toLocaleDateString(
                        "en-NZ",
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </span>
                  </div>
                  {daysUntil >= 0 && milestone.status !== "completed" && (
                    <div
                      className={`text-center py-1 rounded font-semibold ${
                        daysUntil <= 7
                          ? "bg-red-100 text-red-700"
                          : daysUntil <= 30
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {daysUntil === 0 ? "Due Today" : `${daysUntil} days left`}
                    </div>
                  )}
                  {daysUntil < 0 && milestone.status !== "completed" && (
                    <div className="text-center py-1 rounded font-semibold bg-red-100 text-red-700">
                      {Math.abs(daysUntil)} days overdue
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
