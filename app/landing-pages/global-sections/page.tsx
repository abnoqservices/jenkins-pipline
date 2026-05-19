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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { GripVertical, Plus, Trash2, Save } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import axiosClient from "@/lib/axiosClient"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type Field = {
  key: string
  label: string
  type: "text" | "textarea" | "number" | "boolean" | "url" | "email" | "date" | "file" | "image"
  required?: boolean
  analytics?: boolean
  tempId?: string
}

type Section = {
  id?: number
  key: string
  name: string
  group: string
  sub_group: string | null
  description: string
  schema: {
    component: string
    fields: Field[]
  }
  is_active: boolean
  sort_order: number
  tempId?: string
}

const FIELD_TYPES = ["text", "textarea", "number", "boolean", "url", "email", "date", "file", "image"] as const
const GROUPS = ["content", "media", "social", "conversion"] as const

// Sortable Accordion Item Wrapper
function SortableSection({ section, children }: { section: Section; children: React.ReactNode }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: section.id ?? section.tempId! })
  
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }
  
    return (
      <AccordionItem
        value={section.id?.toString() ?? section.tempId!}
        ref={setNodeRef}
        style={style}
        className="overflow-hidden rounded-xl border bg-card  hover: transition-shadow duration-200"
      >
        <AccordionTrigger className="px-6 py-5 hover:no-underline bg-muted/40">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing touch-none"
              >
                <GripVertical className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground">
                  {section.name || "(Untitled Section)"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Key: <code className="mx-1 px-2 py-0.5 bg-background rounded text-xs">{section.key || "—"}</code>
                  • Group: <span className="capitalize">{section.group}</span>
                  • Order: {section.sort_order}
                </p>
              </div>
            </div>
  
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={section.is_active}
                  onCheckedChange={(v) => updateSection(section.id ?? section.tempId!, "is_active", v)}
                />
                <span className="text-sm font-medium">{section.is_active ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>
        </AccordionTrigger>
  
        <AccordionContent className="border-t bg-card">
          <div className="p-6 space-y-6">
            {children}
          </div>
        </AccordionContent>
      </AccordionItem>
    )
  }

export default function GlobalLandingPageSections() {
  const [sections, setSections] = React.useState<Section[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  React.useEffect(() => {
    async function loadSections() {
      try {
        const res = await axiosClient.get("/admin/landing-page/sections")
        console.log("Fetched sections:", res.data)
        if (res.data.success) {
          // Ensure sort_order is correct based on array order
          const sorted = res.data.data.sort((a: any, b: any) => a.sort_order - b.sort_order)
          setSections(sorted)
        }
      } catch (err) {
        console.error("Failed to load sections:", err)
      } finally {
        setLoading(false)
      }
    }
    loadSections()
  }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((s) => (s.id ?? s.tempId) === active.id)
        const newIndex = items.findIndex((s) => (s.id ?? s.tempId) === over?.id)

        const newItems = arrayMove(items, oldIndex, newIndex)

        // Update sort_order based on new position
        return newItems.map((item, index) => ({
          ...item,
          sort_order: index,
        }))
      })
    }
  }

  // ... [keep all your updateSection, updateComponent, updateField, addField, removeField, addSection, removeSection functions as before]

  const updateSection = (id: number | string, key: keyof Section, value: any) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id || s.tempId === id ? { ...s, [key]: value } : s))
    )
  }

  const updateComponent = (id: number | string, component: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === id || s.tempId === id
          ? { ...s, schema: { ...s.schema, component } }
          : s
      )
    )
  }

  const updateField = (
    sectionId: number | string,
    fieldTempId: string,
    fieldKey: keyof Field,
    value: any
  ) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === sectionId || s.tempId === sectionId) {
          return {
            ...s,
            schema: {
              ...s.schema,
              fields: s.schema.fields.map((f) =>
                f.tempId === fieldTempId ? { ...f, [fieldKey]: value } : f
              ),
            },
          }
        }
        return s
      })
    )
  }

  const addField = (sectionId: number | string) => {
    const newField: Field = {
      key: "",
      label: "",
      type: "text",
      required: false,
      analytics: false,
      tempId: Date.now().toString(),
    }
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId || s.tempId === sectionId
          ? { ...s, schema: { ...s.schema, fields: [...s.schema.fields, newField] } }
          : s
      )
    )
  }

  const removeField = (sectionId: number | string, fieldTempId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId || s.tempId === sectionId
          ? {
              ...s,
              schema: {
                ...s.schema,
                fields: s.schema.fields.filter((f) => f.tempId !== fieldTempId),
              },
            }
          : s
      )
    )
  }

  const addSection = () => {
    const newSection: Section = {
      key: "",
      name: "",
      group: "content",
      sub_group: null,
      description: "",
      schema: { component: "", fields: [] },
      is_active: true,
      sort_order: sections.length,
      tempId: Date.now().toString(),
    }
    setSections([...sections, newSection])
  }

  const removeSection = async (section: Section) => {
    if (section.id) {
      try {
        await axiosClient.delete(`/admin/landing-page/sections/${section.id}`)
      } catch (err) {
        console.error("Delete failed:", err)
      }
    }
    setSections((prev) => prev.filter((s) => (s.id ?? s.tempId) !== (section.id ?? section.tempId)))
  }

  const saveAll = async () => {
    // ... [same as before]
    setSaving(true)
    try {
      const newSections = sections.filter((s) => !s.id)
      for (const sec of newSections) {
        await axiosClient.post("/admin/landing-page/sections", {
          key: sec.key,
          name: sec.name,
          group: sec.group,
          sub_group: sec.sub_group,
          description: sec.description,
          schema: sec.schema,
          is_active: sec.is_active,
          sort_order: sec.sort_order,
        })
      }

      const existingSections = sections.filter((s): s is Section & { id: number } => !!s.id)
      for (const sec of existingSections) {
        await axiosClient.put(`/admin/landing-page/sections/${sec.id}`, {
          key: sec.key,
          name: sec.name,
          group: sec.group,
          sub_group: sec.sub_group,
          description: sec.description,
          schema: sec.schema,
          is_active: sec.is_active,
          sort_order: sec.sort_order,
        })
      }

      alert("All changes saved successfully!")
      const res = await axiosClient.get("/admin/landing-page/sections")
      if (res.data.success) {
        const sorted = res.data.data.sort((a: any, b: any) => a.sort_order - b.sort_order)
        setSections(sorted)
      }
    } catch (err: any) {
      alert("Save failed: " + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-10 flex items-center justify-center">
          <Spinner className="size-8" />
        </div>
      </DashboardLayout>
    )
  }

  const items = sections.map((s) => s.id ?? s.tempId!)

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Global Landing Page Sections</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Drag to reorder • Click to expand • Changes saved on "Save All"
            </p>
          </div>
          <Button onClick={saveAll} disabled={saving} className="gap-2">
            {saving ? <Spinner className="size-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
<DndContext
    sensors={sensors}
    collisionDetection={closestCenter}
    onDragEnd={handleDragEnd}
  >
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <Accordion type="multiple" className="space-y-6">
        {sections.map((section) => (
          <SortableSection key={section.id ?? section.tempId} section={section}>
            <div className="px-6 py-8 space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Section Name</Label>
                    <Input
                      value={section.name}
                      onChange={(e) => updateSection(section.id ?? section.tempId!, "name", e.target.value)}
                      placeholder="Hero Section"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Key (unique)</Label>
                    <Input
                      value={section.key}
                      onChange={(e) => updateSection(section.id ?? section.tempId!, "key", e.target.value)}
                      placeholder="hero"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Component Name</Label>
                    <Input
                      value={section.schema.component}
                      onChange={(e) => updateComponent(section.id ?? section.tempId!, e.target.value)}
                      placeholder="HeroSection"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={section.sort_order}
                      onChange={(e) => updateSection(section.id ?? section.tempId!, "sort_order", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Group</Label>
                    <Select
                      value={section.group}
                      onValueChange={(v) => updateSection(section.id ?? section.tempId!, "group", v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GROUPS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sub Group (optional)</Label>
                    <Input
                      value={section.sub_group ?? ""}
                      onChange={(e) => updateSection(section.id ?? section.tempId!, "sub_group", e.target.value || null)}
                      placeholder="e.g., carousel"
                    />
                  </div>
                  <div className="flex items-end space-x-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={section.is_active}
                        onCheckedChange={(v) => updateSection(section.id ?? section.tempId!, "is_active", v)}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={section.description}
                    onChange={(e) => updateSection(section.id ?? section.tempId!, "description", e.target.value)}
                    placeholder="Brief description of this section..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Schema Fields */}
              <div className="pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Schema Fields</h3>
                  <Button size="sm" onClick={() => addField(section.id ?? section.tempId!)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Field
                  </Button>
                </div>

                <div className="space-y-4">
                  {section.schema.fields.map((field) => (
                    <div
                      key={field.tempId}
                      className="flex items-center gap-4 rounded-lg border bg-background p-4"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Key</Label>
                          <Input
                            value={field.key}
                            onChange={(e) => updateField(section.id ?? section.tempId!, field.tempId!, "key", e.target.value)}
                            placeholder="heading"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(section.id ?? section.tempId!, field.tempId!, "label", e.target.value)}
                            placeholder="Heading"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(v) => updateField(section.id ?? section.tempId!, field.tempId!, "type", v)}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col justify-end gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={field.required ?? false}
                              onCheckedChange={(v) => updateField(section.id ?? section.tempId!, field.tempId!, "required", v)}
                            />
                            <Label className="text-xs">Required</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={field.analytics ?? false}
                              onCheckedChange={(v) => updateField(section.id ?? section.tempId!, field.tempId!, "analytics", v)}
                            />
                            <Label className="text-xs">Analytics</Label>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeField(section.id ?? section.tempId!, field.tempId!)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {section.schema.fields.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No fields yet. Add one to get started.</p>
                  )}
                </div>
              </div>
            </div>
          </SortableSection>
        ))}
      </Accordion>
    </SortableContext>
  </DndContext>

        <Button variant="outline" className="w-full h-16 text-lg gap-3 mt-8" onClick={addSection}>
          <Plus className="h-6 w-6" />
          Add New Global Section
        </Button>
      </div>
    </DashboardLayout>
  )
}