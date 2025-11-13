/**
 * Task Management Board Component
 *
 * Comprehensive task tracking system with Kanban-style board,
 * assignees, due dates, priorities, and filtering
 */

"use client";

import { useState, useMemo } from "react";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "backlog" | "todo" | "in_progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  relatedEntity?: {
    type: "dwsp" | "asset" | "compliance_plan" | "incident";
    id: string;
    name: string;
  };
  subtasks?: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  comments?: number;
  attachments?: number;
}

interface TaskManagementBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskStatusChange?: (taskId: string, newStatus: Task["status"]) => void;
  onTaskCreate?: () => void;
  viewMode?: "board" | "list";
}

const statusConfig = {
  backlog: {
    label: "Backlog",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    icon: "📋",
  },
  todo: {
    label: "To Do",
    color: "#3b82f6",
    bgColor: "#dbeafe",
    icon: "📝",
  },
  in_progress: {
    label: "In Progress",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    icon: "⚡",
  },
  review: {
    label: "Review",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    icon: "👀",
  },
  completed: {
    label: "Completed",
    color: "#10b981",
    bgColor: "#d1fae5",
    icon: "✅",
  },
};

const priorityConfig = {
  low: {
    label: "Low",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    icon: "⬇️",
  },
  medium: {
    label: "Medium",
    color: "#3b82f6",
    bgColor: "#dbeafe",
    icon: "➡️",
  },
  high: {
    label: "High",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    icon: "⬆️",
  },
  critical: {
    label: "Critical",
    color: "#ef4444",
    bgColor: "#fee2e2",
    icon: "🔥",
  },
};

