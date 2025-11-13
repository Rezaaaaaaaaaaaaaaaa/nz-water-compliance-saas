/**
 * Compliance Journey Roadmap Component
 *
 * Visual roadmap showing the path from current compliance state to target
 * with milestones, phases, and estimated timelines
 */

"use client";

import { useState } from "react";

export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  phase:
    | "assessment"
    | "planning"
    | "implementation"
    | "verification"
    | "certification";
  status: "completed" | "in_progress" | "upcoming" | "blocked";
  completionPercentage: number;
  estimatedDuration: string; // e.g., "2 weeks", "1 month"
  startDate?: string;
  completionDate?: string;
  dependencies?: string[]; // IDs of prerequisite milestones
  tasks?: {
    id: string;
    title: string;
    completed: boolean;
    assignee?: string;
  }[];
  deliverables?: string[];
  risks?: string[];
}

interface ComplianceJourneyRoadmapProps {
  milestones: RoadmapMilestone[];
  currentScore: number;
  targetScore: number;
  organizationName?: string;
  onMilestoneClick?: (milestone: RoadmapMilestone) => void;
}

const phaseConfig = {
  assessment: {
    label: "Assessment",
    color: "#3b82f6",
    icon: "🔍",
    description: "Evaluate current state and identify gaps",
  },
  planning: {
    label: "Planning",
    color: "#8b5cf6",
    icon: "📋",
    description: "Develop compliance strategy and action plans",
  },
  implementation: {
    label: "Implementation",
    color: "#f59e0b",
    icon: "🔨",
    description: "Execute compliance initiatives",
  },
  verification: {
    label: "Verification",
    color: "#10b981",
    icon: "✅",
    description: "Validate compliance achievements",
  },
  certification: {
    label: "Certification",
    color: "#06b6d4",
    icon: "🏆",
    description: "Obtain official certification",
  },
};

const statusConfig = {
  completed: {
    label: "Completed",
    color: "#10b981",
    bgColor: "#d1fae5",
    icon: "✓",
  },
  in_progress: {
    label: "In Progress",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    icon: "⏳",
  },
  upcoming: {
    label: "Upcoming",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    icon: "⏰",
  },
  blocked: {
    label: "Blocked",
    color: "#ef4444",
    bgColor: "#fee2e2",
    icon: "⚠️",
  },
};

