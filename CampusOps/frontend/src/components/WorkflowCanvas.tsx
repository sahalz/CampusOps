import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react'
import {
  Bell,
  Bot,
  CheckCircle2,
  Database,
  GitBranch,
  Handshake,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import clsx from 'clsx'
import type { WorkflowStep, WorkflowStepKind, WorkflowStepStatus, WorkflowTemplate } from '../types'
import '@xyflow/react/dist/style.css'

type CampusNodeData = {
  kind: WorkflowStepKind
  label: string
  description: string
  status: WorkflowStepStatus
}

type CampusNode = Node<CampusNodeData, 'campusNode'>

const stepIcons = {
  intake: Bot,
  rag: Database,
  policy: ShieldCheck,
  approval: Handshake,
  tool: Wrench,
  notify: Bell,
  complete: CheckCircle2,
} satisfies Record<WorkflowStepKind, typeof Bot>

const stepLabels: Record<WorkflowStepKind, string> = {
  intake: 'AI intake',
  rag: 'RAG lookup',
  policy: 'Policy guard',
  approval: 'Human approval',
  tool: 'System tool',
  notify: 'Notification',
  complete: 'Close case',
}

const stepDescriptions: Record<WorkflowStepKind, string> = {
  intake: 'Classify request and extract fields.',
  rag: 'Retrieve approved campus knowledge.',
  policy: 'Check safety, privacy, and authority.',
  approval: 'Pause for authorized review.',
  tool: 'Run a controlled internal action.',
  notify: 'Send a tracked message.',
  complete: 'Record final status and proof.',
}

const statusByKind: Record<WorkflowStepKind, WorkflowStepStatus> = {
  intake: 'automated',
  rag: 'automated',
  policy: 'guarded',
  approval: 'human',
  tool: 'guarded',
  notify: 'automated',
  complete: 'ready',
}

const paletteSteps: WorkflowStepKind[] = ['intake', 'rag', 'policy', 'approval', 'tool', 'notify', 'complete']

const toNodes = (template: WorkflowTemplate): CampusNode[] =>
  template.steps.map((step, index) => ({
    id: step.id,
    type: 'campusNode',
    position: {
      x: 24 + index * 238,
      y: index % 2 === 0 ? 32 : 182,
    },
    data: {
      kind: step.kind,
      label: step.label,
      description: step.description,
      status: step.status,
    },
  }))

const toEdges = (steps: WorkflowStep[]): Edge[] =>
  steps.slice(0, -1).map((step, index) => ({
    id: `${step.id}-${steps[index + 1].id}`,
    source: step.id,
    target: steps[index + 1].id,
    type: 'smoothstep',
    animated: index === 0,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
    },
  }))

function WorkflowNode({ data, selected }: NodeProps<CampusNode>) {
  const Icon = stepIcons[data.kind]

  return (
    <div className={clsx('workflow-node', `workflow-node--${data.status}`, selected && 'is-selected')}>
      <Handle type="target" position={Position.Left} />
      <div className="workflow-node__top">
        <span className="workflow-node__icon">
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <span className="workflow-node__status">{data.status}</span>
      </div>
      <strong>{data.label}</strong>
      <p>{data.description}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = {
  campusNode: WorkflowNode,
} satisfies NodeTypes

type WorkflowCanvasProps = {
  activeWorkflow: WorkflowTemplate
  templates: WorkflowTemplate[]
  onTemplateChange: (workflowId: string) => void
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  )
}

function WorkflowCanvasInner({ activeWorkflow, templates, onTemplateChange }: WorkflowCanvasProps) {
  const { screenToFlowPosition } = useReactFlow()
  const [nodes, setNodes] = useState<CampusNode[]>(() => toNodes(activeWorkflow))
  const [edges, setEdges] = useState<Edge[]>(() => toEdges(activeWorkflow.steps))

  useEffect(() => {
    setNodes(toNodes(activeWorkflow))
    setEdges(toEdges(activeWorkflow.steps))
  }, [activeWorkflow])

  const onNodesChange = useCallback((changes: NodeChange<CampusNode>[]) => {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes))
  }, [])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges))
  }, [])

  const onConnect = useCallback((connection: Connection) => {
    setEdges((currentEdges) =>
      addEdge(
        {
          ...connection,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 18,
            height: 18,
          },
        },
        currentEdges,
      ),
    )
  }, [])

  const addNode = useCallback(
    (kind: WorkflowStepKind, position = { x: 130 + nodes.length * 34, y: 94 + nodes.length * 18 }) => {
      const id = `${kind}-${Date.now()}`
      setNodes((currentNodes) => [
        ...currentNodes,
        {
          id,
          type: 'campusNode',
          position,
          data: {
            kind,
            label: stepLabels[kind],
            description: stepDescriptions[kind],
            status: statusByKind[kind],
          },
        },
      ])
    },
    [nodes.length],
  )

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const kind = event.dataTransfer.getData('application/campusops-step') as WorkflowStepKind

      if (!paletteSteps.includes(kind)) {
        return
      }

      addNode(
        kind,
        screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      )
    },
    [addNode, screenToFlowPosition],
  )

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const minimapColor = useCallback((node: Node) => {
    const status = (node.data as CampusNodeData).status
    if (status === 'human') {
      return '#f59e0b'
    }
    if (status === 'guarded') {
      return '#2563eb'
    }
    if (status === 'automated') {
      return '#10b981'
    }
    return '#64748b'
  }, [])

  const workflowHealth = useMemo(() => {
    const guarded = activeWorkflow.steps.filter((step) => step.status === 'guarded').length
    const human = activeWorkflow.steps.filter((step) => step.status === 'human').length
    return `${activeWorkflow.steps.length} steps / ${guarded} guards / ${human} approvals`
  }, [activeWorkflow])

  return (
    <div className="workflow-builder">
      <div className="workflow-builder__toolbar">
        <div className="workflow-builder__title">
          <span className="tool-icon">
            <GitBranch size={16} />
          </span>
          <div>
            <strong>{activeWorkflow.title}</strong>
            <span>{workflowHealth}</span>
          </div>
        </div>
        <select
          aria-label="Workflow template"
          value={activeWorkflow.id}
          onChange={(event) => onTemplateChange(event.target.value)}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title}
            </option>
          ))}
        </select>
      </div>

      <div className="workflow-builder__body">
        <div className="step-palette" aria-label="Workflow step palette">
          {paletteSteps.map((kind) => {
            const Icon = stepIcons[kind]
            return (
              <button
                key={kind}
                type="button"
                draggable
                className="palette-step"
                onClick={() => addNode(kind)}
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/campusops-step', kind)
                  event.dataTransfer.effectAllowed = 'move'
                }}
              >
                <Icon size={15} />
                <span>{stepLabels[kind]}</span>
              </button>
            )
          })}
        </div>

        <div className="workflow-canvas" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            minZoom={0.45}
            maxZoom={1.35}
          >
            <Background color="#cbd5e1" gap={22} size={1} />
            <MiniMap nodeColor={minimapColor} pannable zoomable />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
