import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  Connection,
  MarkerType,
  Handle,
  Position,
  ReactFlowInstance,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  Database,
  Clock,
  FileText,
  Bell,
  X,
} from 'lucide-react';

/* =========================================================
   Custom Workflow Node
========================================================= */

const WorkflowNode = ({ data }: any) => {
  return (
    <div
      className={`
        min-w-[240px]
        rounded-2xl
        border-2
        bg-white
        shadow-lg
        px-4
        py-4
        transition-all
        hover:border-indigo-400
        ${data.selected ? 'border-indigo-500' : 'border-slate-200'}
      `}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-slate-400" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-slate-400" />
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-slate-400" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-slate-400" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${data.color}`}>
            {data.icon}
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
              {data.type}
            </p>
            <p className="font-bold text-sm text-slate-800">
              {data.title || 'Untitled Step'}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2">
          {data.description || 'No description added'}
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock size={12} />
          <span>{data.executionDate || 'No execution date'}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Bell size={12} />
          <span>{data.reminderDate || 'No reminder date'}</span>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  workflowNode: WorkflowNode,
};

/* =========================================================
   Main Workflow Builder
========================================================= */

const Workflows = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  /* =========================================================
     Helpers
  ========================================================= */

  const getNodeVisuals = (type: string) => {
    if (type === 'Trigger') {
      return {
        icon: <Zap size={14} />,
        color: 'bg-indigo-50 text-indigo-600',
      };
    }

    if (type === 'Condition') {
      return {
        icon: <ShieldCheck size={14} />,
        color: 'bg-orange-50 text-orange-500',
      };
    }

    return {
      icon: <CheckCircle2 size={14} />,
      color: 'bg-green-50 text-green-600',
    };
  };

  const updateNodeData = (nodeId: string, field: string, value: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeId) return node;

        return {
          ...node,
          data: {
            ...node.data,
            [field]: value,
          },
        };
      })
    );
  };

  /* =========================================================
     Edge Connection
  ========================================================= */

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);

      const isConditional = sourceNode?.data?.type === 'Condition';

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            label: isConditional ? 'Condition' : '',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#6366f1',
            },
            style: {
              stroke: '#6366f1',
              strokeWidth: 2,
            },
          },
          eds
        )
      );
    },
    [nodes]
  );

  /* =========================================================
     Drag + Drop
  ========================================================= */

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !rfInstance) return;

      const type = event.dataTransfer.getData('application/reactflow');

      const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const visuals = getNodeVisuals(type);

      const newNode: Node = {
        id: `step_${Date.now()}`,
        type: 'workflowNode',
        position,
        data: {
          title: `New ${type}`,
          description: '',
          executionDate: '',
          reminderDate: '',
          conditionLabel: '',
          type,
          ...visuals,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNode.id);
    },
    [rfInstance]
  );

  /* =========================================================
     Save Flow
  ========================================================= */

  const saveFlow = () => {
    const payload = {
      workflowName: 'Agent Workflow',
      steps: nodes.map((node) => ({
        id: node.id,
        title: node.data.title,
        description: node.data.description,
        executionDate: node.data.executionDate,
        reminderDate: node.data.reminderDate,
        type: node.data.type,
      })),
      connections: edges.map((edge: Edge) => ({
        from: edge.source,
        to: edge.target,
        type: edge.label ? 'conditional' : 'direct',
        condition: edge.label || null,
      })),
    };

    console.log('Workflow Payload:', JSON.stringify(payload, null, 2));
    alert('Workflow saved. Check console for payload.');
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* LEFT PALETTE */}
      <aside className="w-64 border-r bg-white p-6 flex flex-col gap-4">
        <h2 className="font-bold text-slate-800">Node Palette</h2>

        <div
          draggable
          onDragStart={(e) => onDragStart(e, 'Trigger')}
          className="p-3 rounded-xl border bg-indigo-50 cursor-grab flex items-center gap-2"
        >
          <Zap size={16} /> Trigger Step
        </div>

        <div
          draggable
          onDragStart={(e) => onDragStart(e, 'Condition')}
          className="p-3 rounded-xl border bg-orange-50 cursor-grab flex items-center gap-2"
        >
          <ShieldCheck size={16} /> Condition Step
        </div>

        <div
          draggable
          onDragStart={(e) => onDragStart(e, 'Task')}
          className="p-3 rounded-xl border bg-green-50 cursor-grab flex items-center gap-2"
        >
          <CheckCircle2 size={16} /> Action Step
        </div>
      </aside>

      {/* CENTER CANVAS */}
      <main className="flex-1 flex flex-col" ref={reactFlowWrapper}>
        <header className="h-16 border-b bg-[#0f172a] text-white flex items-center justify-between px-6">
          <span className="font-bold">Agent Workflow Designer</span>

          <button
            onClick={saveFlow}
            className="bg-indigo-600 px-4 py-2 rounded-lg flex items-center gap-2 font-bold"
          >
            <Database size={16} /> Save Flow
          </button>
        </header>

        <div className="flex-1">
          <ReactFlow
            nodes={nodes.map((n) => ({
              ...n,
              data: {
                ...n.data,
                selected: n.id === selectedNodeId,
              },
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRfInstance}
            onDrop={onDrop}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#cbd5e1" gap={20} />
            <Controls />
          </ReactFlow>
        </div>
      </main>

      {/* RIGHT DRAWER */}
      {selectedNode && (
        <aside className="w-[380px] border-l bg-white p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-800">Step Properties</h2>
            <button onClick={() => setSelectedNodeId(null)}>
              <X size={18} />
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                value={selectedNode.data.title || ''}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, 'title', e.target.value)
                }
                className="w-full mt-1 border rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                rows={4}
                value={selectedNode.data.description || ''}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, 'description', e.target.value)
                }
                className="w-full mt-1 border rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Execution Date</label>
              <input
                type="datetime-local"
                value={selectedNode.data.executionDate || ''}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, 'executionDate', e.target.value)
                }
                className="w-full mt-1 border rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Reminder Date</label>
              <input
                type="datetime-local"
                value={selectedNode.data.reminderDate || ''}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, 'reminderDate', e.target.value)
                }
                className="w-full mt-1 border rounded-xl px-3 py-2"
              />
            </div>

            {selectedNode.data.type === 'Condition' && (
              <div>
                <label className="text-sm font-medium">Condition Label</label>
                <input
                  value={selectedNode.data.conditionLabel || ''}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, 'conditionLabel', e.target.value)
                  }
                  placeholder="Approved / Rejected"
                  className="w-full mt-1 border rounded-xl px-3 py-2"
                />
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};

export default Workflows;
