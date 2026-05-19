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
  ArrowLeft, Save, Check, Plus, GripVertical, Trash2,
  ChevronDown, ChevronUp, Pencil, UserPlus, Mail, Type,
  Hash, Phone, Calendar, CheckSquare,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"

import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove, SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import LivePreview from "@/components/form-component/LivePreview"

// ─── Field Types ────────────────────────────────────────────────────────
const fieldTypes = [
  { value: "text",       label: "Short text",     icon: Type },
  { value: "textarea",   label: "Paragraph",      icon: Type },
  { value: "email",      label: "Email",          icon: Mail },
  { value: "number",     label: "Number",         icon: Hash },
  { value: "phone",      label: "Phone",          icon: Phone },
  { value: "date",       label: "Date",           icon: Calendar },
  { value: "select",     label: "Dropdown",       icon: ChevronDown },
  { value: "radio",      label: "Single choice",  icon: CheckSquare },
  { value: "checkbox",   label: "Multiple choice",icon: CheckSquare },
]

const supportsPlaceholder = new Set(["text", "textarea", "email", "number", "phone", "date"])
const supportsOptions    = new Set(["select", "radio", "checkbox"])

// ─── Templates (only used when creating new form) ──────────────────────
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
    id: "contact",
    name: "Contact Us",
    description: "Simple contact form",
    icon: Mail,
    getInitialData: () => ({
      name: "Contact Us",
      description: "Get in touch with us",
      sections: [{
        tempId: "sec-contact-" + Date.now(),
        title: "Contact Information",
        order: 0,
        collapsed: false,
        fields: [
          { tempId: "f1", type: "text", label: "Full Name", placeholder: "Your name", is_required: true, order: 0 },
          { tempId: "f2", type: "email", label: "Email", placeholder: "you@example.com", is_required: true, order: 1 },
          { tempId: "f3", type: "textarea", label: "Message", placeholder: "Your message...", is_required: true, order: 2 },
        ]
      }]
    })
  },
  // Add more templates if needed
]

// ─── Types ──────────────────────────────────────────────────────────────
interface Field {
  id?: number
  tempId: string
  type: string
  label: string
  key?: string
  placeholder?: string
  is_required: boolean
  options?: any
  order: number
  expanded?: boolean
  rules?: any[]
  conditions?: any | null
}

interface Section {
  id?: number
  tempId: string
  title: string
  order: number
  collapsed: boolean
  fields: Field[]
}

interface FormData {
  id?: number
  name: string
  description: string
  is_active: boolean
  success_message?: string
  redirect_url?: string
}

