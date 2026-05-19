"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
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
  Lock,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
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
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import LivePreview from "@/components/form-component/LivePreview"
import {
 
  Mail,             // ← keep only one
  ShoppingCart,
  Bell,
  HelpCircle,
  FileText,
  Type,
  Hash,
  Phone,
  Calendar,
  ChevronDown as DownIcon,
  CheckSquare,
} from "lucide-react";
const fieldTypes = [
  { value: "text",      label: "text",            icon: Type },
  { value: "email",     label: "Email",           icon: Mail },
  { value: "number",    label: "Number",          icon: Hash },
  { value: "phone",     label: "Phone",           icon: Phone },
  { value: "date",      label: "Date",            icon: Calendar },
  { value: "select",    label: "Dropdown",        icon: DownIcon },
  { value: "radio",     label: "Single choice",   icon: CheckSquare },
  { value: "checkbox",  label: "Multiple choice", icon: CheckSquare },
]

const supportsPlaceholder = new Set(["text", "email", "number", "phone", "date"])
const supportsOptions   = new Set(["select", "radio", "checkbox"])


// ─── Templates ──────────────────────────────────────────────────
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

  // ────────────────────────────────────────────────
  // Authentication (kept & slightly improved)
  // ────────────────────────────────────────────────
  
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
          {
            tempId: "f-name-" + Date.now(),
            type: "text",
            label: "Full Name",
            placeholder: "John Doe",
            required: true,
            order: 0,
            expanded: false,
          },
          {
            tempId: "f-email-" + Date.now(),
            type: "email",
            label: "Email Address",
            placeholder: "you@example.com",
            required: true,
            order: 1,
            expanded: false,
          },
          {
            tempId: "f-password-" + Date.now(),
            type: "text",
            label: "Password",
            placeholder: "Minimum 8 characters",
            required: true,
            order: 2,
            expanded: false,
          },
          {
            tempId: "f-confirm-" + Date.now(),
            type: "text",
            label: "Confirm Password",
            placeholder: "Repeat password",
            required: true,
            order: 3,
            expanded: false,
          },
          {
            tempId: "f-tos-" + Date.now(),
            type: "checkbox",
            label: "I agree to Terms & Privacy Policy",
            required: true,
            order: 4,
            expanded: false,
          },
        ]
      }]
    })
  },

  // ────────────────────────────────────────────────
  // Very common business forms (2025–2026 standards)
  // ────────────────────────────────────────────────
  {
    id: "contact",
    name: "Contact / General Enquiry",
    description: "Classic contact us form – minimal friction",
    icon: Mail,
    getInitialData: () => ({
      name: "Contact Us",
      description: " We'd love to hear from you!",
      sections: [{
        tempId: "sec-contact-" + Date.now(),
        title: "Get in Touch",
        order: 0,
        collapsed: false,
        fields: [
          {
            tempId: "f-name-" + Date.now(),
            type: "text",
            label: "Name",
            placeholder: "Your name",
            required: true,
            order: 0,
            expanded: false,
          },
          {
            tempId: "f-email-" + Date.now(),
            type: "email",
            label: "Email",
            placeholder: "your@email.com",
            required: true,
            order: 1,
            expanded: false,
          },
          {
            tempId: "f-message-" + Date.now(),
            type: "textarea", // ← assume you add textarea support in fieldTypes & LivePreview
            label: "Message",
            placeholder: "How can we help you today?",
            required: true,
            order: 2,
            expanded: false,
          },
        ]
      }]
    })
  },

  {
    id: "product-enquiry",
    name: "Product Enquiry / Lead Form",
    description: "Qualified lead capture for products/services",
    icon: ShoppingCart, // or Package, Tag, etc. — import from lucide-react
    getInitialData: () => ({
      name: "Product Enquiry",
      description: "Tell us what you're interested in — we'll get back to you quickly",
      sections: [{
        tempId: "sec-product-" + Date.now(),
        title: "Tell Us About Your Needs",
        order: 0,
        collapsed: false,
        fields: [
          {
            tempId: "f-name-" + Date.now(),
            type: "text",
            label: "Full Name",
            required: true,
            order: 0,
          },
          {
            tempId: "f-email-" + Date.now(),
            type: "email",
            label: "Business / Personal Email",
            required: true,
            order: 1,
          },
          {
            tempId: "f-phone-" + Date.now(),
            type: "phone",
            label: "Phone Number",
            placeholder: "+91 ...",
            required: false, // optional → better conversion
            order: 2,
          },
          {
            tempId: "f-product-" + Date.now(),
            type: "select",
            label: "Which product/service interests you?",
            required: true,
            options: [
              { label: "Product A", value: "product-a" },
              { label: "Product B", value: "product-b" },
              { label: "Product C", value: "product-c" },
              { label: "Not sure yet", value: "not-sure" },
            ],
            order: 3,
          },
          {
            tempId: "f-message-" + Date.now(),
            type: "textarea",
            label: "What would you like to know? (budget, quantity, timeline...)",
            placeholder: "Any details that will help us give you the best answer",
            required: false,
            order: 4,
          },
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
          {
            tempId: "f-email-" + Date.now(),
            type: "email",
            label: "Email Address",
            placeholder: "you@example.com",
            required: true,
            order: 0,
            expanded: false,
          },
          // Optional second field — many top newsletters use only email
          {
            tempId: "f-name-" + Date.now(),
            type: "text",
            label: "First Name",
            placeholder: "Optional",
            required: false,
            order: 1,
           
          },
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
          {
            tempId: "f-name-" + Date.now(),
            type: "text",
            label: "Name",
            required: true,
            order: 0,
          },
          {
            tempId: "f-email-" + Date.now(),
            type: "email",
            label: "Email",
            required: true,
            order: 1,
          },
          {
            tempId: "f-subject-" + Date.now(),
            type: "text",
            label: "Subject",
            placeholder: "Brief title of your request",
            required: true,
            order: 2,
          },
          {
            tempId: "f-category-" + Date.now(),
            type: "select",
            label: "Category",
            required: true,
            options: [
              { label: "Technical Issue", value: "tech" },
              { label: "Billing / Payment", value: "billing" },
              { label: "Feature Request", value: "feature" },
              { label: "General Input Field", value: "general" },
              { label: "Other", value: "other" },
            ],
            order: 3,
          },
          {
            tempId: "f-message-" + Date.now(),
            type: "textarea",
            label: "Description",
            placeholder: "Please describe your issue or Input Field in detail...",
            required: true,
            order: 4,
          },
        ]
      }]
    })
  },
];

