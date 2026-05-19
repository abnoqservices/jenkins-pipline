"use client"

import * as React from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { GitBranch, Zap, Clock, Play, Wand2, Repeat } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AutomationStep, StepType } from "@/lib/types/workflow"

function stepSubtitle(step: AutomationStep): string {
  if (step.type === "condition") {
    const t = (step.config as { condition_type?: string }).condition_type
    return t?.replace(/_/g, " ") ?? "Condition"
  }
  if (step.type === "action") {
    const t = (step.config as { action_type?: string }).action_type
    return t?.replace(/_/g, " ") ?? "Action"
  }
  if (step.type === "transform") {
    const ops = (step.config as { operations?: Array<{ op?: string; var?: string }> }).operations ?? []
    if (!ops.length) return "Transform (empty)"
    return `Transform · ${ops.length} op${ops.length === 1 ? "" : "s"}`
  }
  if (step.type === "loop") {
    const over = (step.config as { over?: string }).over
    return over ? `For each in ${over}` : "Loop"
  }
  const sec = (step.config as { seconds?: number }).seconds ?? 0
  if (sec >= 86400) return `Wait ${sec / 86400}d`
  if (sec >= 3600) return `Wait ${sec / 3600}h`
  if (sec >= 60) return `Wait ${sec / 60}m`
  return `Wait ${sec}s`
}

const typeAccent: Record<StepType, string> = {
  condition: "border-blue-500/60 bg-blue-500/5",
  action: "border-violet-500/60 bg-violet-500/5",
  delay: "border-amber-500/60 bg-amber-500/5",
  transform: "border-cyan-500/60 bg-cyan-500/5",
  loop: "border-pink-500/60 bg-pink-500/5",
}

const typeIcon: Record<StepType, React.ReactNode> = {
  condition: <GitBranch className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
  action: <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />,
  delay: <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
  transform: <Wand2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />,
  loop: <Repeat className="h-4 w-4 text-pink-600 dark:text-pink-400" />,
}

export type TriggerNodeData = { label: string }

export function TriggerFlowNode({ data }: NodeProps) {
  const { label } = data as TriggerNodeData
  return (
    <div
      className={cn(
        "rounded-lg border-2 border-emerald-500/70 bg-emerald-500/10 px-4 py-3 shadow-sm min-w-[200px]",
        "text-left"
      )}
    >
      <div className="flex items-center gap-2">
        <Play className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trigger</p>
          <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-emerald-500 !border-background !size-2.5"
        isConnectable={false}
      />
    </div>
  )
}

export type WorkflowStepNodeData = {
  step: AutomationStep
  index: number
  selected: boolean
  onSelect: () => void
}

export function WorkflowStepFlowNode({ data, selected }: NodeProps) {
  const { step, index, onSelect, selected: dataSelected } = data as WorkflowStepNodeData
  const isSel = selected || dataSelected

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      className={cn(
        "rounded-lg border-2 px-3 py-2.5 shadow-sm min-w-[220px] text-left transition-shadow outline-none",
        typeAccent[step.type],
        isSel && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground !border-background !size-2.5"
        isConnectable={false}
      />
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{typeIcon[step.type]}</span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            Step {index + 1} · {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
          </p>
          <p className="text-sm font-semibold text-foreground truncate">{stepSubtitle(step)}</p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground !border-background !size-2.5"
        isConnectable={false}
      />
    </button>
  )
}

export const workflowFlowNodeTypes = {
  trigger: TriggerFlowNode,
  workflowStep: WorkflowStepFlowNode,
}