// ─── Main Component ─────────────────────────────────────────────────────
export default function FormEditorPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params?.id || params?.slug

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

  const [showTemplatePicker, setShowTemplatePicker] = React.useState(!formId)
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null)

  const [selectedField, setSelectedField] = React.useState<{
    sectionTempId: string
    fieldTempId: string
  } | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  React.useEffect(() => {
    if (formId) {
      loadForm()
      setShowTemplatePicker(false)
    } else if (selectedTemplateId) {
      applyTemplate()
      setShowTemplatePicker(false)
      setLoading(false)
    }
  }, [formId, selectedTemplateId])

  const applyTemplate = () => {
    const template = FORM_TEMPLATES.find(t => t.id === selectedTemplateId)
    if (!template) return

    const data = template.getInitialData()
    setForm({
      name: data.name,
      description: data.description,
      is_active: false,
    })
    setSections(data.sections.map(s => ({ ...s, collapsed: false })))
  }

  const loadForm = async () => {
    if (!formId) return
    setLoading(true)
  
    try {
      // 1. Load form → sections should come nested inside
      const formRes = await axiosClient.get(`/forms/${formId}`)
      console.log("[DEBUG] Full form response:", formRes.data)
  
      let data = formRes.data?.data || formRes.data
  
      if (!data) throw new Error("No form data received")
  
      // Set main form fields
      setForm({
        id: data.id,
        name: data.name || "Untitled Form",
        description: data.description || "",
        is_active: !!data.is_active,
        success_message: data.success_message || "Thank you!",
        redirect_url: data.redirect_url || "",
      })
  
      // 2. Load sections FROM THE SAME RESPONSE (most important fix)
      let loadedSections: Section[] = []
  
      // Try different common nesting patterns your backend might use
      const possibleSections = [
        data.sections,
        data.form_sections,
        data.section,
        data.children,
        // fallback: empty array
      ].find(Array.isArray) || []
  
      if (possibleSections.length > 0) {
        loadedSections = possibleSections.map((s: any, i: number) => {
          console.log("[DEBUG] Processing section:", s)
  
          const fieldsArray =
            s.fields ||
            s.form_fields ||
            s.inputs ||
            s.children ||
            s.items ||
            []
  
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
                  is_required: !!f.is_required,
                  options: f.options?.choices || f.options || undefined,
                  rules: f.rules || [],
                  conditions: f.conditions || null,
                  order: f.order ?? fi,
                  expanded: false,
                }))
              : [],
          }
        })
  
        loadedSections.sort((a, b) => a.order - b.order)
        console.log("[DEBUG] Loaded sections:", loadedSections)
      }
  
      // Fallback if still no sections
      if (loadedSections.length === 0) {
        console.warn("No sections found in response → using fallback")
        loadedSections = [{
          tempId: "sec-main-" + Date.now(),
          title: "Main Section",
          order: 0,
          collapsed: false,
          fields: [],
        }]
      }
  
      setSections(loadedSections)
  
    } catch (err: any) {
      console.error("[ERROR] Load form failed:", err)
      showToast("Failed to load form data", "error")
      // Fallback UI
      setSections([{
        tempId: "error-fallback-" + Date.now(),
        title: "Main Section (fallback)",
        order: 0,
        collapsed: false,
        fields: [],
      }])
    } finally {
      setLoading(false)
    }
  }
  const addSection = () => {
    const newId = Date.now().toString()
    setSections(prev => [...prev, {
      tempId: newId,
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
    if (section.id) {
      axiosClient.delete(`/sections/${section.id}`).catch(() => {})
    }
    setSections(prev => prev.filter(s => s.tempId !== section.tempId))
  }

  const addField = (sectionTempId: string, type: string) => {
    setSections(prev => prev.map(sec => {
      if (sec.tempId !== sectionTempId) return sec
      const newField: Field = {
        tempId: Date.now().toString(),
        type,
        label: "New Field",
        is_required: false,
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
        ? {
            ...sec,
            fields: sec.fields.map(f =>
              f.tempId === fieldTempId ? { ...f, ...updates } : f
            ),
          }
        : sec
    ))
  }

  const removeField = (sectionTempId: string, fieldTempId: string) => {
    setSections(prev => prev.map(sec =>
      sec.tempId === sectionTempId
        ? { ...sec, fields: sec.fields.filter(f => f.tempId !== fieldTempId) }
        : sec
    ))
  }

  const toggleFieldExpand = (sectionTempId: string, fieldTempId: string) => {
    setSections(prev => prev.map(sec =>
      sec.tempId === sectionTempId
        ? {
            ...sec,
            fields: sec.fields.map(f =>
              f.tempId === fieldTempId ? { ...f, expanded: !f.expanded } : f
            ),
          }
        : sec
    ))
  }

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

    // Field drag (same section only)
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
  const generateKey = (label: string): string => {
    return label
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  };
  const saveForm = async (publish: boolean = false) => {
    if (!form.name.trim()) {
      showToast("Form name is required", "error");
      return;
    }
  
    setSaving(true);
    try {
      let savedFormId = formId ? Number(formId) : null;
  
      // 1. Save/Update main Form
      const formPayload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        is_active: publish || form.is_active,
        success_message: form.success_message?.trim() || null,
        redirect_url: form.redirect_url?.trim() || null,
      };
  
      if (savedFormId) {
        await axiosClient.put(`/forms/${savedFormId}`, formPayload);
      } else {
        const res = await axiosClient.post("/forms", formPayload);
        savedFormId = res.data.data.id;
        router.replace(`/forms/${savedFormId}/edit`);
      }
  
      // 2. Save / Update Sections + Fields
      for (let secIndex = 0; secIndex < sections.length; secIndex++) {
        const section = sections[secIndex];
        let sectionId = section.id;
  
        const secPayload = {
          title: section.title.trim() || "Untitled Section",
          order: secIndex,
        };
  
        if (!sectionId) {
          const res = await axiosClient.post(`/forms/${savedFormId}/sections`, secPayload);
          sectionId = res.data.data.id;
        } else {
          await axiosClient.put(`/sections/${sectionId}`, secPayload);
        }
  
        // 3. Save / Update Fields
        for (let fieldIndex = 0; fieldIndex < section.fields.length; fieldIndex++) {
          const field = section.fields[fieldIndex];
  
          const isChoiceField = ["select", "radio", "checkbox"].includes(field.type); // note: removed multi_select if not used
  
          const fieldPayload: any = {
            form_section_id: sectionId,
            label: field.label.trim(),
            key: field.key || generateKey(field.label),
            type: field.type,
            is_required: field.is_required,
            is_active: true,
            order: fieldIndex,
  
            rules: field.rules || [],
            conditions: field.conditions || null,
          };
  
          fieldPayload.options = {};
  
          if (field.placeholder) {
            fieldPayload.options.placeholder = field.placeholder.trim();
          }
  
          if (isChoiceField && Array.isArray(field.options)) {
            fieldPayload.options.choices = field.options.map((o: any) => ({
              label: o.label?.trim() || "",
              value: o.value?.trim() || generateKey(o.label || ""),
            }));
          }
  
          // ... rest of options handling (rating, range, file, etc.) remains the same
  
          if (field.id) {
            await axiosClient.put(`/fields/${field.id}`, fieldPayload);
          } else {
            await axiosClient.post(`/forms/${savedFormId}/fields`, fieldPayload);
            // If you want to store the new ID locally:
            // const res = await ...; updateField(section.tempId, field.tempId, { id: res.data.data.id });
          }
        }
      }
  
      showToast(publish ? "Form published successfully" : "Form saved successfully", "success");
    } catch (err: any) {
      console.error("Save error:", err);
      const msg = err.response?.data?.message || "Failed to save form";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  // ─── Template Picker (only for new forms) ──────────────────────────────
  if (!formId && showTemplatePicker) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-12 max-w-5xl">
          <h1 className="text-3xl font-bold text-center mb-2">Create New Form</h1>
          <p className="text-center text-muted-foreground mb-10">Choose a template or start blank</p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FORM_TEMPLATES.map(template => {
              const Icon = template.icon
              const isSelected = selectedTemplateId === template.id
              return (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${isSelected ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/50"}`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{template.name}</CardTitle>
                        <CardDescription className="mt-1">{template.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant={isSelected ? "default" : "outline"} className="w-full">
                      {isSelected ? "Selected" : "Use Template"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="text-center mt-10">
            <Button variant="link" onClick={() => setSelectedTemplateId("blank")}>
              Start completely from scratch →
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-lg text-muted-foreground">Loading form...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Link href="/forms">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">
                {formId ? "Edit Form" : "Create Form"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {form.name || "Untitled Form"}
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" disabled={saving} onClick={() => saveForm(false)}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button disabled={saving} onClick={() => saveForm(true)}>
              <Check className="mr-2 h-4 w-4" />
              {form.is_active ? "Update & Publish" : "Publish Form"}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Editor */}
          <div className="space-y-6">
            {/* Form Info */}
            <Card>
              <CardHeader>
                <CardTitle>Form Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="form-title">Form Title *</Label>
                  <Input
                    id="form-title"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Customer Feedback Survey"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-desc">Description</Label>
                  <Textarea
                    id="form-desc"
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description or instructions..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Form Structure</CardTitle>
                  <CardDescription>Drag sections and fields to reorder</CardDescription>
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
                    No sections yet — add one to start building your form
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview */}
          <div>
            <LivePreview
              formData={form}
              sections={sections}
              onFieldSelect={(sectionTempId, fieldTempId) => {
                setSelectedField({ sectionTempId, fieldTempId })
                // Expand the field and section
                updateField(sectionTempId, fieldTempId, { expanded: true })
                updateSection(sectionTempId, { collapsed: false })
              }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// ─── SortableSection ────────────────────────────────────────────────────
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
}: {
  section: Section
  updateSection: (tempId: string, updates: Partial<Section>) => void
  deleteSection: (s: Section) => void
  addField: (secTempId: string, type: string) => void
  updateField: (secTempId: string, fieldTempId: string, updates: Partial<Field>) => void
  removeField: (secTempId: string, fieldTempId: string) => void
  toggleFieldExpand: (secTempId: string, fieldTempId: string) => void
  selectedField: { sectionTempId: string; fieldTempId: string } | null
  setSelectedField: React.Dispatch<React.SetStateAction<{ sectionTempId: string; fieldTempId: string } | null>>
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `sec-${section.tempId}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }

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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => updateSection(section.tempId, { collapsed: !section.collapsed })}
        >
          {section.collapsed ? <ChevronDown /> : <ChevronUp />}
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSection(section)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {!section.collapsed && (
        <div className="p-4">
          <SortableContext items={section.fields.map(f => f.tempId)} strategy={verticalListSortingStrategy}>
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

// ─── SortableField ──────────────────────────────────────────────────────
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-3 p-3 border rounded-md bg-white transition-all ${
        isSelected ? "ring-2 ring-primary shadow-md" : "hover:border-primary/50"
      }`}
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

        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => removeField(sectionTempId, field.tempId)}
        >
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
              checked={field.is_required}
              onCheckedChange={checked =>
                updateField(sectionTempId, field.tempId, { is_required: !!checked })
              }
            />
            <Label htmlFor={`required-${field.tempId}`}>Required</Label>
          </div>
        </div>
      )}
    </div>
  )
}