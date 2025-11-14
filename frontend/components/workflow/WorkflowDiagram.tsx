/**
 * Workflow Diagram Component
 *
 * BPMN-style workflow visualization for compliance processes
 * Uses react-flow-renderer for interactive diagrams
 */

'use client';

import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
} from 'react-flow-renderer';

export interface WorkflowStep {
  id: string;
  label: string;
  type: 'start' | 'process' | 'decision' | 'end' | 'approval';
  status?: 'pending' | 'in_progress' | 'completed' | 'rejected';
  assignee?: string;
  dueDate?: string;
}

export interface WorkflowConnection {
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

interface WorkflowDiagramProps {
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
  title?: string;
  onStepClick?: (step: WorkflowStep) => void;
}

const nodeColors = {
  start: { bg: '#10b981', border: '#059669' },
  process: { bg: '#3b82f6', border: '#2563eb' },
  decision: { bg: '#f59e0b', border: '#d97706' },
  approval: { bg: '#8b5cf6', border: '#7c3aed' },
  end: { bg: '#ef4444', border: '#dc2626' },
};

const statusColors = {
  pending: { bg: '#e5e7eb', text: '#6b7280' },
  in_progress: { bg: '#fef3c7', text: '#92400e' },
  completed: { bg: '#d1fae5', text: '#065f46' },
  rejected: { bg: '#fee2e2', text: '#991b1b' },
};

export function WorkflowDiagram({
  steps,
  connections,
  title = 'Workflow Diagram',
  onStepClick,
}: WorkflowDiagramProps) {
  // Convert steps to nodes
  const initialNodes: Node[] = steps.map((step, index) => {
    const colors = nodeColors[step.type];
    const statusColor = step.status ? statusColors[step.status] : null;

    return {
      id: step.id,
      type: step.type === 'decision' ? 'default' : 'default',
      data: {
        label: (
          <div className="text-center">
            <div className="font-semibold text-sm">{step.label}</div>
            {step.status && (
              <div
                className="mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: statusColor?.bg,
                  color: statusColor?.text,
                }}
              >
                {step.status.replace('_', ' ').toUpperCase()}
              </div>
            )}
            {step.assignee && (
              <div className="text-xs text-gray-600 mt-1">
                👤 {step.assignee}
              </div>
            )}
          </div>
        ),
      },
      position: {
        x: (index % 3) * 250,
        y: Math.floor(index / 3) * 150,
      },
      style: {
        background: colors.bg,
        color: 'white',
        border: `2px solid ${colors.border}`,
        borderRadius: step.type === 'decision' ? '50%' : '8px',
        padding: '16px',
        minWidth: step.type === 'decision' ? '100px' : '180px',
        minHeight: step.type === 'decision' ? '100px' : '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    };
  });

  // Convert connections to edges
  const initialEdges: Edge[] = connections.map((conn, index) => ({
    id: `edge-${index}`,
    source: conn.from,
    target: conn.to,
    label: conn.label || conn.condition,
    animated: true,
    style: { stroke: '#6b7280', strokeWidth: 2 },
    labelStyle: { fill: '#374151', fontWeight: 600, fontSize: 12 },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
    type: 'smoothstep',
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const step = steps.find(s => s.id === node.id);
      if (step && onStepClick) {
        onStepClick(step);
      }
    },
    [steps, onStepClick]
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          {Object.entries(nodeColors).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded border-2"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  borderRadius: type === 'decision' ? '50%' : '4px',
                }}
              />
              <span className="text-gray-600 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Diagram */}
      <div className="h-[600px] border-2 border-gray-200 rounded-lg overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="#e5e7eb"
          />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const step = steps.find(s => s.id === node.id);
              return step ? nodeColors[step.type].bg : '#6b7280';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Status Summary */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        {(['pending', 'in_progress', 'completed', 'rejected'] as const).map(status => {
          const count = steps.filter(s => s.status === status).length;
          const colors = statusColors[status];

          return (
            <div
              key={status}
              className="p-4 rounded-lg border-2"
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.text,
              }}
            >
              <p className="text-sm font-medium" style={{ color: colors.text }}>
                {status.replace('_', ' ').toUpperCase()}
              </p>
              <p className="text-3xl font-bold mt-1" style={{ color: colors.text }}>
                {count}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Predefined DWSP Approval Workflow
 */
export const DWSPApprovalWorkflow: WorkflowStep[] = [
  {
    id: 'start',
    label: 'Start',
    type: 'start',
    status: 'completed',
  },
  {
    id: 'draft',
    label: 'Create DWSP Draft',
    type: 'process',
    status: 'completed',
    assignee: 'Compliance Manager',
  },
  {
    id: 'review',
    label: 'Internal Review',
    type: 'process',
    status: 'in_progress',
    assignee: 'Technical Team',
  },
  {
    id: 'decision1',
    label: 'Pass Review?',
    type: 'decision',
    status: 'pending',
  },
  {
    id: 'revise',
    label: 'Revise Document',
    type: 'process',
    status: 'pending',
  },
  {
    id: 'approval',
    label: 'Manager Approval',
    type: 'approval',
    status: 'pending',
    assignee: 'Operations Manager',
  },
  {
    id: 'decision2',
    label: 'Approved?',
    type: 'decision',
    status: 'pending',
  },
  {
    id: 'submit',
    label: 'Submit to Regulator',
    type: 'process',
    status: 'pending',
  },
  {
    id: 'end',
    label: 'Complete',
    type: 'end',
    status: 'pending',
  },
];

export const DWSPApprovalConnections: WorkflowConnection[] = [
  { from: 'start', to: 'draft' },
  { from: 'draft', to: 'review' },
  { from: 'review', to: 'decision1' },
  { from: 'decision1', to: 'approval', label: 'Yes', condition: 'Pass' },
  { from: 'decision1', to: 'revise', label: 'No', condition: 'Fail' },
  { from: 'revise', to: 'review' },
  { from: 'approval', to: 'decision2' },
  { from: 'decision2', to: 'submit', label: 'Approved' },
  { from: 'decision2', to: 'revise', label: 'Rejected' },
  { from: 'submit', to: 'end' },
];
