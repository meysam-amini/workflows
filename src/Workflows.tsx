import React, { useCallback, useState } from 'react';
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
  Redo2,
  Plus
} from 'lucide-react';

const NODE_CONFIG: Record<string, any> = {
  Trigger: { icon: <Zap size={16} />, headerBg: 'bg-indigo-50', iconColor: 'text-indigo-600', border: 'border-indigo-100' },
  Condition: { icon: <ShieldCheck size={16} />, headerBg: 'bg-orange-50', iconColor: 'text-orange-500', border: 'border-orange-100' },
  Task: { icon: <CheckCircle2 size={16} />, headerBg: 'bg-green-50', iconColor: 'text-green-600', border: 'border-green-100' },
};

const WorkflowNode = ({ data, id }: any) => {
  const config = NODE_CONFIG[data.type] || NODE_CONFIG.Task;

  return (
    <div className={`min-w-[220px] md:min-w-[260px] rounded-xl border-2 bg-white shadow-sm group ${data.selected ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
      <button 
        onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
        className="absolute -top-3 -right-3 p-1.5 bg-white border-2 border-red-100 text-red-500 rounded-full shadow-md md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-[60]"
      >
        <Trash2 size={14} />
      </button>

      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-300 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-300 border-2 border-white" />

      {data.type === 'Condition' ? (
        <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 flex flex-col gap-6 md:gap-8 z-50">
          <div className="relative flex items-center justify-end">
            <span className="mr-1 text-[8px] font-black text-green-600 bg-green-50 px-1 rounded border border-green-100 uppercase">Y</span>
            <Handle type="source" position={Position.Right} id="yes" className="w-4 h-4 bg-green-500 border-2 border-white !static" />
          </div>
          <div className="relative flex items-center justify-end">
            <span className="mr-1 text-[8px] font-black text-red-600 bg-red-50 px-1 rounded border border-red-100 uppercase">N</span>
            <Handle type="source" position={Position.Right} id="no" className="w-4 h-4 bg-red-500 border-2 border-white !static" />
          </div>
        </div>
      ) : (
        <Handle type="source" position={Position.Right} id="r" className="w-3 h-3 bg-slate-300 border-2 border-white" />
      )}

      <div className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 border-b-2 ${config.headerBg} ${config.border}`}>
        <div className={`p-1 rounded-lg bg-white shadow-sm ${config.iconColor}`}>{config.icon}</div>
        <div className="flex-1 font-bold text-slate-800 text-xs md:text-sm truncate">{data.title || 'Step'}</div>
      </div>

      <div className="p-3 md:p-4 bg-white space-y-1 md:space-y-2">
        <div className="text-[10px] md:text-[11px] text-slate-500 truncate italic">{data.description || 'No description...'}</div>
        <div className="text-[10px] md:text-[11px] font-bold text-indigo-500">{data.executionDate || 'No date set'}</div>
      </div>
    </div>
  );
};

const nodeTypes = { workflowNode: WorkflowNode };

