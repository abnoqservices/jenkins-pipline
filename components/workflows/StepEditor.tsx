"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, GripVertical, GitBranch, Zap, Clock, Wand2, Repeat } from "lucide-react"
import type {
  AutomationStep,
  StepConfig,
  ConditionConfig,
  ActionConfig,
  DelayConfig,
  HttpMethod,
  HttpBodyType,
  TransformConfig,
  TransformOp,
  LoopConfig,
} from "@/lib/types/workflow"
import axiosClient from "@/lib/axiosClient"
import { cn } from "@/lib/utils"

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/80 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

interface StepEditorProps {
  step: AutomationStep
  index: number
  allSteps?: AutomationStep[]
  triggerEvent?: string
  onUpdate: (step: AutomationStep) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  /** Flat layout for side panel / sheet (no card chrome, no reorder grips). */
  embedded?: boolean
}

type StepTypeMeta = {
  label: string
  blurb: string
  icon: React.ComponentType<{ className?: string }>
  ringClass: string
  iconWrapClass: string
  iconColorClass: string
  badgeClass: string
  stripClass: string
  bgClass: string
}

const STEP_TYPE_META: Record<string, StepTypeMeta> = {
  condition: {
    label: "Condition",
    blurb: "Branch the workflow based on a check.",
    icon: GitBranch,
    ringClass: "ring-blue-500/30",
    iconWrapClass: "bg-blue-500/10",
    iconColorClass: "text-blue-600 dark:text-blue-400",
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    stripClass: "from-blue-500/40 via-blue-500/15 to-transparent",
    bgClass: "bg-gradient-to-b from-blue-500/[0.06] to-transparent",
  },
  action: {
    label: "Action",
    blurb: "Do something — send a message, call an API, etc.",
    icon: Zap,
    ringClass: "ring-violet-500/30",
    iconWrapClass: "bg-violet-500/10",
    iconColorClass: "text-violet-600 dark:text-violet-400",
    badgeClass: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
    stripClass: "from-violet-500/40 via-violet-500/15 to-transparent",
    bgClass: "bg-gradient-to-b from-violet-500/[0.06] to-transparent",
  },
  delay: {
    label: "Delay",
    blurb: "Wait before continuing to the next step.",
    icon: Clock,
    ringClass: "ring-amber-500/30",
    iconWrapClass: "bg-amber-500/10",
    iconColorClass: "text-amber-600 dark:text-amber-400",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    stripClass: "from-amber-500/40 via-amber-500/15 to-transparent",
    bgClass: "bg-gradient-to-b from-amber-500/[0.06] to-transparent",
  },
  transform: {
    label: "Transform",
    blurb: "Compute or extract values into the vars namespace.",
    icon: Wand2,
    ringClass: "ring-cyan-500/30",
    iconWrapClass: "bg-cyan-500/10",
    iconColorClass: "text-cyan-600 dark:text-cyan-400",
    badgeClass: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    stripClass: "from-cyan-500/40 via-cyan-500/15 to-transparent",
    bgClass: "bg-gradient-to-b from-cyan-500/[0.06] to-transparent",
  },
  loop: {
    label: "Loop",
    blurb: "Iterate over a list, running body steps for each item.",
    icon: Repeat,
    ringClass: "ring-pink-500/30",
    iconWrapClass: "bg-pink-500/10",
    iconColorClass: "text-pink-600 dark:text-pink-400",
    badgeClass: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30",
    stripClass: "from-pink-500/40 via-pink-500/15 to-transparent",
    bgClass: "bg-gradient-to-b from-pink-500/[0.06] to-transparent",
  },
}

function getStepSubtitle(step: AutomationStep): string {
  if (step.type === "condition") {
    const t = (step.config as { condition_type?: string }).condition_type
    return t ? `Check: ${t.replace(/_/g, " ")}` : "Set up a condition"
  }
  if (step.type === "action") {
    const t = (step.config as { action_type?: string }).action_type
    return t ? `Action: ${t.replace(/_/g, " ")}` : "Pick an action"
  }
  if (step.type === "delay") {
    const sec = (step.config as { seconds?: number }).seconds ?? 0
    if (sec >= 86400) return `Wait ${sec / 86400} day(s)`
    if (sec >= 3600) return `Wait ${sec / 3600} hour(s)`
    if (sec >= 60) return `Wait ${sec / 60} minute(s)`
    return `Wait ${sec}s`
  }
  if (step.type === "transform") {
    const ops = (step.config as { operations?: any[] }).operations || []
    return ops.length ? `${ops.length} operation${ops.length === 1 ? "" : "s"}` : "No operations yet"
  }
  if (step.type === "loop") {
    const over = (step.config as { over?: string }).over
    return over ? `For each in ${over}` : "Configure a list to iterate"
  }
  return ""
}

