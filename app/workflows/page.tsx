"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Play, Pause, Edit, Copy, Trash2, MoreVertical, Loader2, Eye } from 'lucide-react'
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { automationsApi } from "@/lib/api/automation"
import { showToast } from "@/lib/showToast"
import type { Automation } from "@/lib/types/workflow"

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = React.useState<Automation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [workflowToDelete, setWorkflowToDelete] = React.useState<Automation | null>(null)
  const [processingId, setProcessingId] = React.useState<string | null>(null)

  // Fetch workflows
  const fetchWorkflows = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await automationsApi.list()
      setWorkflows(data)
    } catch (error: any) {
      console.error("Error fetching workflows:", error)
      showToast("Failed to load workflows", "error")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  // Handle activate/pause
  const handleToggleStatus = async (workflow: Automation) => {
    try {
      setProcessingId(workflow.id)
      if (workflow.is_active) {
        await automationsApi.pause(workflow.id)
        showToast("Workflow paused", "success")
      } else {
        await automationsApi.activate(workflow.id)
        showToast("Workflow activated", "success")
      }
      await fetchWorkflows()
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Failed to update workflow", "error")
    } finally {
      setProcessingId(null)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!workflowToDelete) return

    try {
      setProcessingId(workflowToDelete.id)
      await automationsApi.delete(workflowToDelete.id)
      showToast("Workflow deleted", "success")
      setDeleteDialogOpen(false)
      setWorkflowToDelete(null)
      await fetchWorkflows()
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Failed to delete workflow", "error")
    } finally {
      setProcessingId(null)
    }
  }

  // Handle duplicate (UI only - creates a copy with "- Copy" suffix)
  const handleDuplicate = async (workflow: Automation) => {
    try {
      setProcessingId(workflow.id)
      const duplicatePayload = {
        name: `${workflow.name} - Copy`,
        trigger_event: workflow.trigger_event,
        steps: (workflow.steps || []).map((step) => ({
          order: step.order,
          type: step.type,
          config: step.config,
        })),
      }
      await automationsApi.create(duplicatePayload)
      showToast("Workflow duplicated", "success")
      await fetchWorkflows()
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Failed to duplicate workflow", "error")
    } finally {
      setProcessingId(null)
    }
  }

  // Group workflows by status
  const groupedWorkflows = React.useMemo(() => {
    const active: Automation[] = []
    const paused: Automation[] = []

    workflows.forEach((workflow) => {
      if (workflow.is_active) {
        active.push(workflow)
      } else {
        paused.push(workflow)
      }
    })

    return { active, paused }
  }, [workflows])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Workflow Automation</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Automate your customer engagement workflows
            </p>
          </div>
          <Link href="/workflows/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Workflow
            </Button>
          </Link>
        </div>

        {/* Workflows Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Workflows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Active</h3>
                <Badge variant="secondary" className="text-xs">
                  {groupedWorkflows.active.length}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {groupedWorkflows.active.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  processingId={processingId}
                  onToggleStatus={handleToggleStatus}
                  onDuplicate={handleDuplicate}
                  onDelete={() => {
                    setWorkflowToDelete(workflow)
                    setDeleteDialogOpen(true)
                  }}
                />
              ))}

              {groupedWorkflows.active.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                  <p className="text-sm text-muted-foreground">No active workflows</p>
                </div>
              )}
            </div>
          </div>

          {/* Paused Workflows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Paused</h3>
                <Badge variant="secondary" className="text-xs">
                  {groupedWorkflows.paused.length}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {groupedWorkflows.paused.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  processingId={processingId}
                  onToggleStatus={handleToggleStatus}
                  onDuplicate={handleDuplicate}
                  onDelete={() => {
                    setWorkflowToDelete(workflow)
                    setDeleteDialogOpen(true)
                  }}
                />
              ))}

              {groupedWorkflows.paused.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                  <p className="text-sm text-muted-foreground">No paused workflows</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{workflowToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

interface WorkflowCardProps {
  workflow: Automation
  processingId: string | null
  onToggleStatus: (workflow: Automation) => void
  onDuplicate: (workflow: Automation) => void
  onDelete: () => void
}

function WorkflowCard({ workflow, processingId, onToggleStatus, onDuplicate, onDelete }: WorkflowCardProps) {
  const isProcessing = processingId === workflow.id

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium leading-tight">
            <Link href={`/workflows/${workflow.id}`} className="hover:text-primary">
              {workflow.name}
            </Link>
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isProcessing}>
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/workflows/${workflow.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
              </Link>
              <Link href={`/workflows/${workflow.id}/edit`}>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                onClick={() => onDuplicate(workflow)}
                disabled={isProcessing}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleStatus(workflow)}
                disabled={isProcessing}
              >
                {workflow.is_active ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={onDelete}
                disabled={isProcessing}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="text-xs">
          Trigger: {workflow.trigger_event}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {workflow.steps?.length || 0} steps
          </span>
          <Badge variant={workflow.is_active ? "default" : "secondary"} className="text-xs">
            {workflow.is_active ? "Active" : "Paused"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
