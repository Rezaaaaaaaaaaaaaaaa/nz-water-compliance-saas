/**
 * Deadline Alert System Component
 *
 * Comprehensive deadline monitoring and alert system with
 * escalation rules, notification preferences, and alert management
 */

"use client";

import { useState, useMemo } from "react";

export interface DeadlineItem {
  id: string;
  title: string;
  description: string;
  type:
    | "compliance"
    | "inspection"
    | "training"
    | "maintenance"
    | "certification";
  dueDate: string;
  owner: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  status: "upcoming" | "due_soon" | "overdue" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  completionPercentage?: number;
  estimatedCompletionDate?: string;
  dependencies?: string[];
  escalationLevel?: number;
  lastAlertSent?: string;
  alertCount?: number;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  type: "deadline" | "overdue" | "stalled";
  conditions: {
    daysBeforeDue?: number;
    daysOverdue?: number;
    priority?: DeadlineItem["priority"][];
    itemType?: DeadlineItem["type"][];
  };
  actions: {
    notifyOwner: boolean;
    notifyManager: boolean;
    notifyTeam: boolean;
    escalateTo?: string[];
    createTask?: boolean;
    sendReminder?: boolean;
  };
  escalation?: {
    enabled: boolean;
    intervalDays: number;
    maxLevel: number;
    escalationChain: string[];
  };
}

interface DeadlineAlertSystemProps {
  items: DeadlineItem[];
  rules?: AlertRule[];
  onUpdateRule?: (rule: AlertRule) => void;
  onAcknowledgeAlert?: (itemId: string) => void;
  onSnoozeAlert?: (itemId: string, hours: number) => void;
}

const typeConfig = {
  compliance: { label: "Compliance", icon: "📋", color: "#3b82f6" },
  inspection: { label: "Inspection", icon: "🔍", color: "#10b981" },
  training: { label: "Training", icon: "🎓", color: "#f59e0b" },
  maintenance: { label: "Maintenance", icon: "🔧", color: "#8b5cf6" },
  certification: { label: "Certification", icon: "🏆", color: "#06b6d4" },
};

const priorityConfig = {
  low: { label: "Low", color: "#6b7280", bgColor: "#f3f4f6" },
  medium: { label: "Medium", color: "#3b82f6", bgColor: "#dbeafe" },
  high: { label: "High", color: "#f59e0b", bgColor: "#fef3c7" },
  critical: { label: "Critical", color: "#ef4444", bgColor: "#fee2e2" },
};

const statusConfig = {
  upcoming: {
    label: "Upcoming",
    icon: "📅",
    color: "#10b981",
    bgColor: "#d1fae5",
  },
  due_soon: {
    label: "Due Soon",
    icon: "⚠️",
    color: "#f59e0b",
    bgColor: "#fef3c7",
  },
  overdue: {
    label: "Overdue",
    icon: "🚨",
    color: "#ef4444",
    bgColor: "#fee2e2",
  },
  completed: {
    label: "Completed",
    icon: "✅",
    color: "#6b7280",
    bgColor: "#f3f4f6",
  },
};

