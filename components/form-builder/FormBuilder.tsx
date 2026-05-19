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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Save,
  Check,
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Pencil,
  UserPlus,
  Mail,
  ShoppingCart,
  Bell,
  HelpCircle,
  Type,
  Hash,
  Phone,
  Calendar,
  CheckSquare,
} from "lucide-react"
import { useRouter } from "next/navigation"
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import LivePreview from "@/components/form-component/LivePreview"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// ─── Field Types (merged from both codes - includes textarea) ─────────────
const fieldTypes = [
  { value: "text", label: "Short text", icon: Type },
  { value: "textarea", label: "Paragraph", icon: Type },
  { value: "email", label: "Email", icon: Mail },
  { value: "number", label: "Number", icon: Hash },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "date", label: "Date", icon: Calendar },
  { value: "select", label: "Dropdown", icon: ChevronDown },
  { value: "radio", label: "Single choice", icon: CheckSquare },
  { value: "checkbox", label: "Multiple choice", icon: CheckSquare },
]

const supportsPlaceholder = new Set(["text", "textarea", "email", "number", "phone", "date"])
const supportsOptions = new Set(["select", "radio", "checkbox"])

// ─── Templates (merged - all from your first code + blank) ─────────────────
const FORM_TEMPLATES = [
  {
    id: "blank",
    name: "Start from Scratch",
    description: "Build your completely custom form",
    icon: Plus,
    getInitialData: () => ({
      name: "Untitled Form",
      description: "",
      sections: [{
        tempId: "sec-main-" + Date.now(),
        title: "Main Section",
        order: 0,
        collapsed: false,
        fields: [],
      }]
    })
  },
  {
    id: "signup",
    name: "Sign Up / Registration",
    description: "New user registration form",
    icon: UserPlus,
    getInitialData: () => ({
      name: "Create Account",
      description: "Sign up for a new account",
      sections: [{
        tempId: "sec-signup-" + Date.now(),
        title: "Registration",
        order: 0,
        collapsed: false,
        fields: [
          { tempId: "f-name-" + Date.now(), type: "text", label: "Full Name", placeholder: "John Doe", required: true, order: 0, expanded: false },
          { tempId: "f-email-" + Date.now(), type: "email", label: "Email Address", placeholder: "you@example.com", required: true, order: 1, expanded: false },
          { tempId: "f-password-" + Date.now(), type: "text", label: "Password", placeholder: "Minimum 8 characters", required: true, order: 2, expanded: false },
          { tempId: "f-confirm-" + Date.now(), type: "text", label: "Confirm Password", placeholder: "Repeat password", required: true, order: 3, expanded: false },
          { tempId: "f-tos-" + Date.now(), type: "checkbox", label: "I agree to Terms & Privacy Policy", required: true, order: 4, expanded: false },
        ]
      }]
    })
  },
  {
    id: "contact",
    name: "Contact / General Enquiry",
    description: "Classic contact us form – minimal friction",
    icon: Mail,
    getInitialData: () => ({
      name: "Contact Us",
      description: "We'd love to hear from you!",
      sections: [{
        tempId: "sec-contact-" + Date.now(),
        title: "Get in Touch",
        order: 0,
        collapsed: false,
        fields: [
          { tempId: "f-name-" + Date.now(), type: "text", label: "Name", placeholder: "Your name", required: true, order: 0, expanded: false },
          { tempId: "f-email-" + Date.now(), type: "email", label: "Email", placeholder: "your@email.com", required: true, order: 1, expanded: false },
          { tempId: "f-message-" + Date.now(), type: "textarea", label: "Message", placeholder: "How can we help you today?", required: true, order: 2, expanded: false },
        ]
      }]
    })
  },
  {
    id: "product-enquiry",
    name: "Product Enquiry / Lead Form",
    description: "Qualified lead capture for products/services",
    icon: ShoppingCart,
    getInitialData: () => ({
      name: "Product Enquiry",
      description: "Tell us what you're interested in — we'll get back to you quickly",
      sections: [{
        tempId: "sec-product-" + Date.now(),
        title: "Tell Us About Your Needs",
        order: 0,
        collapsed: false,
        fields: [
          { tempId: "f-name-" + Date.now(), type: "text", label: "Full Name", required: true, order: 0, expanded: false },
          { tempId: "f-email-" + Date.now(), type: "email", label: "Business / Personal Email", required: true, order: 1, expanded: false },
          { tempId: "f-phone-" + Date.now(), type: "phone", label: "Phone Number", placeholder: "+91 ...", required: false, order: 2, expanded: false },
          { tempId: "f-product-" + Date.now(), type: "select", label: "Which product/service interests you?", required: true, options: [{ label: "Product A", value: "product-a" }, { label: "Product B", value: "product-b" }, { label: "Product C", value: "product-c" }, { label: "Not sure yet", value: "not-sure" }], order: 3, expanded: false },
          { tempId: "f-message-" + Date.now(), type: "textarea", label: "What would you like to know? (budget, quantity, timeline...)", placeholder: "Any details that will help us give you the best answer", required: false, order: 4, expanded: false },
        ]
      }]
    })
  },
  {
    id: "subscribe",
    name: "Subscribe / Newsletter",
    description: "Minimal email capture for newsletter / updates",
    icon: Bell,
    getInitialData: () => ({
      name: "Subscribe to Updates",
      description: "Get the latest news, tips & offers",
      sections: [{
        tempId: "sec-subscribe-" + Date.now(),
        title: "Join Our Newsletter",
        order: 0,
        collapsed: false,
        fields: [
          { tempId: "f-email-" + Date.now(), type: "email", label: "Email Address", placeholder: "you@example.com", required: true, order: 0, expanded: false },
          { tempId: "f-name-" + Date.now(), type: "text", label: "First Name", placeholder: "Optional", required: false, order: 1, expanded: false },
        ]
      }]
    })
  },
  {
    id: "user-enquiry",
    name: "User Enquiry / Support Request",
    description: "Help / support / detailed user Input Field form",
    icon: HelpCircle,
    getInitialData: () => ({
      name: "How can we help?",
      description: "Submit your Input Field or issue — we'll respond soon",
      sections: [{
        tempId: "sec-support-" + Date.now(),
        title: "Support / Enquiry",
        order: 0,
        collapsed: false,
        fields: [
          { tempId: "f-name-" + Date.now(), type: "text", label: "Name", required: true, order: 0, expanded: false },
          { tempId: "f-email-" + Date.now(), type: "email", label: "Email", required: true, order: 1, expanded: false },
          { tempId: "f-subject-" + Date.now(), type: "text", label: "Subject", placeholder: "Brief title of your request", required: true, order: 2, expanded: false },
          { tempId: "f-category-" + Date.now(), type: "select", label: "Category", required: true, options: [{ label: "Technical Issue", value: "tech" }, { label: "Billing / Payment", value: "billing" }, { label: "Feature Request", value: "feature" }, { label: "General Input Field", value: "general" }, { label: "Other", value: "other" }], order: 3, expanded: false },
          { tempId: "f-message-" + Date.now(), type: "textarea", label: "Description", placeholder: "Please describe your issue or Input Field in detail...", required: true, order: 4, expanded: false },
        ]
      }]
    })
  },
]

