/**
 * Regulatory Deadline Calendar Component
 *
 * Calendar view of compliance deadlines with visual indicators
 * for urgency, type, and completion status
 */

"use client";

import { useState, useMemo } from "react";

export interface RegulatoryDeadline {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  type:
    | "report_submission"
    | "inspection"
    | "certification_renewal"
    | "testing"
    | "documentation"
    | "training";
  urgency: "low" | "medium" | "high" | "critical";
  status: "upcoming" | "due_soon" | "overdue" | "completed";
  isCompleted: boolean;
  completedDate?: string;
  assignee?: {
    id: string;
    name: string;
  };
  relatedEntity?: {
    type: "dwsp" | "asset" | "plan";
    id: string;
    name: string;
  };
  recurringPattern?: "monthly" | "quarterly" | "annually";
  reminderDays?: number;
}

interface RegulatoryDeadlineCalendarProps {
  deadlines: RegulatoryDeadline[];
  onDeadlineClick?: (deadline: RegulatoryDeadline) => void;
  onDateClick?: (date: Date) => void;
}

const typeConfig = {
  report_submission: {
    label: "Report Submission",
    icon: "📄",
    color: "#3b82f6",
  },
  inspection: {
    label: "Inspection",
    icon: "🔍",
    color: "#8b5cf6",
  },
  certification_renewal: {
    label: "Certification Renewal",
    icon: "📜",
    color: "#f59e0b",
  },
  testing: {
    label: "Testing",
    icon: "🧪",
    color: "#10b981",
  },
  documentation: {
    label: "Documentation",
    icon: "📋",
    color: "#06b6d4",
  },
  training: {
    label: "Training",
    icon: "🎓",
    color: "#ec4899",
  },
};