export function DeadlineAlertSystem({
  items,
  rules = [],
  onUpdateRule,
  onAcknowledgeAlert,
  onSnoozeAlert,
}: DeadlineAlertSystemProps) {
  const [selectedView, setSelectedView] = useState<
    "alerts" | "rules" | "schedule"
  >("alerts");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Calculate days until/since due
  const getDaysUntilDue = (dueDate: string): number => {
    return Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedStatus !== "all" && item.status !== selectedStatus)
        return false;
      if (selectedPriority !== "all" && item.priority !== selectedPriority)
        return false;
      if (selectedType !== "all" && item.type !== selectedType) return false;
      return true;
    });
  }, [items, selectedStatus, selectedPriority, selectedType]);

  // Sort by urgency
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      // Overdue first
      if (a.status === "overdue" && b.status !== "overdue") return -1;
      if (a.status !== "overdue" && b.status === "overdue") return 1;

      // Then by due date
      const daysA = getDaysUntilDue(a.dueDate);
      const daysB = getDaysUntilDue(b.dueDate);
      return daysA - daysB;
    });
  }, [filteredItems]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = items.length;
    const overdue = items.filter((i) => i.status === "overdue").length;
    const dueSoon = items.filter((i) => i.status === "due_soon").length;
    const critical = items.filter(
      (i) => i.priority === "critical" && i.status !== "completed",
    ).length;
    const escalated = items.filter((i) => (i.escalationLevel || 0) > 0).length;
    const dueThisWeek = items.filter((i) => {
      const days = getDaysUntilDue(i.dueDate);
      return days >= 0 && days <= 7 && i.status !== "completed";
    }).length;

    return { total, overdue, dueSoon, critical, escalated, dueThisWeek };
  }, [items]);

  // Get urgency indicator
  const getUrgencyIndicator = (item: DeadlineItem) => {
    const days = getDaysUntilDue(item.dueDate);

    if (item.status === "overdue") {
      return {
        label: `${Math.abs(days)}d overdue`,
        color: "text-red-700",
        bgColor: "bg-red-100",
        icon: "🚨",
      };
    } else if (days <= 1) {
      return {
        label: days === 0 ? "Due today" : "Due tomorrow",
        color: "text-orange-700",
        bgColor: "bg-orange-100",
        icon: "⚠️",
      };
    } else if (days <= 3) {
      return {
        label: `${days} days`,
        color: "text-yellow-700",
        bgColor: "bg-yellow-100",
        icon: "⏰",
      };
    } else if (days <= 7) {
      return {
        label: `${days} days`,
        color: "text-blue-700",
        bgColor: "bg-blue-100",
        icon: "📅",
      };
    } else {
      return {
        label: `${days} days`,
        color: "text-gray-700",
        bgColor: "bg-gray-100",
        icon: "📆",
      };
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Deadline Alert System
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Monitor and manage upcoming deadlines with automated alerts
            </p>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView("alerts")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedView === "alerts"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              🔔 Alerts
            </button>
            <button
              onClick={() => setSelectedView("rules")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedView === "rules"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              ⚙️ Rules
            </button>
            <button
              onClick={() => setSelectedView("schedule")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedView === "schedule"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              📆 Schedule
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-6 gap-3 mb-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-medium">Total Items</p>
            <p className="text-xl font-bold text-blue-700 mt-1">
              {stats.total}
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-600 font-medium">Overdue</p>
            <p className="text-xl font-bold text-red-700 mt-1">
              {stats.overdue}
            </p>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
            <p className="text-xs text-orange-600 font-medium">Due Soon</p>
            <p className="text-xl font-bold text-orange-700 mt-1">
              {stats.dueSoon}
            </p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-600 font-medium">Critical</p>
            <p className="text-xl font-bold text-yellow-700 mt-1">
              {stats.critical}
            </p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
            <p className="text-xs text-purple-600 font-medium">Escalated</p>
            <p className="text-xl font-bold text-purple-700 mt-1">
              {stats.escalated}
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-600 font-medium">This Week</p>
            <p className="text-xl font-bold text-green-700 mt-1">
              {stats.dueThisWeek}
            </p>
          </div>
        </div>

        {/* Filters */}
        {selectedView === "alerts" && (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Priority:
              </span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="all">All Priorities</option>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="all">All Types</option>
                {Object.entries(typeConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Critical Alerts Banner */}
      {(stats.overdue > 0 || stats.critical > 0) &&
        selectedView === "alerts" && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🚨</div>
              <div>
                <h4 className="font-semibold text-red-800">
                  Urgent Attention Required
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  {stats.overdue > 0 &&
                    `${stats.overdue} overdue item${stats.overdue !== 1 ? "s" : ""}`}
                  {stats.overdue > 0 && stats.critical > 0 && " and "}
                  {stats.critical > 0 &&
                    `${stats.critical} critical item${stats.critical !== 1 ? "s" : ""} require immediate action`}
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Alerts View */}
      {selectedView === "alerts" && (
        <div className="space-y-3">
          {sortedItems.map((item) => {
            const isExpanded = expandedItem === item.id;
            const urgency = getUrgencyIndicator(item);
            const typeInfo = typeConfig[item.type];
            const priorityInfo = priorityConfig[item.priority];
            const statusInfo = statusConfig[item.status];

            return (
              <div
                key={item.id}
                className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all"
              >
                {/* Alert Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                  style={{
                    borderLeftWidth: "6px",
                    borderLeftColor: priorityInfo.color,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{typeInfo.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.description}
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
                            backgroundColor: priorityInfo.bgColor,
                            color: priorityInfo.color,
                          }}
                        >
                          {priorityInfo.label}
                        </div>

                        <div
                          className={`px-2 py-1 rounded text-xs font-semibold ${urgency.bgColor} ${urgency.color}`}
                        >
                          {urgency.icon} {urgency.label}
                        </div>

                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Owner:</span>{" "}
                          {item.owner.name}
                        </div>

                        {item.escalationLevel && item.escalationLevel > 0 && (
                          <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                            ⬆️ Escalation Level {item.escalationLevel}
                          </div>
                        )}

                        {item.completionPercentage !== undefined && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Progress:</span>{" "}
                            {item.completionPercentage}%
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
                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">
                          Due Date
                        </h5>
                        <p className="text-sm text-gray-700">
                          {new Date(item.dueDate).toLocaleDateString("en-NZ", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      {item.estimatedCompletionDate && (
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <h5 className="text-sm font-semibold text-gray-800 mb-2">
                            Est. Completion
                          </h5>
                          <p className="text-sm text-gray-700">
                            {new Date(
                              item.estimatedCompletionDate,
                            ).toLocaleDateString("en-NZ")}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Alert History */}
                    {item.alertCount && item.alertCount > 0 && (
                      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <h5 className="text-sm font-semibold text-yellow-800 mb-2">
                          Alert History
                        </h5>
                        <p className="text-sm text-yellow-700">
                          {item.alertCount} alert
                          {item.alertCount !== 1 ? "s" : ""} sent
                          {item.lastAlertSent &&
                            ` (last: ${new Date(item.lastAlertSent).toLocaleDateString("en-NZ")})`}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {onAcknowledgeAlert && (
                        <button
                          onClick={() => onAcknowledgeAlert(item.id)}
                          className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          ✓ Acknowledge
                        </button>
                      )}
                      {onSnoozeAlert && (
                        <>
                          <button
                            onClick={() => onSnoozeAlert(item.id, 4)}
                            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            ⏰ Snooze 4h
                          </button>
                          <button
                            onClick={() => onSnoozeAlert(item.id, 24)}
                            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            ⏰ Snooze 24h
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {sortedItems.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-gray-200">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-gray-600">
                No alerts match the selected filters
              </p>
            </div>
          )}
        </div>
      )}

      {/* Rules View */}
      {selectedView === "rules" && (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white border-2 border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">⚙️</span>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {rule.name}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Type: {rule.type} •{" "}
                        {rule.enabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">
                        Conditions:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {rule.conditions.daysBeforeDue &&
                          `${rule.conditions.daysBeforeDue} days before due`}
                        {rule.conditions.daysOverdue &&
                          `${rule.conditions.daysOverdue} days overdue`}
                      </span>
                    </div>

                    <div>
                      <span className="font-medium text-gray-700">
                        Actions:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {rule.actions.notifyOwner && "Notify owner"}
                        {rule.actions.notifyManager && ", Notify manager"}
                        {rule.actions.escalateTo &&
                          `, Escalate to ${rule.actions.escalateTo.length} people`}
                      </span>
                    </div>
                  </div>
                </div>

                {onUpdateRule && (
                  <button
                    onClick={() =>
                      onUpdateRule({ ...rule, enabled: !rule.enabled })
                    }
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      rule.enabled
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                    }`}
                  >
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </button>
                )}
              </div>
            </div>
          ))}

          {rules.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-gray-200">
              <p className="text-2xl mb-2">⚙️</p>
              <p className="text-gray-600">No alert rules configured</p>
            </div>
          )}
        </div>
      )}

      {/* Schedule View */}
      {selectedView === "schedule" && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Upcoming Deadlines
          </h3>
          <div className="space-y-4">
            {[7, 14, 30, 60, 90].map((days) => {
              const count = items.filter((item) => {
                const daysUntil = getDaysUntilDue(item.dueDate);
                return (
                  daysUntil >= 0 &&
                  daysUntil <= days &&
                  item.status !== "completed"
                );
              }).length;

              return (
                <div key={days} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Next {days} days
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-blue-700">
                      {count}
                    </div>
                    <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${(count / items.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
