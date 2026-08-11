"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Radio, Save } from "lucide-react";
import { BaseNode } from "./nodes/BaseNode";
import { NodePalette } from "./NodePalette";
import { ConfigPanel } from "./ConfigPanel";
import {
  NODE_CATALOG,
  NodeType,
  WorkflowNodeData,
  validateWorkflowDefinition,
} from "@/lib/workflow-types";
import { api, Workflow } from "@/lib/api";

const nodeTypes = {
  llm: BaseNode,
  api: BaseNode,
  database: BaseNode,
  condition: BaseNode,
  rag: BaseNode,
  approval: BaseNode,
  output: BaseNode,
};

function toFlowNodes(definition: Workflow["definition"]): Node[] {
  return (definition.nodes || []).map((n) => {
    const raw = n as {
      id: string;
      type?: string;
      position?: { x: number; y: number };
      data?: WorkflowNodeData;
    };
    const type = (raw.data?.type || raw.type || "llm") as NodeType;
    return {
      id: raw.id,
      type,
      position: raw.position || { x: 0, y: 0 },
      data: {
        label: raw.data?.label || type,
        type,
        config: raw.data?.config || {},
      },
    };
  });
}

function toFlowEdges(definition: Workflow["definition"]): Edge[] {
  return (definition.edges || []).map((e) => {
    const raw = e as {
      id: string;
      source: string;
      target: string;
      sourceHandle?: string | null;
      targetHandle?: string | null;
    };
    return {
      id: raw.id,
      source: raw.source,
      target: raw.target,
      sourceHandle: raw.sourceHandle || undefined,
      targetHandle: raw.targetHandle || undefined,
    };
  });
}

export function WorkflowEditor({
  workflow,
  onSaved,
  runStatuses,
  activeRunId,
  runLiveStatus,
  runConnected,
  onSelectRunNode,
}: {
  workflow: Workflow;
  onSaved: (wf: Workflow) => void;
  runStatuses?: Record<string, string>;
  activeRunId?: string | null;
  runLiveStatus?: string | null;
  runConnected?: boolean;
  onSelectRunNode?: (nodeId: string) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(toFlowNodes(workflow.definition));
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(toFlowEdges(workflow.definition));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);
  const [name, setName] = useState(workflow.name);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!runStatuses) return;
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...(n.data as WorkflowNodeData),
          runStatus: runStatuses[n.id],
        },
      }))
    );
  }, [runStatuses, setNodes]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) || null,
    [nodes, selectedId]
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds: Edge[]) => addEdge({ ...connection, id: `e-${Date.now()}` }, eds)),
    [setEdges]
  );

  const addNode = useCallback(
    (type: NodeType, position?: { x: number; y: number }) => {
      const meta = NODE_CATALOG.find((n) => n.type === type);
      if (!meta) return;
      const id = `${type}-${Date.now()}`;
      const node: Node = {
        id,
        type,
        position: position || { x: 120 + nodes.length * 30, y: 80 + nodes.length * 40 },
        data: {
          label: meta.label,
          type,
          config: { ...meta.defaults },
          justDropped: true,
        },
      };
      setNodes((nds: Node[]) => [...nds, node]);
      setSelectedId(id);
      window.setTimeout(() => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === id
              ? { ...n, data: { ...(n.data as WorkflowNodeData), justDropped: false } }
              : n
          )
        );
      }, 450);
    },
    [nodes.length, setNodes]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/flowpilot-node") as NodeType;
      if (!type || !rf) return;
      const position = rf.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(type, position);
    },
    [addNode, rf]
  );

  const updateNodeData = (nodeId: string, patch: Partial<WorkflowNodeData>) => {
    setNodes((nds: Node[]) =>
      nds.map((n: Node) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...(n.data as WorkflowNodeData),
                ...patch,
                config: patch.config
                  ? { ...(n.data as WorkflowNodeData).config, ...patch.config }
                  : (n.data as WorkflowNodeData).config,
              },
            }
          : n
      )
    );
  };

  const save = async () => {
    const definition = {
      nodes: nodes.map((n) => {
        const data = n.data as WorkflowNodeData;
        return {
          id: n.id,
          type: data.type,
          position: n.position,
          data: {
            label: data.label,
            type: data.type,
            config: data.config,
          },
        };
      }),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    };
    const validationErrors = validateWorkflowDefinition(definition);
    setErrors(validationErrors);
    if (validationErrors.length) {
      setMessage(null);
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.updateWorkflow(workflow.id, {
        name,
        definition,
        status: workflow.status === "draft" ? "active" : workflow.status,
      });
      onSaved(updated);
      setMessage("Workflow saved.");
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Failed to save workflow"]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-brick border-[3px] border-black bg-white shadow-brick">
      <div className="flex flex-wrap items-center gap-3 border-b-[3px] border-black bg-lego-yellow px-4 py-3">
        <input
          className="input-lego min-w-[220px] flex-1 font-bold"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="button" className="btn-primary" onClick={() => void save()} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Snapping..." : "Save bricks"}
        </button>
      </div>
      {activeRunId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-black bg-lego-ink px-4 py-2 text-sm font-semibold text-white">
          <div className="flex flex-wrap items-center gap-3">
            <span className="brick-chip bg-lego-yellow text-lego-ink">Live run</span>
            <span className="inline-flex items-center gap-1 text-xs text-white/80">
              <Radio className={`h-3.5 w-3.5 ${runConnected ? "text-lego-green" : "text-white/40"}`} />
              {runConnected ? "Streaming" : "Connecting…"}
            </span>
            <span className="text-xs uppercase tracking-wide text-white/70">
              {runLiveStatus || "running"}
            </span>
          </div>
          <Link href={`/runs/${activeRunId}`} className="text-xs font-bold uppercase text-lego-yellow hover:underline">
            Open full trace →
          </Link>
        </div>
      ) : null}
      {(errors.length > 0 || message) && (
        <div className="border-b-[3px] border-black px-4 py-2 text-sm font-semibold">
          {message ? <p className="text-lego-green">Brick set saved.</p> : null}
          {errors.length > 0 ? (
            <ul className="list-disc pl-5 text-lego-red">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <NodePalette onAdd={addNode} />
        <div
          className="relative min-w-0 flex-1 lego-studs"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRf}
            nodeTypes={nodeTypes}
            onSelectionChange={({ nodes: selected }: { nodes: Node[] }) => {
              const id = selected[0]?.id || null;
              setSelectedId(id);
              if (id && onSelectRunNode && runStatuses?.[id]) onSelectRunNode(id);
            }}
            fitView
          >
            <Background gap={28} size={2} color="#cfcfcf" />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </div>
        <ConfigPanel
          node={selectedNode}
          onChange={updateNodeData}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}
