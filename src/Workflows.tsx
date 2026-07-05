import React, { useCallback, useState, useMemo, memo } from 'react';
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
    NodeProps,
    OnNodesChange,
    OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges
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

/* =========================================================
   1. TYPES & CONFIGURATIONS
========================================================= */
export interface WorkflowNodeData {
    type: 'Trigger' | 'Condition' | 'Task';
    title: string;
    executionDate?: string;
    description?: string;
    selected?: boolean;
    onDelete: (id: string) => void;
}

interface NodeConfig {
    icon: React.ReactNode;
    headerBg: string;
    iconColor: string;
    border: string;
}

const NODE_CONFIG: Record<WorkflowNodeData['type'], NodeConfig> = {
    Trigger: { icon: <Zap size={16} />, headerBg: 'bg-indigo-50', iconColor: 'text-indigo-600', border: 'border-indigo-100' },
    Condition: { icon: <ShieldCheck size={16} />, headerBg: 'bg-orange-50', iconColor: 'text-orange-500', border: 'border-orange-100' },
    Task: { icon: <CheckCircle2 size={16} />, headerBg: 'bg-green-50', iconColor: 'text-green-600', border: 'border-green-100' },
};

/* =========================================================
   2. MEMOIZED CUSTOM NODE COMPONENT
========================================================= */
const WorkflowNode = memo(({ id, data }: NodeProps<Node<WorkflowNodeData>>) => {
    const config = NODE_CONFIG[data.type] || NODE_CONFIG.Task;

    return (
        <div className={`min-w-[220px] md:min-w-[260px] rounded-xl border-2 bg-white shadow-sm group ${data.selected ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
            <button
                type="button"
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
                        <Handle type="source" position={Position.Right} id="no" className="w-4 h-4 bg-green-500 border-2 border-white !static" />
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
});

WorkflowNode.displayName = 'WorkflowNode';
const nodeTypes = { workflowNode: WorkflowNode };

/* =========================================================
   3. MAIN COMPONENT
========================================================= */
const Workflows = () => {
    const [nodes, setNodes] = useState<Node<WorkflowNodeData>>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Structural History State Engine Configuration
    const [history, setHistory] = useState<{ nodes: Node<WorkflowNodeData>[]; edges: Edge[] }[]>([{ nodes: [], edges: [] }]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Deep Snapshot Utility capturing safe object copies
    const createDeepCopy = (targetNodes: Node<WorkflowNodeData>[], targetEdges: Edge[]) => {
        const nodesSnapshot = targetNodes.map(node => ({
            ...node,
            position: { ...node.position },
            data: { ...node.data }
        }));
        const edgesSnapshot = targetEdges.map(edge => ({ ...edge }));
        return { nodes: nodesSnapshot, edges: edgesSnapshot };
    };

    const takeSnapshot = useCallback((nextNodes: Node<WorkflowNodeData>[], nextEdges: Edge[]) => {
        const snapshot = createDeepCopy(nextNodes, nextEdges);
        setHistory((prev) => {
            const updatedHistory = prev.slice(0, historyIndex + 1);
            return [...updatedHistory, snapshot];
        });
        setHistoryIndex((prev) => prev + 1);
    }, [historyIndex]);

    // Intercepting layout and movement mutations safely
    const onNodesChange: OnNodesChange<Node<WorkflowNodeData>> = useCallback((changes) => {
        setNodes((currentNodes) => {
            const nextNodes = applyNodeChanges(changes, currentNodes);

            // Determine if change is structural (e.g., end of drag or deletion) to save history
            const shouldSnapshot = changes.some(c => c.type === 'remove' || (c.type === 'position' && !c.dragging));
            if (shouldSnapshot) {
                takeSnapshot(nextNodes, edges);
            }
            return nextNodes;
        });
    }, [edges, takeSnapshot]);

    const onEdgesChange: OnEdgesChange = useCallback((changes) => {
        setEdges((currentEdges) => {
            const nextEdges = applyEdgeChanges(changes, currentEdges);
            const shouldSnapshot = changes.some(c => c.type === 'remove');
            if (shouldSnapshot) {
                takeSnapshot(nodes, nextEdges);
            }
            return nextEdges;
        });
    }, [nodes, takeSnapshot]);

    const undo = useCallback(() => {
        if (historyIndex <= 0) return;
        const targetIndex = historyIndex - 1;
        const prevState = history[targetIndex];

        const copiedState = createDeepCopy(prevState.nodes, prevState.edges);
        setNodes(copiedState.nodes);
        setEdges(copiedState.edges);
        setHistoryIndex(targetIndex);
        setSelectedNodeId(null);
    }, [historyIndex, history]);

    const redo = useCallback(() => {
        if (historyIndex >= history.length - 1) return;
        const targetIndex = historyIndex + 1;
        const nextState = history[targetIndex];

        const copiedState = createDeepCopy(nextState.nodes, nextState.edges);
        setNodes(copiedState.nodes);
        setEdges(copiedState.edges);
        setHistoryIndex(targetIndex);
    }, [historyIndex, history]);

    // Derived Selection Computation
    const activeNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);

    // Combined field logic keeping snapshots in alignment with text inputs
    const updateActiveNodeField = useCallback((field: keyof WorkflowNodeData, value: string) => {
        if (!selectedNodeId) return;
        setNodes((currentNodes) => {
            const nextNodes = currentNodes.map((node) =>
                node.id === selectedNodeId
                    ? { ...node, data: { ...node.data, [field]: value } }
                    : node
            );
            // Continuous update checks for instant field tracking state parity
            takeSnapshot(nextNodes, edges);
            return nextNodes;
        });
    }, [selectedNodeId, edges, takeSnapshot]);

    const onDeleteNode = useCallback((id: string) => {
        setNodes((currNodes) => {
            const nextNodes = currNodes.filter((n) => n.id !== id);
            setEdges((currEdges) => {
                const nextEdges = currEdges.filter((e) => e.source !== id && e.target !== id);
                takeSnapshot(nextNodes, nextEdges);
                return nextEdges;
            });
            return nextNodes;
        });
        setSelectedNodeId((prev) => (prev === id ? null : prev));
    }, [takeSnapshot]);

    const onConnect = useCallback((params: Connection) => {
        const edgeColor = params.sourceHandle === 'yes' ? '#22c55e' : params.sourceHandle === 'no' ? '#ef4444' : '#94a3b8';
        setEdges((currentEdges) => {
            const nextEdges = addEdge({
                ...params,
                type: 'smoothstep',
                label: params.sourceHandle?.toUpperCase(),
                style: { stroke: edgeColor, strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor }
            }, currentEdges);
            takeSnapshot(nodes, nextEdges);
            return nextEdges;
        });
    }, [nodes, takeSnapshot]);

    const addNodeMobile = (type: WorkflowNodeData['type']) => {
        const newNode: Node<WorkflowNodeData> = {
            id: `node_${Date.now()}`,
            type: 'workflowNode',
            position: { x: 50, y: 50 },
            data: { type, title: type, executionDate: '', description: '', onDelete: onDeleteNode },
        };
        setNodes((currNodes) => {
            const nextNodes = currNodes.concat(newNode);
            takeSnapshot(nextNodes, edges);
            return nextNodes;
        });
    };

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow') as WorkflowNodeData['type'];
        if (!rfInstance || !type) return;

        const position = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const newNode: Node<WorkflowNodeData> = {
            id: `node_${Date.now()}`,
            type: 'workflowNode',
            position,
            data: { type, title: type, executionDate: '', description: '', onDelete: onDeleteNode },
        };

        setNodes((currNodes) => {
            const nextNodes = currNodes.concat(newNode);
            takeSnapshot(nextNodes, edges);
            return nextNodes;
        });
    }, [rfInstance, edges, takeSnapshot]);

    // Custom Data Selection Mapping Pipeline Injection
    const mappedNodes = useMemo(() => {
        return nodes.map((node) => ({
            ...node,
            data: {
                ...node.data,
                selected: node.id === selectedNodeId,
                onDelete: onDeleteNode,
            },
        }));
    }, [nodes, selectedNodeId, onDeleteNode]);

    const onSave = useCallback(() => {
        if (!rfInstance) return;
        const flowData = rfInstance.toObject();
        const logicMap = flowData.edges.map(edge => {
            const source = flowData.nodes.find(n => n.id === edge.source);
            const target = flowData.nodes.find(n => n.id === edge.target);
            return {
                connection: `${source?.data?.title} ➔ ${target?.data?.title}`,
                from_id: edge.source,
                to_id: edge.target,
                via_handle: edge.sourceHandle || 'default',
                metadata: { sourceType: source?.data?.type, targetType: target?.data?.type }
            };
        });
        console.log("--- WORKFLOW EXPORT ---", logicMap, flowData);
        alert(`Exported ${logicMap.length} connections with full metadata.`);
    }, [rfInstance]);

    return (
        <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8fafc] font-sans overflow-hidden">
            <main className="flex-1 flex flex-col relative bg-white order-1 overflow-hidden">

                {/* HEADER */}
                <header className="h-14 md:h-16 border-b bg-[#0f172a] text-white flex items-center justify-between px-4 md:px-8 z-[130] relative flex-shrink-0">
                    <h1 className="font-black tracking-tighter text-sm md:text-lg uppercase">Flow Builder</h1>
                    <div className="flex items-center gap-2">
                        <div className="flex md:hidden gap-1 mr-2">
                            <button type="button" onClick={undo} disabled={historyIndex <= 0} className="p-2 rounded-lg bg-slate-800 border-none disabled:opacity-30 flex items-center active:bg-slate-700"><Undo2 size={16}/></button>
                            <button type="button" onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-lg bg-slate-800 border-none disabled:opacity-30 flex items-center active:bg-slate-700"><Redo2 size={16}/></button>
                        </div>
                        <button type="button" onClick={onSave} className="bg-indigo-600 hover:bg-indigo-500 px-3 md:px-6 py-1.5 md:py-2 rounded-lg font-bold text-xs md:text-sm flex items-center gap-2 transition-colors">
                            <Database size={14} /> <span className="hidden sm:inline">Save</span>
                        </button>
                    </div>
                </header>

                {/* MOBILE PALETTE */}
                <aside className="md:hidden w-full border-b bg-white p-3 flex flex-row gap-2 overflow-x-auto z-[110] relative flex-shrink-0 shadow-sm">
                    {(['Trigger', 'Condition', 'Task'] as const).map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => addNodeMobile(type)}
                            className="flex-shrink-0 px-4 py-2 rounded-xl border-2 bg-slate-50 border-slate-100 font-bold text-[10px] uppercase text-slate-600 flex items-center gap-2 active:bg-indigo-50 active:border-indigo-200"
                        >
                            <Plus size={12}/> {type}
                        </button>
                    ))}
                </aside>

                {/* PROPERTY DRAWER */}
                <div
                    className={`fixed inset-x-0 top-0 bg-white border-b-4 border-indigo-500 shadow-2xl z-[120] transition-transform duration-500 ease-in-out ${activeNode ? 'translate-y-14 md:translate-y-16' : '-translate-y-full'}`}
                    style={{ height: typeof window !== 'undefined' && window.innerWidth < 768 ? 'calc(100% - 3.5rem)' : '280px' }}
                >
                    {activeNode && (
                        <div className="p-6 md:p-8 max-w-6xl mx-auto flex flex-col md:flex-row gap-6 md:gap-12 relative h-full overflow-y-auto pt-10 md:pt-8">
                            <button type="button" onClick={() => setSelectedNodeId(null)} className="absolute right-4 top-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>

                            <div className="flex-1 space-y-4 md:space-y-6">
                                <h2 className="font-black text-slate-800 text-xl uppercase italic">Edit {activeNode.data.type}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Title</label>
                                        <input value={activeNode.data.title || ''} onChange={(e) => updateActiveNodeField('title', e.target.value)} className="w-full border-2 p-2 md:p-3 rounded-xl outline-none focus:border-indigo-400 font-bold text-slate-700 text-sm md:text-base" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Date</label>
                                        <input type="date" value={activeNode.data.executionDate || ''} onChange={(e) => updateActiveNodeField('executionDate', e.target.value)} className="w-full border-2 p-2 md:p-3 rounded-xl outline-none font-bold text-slate-700 text-sm md:text-base" />
                                    </div>
                                </div>
                            </div>
                            <div className="md:w-1/3 space-y-1 pb-10 md:pb-0">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Description</label>
                                <textarea rows={typeof window !== 'undefined' && window.innerWidth < 768 ? 6 : 4} value={activeNode.data.description || ''} onChange={(e) => updateActiveNodeField('description', e.target.value)} className="w-full border-2 p-3 rounded-xl outline-none text-sm font-medium" />
                            </div>
                        </div>
                    )}
                </div>

                {/* FLOW CANVAS */}
                <div className="flex-1 min-h-0 relative z-10">
                    <ReactFlow
                        nodes={mappedNodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setRfInstance}
                        onDrop={onDrop}
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

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex w-72 border-r bg-white p-6 flex-col justify-between shadow-xl z-50 order-first">
                <div className="flex flex-col gap-4">
                    <h2 className="font-black text-slate-800 text-lg uppercase mb-2 tracking-tighter">Nodes</h2>
                    {(['Trigger', 'Condition', 'Task'] as const).map((type) => (
                        <div
                            key={type}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData('application/reactflow', type)}
                            className="cursor-grab p-4 rounded-xl border-2 bg-slate-50 border-slate-100 font-bold text-sm text-slate-600 hover:border-indigo-300 transition-all flex items-center gap-2 select-none"
                        >
                            {type} Node
                        </div>
                    ))}
                </div>

                <div className="flex border-t pt-6 gap-2">
                    <button type="button" onClick={undo} disabled={historyIndex <= 0} className="flex-1 p-3 rounded-xl border-2 border-slate-100 disabled:opacity-20 transition-all flex justify-center hover:bg-slate-50"><Undo2 size={18} /></button>
                    <button type="button" onClick={redo} disabled={historyIndex >= history.length - 1} className="flex-1 p-3 rounded-xl border-2 border-slate-100 disabled:opacity-20 transition-all flex justify-center hover:bg-slate-50"><Redo2 size={18} /></button>
                </div>
            </aside>
        </div>
    );
};

export default Workflows;