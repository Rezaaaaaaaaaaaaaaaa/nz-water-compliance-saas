/**
 * Workflow Builder Component
 *
 * Visual workflow builder for creating and managing automated
 * compliance workflows with triggers, actions, and conditions
 */

"use client";

import { useState, useMemo } from "react";

export interface WorkflowNode {
  id: string;
  type:
    | "trigger"
    | "condition"
    | "action"
    | "notification"
    | "approval"
    | "delay";
  label: string;
  description?: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  connections?: string[]; // IDs of connected nodes
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category:
    | "compliance"
    | "inspection"
    | "training"
    | "maintenance"
    | "incident";
  status: "active" | "inactive" | "draft";
  trigger: {
    type: "schedule" | "event" | "manual" | "condition";
    config: Record<string, unknown>;
  };
  nodes: WorkflowNode[];
  version: number;
  createdBy: string;
  createdDate: string;
  lastModified: string;
  executionCount?: number;
  successRate?: number;
}

interface WorkflowBuilderProps {
  workflow?: Workflow;
  onSave: (workflow: Workflow) => void;
  onTest?: (workflow: Workflow) => void;
  onCancel?: () => void;
}

const nodeTypeConfig = {
  trigger: {
    label: "Trigger",
    icon: "⚡",
    color: "#3b82f6",
    bgColor: "#dbeafe",
    description: "What starts this workflow",
  },
  condition: {
    label: "Condition",
    icon: "🔀",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    description: "Decision point based on conditions",
  },
  action: {
    label: "Action",
    icon: "⚙️",
    color: "#10b981",
    bgColor: "#d1fae5",
    description: "Perform an action",
  },
  notification: {
    label: "Notification",
    icon: "📧",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    description: "Send notification",
  },
  approval: {
    label: "Approval",
    icon: "✅",
    color: "#06b6d4",
    bgColor: "#cffafe",
    description: "Require approval",
  },
  delay: {
    label: "Delay",
    icon: "⏱️",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    description: "Wait for specified time",
  },
};

const triggerTypes = [
  {
    value: "schedule",
    label: "Scheduled",
    description: "Run on a schedule (daily, weekly, etc.)",
  },
  {
    value: "event",
    label: "Event-based",
    description: "Triggered by specific events",
  },
  { value: "manual", label: "Manual", description: "Started manually by user" },
  {
    value: "condition",
    label: "Conditional",
    description: "When specific conditions are met",
  },
];

const categoryConfig = {
  compliance: { label: "Compliance", icon: "📋", color: "#3b82f6" },
  inspection: { label: "Inspection", icon: "🔍", color: "#10b981" },
  training: { label: "Training", icon: "🎓", color: "#f59e0b" },
  maintenance: { label: "Maintenance", icon: "🔧", color: "#8b5cf6" },
  incident: { label: "Incident", icon: "⚠️", color: "#ef4444" },
};

