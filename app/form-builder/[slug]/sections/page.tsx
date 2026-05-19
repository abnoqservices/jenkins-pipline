"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader } from "@/components/ui/card"
import { GripVertical, Plus, Trash2, Save, FolderPlus, ListPlus } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import axiosClient from "@/lib/axiosClient"
import { cn } from "@/lib/utils"
import { showToast } from "@/lib/showToast"

// dnd-kit imports
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
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type Section = {
  id: string
  title: string
  order: number
}

function SortableSectionItem({
  section,
  children,
}: {
  section: Section
  children: React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10",
          isDragging && "cursor-grabbing"
        )}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      {children}
    </div>
  )
}

export default function FormSectionsPage() {
  const params = useParams()
  const router = useRouter()

  // Safely extract formId – handle both string and string[] cases
  const formIdRaw = params.slug
  const formId = Array.isArray(formIdRaw) ? formIdRaw[0] : (formIdRaw as string | undefined)

  const [sections, setSections] = React.useState<Section[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  React.useEffect(() => {
    if (!formId || formId === "") {
      showToast("Invalid or missing Form ID in URL", "error")
      setLoading(false)
      return
    }

    async function loadFormSections() {
      try {
        const res = await axiosClient.get(`/forms/${formId}`)
        const data = res.data

        if (data?.success && Array.isArray(data.data?.sections)) {
          setSections(
            data.data.sections.map((s: any) => ({
              id: String(s.id),
              title: s.title || "Untitled Section",
              order: Number(s.order ?? 0),
            }))
          )
        } else {
          showToast(data.message || "No sections found for this form", "warning")
        }
      } catch (err: any) {
        console.error("Failed to load form sections:", err)
        showToast(
          err.response?.data?.message || "Could not load form sections",
          "error"
        )
      } finally {
        setLoading(false)
      }
    }

    loadFormSections()
  }, [formId])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSections((items) => {
      const oldIndex = items.findIndex((i) => i.id === String(active.id))
      const newIndex = items.findIndex((i) => i.id === String(over.id))
      const reordered = arrayMove(items, oldIndex, newIndex)
      return reordered.map((item, idx) => ({ ...item, order: idx }))
    })
  }

  const addSection = () => {
    const newSection: Section = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      title: "New Section",
      order: sections.length,
    }
    setSections([...sections, newSection])
    showToast("New section added — save to persist", "info")
  }

  const updateSectionTitle = (id: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s))
    )
  }

  const removeSection = (id: string) => {
    if (!confirm("Delete this section?\nAssociated fields will be unassigned.")) return

    const section = sections.find((s) => s.id === id)
    if (!section) return

    setSections((prev) => prev.filter((s) => s.id !== id))

    if (!id.startsWith("temp-")) {
      axiosClient
        .delete(`/sections/${id}`)
        .then(() => {
          showToast(`Section "${section.title}" deleted`, "success")
        })
        .catch((err) => {
          showToast(
            err.response?.data?.message || "Failed to delete section",
            "error"
          )
          // rollback
          setSections((prev) => [...prev, section])
        })
    } else {
      showToast("Temporary section removed", "success")
    }
  }

  const goToManageFields = (sectionId: string) => {
    if (sectionId.startsWith("temp-")) {
      showToast("Please save the section first before managing fields", "warning")
      return
    }
    router.push(`/form-builder/${formId}/sections/${sectionId}/fields`)
  }

  const saveSections = async () => {
    if (sections.length === 0) {
      showToast("No sections to save", "info")
      return
    }

    if (!formId) {
      showToast("Cannot save: Form ID is missing from URL", "error")
      return
    }

    setSaving(true)

    try {
      let createdCount = 0

      for (const [index, section] of sections.entries()) {
        const payload = {
          title: section.title.trim() || "Untitled Section",
          order: index,
        }

        if (section.id.startsWith("temp-")) {
          const res = await axiosClient.post(`/forms/${formId}/sections`, payload)
          const newId = res.data?.data?.id || res.data?.id
          if (newId) {
            section.id = String(newId)
            createdCount++
            showToast(`Created: ${payload.title}`, "success")
          } else {
            throw new Error("No ID returned from create section API")
          }
        } else {
          await axiosClient.put(`/sections/${section.id}`, payload)
        }
      }

      showToast(
        createdCount > 0
          ? `Saved successfully! ${createdCount} new section${createdCount > 1 ? "s" : ""} created`
          : "Section order & titles saved",
        "success"
      )
    } catch (err: any) {
      console.error("Save failed:", err)
      showToast(
        err.response?.data?.message || "Failed to save sections",
        "error"
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
          <span className="ml-3">Loading sections...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Form Sections</h1>
            <p className="text-muted-foreground mt-1.5">
              Manage and reorder sections {formId ? `for form #${formId}` : ""}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={addSection} className="gap-2">
              <FolderPlus className="h-4 w-4" />
              Add Section
            </Button>
            <Button
              onClick={saveSections}
              disabled={saving || sections.length === 0}
              className="min-w-[140px] gap-2"
            >
              {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Order"}
            </Button>
          </div>
        </div>

        {!formId && (
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
            <p className="font-medium">Error: Form ID is missing from the URL</p>
            <p className="text-sm mt-1">Expected route: /form-builder/[formId]/sections</p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {sections.map((section) => (
                <SortableSectionItem key={section.id} section={section}>
                  <Card
                    className={cn(
                      "border-2 transition-all",
                      section.id.startsWith("temp-") &&
                        "border-dashed border-muted-foreground/50 bg-muted/30"
                    )}
                  >
                    <CardHeader className="py-4">
                      <div className="flex items-center gap-4 pl-10">
                        <Input
                          value={section.title}
                          onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                          className="flex-1 text-lg font-medium border-none bg-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                          placeholder="Enter section title..."
                        />

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToManageFields(section.id)}
                            disabled={saving || section.id.startsWith("temp-")}
                            className="gap-1.5"
                          >
                            <ListPlus className="h-4 w-4" />
                            Manage Fields
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSection(section.id)}
                            disabled={saving}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </SortableSectionItem>
              ))}

              {sections.length === 0 && !loading && (
                <div className="rounded-xl border-2 border-dashed py-16 text-center">
                  <p className="mb-4 text-muted-foreground">No sections yet</p>
                  <Button onClick={addSection} variant="secondary" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Section
                  </Button>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </DashboardLayout>
  )
}