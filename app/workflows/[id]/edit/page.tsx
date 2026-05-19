"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { WorkflowFlowBuilder } from "@/components/workflows/WorkflowFlowBuilder"
import { automationsApi } from "@/lib/api/automation"
import { showToast } from "@/lib/showToast"
import type { AutomationStep } from "@/lib/types/workflow"

// Available trigger events (from Laravel backend)
const TRIGGER_EVENTS = [
  { value: "lead.form_submitted", label: "Lead Form Submitted" },
  { value: "lead.created", label: "New Lead Created" },
  { value: "qr.scanned", label: "QR Code Scanned" },
  { value: "event.attended", label: "Event Attended" },
  { value: "schedule", label: "Schedule (cron)" },
]

const SCHEDULE_PRESETS: Array<{ value: string; label: string }> = [
  { value: "*/5 * * * *", label: "Every 5 minutes" },
  { value: "0 * * * *", label: "Every hour (top of hour)" },
  { value: "0 9 * * *", label: "Daily at 09:00" },
  { value: "0 9 * * 1", label: "Weekly — Monday 09:00" },
  { value: "0 9 1 * *", label: "Monthly — 1st at 09:00" },
]

export default function EditWorkflowPage() {
  const router = useRouter()
  const params = useParams()
  const workflowId = params.id as string

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState("")
  const [triggerEvent, setTriggerEvent] = React.useState("")
  const [scheduleCron, setScheduleCron] = React.useState("")
  const [scheduleTimezone, setScheduleTimezone] = React.useState("")
  const [steps, setSteps] = React.useState<AutomationStep[]>([])

  // Fetch workflow data
  React.useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        setLoading(true)
        const workflow = await automationsApi.get(workflowId)
        setName(workflow.name)
        setTriggerEvent(workflow.trigger_event)
        setScheduleCron(workflow.schedule_cron || "")
        setScheduleTimezone(
          workflow.schedule_timezone ||
            (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC")
        )
        setSteps(
          (workflow.steps || []).sort((a, b) => a.order - b.order)
        )
      } catch (error: any) {
        console.error("Error fetching workflow:", error)
        showToast("Failed to load workflow", "error")
        router.push("/workflows")
      } finally {
        setLoading(false)
      }
    }

    if (workflowId) {
      fetchWorkflow()
    }
  }, [workflowId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showToast("Workflow name is required", "error")
      return
    }

    if (!triggerEvent) {
      showToast("Trigger event is required", "error")
      return
    }

    if (steps.length === 0) {
      showToast("At least one step is required", "error")
      return
    }

    const isSchedule = triggerEvent === "schedule"
    if (isSchedule && !scheduleCron.trim()) {
      showToast("Cron expression is required for scheduled workflows", "error")
      return
    }

    try {
      setSaving(true)
      await automationsApi.update(workflowId, {
        name: name.trim(),
        trigger_event: triggerEvent,
        steps: steps.map((step) => ({
          order: step.order,
          type: step.type,
          config: step.config,
        })),
        schedule_cron: isSchedule ? scheduleCron.trim() : "",
        schedule_timezone: isSchedule ? scheduleTimezone.trim() : "",
      })
      showToast("Workflow updated successfully", "success")
      router.push("/workflows")
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Failed to update workflow",
        "error"
      )
    } finally {
      setSaving(false)
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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/workflows">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Workflow</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Update your workflow configuration
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/workflows">
              <Button variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Name and configure your workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Welcome Sequence"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger Event</Label>
                <Select value={triggerEvent} onValueChange={setTriggerEvent} required>
                  <SelectTrigger id="trigger">
                    <SelectValue placeholder="Select a trigger event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_EVENTS.map((trigger) => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        {trigger.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This event will trigger the workflow execution
                </p>
              </div>

              {triggerEvent === "schedule" && (
                <div className="space-y-3 rounded border p-3 bg-muted/20">
                  <div className="space-y-2">
                    <Label>Cron expression</Label>
                    <Input
                      value={scheduleCron}
                      onChange={(e) => setScheduleCron(e.target.value)}
                      placeholder="0 9 * * *"
                    />
                    <div className="flex flex-wrap gap-1">
                      {SCHEDULE_PRESETS.map((preset) => (
                        <Button
                          key={preset.value}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setScheduleCron(preset.value)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Standard 5-field cron: minute hour day-of-month month day-of-week.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Input
                      value={scheduleTimezone}
                      onChange={(e) => setScheduleTimezone(e.target.value)}
                      placeholder="e.g., Asia/Kolkata, America/New_York, UTC"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Steps Builder */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workflow canvas</CardTitle>
                  <CardDescription>
                    Drag nodes from the palette, connect visually top-to-bottom, and click a
                    node to configure it. Order follows vertical position.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <WorkflowFlowBuilder
                key={workflowId}
                steps={steps}
                onStepsChange={setSteps}
                triggerEvent={triggerEvent}
                triggerLabel={
                  TRIGGER_EVENTS.find((t) => t.value === triggerEvent)?.label ??
                  (triggerEvent || "Trigger")
                }
              />
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}