export function WorkflowBuilder({
  workflow: initialWorkflow,
  onSave,
  onTest,
  onCancel,
}: WorkflowBuilderProps) {
  const [name, setName] = useState(initialWorkflow?.name || "");
  const [description, setDescription] = useState(
    initialWorkflow?.description || "",
  );
  const [category, setCategory] = useState<Workflow["category"]>(
    initialWorkflow?.category || "compliance",
  );
  const [triggerType, setTriggerType] = useState<Workflow["trigger"]["type"]>(
    initialWorkflow?.trigger.type || "schedule",
  );
  const [nodes, setNodes] = useState<WorkflowNode[]>(
    initialWorkflow?.nodes || [],
  );
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);

  // Validate workflow
  const validation = useMemo(() => {
    const errors: string[] = [];
    if (!name.trim()) errors.push("Workflow name is required");
    if (!description.trim()) errors.push("Workflow description is required");
    if (nodes.length === 0) errors.push("At least one node is required");

    const hasAction = nodes.some((n) => n.type === "action");
    if (!hasAction) errors.push("Workflow must have at least one action");

    return { isValid: errors.length === 0, errors };
  }, [name, description, nodes]);

  // Add node
  const addNode = (type: WorkflowNode["type"]) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      label: `${nodeTypeConfig[type].label} ${nodes.length + 1}`,
      config: {},
      position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 },
      connections: [],
    };
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode.id);
    setShowAddNode(false);
  };

  // Remove node
  const removeNode = (nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId));
    if (selectedNode === nodeId) setSelectedNode(null);
  };

  // Update node
  const updateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)));
  };

  // Connect nodes
  const connectNodes = (fromId: string, toId: string) => {
    setNodes(
      nodes.map((n) =>
        n.id === fromId
          ? { ...n, connections: [...(n.connections || []), toId] }
          : n,
      ),
    );
  };

  // Save workflow
  const handleSave = () => {
    if (!validation.isValid) return;

    const workflow: Workflow = {
      id: initialWorkflow?.id || `workflow-${Date.now()}`,
      name,
      description,
      category,
      status: "draft",
      trigger: {
        type: triggerType,
        config: {},
      },
      nodes,
      version: (initialWorkflow?.version || 0) + 1,
      createdBy: "Current User",
      createdDate: initialWorkflow?.createdDate || new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    onSave(workflow);
  };

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 max-w-2xl">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workflow Name"
              className="w-full text-2xl font-bold text-gray-800 border-2 border-transparent focus:border-blue-500 rounded px-2 py-1 outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Workflow description..."
              className="w-full mt-2 text-sm text-gray-600 border-2 border-transparent focus:border-blue-500 rounded px-2 py-1 outline-none resize-none"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            {onTest && (
              <button
                onClick={() => onTest({ ...initialWorkflow!, nodes })}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                🧪 Test
              </button>
            )}
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!validation.isValid}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                validation.isValid
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              💾 Save Workflow
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as Workflow["category"])
              }
              className="px-3 py-1 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Trigger:</span>
            <select
              value={triggerType}
              onChange={(e) =>
                setTriggerType(e.target.value as Workflow["trigger"]["type"])
              }
              className="px-3 py-1 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              {triggerTypes.map((trigger) => (
                <option key={trigger.value} value={trigger.value}>
                  {trigger.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto">
            <span className="text-xs text-gray-500">
              {nodes.length} node{nodes.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Validation Errors */}
        {!validation.isValid && (
          <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-800 mb-1">
              Please fix the following:
            </p>
            <ul className="text-xs text-red-700 space-y-0.5 list-disc list-inside">
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbox */}
        <div className="w-64 bg-gray-50 border-r-2 border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Node Types</h3>
          <div className="space-y-2">
            {Object.entries(nodeTypeConfig).map(([type, config]) => (
              <button
                key={type}
                onClick={() => addNode(type as WorkflowNode["type"])}
                className="w-full p-3 text-left rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-white transition-all"
                style={{
                  borderLeftWidth: "4px",
                  borderLeftColor: config.color,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{config.icon}</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {config.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{config.description}</p>
              </button>
            ))}
          </div>

          {/* Workflow Stats */}
          {initialWorkflow && (
            <div className="mt-6 p-3 bg-white rounded-lg border-2 border-gray-200">
              <h4 className="text-xs font-bold text-gray-700 mb-2">
                Workflow Stats
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Version:</span>
                  <span className="font-semibold text-gray-800">
                    {initialWorkflow.version}
                  </span>
                </div>
                {initialWorkflow.executionCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Executions:</span>
                    <span className="font-semibold text-gray-800">
                      {initialWorkflow.executionCount}
                    </span>
                  </div>
                )}
                {initialWorkflow.successRate !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-semibold text-green-600">
                      {initialWorkflow.successRate.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 p-6 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
          {nodes.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl text-gray-400 mb-2">👈</p>
                <p className="text-lg font-semibold text-gray-600 mb-1">
                  Start building your workflow
                </p>
                <p className="text-sm text-gray-500">
                  Add nodes from the toolbox on the left
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {nodes.map((node, index) => {
                const config = nodeTypeConfig[node.type];
                const isSelected = selectedNode === node.id;
                return (
                  <div key={node.id}>
                    <div
                      onClick={() => setSelectedNode(node.id)}
                      className={`relative bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-500 shadow-lg scale-105"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }`}
                      style={{
                        borderLeftWidth: "6px",
                        borderLeftColor: config.color,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-3xl">{config.icon}</span>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={node.label}
                              onChange={(e) =>
                                updateNode(node.id, { label: e.target.value })
                              }
                              className="text-lg font-semibold text-gray-800 border-2 border-transparent hover:border-gray-200 focus:border-blue-500 rounded px-2 py-1 outline-none w-full"
                              placeholder="Node label..."
                            />
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-xs font-medium px-2 py-1 rounded"
                                style={{
                                  backgroundColor: config.bgColor,
                                  color: config.color,
                                }}
                              >
                                {config.label}
                              </span>
                              {node.description && (
                                <span className="text-xs text-gray-500">
                                  {node.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNode(node.id);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Connection indicator */}
                      {node.connections && node.connections.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Connected to {node.connections.length} node
                            {node.connections.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Connection arrow */}
                    {index < nodes.length - 1 && (
                      <div className="flex justify-center my-2">
                        <div className="text-3xl text-gray-400">↓</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedNodeData && (
          <div className="w-80 bg-gray-50 border-l-2 border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700">
                Node Properties
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Node Label
                </label>
                <input
                  type="text"
                  value={selectedNodeData.label}
                  onChange={(e) =>
                    updateNode(selectedNodeData.id, { label: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={selectedNodeData.description || ""}
                  onChange={(e) =>
                    updateNode(selectedNodeData.id, {
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">Node Type:</span>{" "}
                  {nodeTypeConfig[selectedNodeData.type].label}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {nodeTypeConfig[selectedNodeData.type].description}
                </p>
              </div>

              {/* Connection Management */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Connections
                </label>
                <div className="space-y-2">
                  {nodes
                    .filter((n) => n.id !== selectedNodeData.id)
                    .map((node) => {
                      const isConnected =
                        selectedNodeData.connections?.includes(node.id);
                      return (
                        <button
                          key={node.id}
                          onClick={() => {
                            if (isConnected) {
                              updateNode(selectedNodeData.id, {
                                connections:
                                  selectedNodeData.connections?.filter(
                                    (id) => id !== node.id,
                                  ),
                              });
                            } else {
                              connectNodes(selectedNodeData.id, node.id);
                            }
                          }}
                          className={`w-full p-2 text-left text-xs rounded border-2 transition-colors ${
                            isConnected
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                          }`}
                        >
                          {isConnected ? "✓ " : "○ "}
                          {node.label}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
