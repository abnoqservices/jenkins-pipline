// components/category/CategoryManager.tsx
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Save, FolderOpen, ChevronRight, ChevronDown } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"

interface Category {
  id: number
  name: string
  slug: string
  description: string
  parent_id: number | null
  children: Category[]
}

type CategoryForm = {
  name: string
  slug: string
  description: string
  parent_id: number | null
}

interface CategoryManagerProps {
  apiEndpoint: string
  title?: string
  description?: string
  rootLabel?: string
  maxWidth?: string
  /** Called after successful create or delete operations */
  onCategoriesChange?: () => void
}

export function CategoryManager({
  apiEndpoint,
  title = "",
  description = "",
  rootLabel = "Root (no parent)",
  maxWidth = "max-w-6xl",
  onCategoriesChange,
}: CategoryManagerProps) {
  const [flatCategories, setFlatCategories] = React.useState<Category[]>([])
  const [treeCategories, setTreeCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set())

  const [form, setForm] = React.useState<CategoryForm>({
    name: "",
    slug: "",
    description: "",
    parent_id: null,
  })

  const [dialogOpen, setDialogOpen] = React.useState(false)

  const loadCategories = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await axiosClient.get(apiEndpoint)
      if (res.data?.success && Array.isArray(res.data.data)) {
        const flat = res.data.data as Category[]
        setFlatCategories(flat)
        setTreeCategories(buildTree(flat))
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to load categories", "error")
    } finally {
      setLoading(false)
    }
  }, [apiEndpoint])

  React.useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Auto-generate slug from name
  React.useEffect(() => {
    if (!form.name) return

    const slug = form.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    setForm((prev) => ({ ...prev, slug }))
  }, [form.name])

  const resetForm = () => {
    setForm({ name: "", slug: "", description: "", parent_id: null })
  }

  const openAddDialog = (parentId: number | null = null, parentName?: string) => {
    resetForm()
    setForm((prev) => ({ ...prev, parent_id: parentId }))
    setDialogOpen(true)
    if (parentName) {
      showToast(`Adding subcategory under: ${parentName}`, "info")
    }
  }

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const saveCategory = async () => {
    if (!form.name.trim()) {
      showToast("Name is required", "error")
      return
    }

    setSaving(true)
    try {
      await axiosClient.post(apiEndpoint, {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || null,
        parent_id: form.parent_id,
      })

      showToast("Category saved successfully!", "success")
      setDialogOpen(false)
      resetForm()
      await loadCategories()
      onCategoriesChange?.()           // ← Notify parent
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save category", "error")
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category and all its subcategories? This cannot be undone.")) return

    try {
      await axiosClient.delete(`${apiEndpoint}/${id}`)
      showToast("Category deleted successfully", "success")
      await loadCategories()
      onCategoriesChange?.()           // ← Notify parent
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete category", "error")
    }
  }

  const buildTree = (items: Category[]): Category[] => {
    const map = new Map<number, Category>()
    const roots: Category[] = []

    items.forEach((item) => map.set(item.id, { ...item, children: [] }))

    map.forEach((item) => {
      if (item.parent_id === null) {
        roots.push(item)
      } else {
        const parent = map.get(item.parent_id)
        if (parent) parent.children.push(item)
      }
    })

    const sort = (node: Category) => {
      node.children.sort((a, b) => a.name.localeCompare(b.name))
      node.children.forEach(sort)
    }
    roots.forEach(sort)

    return roots
  }

  const renderTree = (items: Category[], level = 0) =>
    items.map((cat) => {
      const hasChildren = cat.children.length > 0
      const isExpanded = expanded.has(cat.id)

      return (
        <div key={cat.id}>
          <div
            className="flex items-center gap-3 py-2.5 px-3 hover:bg-accent/70 rounded-lg group"
            style={{ paddingLeft: `${level * 40 + 20}px` }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (hasChildren) toggleExpand(cat.id)
              }}
              className="w-7 h-7 flex items-center justify-center text-muted-foreground"
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              ) : (
                <span className="w-4" />
              )}
            </button>

            <FolderOpen className="h-5 w-5 text-blue-600" />

            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{cat.name}</div>
              {(cat.description || cat.slug) && (
                <div className="text-xs text-muted-foreground truncate">
                  {cat.description || cat.slug}
                </div>
              )}
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openAddDialog(cat.id, cat.name)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={() => deleteCategory(cat.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="border-l-2 border-border ml-10">
              {renderTree(cat.children, level + 1)}
            </div>
          )}
        </div>
      )
    })

  const isSubcategory = form.parent_id !== null
  const parentName = isSubcategory
    ? flatCategories.find((c) => c.id === form.parent_id)?.name ?? ""
    : ""

  return (
    <div className={`${maxWidth} mx-auto space-y-8 py-6`}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => openAddDialog(null)} className="-mt-6 mb-4">
              <Plus className="h-4 w-4" />
              Add 
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {isSubcategory
                  ? `Add Subcategory under ${parentName}`
                  : "Add New Root Category"}
              </DialogTitle>
              <DialogDescription>
                Enter the details for the new category.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Smartphones, T-Shirts, etc."
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Slug (auto-generated)</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="smartphones"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this category"
                />
              </div>

              <div className="grid gap-2">
                <Label>Parent Category</Label>
                <Select
                  value={form.parent_id?.toString() ?? "root"}
                  onValueChange={(v) =>
                    setForm({ ...form, parent_id: v === "root" ? null : Number(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">{rootLabel}</SelectItem>
                    {flatCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={saveCategory}
                disabled={saving || !form.name.trim()}
              >
                {saving ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Category
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

   
    </div>
  )
}