// ─── Types ──────────────────────────────────────────────────────
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
  status: "draft" | "active"
}

// ─── Main Component ─────────────────────────────────────────────
export default function CreateFormPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params?.id as string | undefined

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const [form, setForm] = React.useState<FormData>({
    name: "",
    description: "",
    status: "draft",
  })

  const [sections, setSections] = React.useState<Section[]>([])

  const [selectedField, setSelectedField] = React.useState<{
    sectionTempId: string
    fieldTempId: string
  } | null>(null)

  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null)
  const [showTemplatePicker, setShowTemplatePicker] = React.useState(!formId)

  const sensors = useSensors(useSensor(PointerSensor))

  const sectionTitleInputRefs = React.useRef<Map<string, HTMLInputElement>>(new Map())

  React.useEffect(() => {
    if (formId) {
      // Edit existing form → load from API
      loadForm()
      setShowTemplatePicker(false)
    } else if (selectedTemplateId) {
      // New form + template chosen → apply it
      const template = FORM_TEMPLATES.find(t => t.id === selectedTemplateId)
      if (template) {
        const initial = template.getInitialData()
        setForm({
          name: initial.name,
          description: initial.description,
          status: "draft",
        })
        setSections(initial.sections)
      }
      setShowTemplatePicker(false)
      setLoading(false)
    }
    // If neither → stay on template picker
  }, [formId, selectedTemplateId])

  const loadForm = async () => {
    try {
      const { data: formRes } = await axiosClient.get(`/forms/${formId}`)
      if (formRes.success) {
        setForm({
          id: formRes.data.id,
          name: formRes.data.name,
          description: formRes.data.description || "",
          status: formRes.data.is_active ? "active" : "draft",
        })
      }

      const { data: secRes } = await axiosClient.get(`/forms/${formId}/sections`)
      if (secRes.success && secRes.data?.length) {
        const loaded = secRes.data.map((s: any, i: number) => ({
          id: s.id,
          tempId: `sec-${s.id}`,
          title: s.title || "Section",
          order: s.order ?? i,
          collapsed: false,
          fields: (s.fields || []).map((f: any, fi: number) => ({
            id: f.id,
            tempId: `f-${f.id}`,
            type: f.type,
            label: f.label,
            required: f.is_required,
            placeholder: f.options?.placeholder || "",
            options: f.options?.choices,
            order: f.order ?? fi,
            expanded: false,
          })),
        }))
        setSections(loaded.sort((a, b) => a.order - b.order))
      }
    } catch {
      showToast("Failed to load form", "error")
    } finally {
      setLoading(false)
    }
  }

  // ─── Template Selection Screen ───────────────────────────────
  if (!formId && showTemplatePicker) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10 max-w-5xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-3">Create a New Form</h1>
            <p className="text-lg text-muted-foreground">
              Choose a template to get started quickly
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FORM_TEMPLATES.map((template) => {
              const Icon = template.icon
              const isSelected = selectedTemplateId === template.id

              return (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                    isSelected ? "border-primary shadow-lg ring-1 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <CardDescription className="mt-1.5">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className="w-full"
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
              onClick={() => setSelectedTemplateId("blank")}
              className="text-muted-foreground hover:text-primary"
            >
              ← Or start with a completely blank form
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-10 text-center">Loading form...</div>
      </DashboardLayout>
    )
  }

  // ─── Rest of your original editor code ───────────────────────
  const addSection = () => {
    const newTempId = Date.now().toString()
    setSections(prev => {
      const newSections = [...prev, {
        tempId: newTempId,
        title: `Section ${prev.length + 1}`,
        order: prev.length,
        fields: [],
        collapsed: false,
      }]
      setTimeout(() => {
        const input = sectionTitleInputRefs.current.get(newTempId)
        if (input) {
          input.focus()
          input.select()
        }
      }, 100)
      return newSections
    })
  }

  const updateSection = (tempId: string, updates: Partial<Section>) => {
    setSections(prev => prev.map(s => s.tempId === tempId ? { ...s, ...updates } : s))
  }

  const deleteSection = (section: Section) => {
    if (section.id) axiosClient.delete(`/sections/${section.id}`).catch(() => {})
    setSections(prev => prev.filter(s => s.tempId !== section.tempId))
    if (selectedField && selectedField.sectionTempId === section.tempId) {
      setSelectedField(null)
    }
  }

  const addField = (sectionTempId: string, type: string) => {
    setSections(prev => prev.map(sec => {
      if (sec.tempId !== sectionTempId) return sec
      const newField: Field = {
        tempId: Date.now().toString(),
        type,
        label: "New Input Field",
        required: false,
        placeholder: supportsPlaceholder.has(type) ? "" : undefined,
        options: supportsOptions.has(type) ? [{ label: "Option 1", value: "option1" }] : undefined,
        order: sec.fields.length,
        expanded: true,
      }
      return { ...sec, fields: [...sec.fields, newField] }
    }))
  }

  const updateField = (sectionTempId: string, fieldTempId: string, updates: Partial<Field>) => {
    setSections(prev => prev.map(sec => {
      if (sec.tempId !== sectionTempId) return sec
      return {
        ...sec,
        fields: sec.fields.map(f => f.tempId === fieldTempId ? { ...f, ...updates } : f)
      }
    }))
  }

  const removeField = (sectionTempId: string, fieldTempId: string) => {
    setSections(prev => prev.map(sec => {
      if (sec.tempId !== sectionTempId) return sec
      return { ...sec, fields: sec.fields.filter(f => f.tempId !== fieldTempId) }
    }))
    if (selectedField?.fieldTempId === fieldTempId) {
      setSelectedField(null)
    }
  }

  const toggleFieldExpand = (sectionTempId: string, fieldTempId: string) => {
    setSections(prev => prev.map(sec => {
      if (sec.tempId !== sectionTempId) return sec
      return {
        ...sec,
        fields: sec.fields.map(f =>
          f.tempId === fieldTempId ? { ...f, expanded: !f.expanded } : f
        )
      }
    }))
  }

  const selectFieldFromPreview = (sectionTempId: string, fieldTempId: string) => {
    setSelectedField({ sectionTempId, fieldTempId })
    updateField(sectionTempId, fieldTempId, { expanded: true })
    setSections(prev => prev.map(s => 
      s.tempId === sectionTempId ? { ...s, collapsed: false } : s
    ))
    setTimeout(() => {
      const el = document.getElementById(`field-wrapper-${fieldTempId}`)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 100)
  }

  const generateKey = (label: string) =>
    label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId.startsWith("sec-") && overId.startsWith("sec-")) {
      const oldIdx = sections.findIndex(s => `sec-${s.tempId}` === activeId)
      const newIdx = sections.findIndex(s => `sec-${s.tempId}` === overId)
      if (oldIdx < 0 || newIdx < 0) return
      const reordered = arrayMove(sections, oldIdx, newIdx)
      setSections(reordered.map((s, i) => ({ ...s, order: i })))
      return
    }

    let fromSec: Section | undefined
    let fromIdx = -1
    let toSec: Section | undefined
    let toIdx = -1

    for (const sec of sections) {
      const fi = sec.fields.findIndex(f => f.tempId === activeId)
      if (fi !== -1) { fromSec = sec; fromIdx = fi }
      const ti = sec.fields.findIndex(f => f.tempId === overId)
      if (ti !== -1) { toSec = sec; toIdx = ti }
    }

    if (fromSec && toSec) {
      if (fromSec.tempId === toSec.tempId) {
        const newFields = arrayMove(fromSec.fields, fromIdx, toIdx)
        setSections(prev => prev.map(s =>
          s.tempId === fromSec!.tempId
            ? { ...s, fields: newFields.map((f, i) => ({ ...f, order: i })) }
            : s
        ))
      }
    }
  }

  const saveForm = async (publish = false) => {
    if (!form.name.trim()) {
      showToast("Form name is required", "error")
      return
    }

    setSaving(true)
    try {
      let formIdToUse = form.id

      const formPayload = {
        name: form.name,
        description: form.description || null,
        is_active: publish,
      }

      if (formIdToUse) {
        await axiosClient.put(`/forms/${formIdToUse}`, formPayload)
      } else {
        const res = await axiosClient.post("/forms", formPayload)
        formIdToUse = res.data.data.id
        router.replace(`/forms/${formIdToUse}/edit`)
      }

      for (const sec of sections) {
        let secId = sec.id
        if (!secId) {
          const res = await axiosClient.post(`/forms/${formIdToUse}/sections`, {
            title: sec.title,
            order: sec.order,
          })
          secId = res.data.data.id
        } else {
          await axiosClient.put(`/sections/${secId}`, {
            title: sec.title,
            order: sec.order,
          })
        }

        for (const field of sec.fields) {
          const payload = {
            form_section_id: secId,
            label: field.label,
            key: field.key || generateKey(field.label),
            type: field.type,
            options: field.options
              ? { choices: field.options }
              : field.placeholder
                ? { placeholder: field.placeholder }
                : {},
            is_required: field.required,
            is_active: true,
            order: field.order,
          }

          if (field.id) {
            await axiosClient.put(`/fields/${field.id}`, payload)
          } else {
            await axiosClient.post(`/forms/${formIdToUse}/fields`, payload)
          }
        }
      }

      showToast(publish ? "Form published!" : "Form saved", "success")
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Save failed", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-4">
            <a href="/forms/new">
              <Button variant="ghost" size="icon"><ArrowLeft /></Button>
            </a>
            <div>
              <h1 className="text-2xl font-bold">
                {formId ? "Edit Form" : "New Form"}
                {!formId && selectedTemplateId && (
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    ({FORM_TEMPLATES.find(t => t.id === selectedTemplateId)?.name})
                  </span>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">Click fields in preview to edit</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" disabled={saving} onClick={() => saveForm(false)}>
              <Save className="mr-2 h-4 w-4" /> Save Draft
            </Button>
            <Button disabled={saving} onClick={() => saveForm(true)}>
              <Check className="mr-2 h-4 w-4" />
              {formId ? "Update & Publish" : "Publish"}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">

          <div className="lg:col-span-2 space-y-6">

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Form Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Form Title *</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Event Registration"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex-row justify-between items-center pb-3">
                <div>
                  <CardTitle>Your Sections & Fields</CardTitle>
                  <CardDescription>Drag to reorder • Click field in preview to jump & edit</CardDescription>
                </div>
                <Button size="sm" onClick={addSection}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Section
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
                        sectionTitleInputRefs={sectionTitleInputRefs}
                        selectedField={selectedField}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {sections.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                    Add a section to begin
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <LivePreview 
              formData={form} 
              sections={sections} 
              onFieldSelect={selectFieldFromPreview}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// ─── SortableSection ────────────────────────────────────────────
function SortableSection({
  section,
  updateSection,
  deleteSection,
  addField,
  updateField,
  removeField,
  toggleFieldExpand,
  sectionTitleInputRefs,
  selectedField,
}: {
  section: Section
  updateSection: (id: string, u: Partial<Section>) => void
  deleteSection: (s: Section) => void
  addField: (secId: string, type: string) => void
  updateField: (secId: string, fId: string, u: Partial<Field>) => void
  removeField: (secId: string, fId: string) => void
  toggleFieldExpand: (secId: string, fId: string) => void
  sectionTitleInputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>
  selectedField: { sectionTempId: string; fieldTempId: string } | null
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `sec-${section.tempId}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  }
  const [selectedValue, setSelectedValue] = React.useState("");
  const titleInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (titleInputRef.current) {
      sectionTitleInputRefs.current.set(section.tempId, titleInputRef.current)
    }
    return () => {
      sectionTitleInputRefs.current.delete(section.tempId)
    }
  }, [section.tempId, sectionTitleInputRefs])

  return (
    <div ref={setNodeRef} style={style} className="mb-6 rounded-lg border bg-white shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>

        <Input
          ref={titleInputRef}
          value={section.title}
          onChange={e => updateSection(section.tempId, { title: e.target.value })}
          className="h-9 flex-1 border-0 bg-transparent px-0 font-semibold focus-visible:ring-0 focus:bg-white transition-colors"
          placeholder="Section name (click to rename)"
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => updateSection(section.tempId, { collapsed: !section.collapsed })}
        >
          {section.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => deleteSection(section)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {!section.collapsed && (
        <div className="p-4">
          <SortableContext items={section.fields.map(f => f.tempId)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {section.fields.map(field => (
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
            </div>
          </SortableContext>

          <div className="mt-5">
  <Select
    value={selectedValue}
    onValueChange={(type) => {
      addField(section.tempId, type);  // your existing function
      setSelectedValue("");            // 🔥 reset dropdown
    }}
  >
    <SelectTrigger className="h-10 border-dashed border-2 text-muted-foreground hover:border-primary/60">
      <SelectValue placeholder="+ Add Field..." />
    </SelectTrigger>

    <SelectContent>
      {fieldTypes.map((t) => (
        <SelectItem key={t.value} value={t.value}>
          <div className="flex items-center gap-2">
            <t.icon className="h-4 w-4" /> {t.label}
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

// ─── SortableField ──────────────────────────────────────────────
function SortableField({
  sectionTempId,
  field,
  updateField,
  removeField,
  toggleExpand,
  isSelected,
}: {
  sectionTempId: string
  field: Field
  updateField: (s: string, f: string, u: Partial<Field>) => void
  removeField: (s: string, f: string) => void
  toggleExpand: () => void
  isSelected: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.tempId })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      id={`field-wrapper-${field.tempId}`}
      ref={setNodeRef}
      style={style}
      className={`
        rounded-lg border bg-white overflow-hidden transition-all duration-200
        ${isSelected 
          ? "ring-2 ring-primary ring-offset-2 shadow-md bg-primary/5" 
          : "shadow-sm hover:shadow hover:border-primary/40"}
      `}
    >
      <div
        className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50"
        onClick={toggleExpand}
      >
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

        <div className="flex-1 flex items-center gap-2">
          <Pencil className="h-3.5 w-3.5 text-gray-500" />
          <span className="font-medium text-gray-800 text-sm truncate">
          {field.label || "Untitled Field"}
        </span>
          {field.required && <span className="text-xs text-red-600">(required)</span>}
        </div>

        <div className="text-gray-400">
          {field.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-600 hover:bg-red-50"
          onClick={e => {
            e.stopPropagation()
            removeField(sectionTempId, field.tempId)
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {field.expanded && (
        <div className="px-4 pb-4 pt-1 border-t bg-gray-200/40">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Field text</Label>
              <Input
                value={field.label}
                onChange={e => updateField(sectionTempId, field.tempId, { label: e.target.value })}
                placeholder="Type your Input Field here..."
                className="h-9"
                autoFocus
              />
            </div>

            {supportsPlaceholder.has(field.type) && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Placeholder / hint</Label>
                <Input
                  value={field.placeholder || ""}
                  onChange={e => updateField(sectionTempId, field.tempId, { placeholder: e.target.value })}
                  placeholder="Example or instruction..."
                  className="h-9"
                />
              </div>
            )}

            {supportsOptions.has(field.type) && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Choices</Label>
                <div className="space-y-2">
                  {(field.options || []).map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={opt.label}
                        onChange={e => {
                          const opts = [...(field.options || [])]
                          opts[i] = {
                            label: e.target.value,
                            value: e.target.value.trim().toLowerCase().replace(/\s+/g, "_") || `opt${i+1}`
                          }
                          updateField(sectionTempId, field.tempId, { options: opts })
                        }}
                        className="h-9"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-500 hover:text-red-600"
                        onClick={() => {
                          const newOpts = (field.options || []).filter((_, idx) => idx !== i)
                          updateField(sectionTempId, field.tempId, { options: newOpts.length ? newOpts : undefined })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      const newOpts = [
                        ...(field.options || []),
                        { label: `Option ${(field.options?.length || 0) + 1}`, value: `opt_${Date.now()}` }
                      ]
                      updateField(sectionTempId, field.tempId, { options: newOpts })
                    }}
                  >
                    + Add choice
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id={`req-${field.tempId}`}
                checked={field.required}
                onCheckedChange={c => updateField(sectionTempId, field.tempId, { required: !!c })}
              />
              <Label htmlFor={`req-${field.tempId}`} className="text-sm cursor-pointer">
                This field is required
              </Label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}