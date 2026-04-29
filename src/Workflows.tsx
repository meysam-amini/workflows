import React, { useCallback, useRef, useState, useEffect } from 'react';
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
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Database, 
  X, 
  Trash2,
  Undo2,
  Redo2 
} from 'lucide-react';

/* =========================================================
   1. VISUAL CONFIGURATION
========================================================= */
const NODE_CONFIG: Record<string, any> = {
  Trigger: { icon: <Zap size={16} />, headerBg: 'bg-indigo-50', iconColor: 'text-indigo-600', border: 'border-indigo-100' },
  Condition: { icon: <ShieldCheck size={16} />, headerBg: 'bg-orange-50', iconColor: 'text-orange-500', border: 'border-orange-100' },
  Task: { icon: <CheckCircle2 size={16} />, headerBg: 'bg-green-50', iconColor: 'text-green-600', border: 'border-green-100' },
};

/* =========================================================
   2. CUSTOM NODE COMPONENT
========================================================= */
const WorkflowNode = ({ data, id }: any) => {
  const config = NODE_CONFIG[data.type] || NODE_CONFIG.Task;

  return (
    <div className={`min-w-[260px] rounded-xl border-2 bg-white shadow-sm overflow-visible group ${data.selected ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
      <button 
        onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
        className="absolute -top-3 -right-3 p-1.5 bg-white border-2 border-red-100 text-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-[60]"
      >
        <Trash2 size={14} />
      </button>

      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-300 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-300 border-2 border-white" />

      {data.type === 'Condition' ? (
        <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 flex flex-col gap-8 z-50">
          <div className="relative flex items-center justify-end">
            <span className="mr-2 text-[9px] font-black text-green-600 bg-green-50 px-1 rounded border border-green-100 uppercase">Yes</span>
            <Handle type="source" position={Position.Right} id="yes" className="w-4 h-4 bg-green-500 border-2 border-white !static" />
          </div>
          <div className="relative flex items-center justify-end">
            <span className="mr-2 text-[9px] font-black text-red-600 bg-red-50 px-1 rounded border border-red-100 uppercase">No</span>
            <Handle type="source" position={Position.Right} id="no" className="w-4 h-4 bg-green-500 border-2 border-white !static" />
          </div>
        </div>
      ) : (
        <Handle type="source" position={Position.Right} id="r" className="w-3 h-3 bg-slate-300 border-2 border-white" />
      )}

      <div className={`flex items-center gap-3 px-4 py-3 border-b-2 ${config.headerBg} ${config.border}`}>
        <div className={`p-1.5 rounded-lg bg-white shadow-sm ${config.iconColor}`}>{config.icon}</div>
        <div className="flex-1 font-bold text-slate-800 text-sm truncate">{data.title || 'Step'}</div>
      </div>

      <div className="p-4 bg-white space-y-2">
        <div className="text-[11px] text-slate-500 truncate italic">{data.description || 'No description...'}</div>
        <div className="text-[11px] font-bold text-indigo-500">{data.executionDate || 'No date set'}</div>
      </div>
    </div>
  );
};

const nodeTypes = { workflowNode: WorkflowNode };

/* =========================================================
   3. MAIN COMPONENT
========================================================= */
const Workflows = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // --- HISTORY SYSTEM ---
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([{ nodes: [], edges: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const activeNode = nodes.find((n) => n.id === selectedNodeId);

  const takeSnapshot = useCallback((nextNodes?: Node[], nextEdges?: Edge[]) => {
    const snapshot = {
      nodes: JSON.parse(JSON.stringify(nextNodes || nodes)),
      edges: JSON.parse(JSON.stringify(nextEdges || edges)),
    };
    setHistory((prev) => {
      const newStack = prev.slice(0, historyIndex + 1);
      return [...newStack, snapshot];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [nodes, edges, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const { nodes: hNodes, edges: hEdges } = history[prevIndex];
      setNodes(JSON.parse(JSON.stringify(hNodes)));
      setEdges(JSON.parse(JSON.stringify(hEdges)));
      setHistoryIndex(prevIndex);
      setSelectedNodeId(null);
    }
  }, [historyIndex, history, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const { nodes: hNodes, edges: hEdges } = history[nextIndex];
      setNodes(JSON.parse(JSON.stringify(hNodes)));
      setEdges(JSON.parse(JSON.stringify(hEdges)));
      setHistoryIndex(nextIndex);
    }
  }, [historyIndex, history, setNodes, setEdges]);

  // --- SAVE & EXPORT LOGIC ---
  const onSave = useCallback(() => {
    if (!rfInstance) return;

    // This captures EVERYTING: positions, types, data, and edge logic
    const flowObject = rfInstance.toObject();

    console.log("%c--- COMPLETE FLOW EXPORT (JSON READY) ---", "color: #10b981; font-weight: bold; font-size: 14px;");
    console.log("Full Object:", flowObject);

    console.group("Detailed Positioning & Data");
    flowObject.nodes.forEach((node) => {
      console.log(`[${node.id}] "${node.data.title}" at X: ${Math.round(node.position.x)}, Y: ${Math.round(node.position.y)}`);
    });
    console.groupEnd();

    console.group("Connectivity Map");
    flowObject.edges.forEach((edge) => {
      const src = flowObject.nodes.find((n) => n.id === edge.source);
      const tar = flowObject.nodes.find((n) => n.id === edge.target);
      console.log(`${src?.data.title || edge.source} (${edge.sourceHandle || 'default'}) -> ${tar?.data.title || edge.target}`);
    });
    console.groupEnd();

    // To load this back later: setNodes(flowObject.nodes); setEdges(flowObject.edges);
  }, [rfInstance]);

  // --- HANDLERS ---
  const onDeleteNode = useCallback((id: string) => {
    const nextNodes = nodes.filter((n) => n.id !== id);
    const nextEdges = edges.filter((e) => e.source !== id && e.target !== id);
    takeSnapshot(nextNodes, nextEdges);
    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodeId(null);
  }, [nodes, edges, takeSnapshot, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    let edgeColor = params.sourceHandle === 'yes' ? '#22c55e' : params.sourceHandle === 'no' ? '#ef4444' : '#94a3b8';
    const newEdge = { 
      ...params, 
      type: 'smoothstep', 
      label: params.sourceHandle?.toUpperCase(),
      labelStyle: { fill: edgeColor, fontWeight: 700, fontSize: 10 },
      style: { stroke: edgeColor, strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor } 
    };
    const nextEdges = addEdge(newEdge, edges);
    takeSnapshot(nodes, nextEdges);
    setEdges(nextEdges);
  }, [nodes, edges, takeSnapshot, setEdges]);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!rfInstance) return;

    const type = event.dataTransfer.getData('application/reactflow');
    const position = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });

    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'workflowNode',
      position,
      data: { type, title: type, executionDate: '', description: '', onDelete: onDeleteNode },
    };

    const nextNodes = nodes.concat(newNode);
    takeSnapshot(nextNodes, edges);
    setNodes(nextNodes);
  }, [rfInstance, nodes, edges, takeSnapshot, setNodes, onDeleteNode]);

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans overflow-hidden">
      <aside className="w-72 border-r bg-white p-6 flex flex-col justify-between shadow-xl z-50">
        <div>
          <h2 className="font-black text-slate-800 text-lg uppercase mb-6 tracking-tighter">Node Palette</h2>
          <div className="space-y-4">
            {['Trigger', 'Condition', 'Task'].map((type) => (
              <div 
                key={type} 
                draggable 
                onDragStart={(e) => e.dataTransfer.setData('application/reactflow', type)} 
                className="cursor-grab p-4 rounded-xl border-2 bg-slate-50 border-slate-100 font-bold text-slate-600 hover:border-indigo-300 transition-all"
              >
                {type} Node
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">History</p>
          <div className="flex gap-2">
            <button onClick={undo} disabled={historyIndex <= 0} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-slate-100 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-20 transition-all">
              <Undo2 size={18} /> Undo
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-slate-100 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-20 transition-all">
              <Redo2 size={18} /> Redo
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-white">
        <header className="h-16 border-b bg-[#0f172a] text-white flex items-center justify-between px-8 z-50">
          <h1 className="font-black tracking-tighter text-lg uppercase">Flow Builder</h1>
          <button onClick={onSave} className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
            <Database size={16} /> Save & Log Full State
          </button>
        </header>

        {/* PROPERTIES PANEL */}
        <div className={`absolute left-0 right-0 bg-white border-b-4 border-indigo-500 shadow-2xl z-40 transition-all duration-300 ${activeNode ? 'translate-y-16' : '-translate-y-full'}`} style={{ height: '280px' }}>
          {activeNode && (
            <div className="p-8 max-w-6xl mx-auto flex flex-row gap-12 relative">
              <button onClick={() => setSelectedNodeId(null)} className="absolute right-4 top-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X size={20} /></button>
              <div className="flex-1 space-y-6">
                <h2 className="font-black text-slate-800 text-xl uppercase italic">Edit {activeNode.data.type}</h2>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase">Title</label>
                    <input 
                      onBlur={() => takeSnapshot()} 
                      value={activeNode.data.title} 
                      onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, title: e.target.value } } : n))} 
                      className="w-full border-2 p-3 rounded-xl outline-none focus:border-indigo-400 font-bold text-slate-700" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase">Date</label>
                    <input 
                      onBlur={() => takeSnapshot()}
                      type="date" 
                      value={activeNode.data.executionDate} 
                      onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, executionDate: e.target.value } } : n))} 
                      className="w-full border-2 p-3 rounded-xl outline-none font-bold text-slate-700" 
                    />
                  </div>
                </div>
              </div>
              <div className="w-1/3 space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase">Description</label>
                <textarea 
                  onBlur={() => takeSnapshot()}
                  rows={4} 
                  value={activeNode.data.description} 
                  onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, description: e.target.value } } : n))} 
                  className="w-full border-2 p-3 rounded-xl outline-none text-sm font-medium" 
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <ReactFlow
            nodes={nodes.map((n) => ({ ...n, data: { ...n.data, selected: n.id === selectedNodeId, onDelete: onDeleteNode } }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRfInstance}
            onDrop={onDrop}
            onNodeDragStop={() => takeSnapshot()}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onDragOver={(e) => e.preventDefault()}
            nodeTypes={nodeTypes}
            snapToGrid={true}
            fitView
          >
            <Background color="#cbd5e1" gap={25} variant="dots" />
            <Controls />
          </ReactFlow>
        </div>
      </main>
    </div>
  );
};

export default Workflows;