export function getStepTypeMeta(type: string): StepTypeMeta {
  return STEP_TYPE_META[type] || STEP_TYPE_META.action
}

export function StepEditor({
  step,
  index,
  allSteps = [],
  triggerEvent = "",
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  embedded = false,
}: StepEditorProps) {
  const handleTypeChange = (type: "condition" | "action" | "delay" | "transform" | "loop") => {
    let defaultConfig: StepConfig = {} as StepConfig

    if (type === "condition") {
      defaultConfig = { condition_type: "email_exists" } as ConditionConfig
    } else if (type === "action") {
      defaultConfig = { action_type: "send_email" } as ActionConfig
    } else if (type === "delay") {
      defaultConfig = { seconds: 3600 } as DelayConfig
    } else if (type === "transform") {
      defaultConfig = { operations: [] } as TransformConfig
    } else if (type === "loop") {
      defaultConfig = { over: "data.form_fields.items", end_step: index + 1, iterator_var: "item" } as LoopConfig
    }

    onUpdate({
      ...step,
      type,
      config: defaultConfig,
    })
  }

  const handleConfigUpdate = (updates: Partial<StepConfig>) => {
    onUpdate({
      ...step,
      config: {
        ...step.config,
        ...updates,
      },
    })
  }

  const meta = getStepTypeMeta(step.type)
  const subtitle = getStepSubtitle(step)
  const Icon = meta.icon

  const stepTypeSelector = (
    <Section title="Block type" subtitle="Pick a different block to convert this step.">
      <Select value={step.type} onValueChange={handleTypeChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="condition">Condition · branch</SelectItem>
          <SelectItem value="action">Action · do something</SelectItem>
          <SelectItem value="delay">Delay · wait</SelectItem>
          <SelectItem value="transform">Transform · set vars</SelectItem>
          <SelectItem value="loop">Loop · for-each</SelectItem>
        </SelectContent>
      </Select>
    </Section>
  )

  const configSection =
    step.type === "transform" ? (
      <Section title="Operations" subtitle="Run in order. Writes go to the vars namespace.">
        <TransformConfigEditor
          config={step.config as TransformConfig}
          onUpdate={handleConfigUpdate}
        />
      </Section>
    ) : step.type === "loop" ? (
      <Section title="Iteration" subtitle="Choose what to loop over and where the body ends.">
        <LoopConfigEditor
          config={step.config as LoopConfig}
          stepIndex={index}
          allSteps={allSteps}
          onUpdate={handleConfigUpdate}
        />
      </Section>
    ) : step.type === "condition" ? (
      <Section title="Condition" subtitle="Branch the flow based on a check.">
        <ConditionConfigEditor
          config={step.config as ConditionConfig}
          stepIndex={index}
          allSteps={allSteps}
          onUpdate={handleConfigUpdate}
        />
      </Section>
    ) : step.type === "action" ? (
      <Section title="Action" subtitle="What this step actually does.">
        <ActionConfigEditor
          config={step.config as ActionConfig}
          triggerEvent={triggerEvent}
          onUpdate={handleConfigUpdate}
        />
      </Section>
    ) : step.type === "delay" ? (
      <Section title="Wait duration" subtitle="The flow pauses, then resumes automatically.">
        <DelayConfigEditor
          config={step.config as DelayConfig}
          onUpdate={handleConfigUpdate}
        />
      </Section>
    ) : null

  const fields = (
    <div className="space-y-5">
      {stepTypeSelector}
      {configSection}
    </div>
  )

  if (embedded) {
    return (
      <div className="flex flex-col h-full">
        {/* Top accent strip */}
        <div className={cn("h-1 bg-gradient-to-r", meta.stripClass)} />

        {/* Hero header */}
        <div className={cn("px-6 pt-5 pb-4 border-b border-border", meta.bgClass)}>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                meta.iconWrapClass,
                meta.ringClass,
              )}
            >
              <Icon className={cn("h-5 w-5", meta.iconColorClass)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border",
                    meta.badgeClass,
                  )}
                >
                  Step {index + 1}
                </span>
                <h3 className="text-base font-semibold text-foreground leading-tight truncate">
                  {meta.label}
                </h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                {subtitle || meta.blurb}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex-1">{fields}</div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 px-6 py-3 bg-background/95 backdrop-blur border-t border-border">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            Remove this step
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {canMoveUp && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onMoveUp}
                >
                  <GripVertical className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CardTitle className="text-sm font-medium">
              Step {index + 1}: {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
            </CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{fields}</CardContent>
    </Card>
  )
}

// ==================== CONDITION EDITOR ====================
interface ConditionConfigEditorProps {
  config: ConditionConfig
  stepIndex: number
  allSteps: AutomationStep[]
  onUpdate: (updates: Partial<ConditionConfig>) => void
}