export function ComplianceJourneyRoadmap({
  milestones,
  currentScore,
  targetScore,
  organizationName = "Your Organization",
  onMilestoneClick,
}: ComplianceJourneyRoadmapProps) {
  const [selectedMilestone, setSelectedMilestone] =
    useState<RoadmapMilestone | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  // Group milestones by phase
  const milestonesByPhase = milestones.reduce(
    (acc, milestone) => {
      if (!acc[milestone.phase]) {
        acc[milestone.phase] = [];
      }
      acc[milestone.phase].push(milestone);
      return acc;
    },
    {} as Record<string, RoadmapMilestone[]>,
  );

  // Calculate overall progress
  const overallProgress =
    milestones.length > 0
      ? Math.round(
          milestones.reduce((sum, m) => sum + m.completionPercentage, 0) /
            milestones.length,
        )
      : 0;

  const completedMilestones = milestones.filter(
    (m) => m.status === "completed",
  ).length;
  const inProgressMilestones = milestones.filter(
    (m) => m.status === "in_progress",
  ).length;
  const blockedMilestones = milestones.filter(
    (m) => m.status === "blocked",
  ).length;

  // Calculate estimated completion date
  const estimateCompletion = () => {
    const remainingMilestones = milestones.filter(
      (m) => m.status !== "completed",
    );
    if (remainingMilestones.length === 0) return "Completed!";

    const totalWeeks = remainingMilestones.reduce((sum, m) => {
      const duration = m.estimatedDuration.toLowerCase();
      if (duration.includes("week")) {
        return sum + parseInt(duration);
      } else if (duration.includes("month")) {
        return sum + parseInt(duration) * 4;
      }
      return sum + 1;
    }, 0);

    const months = Math.ceil(totalWeeks / 4);
    return `~${months} month${months !== 1 ? "s" : ""}`;
  };

  const handleMilestoneClick = (milestone: RoadmapMilestone) => {
    setSelectedMilestone(milestone);
    if (onMilestoneClick) {
      onMilestoneClick(milestone);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {organizationName} - Compliance Journey
        </h2>
        <p className="text-gray-600">
          Your roadmap from {currentScore}% to {targetScore}% compliance
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <div className="text-sm opacity-90 mb-2">Overall Progress</div>
          <div className="text-4xl font-bold mb-2">{overallProgress}%</div>
          <div className="w-full h-2 bg-blue-400 rounded-full overflow-hidden">
            <div
              className="h-full bg-white"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white border-2 border-green-200 rounded-lg p-6">
          <div className="text-sm text-green-600 font-medium mb-2">
            Completed
          </div>
          <div className="text-3xl font-bold text-green-700">
            {completedMilestones} / {milestones.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">milestones</div>
        </div>

        <div className="bg-white border-2 border-orange-200 rounded-lg p-6">
          <div className="text-sm text-orange-600 font-medium mb-2">
            In Progress
          </div>
          <div className="text-3xl font-bold text-orange-700">
            {inProgressMilestones}
          </div>
          <div className="text-xs text-gray-500 mt-1">active tasks</div>
        </div>

        <div className="bg-white border-2 border-purple-200 rounded-lg p-6">
          <div className="text-sm text-purple-600 font-medium mb-2">
            Est. Completion
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {estimateCompletion()}
          </div>
          <div className="text-xs text-gray-500 mt-1">from today</div>
        </div>
      </div>

      {/* Roadmap Phases */}
      <div className="space-y-6">
        {Object.entries(phaseConfig).map(([phaseKey, phaseInfo]) => {
          const phaseMilestones =
            milestonesByPhase[phaseKey as keyof typeof phaseConfig] || [];
          const isExpanded = expandedPhase === phaseKey;
          const phaseProgress =
            phaseMilestones.length > 0
              ? Math.round(
                  phaseMilestones.reduce(
                    (sum, m) => sum + m.completionPercentage,
                    0,
                  ) / phaseMilestones.length,
                )
              : 0;

          return (
            <div
              key={phaseKey}
              className="border-2 border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Phase Header */}
              <button
                onClick={() => setExpandedPhase(isExpanded ? null : phaseKey)}
                className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                style={{
                  borderLeftWidth: "6px",
                  borderLeftColor: phaseInfo.color,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{phaseInfo.icon}</div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">
                          {phaseInfo.label}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({phaseMilestones.length} milestone
                          {phaseMilestones.length !== 1 ? "s" : ""})
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {phaseInfo.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div
                        className="text-2xl font-bold"
                        style={{ color: phaseInfo.color }}
                      >
                        {phaseProgress}%
                      </div>
                      <div className="text-xs text-gray-500">complete</div>
                    </div>
                    <div className="text-2xl text-gray-400">
                      {isExpanded ? "▼" : "▶"}
                    </div>
                  </div>
                </div>

                {/* Phase Progress Bar */}
                <div className="mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${phaseProgress}%`,
                      backgroundColor: phaseInfo.color,
                    }}
                  ></div>
                </div>
              </button>

              {/* Phase Milestones */}
              {isExpanded && phaseMilestones.length > 0 && (
                <div className="p-6 bg-gray-50 border-t-2 border-gray-200">
                  <div className="space-y-4">
                    {phaseMilestones.map((milestone, index) => {
                      const statusInfo = statusConfig[milestone.status];
                      const isSelected = selectedMilestone?.id === milestone.id;

                      return (
                        <div
                          key={milestone.id}
                          className={`bg-white rounded-lg border-2 overflow-hidden transition-all cursor-pointer ${
                            isSelected
                              ? "border-blue-500 shadow-lg"
                              : "border-gray-200 hover:border-gray-300 hover:shadow"
                          }`}
                          onClick={() => handleMilestoneClick(milestone)}
                        >
                          {/* Milestone Header */}
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                    style={{ backgroundColor: phaseInfo.color }}
                                  >
                                    {index + 1}
                                  </div>
                                  <h4 className="font-semibold text-gray-800 text-lg">
                                    {milestone.title}
                                  </h4>
                                  <div
                                    className="px-3 py-1 rounded-full text-xs font-semibold"
                                    style={{
                                      backgroundColor: statusInfo.bgColor,
                                      color: statusInfo.color,
                                    }}
                                  >
                                    {statusInfo.icon} {statusInfo.label}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 ml-11">
                                  {milestone.description}
                                </p>
                              </div>

                              <div className="text-right ml-4">
                                <div className="text-2xl font-bold text-gray-800">
                                  {milestone.completionPercentage}%
                                </div>
                                <div className="text-xs text-gray-500">
                                  {milestone.estimatedDuration}
                                </div>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden ml-11">
                              <div
                                className="h-full transition-all"
                                style={{
                                  width: `${milestone.completionPercentage}%`,
                                  backgroundColor: statusInfo.color,
                                }}
                              ></div>
                            </div>

                            {/* Tasks Summary */}
                            {milestone.tasks && milestone.tasks.length > 0 && (
                              <div className="mt-3 ml-11">
                                <div className="text-xs text-gray-600 mb-2">
                                  Tasks:{" "}
                                  {
                                    milestone.tasks.filter((t) => t.completed)
                                      .length
                                  }{" "}
                                  / {milestone.tasks.length} completed
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {milestone.tasks.slice(0, 3).map((task) => (
                                    <div
                                      key={task.id}
                                      className={`text-xs px-2 py-1 rounded ${
                                        task.completed
                                          ? "bg-green-100 text-green-700"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {task.completed ? "✓" : "○"} {task.title}
                                    </div>
                                  ))}
                                  {milestone.tasks.length > 3 && (
                                    <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                      +{milestone.tasks.length - 3} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Dependencies */}
                            {milestone.dependencies &&
                              milestone.dependencies.length > 0 && (
                                <div className="mt-3 ml-11 text-xs text-gray-500">
                                  <span className="font-medium">
                                    Depends on:
                                  </span>{" "}
                                  {milestone.dependencies.length} prerequisite
                                  {milestone.dependencies.length !== 1
                                    ? "s"
                                    : ""}
                                </div>
                              )}

                            {/* Risks Warning */}
                            {milestone.risks && milestone.risks.length > 0 && (
                              <div className="mt-3 ml-11 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                <div className="text-xs font-semibold text-yellow-800 mb-1">
                                  ⚠️ Risks Identified
                                </div>
                                <ul className="text-xs text-yellow-700 list-disc list-inside">
                                  {milestone.risks.map((risk, idx) => (
                                    <li key={idx}>{risk}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Blockers Alert */}
      {blockedMilestones > 0 && (
        <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h4 className="font-semibold text-red-800 mb-2">
                {blockedMilestones} Milestone
                {blockedMilestones !== 1 ? "s" : ""} Blocked
              </h4>
              <p className="text-sm text-red-700">
                Action required to unblock progress. Review dependencies and
                resolve issues.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
