"use client"

import * as React from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { GitBranch, Zap, Clock, Plus, Wand2, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { AutomationStep, StepType } from "@/lib/types/workflow"
import { StepEditor } from "@/components/workflows/StepEditor"
import { workflowFlowNodeTypes } from "@/components/workflows/workflowFlowNodes"

const DND_TYPE = "application/workflow-step"

function defaultStepForType(type: StepType): AutomationStep {
  if (type === "condition") {
    return { order: 0, type: "condition", config: { condition_type: "email_exists" } }
  }
  if (type === "action") {
    return { order: 0, type: "action", config: { action_type: "send_email" } }
  }
  if (type === "transform") {
    return { order: 0, type: "transform", config: { operations: [] } }
  }
  if (type === "loop") {
    return { order: 0, type: "loop", config: { over: "data.form_fields.items", end_step: 0, iterator_var: "item" } }
  }
  return { order: 0, type: "delay", config: { seconds: 3600 } }
}

function buildEdges(nodeIds: string[]): Edge[] {
  const edges: Edge[] = []
  if (nodeIds.length > 0 && nodeIds[0]) {
    edges.push({
      id: "e-trigger-first",
      source: "trigger",
      target: nodeIds[0]!,
      animated: true,
      style: { stroke: "var(--muted-foreground)", strokeWidth: 2 },
    })
  }
  for (let i = 0; i < nodeIds.length - 1; i++) {
    const a = nodeIds[i]!
    const b = nodeIds[i + 1]!
    edges.push({
      id: `e-${a}-${b}`,
      source: a,
      target: b,
      animated: true,
      style: { stroke: "var(--muted-foreground)", strokeWidth: 2 },
    })
  }
  return edges
}

type FlowCanvasProps = {
  steps: AutomationStep[]
  onStepsChange: (next: AutomationStep[]) => void
  nodeIds: string[]
  setNodeIds: React.Dispatch<React.SetStateAction<string[]>>
  triggerLabel: string
  triggerEvent: string
}

function WorkflowFlowCanvas({
  steps,
  onStepsChange,
  nodeIds,
  setNodeIds,
  triggerLabel,
  triggerEvent,
}: FlowCanvasProps) {
  const { screenToFlowPosition, getNodes } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedStepIndex, setSelectedStepIndex] = React.useState<number | null>(null)
  const [dropPositions, setDropPositions] = React.useState<Record<string, { x: number; y: number }>>({})

  const selectStepRef = React.useRef<(i: number) => void>(() => {})
  selectStepRef.current = (i: number) => setSelectedStepIndex(i)

  React.useLayoutEffect(() => {
    setNodes((prev) => {
      const posMap = new Map(prev.map((n) => [n.id, n.position]))
      const nextNodes: Node[] = [
        {
          id: "trigger",
          type: "trigger",
          position: { x: 220, y: 0 },
          data: { label: triggerLabel },
          draggable: false,
          selectable: false,
        },
      ]
      steps.forEach((step, i) => {
        const id = nodeIds[i]
        if (!id) return
        const defaultPos = { x: 200, y: 110 + i * 130 }
        const position = posMap.get(id) ?? dropPositions[id] ?? defaultPos
        nextNodes.push({
          id,
          type: "workflowStep",
          position,
          data: {
            step,
            index: i,
            selected: selectedStepIndex === i,
            onSelect: () => selectStepRef.current(i),
          },
          draggable: true,
        })
      })
      return nextNodes
    })
  }, [steps, nodeIds, triggerLabel, selectedStepIndex, dropPositions, setNodes])

  React.useLayoutEffect(() => {
    setEdges(buildEdges(nodeIds))
  }, [nodeIds, setEdges])

  const onNodeDragStop = React.useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type !== "workflowStep") return
      const all = getNodes().filter((n) => n.type === "workflowStep")
      if (all.length <= 1) return
      const sorted = [...all].sort(
        (a, b) => a.position.y - b.position.y || a.position.x - b.position.x
      )
      const newIds = sorted.map((n) => n.id)
      const newSteps = sorted
        .map((n) => {
          const oldIdx = nodeIds.indexOf(n.id)
          return steps[oldIdx]!
        })
        .map((s, i) => ({ ...s, order: i }))
      setNodeIds(newIds)
      onStepsChange(newSteps)
    },
    [getNodes, nodeIds, steps, onStepsChange, setNodeIds]
  )

  const onDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData(DND_TYPE) as StepType | ""
      if (raw !== "condition" && raw !== "action" && raw !== "delay" && raw !== "transform" && raw !== "loop") return
      const position = screenToFlowPosition({
        clientX: e.clientX,
        clientY: e.clientY,
      })
      const newId = crypto.randomUUID()
      const newStep = { ...defaultStepForType(raw), order: steps.length }
      setDropPositions((p) => ({ ...p, [newId]: position }))
      setNodeIds((prev) => [...prev, newId])
      onStepsChange([...steps, newStep])
    },
    [screenToFlowPosition, steps, onStepsChange, setNodeIds]
  )

  const addStep = React.useCallback(
    (type: StepType) => {
      const newId = crypto.randomUUID()
      const newStep = { ...defaultStepForType(type), order: steps.length }
      const y = 110 + steps.length * 130
      setDropPositions((p) => ({ ...p, [newId]: { x: 200, y } }))
      setNodeIds((prev) => [...prev, newId])
      onStepsChange([...steps, newStep])
    },
    [steps, onStepsChange, setNodeIds]
  )

  const deleteStep = React.useCallback(
    (index: number) => {
      const id = nodeIds[index]
      const newSteps = steps
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, order: i }))
      setNodeIds((prev) => prev.filter((_, i) => i !== index))
      if (id) {
        setDropPositions((p) => {
          const next = { ...p }
          delete next[id]
          return next
        })
      }
      onStepsChange(newSteps)
      setSelectedStepIndex((cur) => {
        if (cur === null) return null
        if (cur === index) return null
        if (cur > index) return cur - 1
        return cur
      })
    },
    [steps, nodeIds, onStepsChange, setNodeIds]
  )

  const updateStep = React.useCallback(
    (index: number, step: AutomationStep) => {
      const next = [...steps]
      next[index] = { ...step, order: index }
      onStepsChange(next)
    },
    [steps, onStepsChange]
  )

  const selectedStep =
    selectedStepIndex !== null ? steps[selectedStepIndex] ?? null : null

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[560px]">
      <aside className="w-full lg:w-52 shrink-0 space-y-3 rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Nodes
        </p>
        <p className="text-xs text-muted-foreground leading-snug">
          Drag onto the canvas or use the buttons below.
        </p>
        <PaletteItem
          type="condition"
          label="Condition"
          icon={<GitBranch className="h-4 w-4" />}
          accent="border-blue-500/50 bg-blue-500/10"
        />
        <PaletteItem
          type="action"
          label="Action"
          icon={<Zap className="h-4 w-4" />}
          accent="border-violet-500/50 bg-violet-500/10"
        />
        <PaletteItem
          type="delay"
          label="Delay"
          icon={<Clock className="h-4 w-4" />}
          accent="border-amber-500/50 bg-amber-500/10"
        />
        <PaletteItem
          type="transform"
          label="Transform"
          icon={<Wand2 className="h-4 w-4" />}
          accent="border-cyan-500/50 bg-cyan-500/10"
        />
        <PaletteItem
          type="loop"
          label="Loop"
          icon={<Repeat className="h-4 w-4" />}
          accent="border-pink-500/50 bg-pink-500/10"
        />
        <div className="pt-2 space-y-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => addStep("condition")}
          >
            <Plus className="h-3.5 w-3.5" />
            Add condition
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => addStep("action")}
          >
            <Plus className="h-3.5 w-3.5" />
            Add action
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => addStep("delay")}
          >
            <Plus className="h-3.5 w-3.5" />
            Add delay
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => addStep("transform")}
          >
            <Plus className="h-3.5 w-3.5" />
            Add transform
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => addStep("loop")}
          >
            <Plus className="h-3.5 w-3.5" />
            Add loop
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-h-[480px] rounded-lg border border-border bg-card overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={workflowFlowNodeTypes}
          onNodeDragStop={onNodeDragStop}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onPaneClick={() => setSelectedStepIndex(null)}
          nodesConnectable={false}
          elementsSelectable
          onInit={(instance) => {
            instance.fitView({ padding: 0.2, duration: 200 })
          }}
          minZoom={0.4}
          maxZoom={1.25}
          proOptions={{ hideAttribution: true }}
          className="bg-muted/20"
        >
          <Background gap={16} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <Sheet
        open={selectedStepIndex !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedStepIndex(null)
        }}
      >
        <SheetContent className="w-full sm:max-w-md p-0 gap-0 overflow-y-auto">
          {/* Visually-hidden title for a11y — the embedded StepEditor renders its own themed header. */}
          <SheetHeader className="sr-only">
            <SheetTitle>Edit step</SheetTitle>
            <SheetDescription>
              Configure this block. Execution order follows vertical position.
            </SheetDescription>
          </SheetHeader>
          {selectedStep !== null && selectedStepIndex !== null ? (
            <StepEditor
              step={selectedStep}
              index={selectedStepIndex}
              allSteps={steps}
              triggerEvent={triggerEvent}
              embedded
              onUpdate={(s) => updateStep(selectedStepIndex, s)}
              onDelete={() => deleteStep(selectedStepIndex)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function PaletteItem({
  type,
  label,
  icon,
  accent,
}: {
  type: StepType
  label: string
  icon: React.ReactNode
  accent: string
}) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DND_TYPE, type)
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        "flex cursor-grab items-center gap-2 rounded-md border-2 px-3 py-2.5 text-sm font-medium active:cursor-grabbing",
        accent
      )}
    >
      {icon}
      {label}
    </div>
  )
}

type WorkflowFlowBuilderProps = {
  steps: AutomationStep[]
  onStepsChange: (next: AutomationStep[]) => void
  /** Label for the trigger node (e.g. selected trigger event). */
  triggerLabel: string
  /** Selected trigger event value (e.g. lead.form_submitted). */
  triggerEvent: string
}

export function WorkflowFlowBuilder({
  steps,
  onStepsChange,
  triggerLabel,
  triggerEvent,
}: WorkflowFlowBuilderProps) {
  const [nodeIds, setNodeIds] = React.useState<string[]>(() =>
    steps.map((s) => s.id?.toString() ?? crypto.randomUUID())
  )

  React.useLayoutEffect(() => {
    setNodeIds((prev) => {
      if (prev.length === steps.length) return prev
      return steps.map((s, i) => s.id?.toString() ?? prev[i] ?? crypto.randomUUID())
    })
  }, [steps])

  return (
    <ReactFlowProvider>
      <WorkflowFlowCanvas
        steps={steps}
        onStepsChange={onStepsChange}
        nodeIds={nodeIds}
        setNodeIds={setNodeIds}
        triggerLabel={triggerLabel}
        triggerEvent={triggerEvent}
      />
    </ReactFlowProvider>
  )
}
