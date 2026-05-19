"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Edit, Play, Pause, Loader2, Eye, Clock, CheckCircle2, XCircle, Minus } from "lucide-react"
import Link from "next/link"
import { automationsApi, executionsApi } from "@/lib/api/automation"
import { showToast } from "@/lib/showToast"
import type {
  Automation,
  AutomationExecution,
  ExecutionLog,
  AutomationVersionSummary,
} from "@/lib/types/workflow"

export default function WorkflowDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workflowId = params.id as string

  const [workflow, setWorkflow] = React.useState<Automation | null>(null)
  const [executions, setExecutions] = React.useState<AutomationExecution[]>([])
  const [loading, setLoading] = React.useState(true)
  const [processingId, setProcessingId] = React.useState<string | null>(null)
  const [selectedExecution, setSelectedExecution] = React.useState<AutomationExecution | null>(null)
  const [executionLogs, setExecutionLogs] = React.useState<ExecutionLog[]>([])
  const [logsDialogOpen, setLogsDialogOpen] = React.useState(false)
  const [versions, setVersions] = React.useState<AutomationVersionSummary[]>([])
  const [restoringVersion, setRestoringVersion] = React.useState<number | null>(null)

  // Fetch workflow and executions
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [workflowData, executionsData, versionsData] = await Promise.all([
        automationsApi.get(workflowId),
        executionsApi.list(workflowId),
        automationsApi.listVersions(workflowId).catch(() => [] as AutomationVersionSummary[]),
      ])
      setWorkflow(workflowData)
      setExecutions(executionsData)
      setVersions(versionsData)
    } catch (error: any) {
      console.error("Error fetching workflow:", error)
      showToast("Failed to load workflow", "error")
      router.push("/workflows")
    } finally {
      setLoading(false)
    }
  }, [workflowId, router])

  React.useEffect(() => {
   
    if (workflowId) {
      fetchData()
    }
  }, [workflowId, fetchData])

  // Handle activate/pause
  const handleToggleStatus = async () => {
    if (!workflow) return

    try {
      setProcessingId(workflow.id)
      if (workflow.is_active) {
        await automationsApi.pause(workflow.id)
        showToast("Workflow paused", "success")
      } else {
        await automationsApi.activate(workflow.id)
        showToast("Workflow activated", "success")
      }
      await fetchData()
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Failed to update workflow", "error")
    } finally {
      setProcessingId(null)
    }
  }

  // Handle view execution logs
  const handleViewLogs = async (execution: AutomationExecution) => {
    try {
      setSelectedExecution(execution)
      const logs = await executionsApi.getLogs(execution.id)
      setExecutionLogs(logs)
      setLogsDialogOpen(true)
    } catch (error: any) {
      showToast("Failed to load execution logs", "error")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      running: { variant: "default", label: "Running" },
      completed: { variant: "default", label: "Completed" },
      stopped: { variant: "secondary", label: "Stopped" },
      failed: { variant: "destructive", label: "Failed" },
    }

    const config = variants[status] || { variant: "secondary" as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getLogStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "skipped":
        return <Minus className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  if (!workflow) {
    return null
  }

  const sortedSteps = (workflow.steps || []).sort((a, b) => a.order - b.order)

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/workflows">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{workflow.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Trigger: {workflow.trigger_event}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleToggleStatus}
              disabled={processingId === workflow.id}
              className="gap-2"
            >
              {workflow.is_active ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
            <Link href={`/workflows/${workflow.id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Workflow Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={workflow.is_active ? "default" : "secondary"}>
                {workflow.is_active ? "Active" : "Paused"}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{sortedSteps.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{executions.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Steps Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Steps</CardTitle>
            <CardDescription>Execution order and configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-muted/50"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex-shrink-0">
                    {step.order + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{step.type}</Badge>
                      {step.type === "condition" && "condition_type" in step.config && (
                        <span className="text-sm text-muted-foreground">
                          {step.config.condition_type}
                        </span>
                      )}
                      {step.type === "action" && "action_type" in step.config && (
                        <span className="text-sm text-muted-foreground">
                          {step.config.action_type}
                        </span>
                      )}
                      {step.type === "delay" && "seconds" in step.config && (
                        <span className="text-sm text-muted-foreground">
                          Wait {step.config.seconds} seconds
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Versions */}
        <Card>
          <CardHeader>
            <CardTitle>Versions</CardTitle>
            <CardDescription>
              Each save creates a snapshot. Restore to roll back to a prior config.
              {workflow.version != null && (
                <> Currently on <strong>v{workflow.version}</strong>.</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {versions.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">No version history yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Version</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead className="w-20">Steps</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Saved at</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">v{v.version}</span>
                          {v.is_current && <Badge>current</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{v.name}</TableCell>
                      <TableCell className="text-sm">{v.trigger_event}</TableCell>
                      <TableCell className="text-sm">{v.step_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {v.note || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {v.created_at ? formatDate(v.created_at) : "-"}
                      </TableCell>
                      <TableCell>
                        {v.is_current ? (
                          <span className="text-xs text-muted-foreground">live</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={restoringVersion === v.version}
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  `Restore this workflow to v${v.version}? Current state will be archived as a new version.`
                                )
                              ) {
                                return
                              }
                              try {
                                setRestoringVersion(v.version)
                                await automationsApi.restoreVersion(workflowId, v.version)
                                showToast(`Restored to v${v.version}`, "success")
                                await fetchData()
                              } catch (err: any) {
                                showToast(
                                  err.response?.data?.detail || "Restore failed",
                                  "error"
                                )
                              } finally {
                                setRestoringVersion(null)
                              }
                            }}
                          >
                            {restoringVersion === v.version ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Restore"
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Execution History */}
        <Card>
          <CardHeader>
            <CardTitle>Execution History</CardTitle>
            <CardDescription>Recent workflow executions</CardDescription>
          </CardHeader>
          <CardContent>
            {executions.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">No executions yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Step</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead>Finished At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell className="font-mono text-sm">{execution.entity_id}</TableCell>
                      <TableCell>{getStatusBadge(execution.status)}</TableCell>
                      <TableCell>{execution.current_step + 1}</TableCell>
                      <TableCell>{formatDate(execution.started_at)}</TableCell>
                      <TableCell>
                        {execution.finished_at ? formatDate(execution.finished_at) : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewLogs(execution)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Logs
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Execution Logs Dialog */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Execution Logs</DialogTitle>
            <DialogDescription>
              Step-by-step execution details for lead: {selectedExecution?.entity_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {executionLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No logs available</p>
            ) : (
              executionLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50"
                >
                  <div className="mt-0.5">{getLogStatusIcon(log.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Step {log.step_order + 1}</Badge>
                      <Badge
                        variant={
                          log.status === "success"
                            ? "default"
                            : log.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {log.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    {log.message && (
                      <p className="text-sm text-muted-foreground">{log.message}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
