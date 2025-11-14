/**
 * Corrective Action Tracker Component
 *
 * Track and manage corrective actions from audits, incidents,
 * and non-conformances with completion tracking and evidence
 */

"use client";

import { useState, useMemo } from "react";

export interface CorrectiveAction {
  id: string;
  title: string;
  description: string;
  source: "audit" | "incident" | "inspection" | "complaint" | "self_assessment";
  sourceReference?: string; // e.g., "Audit Report #2024-Q1"
  category:
    | "infrastructure"
    | "procedure"
    | "documentation"
    | "training"
    | "equipment"
    | "monitoring";
  severity: "minor" | "moderate" | "major" | "critical";
  status: "open" | "in_progress" | "verification" | "completed" | "overdue";
  priority: "low" | "medium" | "high" | "urgent";
  identifiedDate: string;
  dueDate: string;
  completionDate?: string;
  assignedTo: {
    id: string;
    name: string;
    role: string;
  };
  approver?: {
    id: string;
    name: string;
    role: string;
  };
  rootCause?: string;
  correctiveAction: string;
  preventiveAction?: string;
  resourcesRequired?: {
    type: "budget" | "personnel" | "equipment" | "time";
    description: string;
    allocated: boolean;
  }[];
  verificationMethod?: string;
  evidence?: {
    id: string;
    type: "document" | "photo" | "inspection_report" | "certificate";
    name: string;
    uploadDate: string;
  }[];
  comments?: {
    id: string;
    author: string;
    date: string;
    text: string;
  }[];
  effectiveness?: {
    assessed: boolean;
    assessmentDate?: string;
    rating?: "effective" | "partially_effective" | "ineffective";
    notes?: string;
  };
}

interface CorrectiveActionTrackerProps {
  actions: CorrectiveAction[];
  onActionClick?: (action: CorrectiveAction) => void;
  onStatusUpdate?: (
    actionId: string,
    status: CorrectiveAction["status"],
  ) => void;
}

const sourceConfig = {
  audit: { label: "Audit", icon: "🔍", color: "#3b82f6" },
  incident: { label: "Incident", icon: "⚠️", color: "#ef4444" },
  inspection: { label: "Inspection", icon: "👁️", color: "#8b5cf6" },
  complaint: { label: "Complaint", icon: "📢", color: "#f59e0b" },
  self_assessment: { label: "Self Assessment", icon: "✅", color: "#10b981" },
};

const severityConfig = {
  minor: { label: "Minor", color: "#6b7280", bgColor: "#f3f4f6" },
  moderate: { label: "Moderate", color: "#f59e0b", bgColor: "#fef3c7" },
  major: { label: "Major", color: "#f97316", bgColor: "#fed7aa" },
  critical: { label: "Critical", color: "#ef4444", bgColor: "#fee2e2" },
};

const statusConfig = {
  open: { label: "Open", icon: "🔴", color: "#ef4444", bgColor: "#fee2e2" },
  in_progress: {
    label: "In Progress",
    icon: "🔵",
    color: "#3b82f6",
    bgColor: "#dbeafe",
  },
  verification: {
    label: "Verification",
    icon: "🔍",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
  },
  completed: {
    label: "Completed",
    icon: "✅",
    color: "#10b981",
    bgColor: "#d1fae5",
  },
  overdue: {
    label: "Overdue",
    icon: "⏰",
    color: "#dc2626",
    bgColor: "#fee2e2",
  },
};

