"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
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
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Plus,
  Trash2,
  Save,
  FolderOpen,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
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

// Build nested tree from flat list
const buildTree = (items: Category[]): Category[] => {
  const map = new Map<number, Category>()
  const roots: Category[] = []

  items.forEach(item => {
    map.set(item.id, { ...item, children: [] })
  })

  map.forEach(item => {
    if (item.parent_id === null) {
      roots.push(item)
    } else {
      const parent = map.get(item.parent_id)
      if (parent) parent.children.push(item)
    }
  })

  // Sort alphabetically
  const sort = (node: Category) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name))
    node.children.forEach(sort)
  }
  roots.forEach(sort)

  return roots
}

export default function ProductCategoriesPage() {
  const [flatCategories, setFlatCategories] = React.useState<Category[]>([])
  const [treeCategories, setTreeCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set())

  const [form, setForm] = React.useState({
    name: "",
    slug: "",
    description: "",
    parent_id: null as number | null,
  })

  React.useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const res = await axiosClient.get("/product-categories")
      if (res.data.success && Array.isArray(res.data.data)) {
        const flat = res.data.data as Category[]
        setFlatCategories(flat)
        setTreeCategories(buildTree(flat))
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to load categories", "error")
    } finally {
      setLoading(false)
    }
  }

  // Smart slug generation
  React.useEffect(() => {
    if (form.name) {
      const slug = form.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
      setForm(prev => ({ ...prev, slug }))
    }
  }, [form.name])

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const saveCategory = async () => {
    if (!form.name.trim()) return showToast("Name is required", "error")

    setSaving(true)
    try {
      await axiosClient.post("/product-categories", {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || null,
        parent_id: form.parent_id,
      })

      showToast("Saved successfully!", "success")
      setForm({ name: "", slug: "", description: "", parent_id: null })
      await loadCategories()
    } catch (err: any) {
      showToast(err.response?.data?.message || "Save failed", "error")
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category and all subcategories?")) return
    try {
      await axiosClient.delete(`/product-categories/${id}`)
      showToast("Deleted", "success")
      await loadCategories()
    } catch (err: any) {
      showToast(err.response?.data?.message || "Delete failed", "error")
    }
  }

  const handleAddSubcategory = (id: number, name: string) => {
    setForm({ name: "", slug: "", description: "", parent_id: id })
    showToast(`Adding under: ${name}`, "info")
    document.getElementById("add-form")?.scrollIntoView({ behavior: "smooth" })
  }

  // Fixed: Added parentheses around parameter
  const renderTree = (items: Category[], level = 0) => {
    return items.map((cat) => {  // ← This was the bug: missing ( )
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

            <div className="flex-1">
              <div className="font-medium">{cat.name}</div>
              {(cat.description || cat.slug) && (
                <div className="text-xs text-muted-foreground">
                  {cat.description || cat.slug}
                </div>
              )}
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
              <Button size="sm" variant="ghost" onClick={() => handleAddSubcategory(cat.id, cat.name)}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCategory(cat.id)}>
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
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Product Categories</h1>
            <p className="text-muted-foreground">Proper nested hierarchy</p>
          </div>
        </div>

        <Card id="add-form">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {form.parent_id
                ? `Add Subcategory → ${flatCategories.find(c => c.id === form.parent_id)?.name || ""}`
                : "Add New Root Category"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-2">Name *</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Mobile Phones & Accessories"
                  autoFocus
                />
              </div>
              <div>
                <Label className="mb-2">Slug (auto-generated)</Label>
                <Input
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  placeholder=""
                />
              </div>
            </div>

            <div>
              <Label className="mb-2">Description (optional)</Label>
              <Input
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <Label>Parent Category</Label>
              <Select
                value={form.parent_id?.toString() || "root"}
                onValueChange={(v) => setForm({ ...form, parent_id: v === "root" ? null : Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Root category" /> </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root (no parent)</SelectItem>
                  {flatCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button onClick={saveCategory} disabled={saving}>
                {saving ? <Spinner /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? "Saving..." : "Save"}
              </Button>
              {form.parent_id && (
                <Button variant="outline" onClick={() => setForm({ ...form, parent_id: null })}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Categories ({flatCategories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner className="size-8" />
              </div>
            ) : treeCategories.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>No categories yet</p>
              </div>
            ) : (
              <div className="border rounded-lg bg-muted/30 p-4">
                {renderTree(treeCategories)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}