// ─── Types (merged and improved) ────────────────────────────────────────
interface FieldOption { label: string; value: string }

interface Field {
  tempId: string
  id?: number
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: FieldOption[]
  order: number
  expanded?: boolean
  key?: string
  is_required?: boolean // alias for compatibility
}

interface Section {
  tempId: string
  id?: number
  title: string
  order: number
  fields: Field[]
  collapsed?: boolean
}

interface FormData {
  id?: number
  name: string
  description: string
  is_active?: boolean
  success_message?: string
  redirect_url?: string
}

// ─── Reusable Dialog Component (ready to use anywhere) ──────────────────
interface FormBuilderDialogProps {
  /** Button that opens the dialog (children of DialogTrigger) */
  trigger?: React.ReactNode
  /** If provided → edit existing form, else → create new */
  formId?: string
  /** Called after successful save with the final form ID */
  onFormSaved?: (formId: string) => void
  /** Optional controlled open state */
  open?: boolean
  /** Optional controlled open state handler */
  onOpenChange?: (open: boolean) => void
}

export default function FormBuilderDialog({
  trigger,
  formId: propFormId,
  onFormSaved,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: FormBuilderDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (val: boolean) => {
    if (isControlled) controlledOnOpenChange?.(val)
    else setInternalOpen(val)
  }

  const [view, setView] = React.useState<"template" | "editor">("template")
  const [internalFormId, setInternalFormId] = React.useState<string | undefined>(propFormId)

  const effectiveFormId = propFormId || internalFormId
  const isCreate = !effectiveFormId

  // ─── States (same as both your codes) ─────────────────────────────────
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const [form, setForm] = React.useState<FormData>({
    name: "",
    description: "",
    is_active: false,
    success_message: "Thank you for your submission!",
    redirect_url: "",
  })

  const [sections, setSections] = React.useState<Section[]>([])

  const [selectedField, setSelectedField] = React.useState<{
    sectionTempId: string
    fieldTempId: string
  } | null>(null)

  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  const sectionTitleInputRefs = React.useRef<Map<string, HTMLInputElement>>(new Map())

  // ─── Reset when dialog opens ─────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return

    if (effectiveFormId) {
      // Edit mode
      setView("editor")
      setLoading(true)
      loadForm()
    } else {
      // Create mode → show template picker
      setView("template")
      setSelectedTemplateId(null)
      setForm({
        name: "",
        description: "",
        is_active: false,
        success_message: "Thank you for your submission!",
        redirect_url: "",
      })
      setSections([])
      setLoading(false)
    }
  }, [open, effectiveFormId])

  // ─── Load existing form (from your second code) ──────────────────────
  const loadForm = async () => {
    if (!effectiveFormId) return
    setLoading(true)

    try {
      const formRes = await axiosClient.get(`/forms/${effectiveFormId}`)
      const data = formRes.data?.data || formRes.data

      setForm({
        id: data.id,
        name: data.name || "Untitled Form",
        description: data.description || "",
        is_active: !!data.is_active,
        success_message: data.success_message || "Thank you!",
        redirect_url: data.redirect_url || "",
      })

      // Try different possible nesting patterns
      const possibleSections = [
        data.sections,
        data.form_sections,
        data.section,
        data.children,
      ].find(Array.isArray) || []

      let loadedSections: Section[] = []

      if (possibleSections.length > 0) {
        loadedSections = possibleSections.map((s: any, i: number) => {
          const fieldsArray = s.fields || s.form_fields || s.inputs || s.children || s.items || []
          return {
            id: s.id,
            tempId: `sec-${s.id || Date.now() + i}`,
            title: s.title || `Section ${i + 1}`,
            order: s.order ?? i,
            collapsed: false,
            fields: Array.isArray(fieldsArray)
              ? fieldsArray.map((f: any, fi: number) => ({
                  id: f.id,
                  tempId: `f-${f.id || Date.now() + fi}`,
                  type: f.type || "text",
                  label: f.label || "Untitled field",
                  key: f.key,
                  placeholder: f.placeholder || f.options?.placeholder || "",
                  required: !!f.is_required,
                  options: f.options?.choices || f.options || undefined,
                  order: f.order ?? fi,
                  expanded: false,
                }))
              : [],
          }
        })
        loadedSections.sort((a, b) => a.order - b.order)
      }

      if (loadedSections.length === 0) {
        loadedSections = [{
          tempId: "sec-main-" + Date.now(),
          title: "Main Section",
          order: 0,
          collapsed: false,
          fields: [],
        }]
      }

      setSections(loadedSections)
    } catch {
      showToast("Failed to load form", "error")
      setSections([{
        tempId: "sec-main-" + Date.now(),
        title: "Main Section",
        order: 0,
        collapsed: false,
        fields: [],
      }])
    } finally {
      setLoading(false)
    }
  }

  // ─── Template Selection (inside dialog) ───────────────────────────────
  const applyTemplate = (templateId: string) => {
    const template = FORM_TEMPLATES.find(t => t.id === templateId)
    if (!template) return

    const initial = template.getInitialData()
    setForm({
      name: initial.name,
      description: initial.description || "",
      is_active: false,
      success_message: "Thank you for your submission!",
      redirect_url: "",
    })
    setSections(initial.sections.map(s => ({ ...s, collapsed: false })))
    setView("editor")
    setSelectedTemplateId(null)
    showToast(`Template "${template.name}" loaded`, "success")
  }

  // ─── Core CRUD functions (merged from both codes) ─────────────────────
  const addSection = () => {
    const newTempId = Date.now().toString()
    setSections(prev => [...prev, {
      tempId: newTempId,
      title: `Section ${prev.length + 1}`,
      order: prev.length,
      collapsed: false,
      fields: [],
    }])
  }

  const updateSection = (tempId: string, updates: Partial<Section>) => {
    setSections(prev => prev.map(s => s.tempId === tempId ? { ...s, ...updates } : s))
  }

  const deleteSection = (section: Section) => {
    if (section.id) axiosClient.delete(`/sections/${section.id}`).catch(() => {})
    setSections(prev => prev.filter(s => s.tempId !== section.tempId))
    if (selectedField?.sectionTempId === section.tempId) setSelectedField(null)
  }

  const addField = (sectionTempId: string, type: string) => {
    setSections(prev => prev.map(sec => {
      if (sec.tempId !== sectionTempId) return sec
      const newField: Field = {
        tempId: Date.now().toString(),
        type,
        label: "New Field",
        required: false,
        placeholder: supportsPlaceholder.has(type) ? "" : undefined,
        options: supportsOptions.has(type) ? [{ label: "Option 1", value: "opt1" }] : undefined,
        order: sec.fields.length,
        expanded: true,
      }
      return { ...sec, fields: [...sec.fields, newField] }
    }))
  }

  const updateField = (sectionTempId: string, fieldTempId: string, updates: Partial<Field>) => {
    setSections(prev => prev.map(sec =>
      sec.tempId === sectionTempId
        ? { ...sec, fields: sec.fields.map(f => f.tempId === fieldTempId ? { ...f, ...updates } : f) }
        : sec
    ))
  }

  const removeField = (sectionTempId: string, fieldTempId: string) => {
    setSections(prev => prev.map(sec =>
      sec.tempId === sectionTempId
        ? { ...sec, fields: sec.fields.filter(f => f.tempId !== fieldTempId) }
        : sec
    ))
    if (selectedField?.fieldTempId === fieldTempId) setSelectedField(null)
  }

  const toggleFieldExpand = (sectionTempId: string, fieldTempId: string) => {
    setSections(prev => prev.map(sec =>
      sec.tempId === sectionTempId
        ? { ...sec, fields: sec.fields.map(f => f.tempId === fieldTempId ? { ...f, expanded: !f.expanded } : f) }
        : sec
    ))
  }

  const generateKey = (label: string) =>
    label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Section drag
    if (activeId.startsWith("sec-") && overId.startsWith("sec-")) {
      const oldIndex = sections.findIndex(s => `sec-${s.tempId}` === activeId)
      const newIndex = sections.findIndex(s => `sec-${s.tempId}` === overId)
      if (oldIndex !== -1 && newIndex !== -1) {
        setSections(arrayMove(sections, oldIndex, newIndex).map((s, i) => ({ ...s, order: i })))
      }
      return
    }

    // Field drag (same section)
    let fromSection: Section | undefined
    let fromIdx = -1
    let toSection: Section | undefined
    let toIdx = -1

    for (const sec of sections) {
      const fi = sec.fields.findIndex(f => f.tempId === activeId)
      if (fi !== -1) { fromSection = sec; fromIdx = fi }
      const ti = sec.fields.findIndex(f => f.tempId === overId)
      if (ti !== -1) { toSection = sec; toIdx = ti }
    }

    if (fromSection && toSection && fromSection.tempId === toSection.tempId) {
      const newFields = arrayMove(fromSection.fields, fromIdx, toIdx)
      setSections(prev => prev.map(s =>
        s.tempId === fromSection!.tempId
          ? { ...s, fields: newFields.map((f, i) => ({ ...f, order: i })) }
          : s
      ))
    }
  }

  // ─── Save (merged - creates new form inside dialog, no redirect) ───────
  const saveForm = async (publish = false) => {
    if (!form.name.trim()) {
      showToast("Form name is required", "error")
      return
    }

    setSaving(true)
    try {
      let savedFormId = effectiveFormId ? Number(effectiveFormId) : null

      const formPayload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        is_active: publish || form.is_active,
        success_message: form.success_message?.trim() || null,
        redirect_url: form.redirect_url?.trim() || null,
      }

      if (savedFormId) {
        await axiosClient.put(`/forms/${savedFormId}`, formPayload)
      } else {
        const res = await axiosClient.post("/forms", formPayload)
        savedFormId = res.data.data.id
        setInternalFormId(savedFormId.toString()) // now we have an ID
      }

      // Save sections + fields
      for (let secIndex = 0; secIndex < sections.length; secIndex++) {
        const section = sections[secIndex]
        let sectionId = section.id

        const secPayload = {
          title: section.title.trim() || "Untitled Section",
          order: secIndex,
        }

        if (!sectionId) {
          const res = await axiosClient.post(`/forms/${savedFormId}/sections`, secPayload)
          sectionId = res.data.data.id
        } else {
          await axiosClient.put(`/sections/${sectionId}`, secPayload)
        }

        for (let fieldIndex = 0; fieldIndex < section.fields.length; fieldIndex++) {
          const field = section.fields[fieldIndex]
          const isChoiceField = ["select", "radio", "checkbox"].includes(field.type)

          const fieldPayload: any = {
            form_section_id: sectionId,
            label: field.label.trim(),
            key: field.key || generateKey(field.label),
            type: field.type,
            is_required: field.required ?? field.is_required ?? false,
            is_active: true,
            order: fieldIndex,
            options: {},
          }

          if (field.placeholder) fieldPayload.options.placeholder = field.placeholder.trim()
          if (isChoiceField && Array.isArray(field.options)) {
            fieldPayload.options.choices = field.options.map((o: any) => ({
              label: o.label?.trim() || "",
              value: o.value?.trim() || generateKey(o.label || ""),
            }))
          }

          if (field.id) {
            await axiosClient.put(`/fields/${field.id}`, fieldPayload)
          } else {
            await axiosClient.post(`/forms/${savedFormId}/fields`, fieldPayload)
          }
        }
      }

      showToast(publish ? "Form published!" : "Form saved successfully", "success")
      onFormSaved?.(savedFormId.toString())

      // If it was a brand new form, stay in editor with the new ID
      if (!effectiveFormId && savedFormId) {
        setInternalFormId(savedFormId.toString())
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Save failed", "error")
    } finally {
      setSaving(false)
    }
  }

  // ─── Live Button Action (exactly as requested) ───────────────────────
  const handleLiveButton = () => {
    if (effectiveFormId) {
      alert(`✅ Form is now LIVE!\n\nForm ID: ${effectiveFormId}\n\nYou can use this ID to embed the form or share the live link.`)
      setOpen(false) // close dialog
    }
  }

  // ─── Template Picker UI (from your first code) ───────────────────────
  if (!open) return null

  if (view === "template") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto p-0">
          <div className="p-8">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-center">Create a New Form</DialogTitle>
              <p className="text-center text-muted-foreground mt-2">Choose a template to get started quickly</p>
            </DialogHeader>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {FORM_TEMPLATES.map((template) => {
                const Icon = template.icon
                const isSelected = selectedTemplateId === template.id
                return (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${isSelected ? "border-primary shadow-lg ring-1 ring-primary" : ""}`}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                          <CardDescription className="mt-1.5">{template.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          applyTemplate(template.id)
                        }}
                      >
                        {isSelected ? "Selected" : "Use this template"}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="mt-12 text-center">
              <Button
                variant="link"
                onClick={() => applyTemplate("blank")}
                className="text-muted-foreground hover:text-primary"
              >
                ← Or start with a completely blank form
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ─── Editor UI (merged - left editor + right live preview) ───────────
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-auto p-0">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <ArrowLeft />
              </Button>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {effectiveFormId ? "Edit Form" : "New Form"}
                  {selectedTemplateId && (
                    <span className="ml-2 text-base font-normal text-muted-foreground">
                      ({FORM_TEMPLATES.find(t => t.id === selectedTemplateId)?.name})
                    </span>
                  )}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">Click any field in preview to edit</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* LIVE BUTTON - exactly as requested */}
              {effectiveFormId && (
                <Button variant="default" onClick={handleLiveButton}>
                  <Check className="mr-2 h-4 w-4" />
                  Live
                </Button>
              )}

              <Button variant="outline" disabled={saving} onClick={() => saveForm(false)}>
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>

              <Button disabled={saving} onClick={() => saveForm(true)}>
                <Check className="mr-2 h-4 w-4" />
                {form.is_active ? "Update & Publish" : "Publish"}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex h-96 items-center justify-center text-muted-foreground">Loading form...</div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              {/* LEFT: Editor */}
              <div className="space-y-6">
                {/* Form Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Form Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Form Title *</Label>
                      <Input
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Customer Feedback Survey"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={form.description}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Brief description or instructions..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Sections & Fields */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Form Structure</CardTitle>
                      <CardDescription>Drag to reorder • Click field in preview to jump</CardDescription>
                    </div>
                    <Button onClick={addSection} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Section
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={sections.map(s => `sec-${s.tempId}`)} strategy={verticalListSortingStrategy}>
                        {sections.map(section => (
                          <SortableSection
                            key={section.tempId}
                            section={section}
                            updateSection={updateSection}
                            deleteSection={deleteSection}
                            addField={addField}
                            updateField={updateField}
                            removeField={removeField}
                            toggleFieldExpand={toggleFieldExpand}
                            selectedField={selectedField}
                            setSelectedField={setSelectedField}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>

                    {sections.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                        No sections yet — add one above
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT: Live Preview */}
              <div className="sticky top-6">
                <LivePreview
                  formData={form}
                  sections={sections}
                  onFieldSelect={(sectionTempId, fieldTempId) => {
                    setSelectedField({ sectionTempId, fieldTempId })
                    updateField(sectionTempId, fieldTempId, { expanded: true })
                    updateSection(sectionTempId, { collapsed: false })
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── SortableSection (from your second code) ────────────────────────────
function SortableSection({
  section,
  updateSection,
  deleteSection,
  addField,
  updateField,
  removeField,
  toggleFieldExpand,
  selectedField,
  setSelectedField,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `sec-${section.tempId}` })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="mb-6 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <Input
          value={section.title}
          onChange={e => updateSection(section.tempId, { title: e.target.value })}
          className="border-0 bg-transparent font-semibold focus-visible:ring-0 px-0"
          placeholder="Section title"
        />
        <Button variant="ghost" size="icon" onClick={() => updateSection(section.tempId, { collapsed: !section.collapsed })}>
          {section.collapsed ? <ChevronDown /> : <ChevronUp />}
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSection(section)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {!section.collapsed && (
        <div className="p-4">
          <SortableContext items={section.fields.map((f: any) => f.tempId)} strategy={verticalListSortingStrategy}>
            {section.fields.map((field: any) => (
              <SortableField
                key={field.tempId}
                sectionTempId={section.tempId}
                field={field}
                updateField={updateField}
                removeField={removeField}
                toggleExpand={() => toggleFieldExpand(section.tempId, field.tempId)}
                isSelected={selectedField?.fieldTempId === field.tempId}
              />
            ))}
          </SortableContext>

          <div className="mt-4">
            <Select onValueChange={type => addField(section.tempId, type)}>
              <SelectTrigger className="border-dashed">
                <SelectValue placeholder="+ Add Field" />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <t.icon className="h-4 w-4" />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SortableField (from your second code) ──────────────────────────────
function SortableField({
  sectionTempId,
  field,
  updateField,
  removeField,
  toggleExpand,
  isSelected,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.tempId })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-3 p-3 border rounded-md bg-white transition-all ${isSelected ? "ring-2 ring-primary shadow-md" : "hover:border-primary/50"}`}
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-1">
          <div className="font-medium">{field.label || "Untitled field"}</div>
          <div className="text-xs text-muted-foreground">{field.type}</div>
        </div>

        <Button variant="ghost" size="icon" onClick={toggleExpand}>
          {field.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeField(sectionTempId, field.tempId)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {field.expanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          <div className="space-y-2">
            <Label>Field Label</Label>
            <Input
              value={field.label}
              onChange={e => updateField(sectionTempId, field.tempId, { label: e.target.value })}
            />
          </div>

          {supportsPlaceholder.has(field.type) && (
            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={field.placeholder || ""}
                onChange={e => updateField(sectionTempId, field.tempId, { placeholder: e.target.value })}
                placeholder="Enter placeholder text..."
              />
            </div>
          )}

          {supportsOptions.has(field.type) && (
            <div className="space-y-2">
              <Label>Options</Label>
              {(field.options as { label: string; value: string }[] || []).map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={opt.label}
                    onChange={e => {
                      const newOptions = [...(field.options as any[] || [])]
                      newOptions[idx] = { ...newOptions[idx], label: e.target.value }
                      updateField(sectionTempId, field.tempId, { options: newOptions })
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newOptions = (field.options as any[] || []).filter((_, i) => i !== idx)
                      updateField(sectionTempId, field.tempId, { options: newOptions })
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOptions = [
                    ...(field.options as any[] || []),
                    { label: `Option ${(field.options as any[] || []).length + 1}`, value: `opt${Date.now()}` },
                  ]
                  updateField(sectionTempId, field.tempId, { options: newOptions })
                }}
              >
                Add Option
              </Button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`required-${field.tempId}`}
              checked={field.required ?? field.is_required ?? false}
              onCheckedChange={checked => updateField(sectionTempId, field.tempId, { required: !!checked })}
            />
            <Label htmlFor={`required-${field.tempId}`}>Required</Label>
          </div>
        </div>
      )}
    </div>
  )
}