const Workflows = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([{ nodes: [], edges: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const activeNode = nodes.find((n) => n.id === selectedNodeId);

  const takeSnapshot = useCallback((nextNodes?: Node[], nextEdges?: Edge[]) => {
    const snapshot = {
      nodes: JSON.parse(JSON.stringify(nextNodes || nodes)),
      edges: JSON.parse(JSON.stringify(nextEdges || edges)),
    };
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), snapshot]);
    setHistoryIndex((prev) => prev + 1);
  }, [nodes, edges, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setNodes(JSON.parse(JSON.stringify(prev.nodes)));
      setEdges(JSON.parse(JSON.stringify(prev.edges)));
      setHistoryIndex(historyIndex - 1);
      setSelectedNodeId(null);
    }
  }, [historyIndex, history, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setNodes(JSON.parse(JSON.stringify(next.nodes)));
      setEdges(JSON.parse(JSON.stringify(next.edges)));
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history, setNodes, setEdges]);

  const onSave = useCallback(() => {
    if (!rfInstance) return;
    console.log("Full Flow Object:", rfInstance.toObject());
  }, [rfInstance]);

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
    const nextEdges = addEdge({ 
      ...params, 
      type: 'smoothstep', 
      label: params.sourceHandle?.toUpperCase(),
      style: { stroke: edgeColor, strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor } 
    }, edges);
    takeSnapshot(nodes, nextEdges);
    setEdges(nextEdges);
  }, [nodes, edges, takeSnapshot, setEdges]);

  const addNodeMobile = (type: string) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'workflowNode',
      position: { x: 50, y: 50 },
      data: { type, title: type, executionDate: '', description: '', onDelete: onDeleteNode },
    };
    const nextNodes = nodes.concat(newNode);
    takeSnapshot(nextNodes, edges);
    setNodes(nextNodes);
  };

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!rfInstance || !type) return;
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
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8fafc] font-sans overflow-hidden">
      
      {/* MAIN SECTION (Header + Content) */}
      <main className="flex-1 flex flex-col relative bg-white order-1 overflow-hidden">
        
        {/* HEADER */}
        <header className="h-14 md:h-16 border-b bg-[#0f172a] text-white flex items-center justify-between px-4 md:px-8 z-[130] relative flex-shrink-0">
          <h1 className="font-black tracking-tighter text-sm md:text-lg uppercase">SDLC Flow</h1>
          
          <div className="flex items-center gap-2">
            <div className="flex md:hidden gap-1 mr-2">
              <button onClick={undo} disabled={historyIndex <= 0} className="p-2 rounded-lg bg-slate-800 border-none disabled:opacity-30 flex items-center active:bg-slate-700"><Undo2 size={16}/></button>
              <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-lg bg-slate-800 border-none disabled:opacity-30 flex items-center active:bg-slate-700"><Redo2 size={16}/></button>
            </div>
            <button onClick={onSave} className="bg-indigo-600 hover:bg-indigo-500 px-3 md:px-6 py-1.5 md:py-2 rounded-lg font-bold text-xs md:text-sm flex items-center gap-2 transition-colors">
              <Database size={14} /> <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </header>

        {/* MOBILE PALETTE (Immediately below Header on small screens) */}
        <aside className="md:hidden w-full border-b bg-white p-3 flex flex-row gap-2 overflow-x-auto z-[110] relative flex-shrink-0 shadow-sm">
          {['Trigger', 'Condition', 'Task'].map((type) => (
            <button 
              key={type} 
              onClick={() => addNodeMobile(type)} 
              className="flex-shrink-0 px-4 py-2 rounded-xl border-2 bg-slate-50 border-slate-100 font-bold text-[10px] uppercase text-slate-600 flex items-center gap-2 active:bg-indigo-50 active:border-indigo-200"
            >
              <Plus size={12}/> {type}
            </button>
          ))}
        </aside>

        {/* PROPERTY DRAWER (Slides over the mobile palette and canvas) */}
        <div 
          className={`fixed inset-x-0 top-0 bg-white border-b-4 border-indigo-500 shadow-2xl z-[120] transition-transform duration-500 ease-in-out ${activeNode ? 'translate-y-14 md:translate-y-16' : '-translate-y-full'}`} 
          style={{ height: window.innerWidth < 768 ? 'calc(100% - 3.5rem)' : '280px' }}
        >
          {activeNode && (
            <div className="p-6 md:p-8 max-w-6xl mx-auto flex flex-col md:flex-row gap-6 md:gap-12 relative h-full overflow-y-auto pt-10 md:pt-8">
              <button onClick={() => setSelectedNodeId(null)} className="absolute right-4 top-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
              
              <div className="flex-1 space-y-4 md:space-y-6">
                <h2 className="font-black text-slate-800 text-xl uppercase italic">Edit {activeNode.data.type}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Title</label>
                    <input onBlur={() => takeSnapshot()} value={activeNode.data.title} onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, title: e.target.value } } : n))} className="w-full border-2 p-2 md:p-3 rounded-xl outline-none focus:border-indigo-400 font-bold text-slate-700 text-sm md:text-base" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Date</label>
                    <input type="date" onBlur={() => takeSnapshot()} value={activeNode.data.executionDate} onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, executionDate: e.target.value } } : n))} className="w-full border-2 p-2 md:p-3 rounded-xl outline-none font-bold text-slate-700 text-sm md:text-base" />
                  </div>
                </div>
              </div>
              <div className="md:w-1/3 space-y-1 pb-10 md:pb-0">
                <label className="text-[10px] font-black text-slate-400 uppercase">Description</label>
                <textarea onBlur={() => takeSnapshot()} rows={window.innerWidth < 768 ? 6 : 4} value={activeNode.data.description} onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, description: e.target.value } } : n))} className="w-full border-2 p-3 rounded-xl outline-none text-sm font-medium" />
              </div>
            </div>
          )}
        </div>

        {/* FLOW CANVAS */}
        <div className="flex-1 min-h-0 relative z-10">
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
            <Controls position="bottom-right" />
          </ReactFlow>
        </div>
      </main>

      {/* DESKTOP SIDEBAR (Hidden on Mobile) */}
      <aside className="hidden md:flex w-72 border-r bg-white p-6 flex-col justify-between shadow-xl z-50 order-first">
        <div className="flex flex-col gap-4">
          <h2 className="font-black text-slate-800 text-lg uppercase mb-2 tracking-tighter">Nodes</h2>
          {['Trigger', 'Condition', 'Task'].map((type) => (
            <button 
              key={type} 
              draggable 
              onDragStart={(e) => e.dataTransfer.setData('application/reactflow', type)}
              className="cursor-grab p-4 rounded-xl border-2 bg-slate-50 border-slate-100 font-bold text-sm text-slate-600 hover:border-indigo-300 transition-all flex items-center gap-2"
            >
              {type} Node
            </button>
          ))}
        </div>

        <div className="flex border-t pt-6 gap-2">
          <button onClick={undo} disabled={historyIndex <= 0} className="flex-1 p-3 rounded-xl border-2 border-slate-100 disabled:opacity-20 transition-all flex justify-center hover:bg-slate-50"><Undo2 size={18} /></button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="flex-1 p-3 rounded-xl border-2 border-slate-100 disabled:opacity-20 transition-all flex justify-center hover:bg-slate-50"><Redo2 size={18} /></button>
        </div>
      </aside>
    </div>
  );
};

export default Workflows;