const urgencyConfig = {
  low: {
    label: "Low",
    color: "#6b7280",
    bgColor: "#f3f4f6",
  },
  medium: {
    label: "Medium",
    color: "#3b82f6",
    bgColor: "#dbeafe",
  },
  high: {
    label: "High",
    color: "#f59e0b",
    bgColor: "#fef3c7",
  },
  critical: {
    label: "Critical",
    color: "#ef4444",
    bgColor: "#fee2e2",
  },
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function RegulatoryDeadlineCalendar({
  deadlines,
  onDeadlineClick,
  onDateClick,
}: RegulatoryDeadlineCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [filterType, setFilterType] = useState<
    RegulatoryDeadline["type"] | "all"
  >("all");

  // Get calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month and last day
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Days from previous month to show
    const firstDayOfWeek = firstDay.getDay();
    const daysFromPrevMonth = firstDayOfWeek;

    // Total days to show (6 weeks max)
    const totalDays = 42;

    // Generate calendar days
    const days: Date[] = [];
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - daysFromPrevMonth);

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }

    return { days, firstDay, lastDay };
  }, [currentDate]);

  // Group deadlines by date
  const deadlinesByDate = useMemo(() => {
    const grouped: Map<string, RegulatoryDeadline[]> = new Map();

    deadlines
      .filter((d) => filterType === "all" || d.type === filterType)
      .forEach((deadline) => {
        const dateKey = new Date(deadline.dueDate).toISOString().split("T")[0];
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(deadline);
      });

    return grouped;
  }, [deadlines, filterType]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = deadlines.filter(
      (d) => !d.isCompleted && new Date(d.dueDate) > now,
    ).length;
    const dueSoon = deadlines.filter(
      (d) =>
        !d.isCompleted &&
        new Date(d.dueDate) > now &&
        new Date(d.dueDate).getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000,
    ).length;
    const overdue = deadlines.filter(
      (d) => !d.isCompleted && new Date(d.dueDate) < now,
    ).length;
    const completed = deadlines.filter((d) => d.isCompleted).length;

    return { upcoming, dueSoon, overdue, completed };
  }, [deadlines]);

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date): boolean => {
    return (
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Regulatory Compliance Calendar
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Track important deadlines and compliance requirements
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("month")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === "month"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                📅 Month
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                📋 List
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Upcoming</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {stats.upcoming}
            </p>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">
              Due Soon (7 days)
            </p>
            <p className="text-2xl font-bold text-orange-700 mt-1">
              {stats.dueSoon}
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Overdue</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {stats.overdue}
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Completed</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {stats.completed}
            </p>
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700">
            Filter by type:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                filterType === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All Types
            </button>
            {Object.entries(typeConfig).map(([type, config]) => (
              <button
                key={type}
                onClick={() =>
                  setFilterType(type as RegulatoryDeadline["type"])
                }
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  filterType === type
                    ? "text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                style={
                  filterType === type
                    ? { backgroundColor: config.color }
                    : undefined
                }
              >
                {config.icon} {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Month View */}
      {viewMode === "month" && (
        <>
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <button
              onClick={previousMonth}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              ← Previous
            </button>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button
                onClick={goToToday}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
              >
                Go to Today
              </button>
            </div>

            <button
              onClick={nextMonth}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-gray-100 border-b-2 border-gray-200">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center font-semibold text-gray-700"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarData.days.map((date, index) => {
                const dateKey = date.toISOString().split("T")[0];
                const dayDeadlines = deadlinesByDate.get(dateKey) || [];
                const isCurrentMonthDate = isCurrentMonth(date);
                const isTodayDate = isToday(date);

                return (
                  <div
                    key={index}
                    onClick={() => onDateClick?.(date)}
                    className={`min-h-[120px] p-2 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !isCurrentMonthDate ? "bg-gray-50" : "bg-white"
                    } ${isTodayDate ? "bg-blue-50" : ""}`}
                  >
                    {/* Date Number */}
                    <div
                      className={`text-sm font-semibold mb-2 ${
                        isTodayDate
                          ? "bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center"
                          : isCurrentMonthDate
                            ? "text-gray-800"
                            : "text-gray-400"
                      }`}
                    >
                      {date.getDate()}
                    </div>

                    {/* Deadlines */}
                    <div className="space-y-1">
                      {dayDeadlines.slice(0, 3).map((deadline) => {
                        const typeInfo = typeConfig[deadline.type];
                        return (
                          <div
                            key={deadline.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeadlineClick?.(deadline);
                            }}
                            className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${
                              deadline.isCompleted
                                ? "bg-green-100 text-green-700 line-through"
                                : deadline.urgency === "critical"
                                  ? "bg-red-100 text-red-700 font-semibold"
                                  : deadline.urgency === "high"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-blue-100 text-blue-700"
                            }`}
                            title={deadline.title}
                          >
                            {typeInfo.icon} {deadline.title}
                          </div>
                        );
                      })}
                      {dayDeadlines.length > 3 && (
                        <div className="text-xs text-gray-500 font-semibold">
                          +{dayDeadlines.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-2">
          {deadlines
            .filter((d) => filterType === "all" || d.type === filterType)
            .sort(
              (a, b) =>
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
            )
            .map((deadline) => {
              const typeInfo = typeConfig[deadline.type];
              const urgencyInfo = urgencyConfig[deadline.urgency];
              const daysUntil = Math.ceil(
                (new Date(deadline.dueDate).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24),
              );
              const isOverdue = daysUntil < 0 && !deadline.isCompleted;

              return (
                <div
                  key={deadline.id}
                  onClick={() => onDeadlineClick?.(deadline)}
                  className={`bg-white rounded-lg p-4 border-2 cursor-pointer hover:shadow-md transition-all ${
                    isOverdue
                      ? "border-red-300 bg-red-50"
                      : deadline.isCompleted
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Type Icon */}
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: typeInfo.color + "20" }}
                    >
                      {typeInfo.icon}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4
                          className={`font-semibold text-gray-800 ${deadline.isCompleted ? "line-through" : ""}`}
                        >
                          {deadline.title}
                        </h4>
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: urgencyInfo.bgColor,
                            color: urgencyInfo.color,
                          }}
                        >
                          {urgencyInfo.label}
                        </span>
                      </div>
                      {deadline.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {deadline.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{typeInfo.label}</span>
                        {deadline.assignee && (
                          <span>👤 {deadline.assignee.name}</span>
                        )}
                        {deadline.recurringPattern && (
                          <span>🔄 {deadline.recurringPattern}</span>
                        )}
                      </div>
                    </div>

                    {/* Due Date */}
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          isOverdue
                            ? "text-red-600"
                            : daysUntil <= 7
                              ? "text-orange-600"
                              : "text-gray-800"
                        }`}
                      >
                        {new Date(deadline.dueDate).toLocaleDateString(
                          "en-NZ",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </div>
                      <div
                        className={`text-xs font-semibold mt-1 ${
                          isOverdue
                            ? "text-red-600"
                            : daysUntil <= 7
                              ? "text-orange-600"
                              : "text-gray-500"
                        }`}
                      >
                        {isOverdue
                          ? `⚠️ ${Math.abs(daysUntil)} days overdue`
                          : deadline.isCompleted
                            ? "✅ Completed"
                            : daysUntil === 0
                              ? "📅 Due Today"
                              : daysUntil === 1
                                ? "📅 Due Tomorrow"
                                : `📅 ${daysUntil} days`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Legend</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-2 font-medium">
              Deadline Types:
            </p>
            <div className="space-y-1">
              {Object.entries(typeConfig).map(([type, config]) => (
                <div key={type} className="flex items-center gap-2 text-xs">
                  <span>{config.icon}</span>
                  <span className="text-gray-700">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-2 font-medium">
              Urgency Levels:
            </p>
            <div className="space-y-1">
              {Object.entries(urgencyConfig).map(([urgency, config]) => (
                <div key={urgency} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: config.bgColor }}
                  ></div>
                  <span className="text-gray-700">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