function ConditionConfigEditor({ config, stepIndex, allSteps, onUpdate }: ConditionConfigEditorProps) {
  const jumpOptions = allSteps
    .map((step, idx) => ({ step, idx }))
    .filter(({ idx }) => idx > stepIndex)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Condition Type</Label>
        <Select
          value={config.condition_type}
          onValueChange={(value) =>
            onUpdate({
              condition_type: value as ConditionConfig["condition_type"],
              field_name: undefined,
              expected_value: undefined,
              threshold: undefined,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email_exists">Email exists</SelectItem>
            <SelectItem value="phone_exists">Phone exists</SelectItem>
            <SelectItem value="whatsapp_opt_in">WhatsApp opt-in exists</SelectItem>
            <SelectItem value="form_field_equals">Form field equals</SelectItem>
            <SelectItem value="form_field_greater_than">Form field greater than</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>If condition is TRUE</Label>
        <Select
          value={
            config.on_true_step === null || config.on_true_step === undefined
              ? "next"
              : String(config.on_true_step)
          }
          onValueChange={(value) =>
            onUpdate({
              on_true_step: value === "next" ? null : Number(value),
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="next">Continue to next step</SelectItem>
            {jumpOptions.map(({ idx, step }) => (
              <SelectItem key={`true-${idx}`} value={String(idx)}>
                Jump to Step {idx + 1} ({step.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>If condition is FALSE</Label>
        <Select
          value={
            config.on_false_step === null || config.on_false_step === undefined
              ? "stop"
              : String(config.on_false_step)
          }
          onValueChange={(value) =>
            onUpdate({
              on_false_step: value === "stop" ? "stop" : value === "next" ? null : Number(value),
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stop">Stop workflow</SelectItem>
            <SelectItem value="next">Continue to next step</SelectItem>
            {jumpOptions.map(({ idx, step }) => (
              <SelectItem key={`false-${idx}`} value={String(idx)}>
                Jump to Step {idx + 1} ({step.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {config.condition_type === "form_field_equals" && (
        <>
          <div className="space-y-2">
            <Label>Field Name</Label>
            <Input
              value={config.field_name || ""}
              onChange={(e) => onUpdate({ field_name: e.target.value })}
              placeholder="e.g., role, budget"
            />
          </div>
          <div className="space-y-2">
            <Label>Expected Value</Label>
            <Input
              value={config.expected_value?.toString() || ""}
              onChange={(e) => onUpdate({ expected_value: e.target.value })}
              placeholder="e.g., CTO, 50000"
            />
          </div>
        </>
      )}

      {config.condition_type === "form_field_greater_than" && (
        <>
          <div className="space-y-2">
            <Label>Field Name</Label>
            <Input
              value={config.field_name || ""}
              onChange={(e) => onUpdate({ field_name: e.target.value })}
              placeholder="e.g., budget, score"
            />
          </div>
          <div className="space-y-2">
            <Label>Threshold</Label>
            <Input
              type="number"
              value={config.threshold?.toString() || ""}
              onChange={(e) => onUpdate({ threshold: parseFloat(e.target.value) || 0 })}
              placeholder="e.g., 50000"
            />
          </div>
        </>
      )}
    </div>
  )
}

// ==================== ACTION EDITOR (FIXED) ====================
interface ActionConfigEditorProps {
  config: ActionConfig
  triggerEvent?: string
  onUpdate: (updates: Partial<ActionConfig>) => void
}

type WorkflowFormSummary = { id: number; name: string; slug?: string }
type WorkflowFormField = { id: number; key: string; label: string; type: string }
type WorkflowFormDetail = {
  id: number
  name: string
  slug: string
  fields?: WorkflowFormField[]
  sections?: Array<{ fields?: WorkflowFormField[] }>
}

function ActionConfigEditor({ config, triggerEvent = "", onUpdate }: ActionConfigEditorProps) {
  const [whatsappAccounts, setWhatsappAccounts] = React.useState<any[]>([])
  const [loadingAccounts, setLoadingAccounts] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [forms, setForms] = React.useState<WorkflowFormSummary[]>([])
  const [loadingForms, setLoadingForms] = React.useState(false)
  const [formFields, setFormFields] = React.useState<WorkflowFormField[]>([])
  const [loadingFields, setLoadingFields] = React.useState(false)
  const isLeadFormTrigger = triggerEvent === "lead.form_submitted"

  React.useEffect(() => {
    if (config.action_type === "send_whatsapp") {
      loadWhatsAppAccounts()
    } else {
      setWhatsappAccounts([])
      setError(null)
    }
  }, [config.action_type])

  React.useEffect(() => {
    if (config.action_type !== "send_whatsapp" || !isLeadFormTrigger) {
      setForms([])
      setFormFields([])
      return
    }
    void loadForms()
  }, [config.action_type, isLeadFormTrigger])

  React.useEffect(() => {
    if (config.action_type !== "send_whatsapp" || !isLeadFormTrigger || !config.form_id) {
      setFormFields([])
      return
    }
    void loadFormFields(config.form_id)
  }, [config.action_type, isLeadFormTrigger, config.form_id])

  const loadWhatsAppAccounts = async () => {
    try {
      setLoadingAccounts(true)
      setError(null)

      const response = await axiosClient.get("/whatsapp/accounts")

      if (response.data?.success) {
        setWhatsappAccounts(response.data.data || [])
      } else {
        setError("Failed to load accounts")
      }
    } catch (err: any) {
      console.error("Failed to load WhatsApp accounts:", err)
      setError(err.response?.data?.message || "Failed to load WhatsApp accounts")
      setWhatsappAccounts([])
    } finally {
      setLoadingAccounts(false)
    }
  }

  const loadForms = async () => {
    try {
      setLoadingForms(true)
      const response = await axiosClient.get("/forms")
      if (response.data?.success) {
        setForms(Array.isArray(response.data.data) ? response.data.data : [])
      }
    } catch {
      setForms([])
    } finally {
      setLoadingForms(false)
    }
  }

  const loadFormFields = async (formId: string) => {
    try {
      setLoadingFields(true)
      const response = await axiosClient.get(`/forms/${formId}`)
      if (!response.data?.success) {
        setFormFields([])
        return
      }

      const form = response.data.data as WorkflowFormDetail
      const sectionFields = (Array.isArray(form.sections) ? form.sections : []).flatMap((section) =>
        Array.isArray(section.fields) ? section.fields : []
      )
      const rootFields = Array.isArray(form.fields) ? form.fields : []
      const unique = new Map<string, WorkflowFormField>()
      ;[...sectionFields, ...rootFields].forEach((field) => {
        if (!field?.key) return
        unique.set(field.key, field)
      })
      setFormFields(Array.from(unique.values()))
    } catch {
      setFormFields([])
    } finally {
      setLoadingFields(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Action Type</Label>
        <Select
          value={config.action_type}
          onValueChange={(value) =>
            onUpdate({ action_type: value as ActionConfig["action_type"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="send_email">Send Email</SelectItem>
            <SelectItem value="send_whatsapp">Send WhatsApp</SelectItem>
            <SelectItem value="send_sms">Send SMS</SelectItem>
            <SelectItem value="http_request">HTTP request</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.action_type === "http_request" && (
        <HttpRequestConfigEditor config={config} onUpdate={onUpdate} />
      )}

      {/* WhatsApp Configuration */}
      {config.action_type === "send_whatsapp" && (
        <>
          {isLeadFormTrigger && (
            <>
              <div className="space-y-2">
                <Label>Form (for dynamic fields)</Label>
                <Select
                  value={config.form_id || ""}
                  onValueChange={(value) =>
                    onUpdate({
                      form_id: value,
                      phone_field_key: undefined,
                      template_params: {},
                    })
                  }
                  disabled={loadingForms}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingForms ? "Loading forms..." : "Select form"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(forms || []).map((form) => (
                      <SelectItem key={form.id} value={String(form.id)}>
                        #{form.id} {form.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Phone field mapping</Label>
                <Select
                  value={config.phone_field_key || ""}
                  onValueChange={(value) => onUpdate({ phone_field_key: value })}
                  disabled={!config.form_id || loadingFields}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !config.form_id
                          ? "Select form first"
                          : loadingFields
                          ? "Loading fields..."
                          : "Select phone field key"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {formFields
                      .filter((field) => field.type === "phone" || field.key.toLowerCase().includes("phone"))
                      .map((field) => (
                        <SelectItem key={field.id} value={field.key}>
                          {field.label} ({field.key})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  If selected, this field value is used as recipient number for this trigger.
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>WhatsApp Account</Label>
            <Select
              value={config.whatsapp_account_id?.toString() || ""}
              onValueChange={(value) => onUpdate({ whatsapp_account_id: value })}
              disabled={loadingAccounts}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingAccounts ? "Loading accounts..." : "Select WhatsApp account"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {loadingAccounts ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                ) : whatsappAccounts.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No WhatsApp accounts connected
                  </div>
                ) : (
                  whatsappAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      [{(account.provider || "meta").toUpperCase()}] {account.phone_number} - {account.business_account_name || "Unnamed"}
                      {account.status === "connected" && " ✓"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

            {whatsappAccounts.length === 0 && !loadingAccounts && (
              <p className="text-xs text-muted-foreground">
                <a
                  href="/integrations"
                  className="text-blue-600 hover:underline"
                >
                  Connect a WhatsApp account →
                </a>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={config.message || ""}
              onChange={(e) => onUpdate({ message: e.target.value })}
              placeholder="Hello {name}, your form has been received..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              You can use variables: {"{name}"}, {"{email}"}, {"{phone}"}, {"{company}"}, etc.
            </p>
            {isLeadFormTrigger && formFields.length > 0 && (
              <div className="text-xs text-muted-foreground rounded border p-2 bg-muted/30">
                Dynamic fields:{" "}
                {formFields.map((f) => `{${f.key}}`).join(", ")}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Template Name (Optional)</Label>
            <Input
              value={config.template_id || ""}
              onChange={(e) => onUpdate({ template_id: e.target.value })}
              placeholder="e.g., welcome_message"
            />
          </div>
        </>
      )}

      {config.action_type === "send_email" && (
        <EmailConfigEditor config={config} onUpdate={onUpdate} />
      )}

      {config.action_type === "send_sms" && (
        <div className="space-y-2">
          <Label>SMS Template ID (Optional)</Label>
          <Input
            value={config.template_id || ""}
            onChange={(e) => onUpdate({ template_id: e.target.value })}
            placeholder="e.g., welcome_sms_1"
          />
        </div>
      )}

      <RetryPolicyEditor config={config} onUpdate={onUpdate} />
    </div>
  )
}

// ==================== RETRY POLICY EDITOR ====================
interface RetryPolicyEditorProps {
  config: ActionConfig
  onUpdate: (updates: Partial<ActionConfig>) => void
}

function RetryPolicyEditor({ config, onUpdate }: RetryPolicyEditorProps) {
  const onFailureValue =
    typeof config.on_failure === "object" && config.on_failure !== null
      ? "jump"
      : (config.on_failure as string) || "stop"

  return (
    <details className="group rounded-lg border border-border/60 bg-muted/30 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex items-center justify-between p-4 text-sm font-medium cursor-pointer select-none rounded-lg hover:bg-muted/50 transition-colors">
        <span className="flex items-center gap-2">
          <span className="text-amber-500">⚠</span>
          Error handling & retries
        </span>
        <span className="text-xs text-muted-foreground transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="px-4 pb-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Max retries</Label>
          <Input
            type="number"
            min={0}
            max={20}
            value={config.max_retries ?? 0}
            onChange={(e) => onUpdate({ max_retries: Math.max(0, parseInt(e.target.value, 10) || 0) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Initial backoff (s)</Label>
          <Input
            type="number"
            min={1}
            value={config.backoff_initial_seconds ?? 30}
            onChange={(e) => onUpdate({ backoff_initial_seconds: Math.max(1, parseInt(e.target.value, 10) || 30) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Backoff factor</Label>
          <Input
            type="number"
            min={1}
            step={0.5}
            value={config.backoff_factor ?? 2}
            onChange={(e) => onUpdate({ backoff_factor: Math.max(1, parseFloat(e.target.value) || 2) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Max backoff (s)</Label>
          <Input
            type="number"
            min={1}
            value={config.backoff_max_seconds ?? 3600}
            onChange={(e) => onUpdate({ backoff_max_seconds: Math.max(1, parseInt(e.target.value, 10) || 3600) })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>On failure (after retries)</Label>
        <Select
          value={onFailureValue}
          onValueChange={(value) => {
            if (value === "jump") onUpdate({ on_failure: { jump_to: 0 } })
            else onUpdate({ on_failure: value as "stop" | "continue" })
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stop">Stop workflow</SelectItem>
            <SelectItem value="continue">Continue to next step</SelectItem>
            <SelectItem value="jump">Jump to step…</SelectItem>
          </SelectContent>
        </Select>
        {onFailureValue === "jump" && (
          <Input
            type="number"
            min={0}
            value={(config.on_failure as { jump_to: number })?.jump_to ?? 0}
            onChange={(e) =>
              onUpdate({ on_failure: { jump_to: Math.max(0, parseInt(e.target.value, 10) || 0) } })
            }
            placeholder="Step index (0-based)"
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Retries use exponential backoff. Counter resets on success or after on-failure transition.
      </p>
      </div>
    </details>
  )
}

// ==================== TRANSFORM EDITOR ====================
interface TransformConfigEditorProps {
  config: TransformConfig
  onUpdate: (updates: Partial<TransformConfig>) => void
}

function TransformConfigEditor({ config, onUpdate }: TransformConfigEditorProps) {
  const ops = config.operations || []

  const updateOp = (i: number, patch: Partial<TransformOp>) => {
    const next = ops.map((op, idx) => (idx === i ? ({ ...op, ...patch } as TransformOp) : op))
    onUpdate({ operations: next })
  }

  const removeOp = (i: number) => {
    onUpdate({ operations: ops.filter((_, idx) => idx !== i) })
  }

  const addOp = (kind: "set" | "extract" | "unset") => {
    const fresh: TransformOp =
      kind === "set"
        ? { op: "set", var: "", value: "" }
        : kind === "extract"
        ? { op: "extract", var: "", from: "" }
        : { op: "unset", var: "" }
    onUpdate({ operations: [...ops, fresh] })
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-4 bg-muted/30">
      <p className="text-xs text-muted-foreground">
        Transform writes to a <code>vars</code> namespace. Reference later as{" "}
        <code>{"{vars.<name>}"}</code>.
      </p>

      {ops.length === 0 && (
        <p className="text-xs text-muted-foreground">No operations yet.</p>
      )}

      {ops.map((op, i) => (
        <div key={i} className="flex flex-col gap-2 rounded border p-2 bg-background">
          <div className="flex items-center gap-2">
            <Select
              value={op.op}
              onValueChange={(value) => {
                const kind = value as "set" | "extract" | "unset"
                if (kind === "set") updateOp(i, { op: "set", var: op.var || "", value: "" })
                else if (kind === "extract") updateOp(i, { op: "extract", var: op.var || "", from: "" })
                else updateOp(i, { op: "unset", var: op.var || "" })
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="set">Set</SelectItem>
                <SelectItem value="extract">Extract</SelectItem>
                <SelectItem value="unset">Unset</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={op.var}
              placeholder="var name"
              onChange={(e) => updateOp(i, { var: e.target.value } as Partial<TransformOp>)}
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeOp(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {op.op === "set" && (
            <Input
              value={typeof (op as any).value === "string" ? (op as any).value : JSON.stringify((op as any).value)}
              placeholder='"Hello {name}" or 42 or {"k": "v"}'
              onChange={(e) => {
                const raw = e.target.value
                let parsed: any = raw
                if (raw.trim().startsWith("{") || raw.trim().startsWith("[")) {
                  try {
                    parsed = JSON.parse(raw)
                  } catch {
                    parsed = raw
                  }
                }
                updateOp(i, { value: parsed } as Partial<TransformOp>)
              }}
            />
          )}
          {op.op === "extract" && (
            <Input
              value={(op as any).from || ""}
              placeholder="dot.path e.g. data.form_fields.email"
              onChange={(e) => updateOp(i, { from: e.target.value } as Partial<TransformOp>)}
            />
          )}
        </div>
      ))}

      <div className="flex gap-1">
        <Button type="button" variant="outline" size="sm" onClick={() => addOp("set")}>
          + Set
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addOp("extract")}>
          + Extract
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addOp("unset")}>
          + Unset
        </Button>
      </div>
    </div>
  )
}

// ==================== LOOP EDITOR ====================
interface LoopConfigEditorProps {
  config: LoopConfig
  stepIndex: number
  allSteps: AutomationStep[]
  onUpdate: (updates: Partial<LoopConfig>) => void
}

function LoopConfigEditor({ config, stepIndex, allSteps, onUpdate }: LoopConfigEditorProps) {
  const candidates = allSteps
    .map((step, idx) => ({ step, idx }))
    .filter(({ idx }) => idx > stepIndex)

  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-4 bg-muted/30">
      <div className="space-y-2">
        <Label>List path (over)</Label>
        <Input
          value={config.over || ""}
          onChange={(e) => onUpdate({ over: e.target.value })}
          placeholder="data.form_fields.recipients or vars.items"
        />
        <p className="text-xs text-muted-foreground">
          Dot path to a list in event data, vars, or form_fields.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Iterator variable name</Label>
        <Input
          value={config.iterator_var || "item"}
          onChange={(e) => onUpdate({ iterator_var: e.target.value || "item" })}
          placeholder="item"
        />
        <p className="text-xs text-muted-foreground">
          Reference inside body as <code>{"{item.field}"}</code> and <code>{"{index}"}</code>.
        </p>
      </div>
      <div className="space-y-2">
        <Label>End step (loop body ends at)</Label>
        <Select
          value={config.end_step != null ? String(config.end_step) : ""}
          onValueChange={(value) => onUpdate({ end_step: Number(value) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select last step in body" />
          </SelectTrigger>
          <SelectContent>
            {candidates.map(({ idx, step }) => (
              <SelectItem key={idx} value={String(idx)}>
                Step {idx + 1} ({step.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          All steps from the next one through this end step run for each item.
        </p>
      </div>
    </div>
  )
}

// ==================== EMAIL EDITOR ====================
interface EmailConfigEditorProps {
  config: ActionConfig
  onUpdate: (updates: Partial<ActionConfig>) => void
}

function EmailConfigEditor({ config, onUpdate }: EmailConfigEditorProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-4 bg-muted/30">
      <div className="space-y-2">
        <Label>Recipient (field key, optional)</Label>
        <Input
          value={config.email_field_key || ""}
          onChange={(e) => onUpdate({ email_field_key: e.target.value })}
          placeholder="email (defaults to event.data.email)"
        />
        <p className="text-xs text-muted-foreground">
          Form field key whose value is the recipient. Falls back to <code>email</code>.
        </p>
      </div>

      <div className="space-y-2">
        <Label>SendGrid template ID (optional)</Label>
        <Input
          value={config.template_id || ""}
          onChange={(e) => onUpdate({ template_id: e.target.value })}
          placeholder="d-xxxxxxxx (use SendGrid Dynamic Templates)"
        />
      </div>

      <div className="space-y-2">
        <Label>Subject</Label>
        <Input
          value={config.subject || ""}
          onChange={(e) => onUpdate({ subject: e.target.value })}
          placeholder="Welcome, {name}!"
        />
      </div>

      {!config.template_id && (
        <>
          <div className="space-y-2">
            <Label>HTML body</Label>
            <Textarea
              rows={5}
              value={config.html_body || ""}
              onChange={(e) => onUpdate({ html_body: e.target.value })}
              placeholder={'<p>Hi {name},</p><p>Thanks for signing up.</p>'}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label>Plain-text body</Label>
            <Textarea
              rows={3}
              value={config.text_body || ""}
              onChange={(e) => onUpdate({ text_body: e.target.value })}
              placeholder="Hi {name}, thanks for signing up."
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>From email (optional)</Label>
          <Input
            value={config.from_email || ""}
            onChange={(e) => onUpdate({ from_email: e.target.value })}
            placeholder="hello@yourdomain.com"
          />
        </div>
        <div className="space-y-2">
          <Label>From name (optional)</Label>
          <Input
            value={config.from_name || ""}
            onChange={(e) => onUpdate({ from_name: e.target.value })}
            placeholder="Your Brand"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Reply-to (optional)</Label>
        <Input
          value={config.reply_to || ""}
          onChange={(e) => onUpdate({ reply_to: e.target.value })}
          placeholder="support@yourdomain.com"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Templates like <code>{"{name}"}</code>, <code>{"{email}"}</code> are substituted from the event payload.
      </p>
    </div>
  )
}

// ==================== HTTP REQUEST EDITOR ====================
interface HttpRequestConfigEditorProps {
  config: ActionConfig
  onUpdate: (updates: Partial<ActionConfig>) => void
}

type KVRow = { id: string; key: string; value: string }

function objectToRows(obj: Record<string, string> | undefined): KVRow[] {
  if (!obj) return []
  return Object.entries(obj).map(([key, value], idx) => ({
    id: `${idx}-${key}`,
    key,
    value: value ?? "",
  }))
}

function rowsToObject(rows: KVRow[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const row of rows) {
    if (!row.key) continue
    out[row.key] = row.value
  }
  return out
}

function KeyValueList({
  rows,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
}: {
  rows: KVRow[]
  onChange: (rows: KVRow[]) => void
  keyPlaceholder: string
  valuePlaceholder: string
}) {
  const update = (id: string, patch: Partial<KVRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id))
  const add = () =>
    onChange([...rows, { id: `${Date.now()}-${Math.random()}`, key: "", value: "" }])

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-xs text-muted-foreground">None — click Add to insert one.</p>
      )}
      {rows.map((row) => (
        <div key={row.id} className="flex gap-2">
          <Input
            value={row.key}
            placeholder={keyPlaceholder}
            onChange={(e) => update(row.id, { key: e.target.value })}
            className="flex-1"
          />
          <Input
            value={row.value}
            placeholder={valuePlaceholder}
            onChange={(e) => update(row.id, { value: e.target.value })}
            className="flex-1"
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(row.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        Add
      </Button>
    </div>
  )
}

function HttpRequestConfigEditor({ config, onUpdate }: HttpRequestConfigEditorProps) {
  const method = config.method || "GET"
  const bodyType = config.body_type || "json"
  const [headerRows, setHeaderRows] = React.useState<KVRow[]>(() => objectToRows(config.headers))
  const [paramRows, setParamRows] = React.useState<KVRow[]>(() => objectToRows(config.query_params))
  const [bodyText, setBodyText] = React.useState<string>(() => {
    if (config.body == null) return ""
    if (typeof config.body === "string") return config.body
    try {
      return JSON.stringify(config.body, null, 2)
    } catch {
      return ""
    }
  })
  const [bodyError, setBodyError] = React.useState<string | null>(null)

  React.useEffect(() => {
    onUpdate({ headers: rowsToObject(headerRows) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerRows])

  React.useEffect(() => {
    onUpdate({ query_params: rowsToObject(paramRows) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramRows])

  const commitBody = (text: string, type: HttpBodyType) => {
    setBodyText(text)
    if (type === "raw") {
      setBodyError(null)
      onUpdate({ body: text })
      return
    }
    if (type === "none" || !text.trim()) {
      setBodyError(null)
      onUpdate({ body: undefined })
      return
    }
    try {
      const parsed = JSON.parse(text)
      setBodyError(null)
      onUpdate({ body: parsed })
    } catch (e: any) {
      setBodyError(e?.message || "Invalid JSON")
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/60 p-4 bg-muted/30">
      <div className="grid grid-cols-[140px_1fr] gap-2">
        <div className="space-y-2">
          <Label>Method</Label>
          <Select
            value={method}
            onValueChange={(value) => onUpdate({ method: value as HttpMethod })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>URL</Label>
          <Input
            value={config.url || ""}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="https://api.example.com/leads/{lead_id}"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Headers</Label>
        <KeyValueList
          rows={headerRows}
          onChange={setHeaderRows}
          keyPlaceholder="Authorization"
          valuePlaceholder="Bearer {token}"
        />
      </div>

      <div className="space-y-2">
        <Label>Query parameters</Label>
        <KeyValueList
          rows={paramRows}
          onChange={setParamRows}
          keyPlaceholder="email"
          valuePlaceholder="{email}"
        />
      </div>

      <div className="space-y-2">
        <Label>Body type</Label>
        <Select
          value={bodyType}
          onValueChange={(value) => {
            const t = value as HttpBodyType
            onUpdate({ body_type: t })
            commitBody(bodyText, t)
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="form">Form (urlencoded)</SelectItem>
            <SelectItem value="raw">Raw text</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {bodyType !== "none" && (
        <div className="space-y-2">
          <Label>Body</Label>
          <Textarea
            value={bodyText}
            onChange={(e) => commitBody(e.target.value, bodyType)}
            rows={6}
            placeholder={
              bodyType === "raw"
                ? "Plain text body. Templates like {email} are supported."
                : '{\n  "email": "{email}",\n  "name": "{name}"\n}'
            }
            className="font-mono text-xs"
          />
          {bodyError && <p className="text-xs text-red-600">{bodyError}</p>}
          {bodyType !== "raw" && (
            <p className="text-xs text-muted-foreground">
              Must be valid JSON. String values are templated with {"{field}"} substitution.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Timeout (seconds)</Label>
          <Input
            type="number"
            min={1}
            max={120}
            value={config.timeout_seconds ?? 30}
            onChange={(e) => onUpdate({ timeout_seconds: parseInt(e.target.value, 10) || 30 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Fail on non-2xx</Label>
          <Select
            value={(config.fail_on_error_status ?? true) ? "yes" : "no"}
            onValueChange={(value) => onUpdate({ fail_on_error_status: value === "yes" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes (treat 4xx/5xx as failure)</SelectItem>
              <SelectItem value="no">No (always succeed)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

// ==================== DELAY EDITOR ====================
interface DelayConfigEditorProps {
  config: DelayConfig
  onUpdate: (updates: Partial<DelayConfig>) => void
}

function DelayConfigEditor({ config, onUpdate }: DelayConfigEditorProps) {
  const [seconds, setSeconds] = React.useState(config.seconds?.toString() || "3600")
  const [unit, setUnit] = React.useState<"seconds" | "minutes" | "hours" | "days">("hours")

  React.useEffect(() => {
    const secs = config.seconds || 3600
    if (secs % 86400 === 0) {
      setUnit("days")
      setSeconds((secs / 86400).toString())
    } else if (secs % 3600 === 0) {
      setUnit("hours")
      setSeconds((secs / 3600).toString())
    } else if (secs % 60 === 0) {
      setUnit("minutes")
      setSeconds((secs / 60).toString())
    } else {
      setUnit("seconds")
      setSeconds(secs.toString())
    }
  }, [config.seconds])

  const handleValueChange = (value: string, newUnit: typeof unit) => {
    const numValue = parseFloat(value) || 0
    let totalSeconds = 0

    switch (newUnit) {
      case "days":
        totalSeconds = numValue * 86400
        break
      case "hours":
        totalSeconds = numValue * 3600
        break
      case "minutes":
        totalSeconds = numValue * 60
        break
      case "seconds":
        totalSeconds = numValue
        break
    }
    onUpdate({ seconds: totalSeconds })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Wait Duration</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={seconds}
            onChange={(e) => {
              setSeconds(e.target.value)
              handleValueChange(e.target.value, unit)
            }}
            min="0"
            className="flex-1"
          />
          <Select
            value={unit}
            onValueChange={(value: string) => {
              const newUnit = value as typeof unit
              setUnit(newUnit)
              handleValueChange(seconds, newUnit)
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seconds">Seconds</SelectItem>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}