export function TaskManagementBoard({
  tasks,
  onTaskClick,
  onTaskCreate,
  viewMode: initialViewMode = "board",
}: TaskManagementBoardProps) {
  const [viewMode, setViewMode] = useState<"board" | "list">(initialViewMode);
  const [filterPriority, setFilterPriority] = useState<
    Task["priority"] | "all"
  >("all");
  const [filterAssignee, setFilterAssignee] = useState<string | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Get unique assignees
  const assignees = useMemo(() => {
    const assigneeMap = new Map();
    tasks.forEach((task) => {
      if (task.assignee) {
        assigneeMap.set(task.assignee.id, task.assignee);
      }
    });
    return Array.from(assigneeMap.values());
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterPriority !== "all" && task.priority !== filterPriority)
        return false;
      if (filterAssignee !== "all" && task.assignee?.id !== filterAssignee)
        return false;
      if (
        searchQuery &&
        !task.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [tasks, filterPriority, filterAssignee, searchQuery]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<Task["status"], Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      completed: [],
    };

    filteredTasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    // Sort by priority and due date
    Object.keys(grouped).forEach((status) => {
      grouped[status as Task["status"]].sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (a.priority !== b.priority) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      });
    });

    return grouped;
  }, [filteredTasks]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const overdue = tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== "completed",
    ).length;
    const highPriority = tasks.filter(
      (t) =>
        (t.priority === "high" || t.priority === "critical") &&
        t.status !== "completed",
    ).length;

    return { total, completed, inProgress, overdue, highPriority };
  }, [tasks]);

  // Check if task is overdue
  const isOverdue = (task: Task): boolean => {
    return (
      !!task.dueDate &&
      new Date(task.dueDate) < new Date() &&
      task.status !== "completed"
    );
  };

  // Get days until due
  const getDaysUntilDue = (dueDate: string): number => {
    const days = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return days;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Task Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Track and manage compliance tasks across your organization
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("board")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === "board"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                📊 Board
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

            {/* Create Task Button */}
            {onTaskCreate && (
              <button
                onClick={onTaskCreate}
                className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
              >
                ➕ New Task
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Tasks</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {stats.total}
            </p>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">In Progress</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">
              {stats.inProgress}
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Completed</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {stats.completed}
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Overdue</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {stats.overdue}
            </p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">High Priority</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {stats.highPriority}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filterPriority}
              onChange={(e) =>
                setFilterPriority(e.target.value as Task["priority"] | "all")
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              {Object.entries(priorityConfig).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Assignees</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Board View */}
      {viewMode === "board" && (
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(statusConfig).map(([status, config]) => {
            const statusTasks = tasksByStatus[status as Task["status"]];

            return (
              <div key={status} className="flex flex-col">
                {/* Column Header */}
                <div
                  className="p-4 rounded-t-lg border-2"
                  style={{
                    backgroundColor: config.bgColor,
                    borderColor: config.color,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{config.icon}</span>
                      <h3
                        className="font-semibold"
                        style={{ color: config.color }}
                      >
                        {config.label}
                      </h3>
                    </div>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: config.color, color: "white" }}
                    >
                      {statusTasks.length}
                    </span>
                  </div>
                </div>

                {/* Task Cards */}
                <div className="flex-1 bg-gray-50 border-2 border-t-0 border-gray-200 rounded-b-lg p-2 space-y-2 min-h-[200px]">
                  {statusTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick?.(task)}
                      isOverdue={isOverdue(task)}
                      daysUntilDue={
                        task.dueDate ? getDaysUntilDue(task.dueDate) : null
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
              isOverdue={isOverdue(task)}
              daysUntilDue={task.dueDate ? getDaysUntilDue(task.dueDate) : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  onClick,
  isOverdue,
  daysUntilDue,
}: {
  task: Task;
  onClick: () => void;
  isOverdue: boolean;
  daysUntilDue: number | null;
}) {
  const priorityInfo = priorityConfig[task.priority];
  const completedSubtasks =
    task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-3 border-2 cursor-pointer hover:shadow-md transition-all ${
        isOverdue ? "border-red-300" : "border-gray-200"
      }`}
    >
      {/* Priority Badge */}
      <div className="flex items-start justify-between mb-2">
        <span
          className="px-2 py-1 rounded text-xs font-semibold"
          style={{
            backgroundColor: priorityInfo.bgColor,
            color: priorityInfo.color,
          }}
        >
          {priorityInfo.icon} {priorityInfo.label}
        </span>
        {isOverdue && (
          <span className="text-xs font-bold text-red-600">⚠️ OVERDUE</span>
        )}
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              +{task.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Subtasks Progress */}
      {totalSubtasks > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Subtasks</span>
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
        {/* Assignee */}
        <div className="flex items-center gap-1">
          {task.assignee ? (
            <>
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {task.assignee.name.charAt(0)}
              </div>
              <span className="truncate max-w-[80px]">
                {task.assignee.name.split(" ")[0]}
              </span>
            </>
          ) : (
            <span className="text-gray-400">Unassigned</span>
          )}
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div
            className={`text-xs font-semibold ${
              isOverdue
                ? "text-red-600"
                : daysUntilDue !== null && daysUntilDue <= 3
                  ? "text-orange-600"
                  : "text-gray-600"
            }`}
          >
            {isOverdue
              ? "⚠️ Overdue"
              : daysUntilDue !== null && daysUntilDue === 0
                ? "📅 Today"
                : daysUntilDue !== null && daysUntilDue === 1
                  ? "📅 Tomorrow"
                  : daysUntilDue !== null && daysUntilDue <= 7
                    ? `📅 ${daysUntilDue}d`
                    : `📅 ${new Date(task.dueDate).toLocaleDateString("en-NZ", { month: "short", day: "numeric" })}`}
          </div>
        )}
      </div>

      {/* Comments/Attachments */}
      {(task.comments || task.attachments) && (
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          {task.comments && task.comments > 0 && (
            <span>💬 {task.comments}</span>
          )}
          {task.attachments && task.attachments > 0 && (
            <span>📎 {task.attachments}</span>
          )}
        </div>
      )}
    </div>
  );
}

// Task List Item Component
function TaskListItem({
  task,
  onClick,
  isOverdue,
  daysUntilDue,
}: {
  task: Task;
  onClick: () => void;
  isOverdue: boolean;
  daysUntilDue: number | null;
}) {
  const statusInfo = statusConfig[task.status];
  const priorityInfo = priorityConfig[task.priority];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-4 border-2 cursor-pointer hover:shadow-md transition-all ${
        isOverdue ? "border-red-300" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Status */}
        <div
          className="px-3 py-2 rounded-lg font-semibold text-sm"
          style={{
            backgroundColor: statusInfo.bgColor,
            color: statusInfo.color,
          }}
        >
          {statusInfo.icon}
        </div>

        {/* Title and Description */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-800 truncate">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-gray-600 truncate mt-1">
              {task.description}
            </p>
          )}
        </div>

        {/* Priority */}
        <div
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: priorityInfo.bgColor,
            color: priorityInfo.color,
          }}
        >
          {priorityInfo.icon} {priorityInfo.label}
        </div>

        {/* Assignee */}
        <div className="w-32">
          {task.assignee ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {task.assignee.name.charAt(0)}
              </div>
              <span className="text-sm text-gray-700 truncate">
                {task.assignee.name}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Unassigned</span>
          )}
        </div>

        {/* Due Date */}
        <div className="w-32 text-right">
          {task.dueDate ? (
            <div
              className={`text-sm font-semibold ${
                isOverdue
                  ? "text-red-600"
                  : daysUntilDue !== null && daysUntilDue <= 3
                    ? "text-orange-600"
                    : "text-gray-600"
              }`}
            >
              {isOverdue
                ? "⚠️ Overdue"
                : new Date(task.dueDate).toLocaleDateString("en-NZ", {
                    month: "short",
                    day: "numeric",
                  })}
            </div>
          ) : (
            <span className="text-sm text-gray-400">No due date</span>
          )}
        </div>
      </div>
    </div>
  );
}