export function CorrectiveActionTracker({
  actions,
  onActionClick,
}: CorrectiveActionTrackerProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"dueDate" | "severity" | "status">(
    "dueDate",
  );

  // Filter actions
  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      if (selectedStatus !== "all" && action.status !== selectedStatus)
        return false;
      if (selectedSeverity !== "all" && action.severity !== selectedSeverity)
        return false;
      if (selectedSource !== "all" && action.source !== selectedSource)
        return false;
      return true;
    });
  }, [actions, selectedStatus, selectedSeverity, selectedSource]);

  // Sort actions
  const sortedActions = useMemo(() => {
    return [...filteredActions].sort((a, b) => {
      if (sortBy === "dueDate") {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortBy === "severity") {
        const severityOrder = { critical: 0, major: 1, moderate: 2, minor: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      } else {
        const statusOrder = {
          overdue: 0,
          open: 1,
          in_progress: 2,
          verification: 3,
          completed: 4,
        };
        return statusOrder[a.status] - statusOrder[b.status];
      }
    });
  }, [filteredActions, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = actions.length;
    const open = actions.filter((a) => a.status === "open").length;
    const inProgress = actions.filter((a) => a.status === "in_progress").length;
    const overdue = actions.filter((a) => a.status === "overdue").length;
    const completed = actions.filter((a) => a.status === "completed").length;
    const critical = actions.filter(
      (a) => a.severity === "critical" && a.status !== "completed",
    ).length;
    const dueSoon = actions.filter((a) => {
      const daysUntil = Math.ceil(
        (new Date(a.dueDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return daysUntil >= 0 && daysUntil <= 7 && a.status !== "completed";
    }).length;

    return { total, open, inProgress, overdue, completed, critical, dueSoon };
  }, [actions]);

  // Get days until due
  const getDaysUntilDue = (dueDate: string): number => {
    return Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Corrective Action Tracker
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage and track corrective actions from audits and incidents
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-7 gap-3 mb-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-medium">Total</p>
            <p className="text-xl font-bold text-blue-700 mt-1">
              {stats.total}
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-600 font-medium">Open</p>
            <p className="text-xl font-bold text-red-700 mt-1">{stats.open}</p>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
            <p className="text-xs text-orange-600 font-medium">In Progress</p>
            <p className="text-xl font-bold text-orange-700 mt-1">
              {stats.inProgress}
            </p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
            <p className="text-xs text-purple-600 font-medium">Overdue</p>
            <p className="text-xl font-bold text-purple-700 mt-1">
              {stats.overdue}
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-600 font-medium">Completed</p>
            <p className="text-xl font-bold text-green-700 mt-1">
              {stats.completed}
            </p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-600 font-medium">Critical</p>
            <p className="text-xl font-bold text-yellow-700 mt-1">
              {stats.critical}
            </p>
          </div>

          <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-3">
            <p className="text-xs text-pink-600 font-medium">Due Soon</p>
            <p className="text-xl font-bold text-pink-700 mt-1">
              {stats.dueSoon}
            </p>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="all">All</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="all">All</option>
              {Object.entries(severityConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Source:</span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="all">All</option>
              {Object.entries(sourceConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "dueDate" | "severity" | "status")
              }
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="dueDate">Due Date</option>
              <option value="severity">Severity</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Urgent Actions Alert */}
      {(stats.overdue > 0 || stats.critical > 0) && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🚨</div>
            <div>
              <h4 className="font-semibold text-red-800">
                Urgent Attention Required
              </h4>
              <p className="text-sm text-red-700 mt-1">
                {stats.overdue > 0 &&
                  `${stats.overdue} overdue action${stats.overdue !== 1 ? "s" : ""}`}
                {stats.overdue > 0 && stats.critical > 0 && " and "}
                {stats.critical > 0 &&
                  `${stats.critical} critical action${stats.critical !== 1 ? "s" : ""} open`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions List */}
      <div className="space-y-3">
        {sortedActions.map((action) => {
          const isExpanded = expandedAction === action.id;
          const sourceInfo = sourceConfig[action.source];
          const severityInfo = severityConfig[action.severity];
          const statusInfo = statusConfig[action.status];
          const daysUntil = getDaysUntilDue(action.dueDate);

          return (
            <div
              key={action.id}
              className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all"
            >
              {/* Action Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => {
                  setExpandedAction(isExpanded ? null : action.id);
                  onActionClick?.(action);
                }}
                style={{
                  borderLeftWidth: "6px",
                  borderLeftColor: severityInfo.color,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{sourceInfo.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">
                          {action.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div
                        className="px-2 py-1 rounded text-xs font-semibold"
                        style={{
                          backgroundColor: statusInfo.bgColor,
                          color: statusInfo.color,
                        }}
                      >
                        {statusInfo.icon} {statusInfo.label}
                      </div>

                      <div
                        className="px-2 py-1 rounded text-xs font-semibold"
                        style={{
                          backgroundColor: severityInfo.bgColor,
                          color: severityInfo.color,
                        }}
                      >
                        {severityInfo.label}
                      </div>

                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Assigned:</span>{" "}
                        {action.assignedTo.name}
                      </div>

                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Due:</span>{" "}
                        {new Date(action.dueDate).toLocaleDateString("en-NZ")}
                        {daysUntil >= 0 && action.status !== "completed" && (
                          <span
                            className={`ml-2 px-2 py-0.5 rounded-full font-semibold ${
                              daysUntil <= 3
                                ? "bg-red-100 text-red-700"
                                : daysUntil <= 7
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {daysUntil === 0 ? "Today" : `${daysUntil}d`}
                          </span>
                        )}
                        {daysUntil < 0 && action.status !== "completed" && (
                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold">
                            {Math.abs(daysUntil)}d overdue
                          </span>
                        )}
                      </div>

                      {action.sourceReference && (
                        <div className="text-xs text-gray-500">
                          {action.sourceReference}
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
                <div className="p-4 bg-gray-50 border-t-2 border-gray-200 space-y-4">
                  {/* Root Cause and Actions */}
                  <div className="grid grid-cols-2 gap-4">
                    {action.rootCause && (
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">
                          Root Cause
                        </h5>
                        <p className="text-sm text-gray-700">
                          {action.rootCause}
                        </p>
                      </div>
                    )}

                    <div className="bg-white p-3 rounded border border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-800 mb-2">
                        Corrective Action
                      </h5>
                      <p className="text-sm text-gray-700">
                        {action.correctiveAction}
                      </p>
                    </div>
                  </div>

                  {action.preventiveAction && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <h5 className="text-sm font-semibold text-blue-800 mb-2">
                        Preventive Action
                      </h5>
                      <p className="text-sm text-blue-700">
                        {action.preventiveAction}
                      </p>
                    </div>
                  )}

                  {/* Resources */}
                  {action.resourcesRequired &&
                    action.resourcesRequired.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">
                          Resources Required
                        </h5>
                        <div className="grid grid-cols-2 gap-2">
                          {action.resourcesRequired.map((resource, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded border text-sm ${
                                resource.allocated
                                  ? "bg-green-50 border-green-200 text-green-700"
                                  : "bg-yellow-50 border-yellow-200 text-yellow-700"
                              }`}
                            >
                              <div className="font-medium">
                                {resource.allocated ? "✓" : "○"} {resource.type}
                              </div>
                              <div className="text-xs mt-1">
                                {resource.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Evidence */}
                  {action.evidence && action.evidence.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-800 mb-2">
                        Evidence ({action.evidence.length})
                      </h5>
                      <div className="space-y-1">
                        {action.evidence.map((evidence) => (
                          <div
                            key={evidence.id}
                            className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span>
                                {evidence.type === "document"
                                  ? "📄"
                                  : evidence.type === "photo"
                                    ? "📷"
                                    : evidence.type === "certificate"
                                      ? "🏆"
                                      : "📋"}
                              </span>
                              <span className="text-gray-700">
                                {evidence.name}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(evidence.uploadDate).toLocaleDateString(
                                "en-NZ",
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Effectiveness Assessment */}
                  {action.effectiveness?.assessed && (
                    <div
                      className={`p-3 rounded border ${
                        action.effectiveness.rating === "effective"
                          ? "bg-green-50 border-green-200"
                          : action.effectiveness.rating ===
                              "partially_effective"
                            ? "bg-orange-50 border-orange-200"
                            : "bg-red-50 border-red-200"
                      }`}
                    >
                      <h5 className="text-sm font-semibold mb-2">
                        Effectiveness Assessment
                      </h5>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium">Rating:</span>{" "}
                          {action.effectiveness.rating === "effective"
                            ? "✅ Effective"
                            : action.effectiveness.rating ===
                                "partially_effective"
                              ? "⚠️ Partially Effective"
                              : "❌ Ineffective"}
                        </div>
                        {action.effectiveness.assessmentDate && (
                          <div>
                            <span className="font-medium">Assessed:</span>{" "}
                            {new Date(
                              action.effectiveness.assessmentDate,
                            ).toLocaleDateString("en-NZ")}
                          </div>
                        )}
                        {action.effectiveness.notes && (
                          <div>
                            <span className="font-medium">Notes:</span>{" "}
                            {action.effectiveness.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  {action.comments && action.comments.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-800 mb-2">
                        Comments ({action.comments.length})
                      </h5>
                      <div className="space-y-2">
                        {action.comments.slice(0, 3).map((comment) => (
                          <div
                            key={comment.id}
                            className="p-2 bg-white rounded border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-700">
                                {comment.author}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.date).toLocaleDateString(
                                  "en-NZ",
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {comment.text}
                            </p>
                          </div>
                        ))}
                        {action.comments.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{action.comments.length - 3} more comments
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredActions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-gray-200">
          <p className="text-gray-500">
            No corrective actions match the selected filters
          </p>
        </div>
      )}
    </div>
  );
}
