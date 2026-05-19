"use client"

import * as React from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  Edit,
  Copy,
  Eye,
  BarChart3,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Power,
  ChevronUp,
  ChevronDown,
  Plus,
  ArrowUp, ArrowDown
} from 'lucide-react'
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"
import { usePermissions } from "@/lib/usePermissions"

type SortDirection = "asc" | "desc" | null
type SortableKey = "name" | "updated_at" | "submissions" | "views" | "conversionRate"

interface FormField {
  id: number
  form_id: number
  form_section_id: number
  label: string
  key: string
  type: "text" | "email" | "phone" | "select" | "textarea" | "image" | "file"
  options: {
    placeholder?: string
    choices?: Array<{ label: string; value: string }>
  }
  rules: null | any
  conditions: null | any
  order: number
  is_required: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

interface FormSection {
  id: number
  form_id: number
  title: string
  order: number
  created_at: string
  updated_at: string
}

interface Form {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
  version?: number
  created_at: string
  updated_at: string
  department_id?: number
  sections: FormSection[]
  fields: FormField[]
  submissions?: number
  views?: number
  conversionRate?: number
}

const statusColors = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-700",
}

export default function FormsPage() {
  const [forms, setForms] = React.useState<Form[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [sortKey, setSortKey] = React.useState<SortableKey>("updated_at")
  const [sortDir, setSortDir] = React.useState<SortDirection>("desc")
  const [previewForm, setPreviewForm] = React.useState<Form | null>(null)
  const checkboxRef = React.useRef<HTMLButtonElement>(null);
  const { hasPermission } = usePermissions()

  React.useEffect(() => {
    loadForms()
  }, [])

  const loadForms = async () => {
    try {
      setLoading(true)
      const res = await axiosClient.get('/forms')
      if (res.data.success) {
        setForms(res.data.data || [])
      } else {
        showToast("Failed to load forms", "error")
      }
    } catch (err) {
      showToast("Failed to load forms", "error")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ────────────────────────────────────────────────
  //  Filtered & Sorted Forms (MUST COME BEFORE selection logic)
  // ────────────────────────────────────────────────
  const filteredForms = React.useMemo(() => {
    let result = forms.filter(form =>
      form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (form.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (sortDir === null) return result

    return [...result].sort((a, b) => {
      let aVal: any = a[sortKey]
      let bVal: any = b[sortKey]

      if (sortKey === "updated_at") {
        aVal = new Date(a.updated_at).getTime()
        bVal = new Date(b.updated_at).getTime()
      } else if (sortKey === "conversionRate") {
        aVal = a.conversionRate ?? 0
        bVal = b.conversionRate ?? 0
      } else if (sortKey === "submissions" || sortKey === "views") {
        aVal = a[sortKey] ?? 0
        bVal = b[sortKey] ?? 0
      } else {
        aVal = String(aVal || "").toLowerCase()
        bVal = String(bVal || "").toLowerCase()
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [forms, searchQuery, sortKey, sortDir])

  // ────────────────────────────────────────────────
  //  Selection logic
  // ────────────────────────────────────────────────
  const allSelected = filteredForms.length > 0 && selectedIds.size === filteredForms.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredForms.length

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredForms.map(f => f.id)))
    }
  }

  const toggleOne = (id: number) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  // ────────────────────────────────────────────────
  //  Sorting
  // ────────────────────────────────────────────────
  const handleSort = (key: SortableKey) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc")
      else if (sortDir === "desc") setSortDir(null)
      else setSortDir("asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const getSortIcon = (key: SortableKey) => {
    if (sortKey !== key)  return <ArrowUp className="h-4 w-4 opacity-30" />;
    if (sortDir === "asc") return <ArrowUp className="ml-1 h-4 w-4" />
    if (sortDir === "desc") return <ArrowDown className="ml-1 h-4 w-4" />
    return null
  }

  // ────────────────────────────────────────────────
  //  Bulk actions
  // ────────────────────────────────────────────────
  const bulkActivate = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Activate ${selectedIds.size} form(s)?`)) return

    try {
      await Promise.all(
        [...selectedIds].map(id =>
          axiosClient.put(`/forms/${id}`, { is_active: true })
        )
      )
      showToast(`Activated ${selectedIds.size} form(s)`, "success")
      loadForms()
      setSelectedIds(new Set())
    } catch (err) {
      showToast("Failed to activate selected forms", "error")
    }
  }

  const bulkDeactivate = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Deactivate ${selectedIds.size} form(s)?`)) return

    try {
      await Promise.all(
        [...selectedIds].map(id =>
          axiosClient.put(`/forms/${id}`, { is_active: false })
        )
      )
      showToast(`Deactivated ${selectedIds.size} form(s)`, "success")
      loadForms()
      setSelectedIds(new Set())
    } catch (err) {
      showToast("Failed to deactivate selected forms", "error")
    }
  }

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} form(s)? This cannot be undone.`)) return

    try {
      await Promise.all(
        [...selectedIds].map(id => axiosClient.delete(`/forms/${id}`))
      )
      showToast(`Deleted ${selectedIds.size} form(s)`, "success")
      loadForms()
      setSelectedIds(new Set())
    } catch (err) {
      showToast("Failed to delete some forms", "error")
    }
  }

  const handleDuplicate = async (formId: number) => {
    try {
      const res = await axiosClient.post(`/forms/${formId}/duplicate`)
      if (res.data.success) {
        showToast("Form duplicated successfully", "success")
        loadForms()
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to duplicate form", "error")
    }
  }

  const toggleFormStatus = async (form: Form) => {
    const newStatus = !form.is_active
    const action = newStatus ? "activate" : "deactivate"
    if (!confirm(`Are you sure you want to ${action} "${form.name}"?`)) return

    try {
      const res = await axiosClient.put(`/forms/${form.id}`, { is_active: newStatus })
      if (res.data.success) {
        setForms(prev => prev.map(f => f.id === form.id ? { ...f, is_active: newStatus } : f))
        showToast(`Form ${action}d successfully`, "success")
      }
    } catch (err) {
      showToast(`Failed to ${action} form`, "error")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this form? This cannot be undone.")) return
    try {
      const res = await axiosClient.delete(`/forms/${id}`)
      if (res.data.success) {
        setForms(prev => prev.filter(f => f.id !== id))
        showToast("Form deleted successfully", "success")
      }
    } catch (err) {
      showToast("Failed to delete form", "error")
    }
  }

  const formatLastModified = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const hours = diffMs / (1000 * 60 * 60)
    const days = diffMs / (1000 * 60 * 60 * 24)

    if (hours < 1) return "Just now"
    if (hours < 24) return `${Math.floor(hours)}h ago`
    if (days < 7) return `${Math.floor(days)}d ago`
    return date.toLocaleDateString()
  }

  // ────────────────────────────────────────────────
  //  Preview Component
  // ────────────────────────────────────────────────
  const FormPreviewContent = ({ form }: { form: Form }) => {
    const sortedFields = [...(form.fields || [])].sort((a, b) => a.order - b.order)
    const sortedSections = [...(form.sections || [])].sort((a, b) => a.order - b.order)

    const renderField = (field: FormField) => {
      const placeholder = field.options?.placeholder || "";
    
      switch (field.type) {
        case "text":
          return <Input type="text" placeholder={placeholder} className="bg-background" />;
    
        case "email":
          return <Input type="email" placeholder={placeholder} className="bg-background" />;
    
        case "phone":
          return <Input type="tel" placeholder={placeholder} className="bg-background" />;
    
        case "select":
          const choices = field.options?.choices || [];
          return (
            <Select>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {choices.map((choice) => (
                  <SelectItem key={choice.value} value={choice.value}>
                    {choice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
    
        case "textarea":
          return (
            <Textarea
              placeholder={placeholder}
              className="bg-background min-h-[100px]"
            />
          );
    
        // ✅ Image Upload
        case "image":
          return (
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Upload image (jpg, png, etc.)
              </p>
            </div>
          );
    
        // ✅ File Upload
        case "file":
          return (
            <div className="space-y-2">
              <Input
                type="file"
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Upload any file
              </p>
            </div>
          );
    
        default:
          return <Input placeholder={placeholder} className="bg-background" />;
      }
    };

    return (
      <div className="p-6 space-y-8 overflow-y-auto">
        {sortedSections.length > 0 ? (
          sortedSections.map(section => (
            <div key={section.id} className="space-y-6">
              <h3 className="text-lg font-semibold tracking-tight">{section.title}</h3>
              <div className="space-y-6">
                {sortedFields
                  .filter(f => f.form_section_id === section.id)
                  .map(field => (
                    <div key={field.id} className="space-y-2">
                      <Label className="text-sm font-medium">
                        {field.label}
                        {field.is_required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {renderField(field)}
                    </div>
                  ))}
              </div>
            </div>
          ))
        ) : (
          sortedFields.map(field => (
            <div key={field.id} className="space-y-2">
              <Label className="text-sm font-medium">
                {field.label}
                {field.is_required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))
        )}

        <div className="flex justify-end pt-6 border-t">
          <Button
            onClick={() => {
              showToast("Demo: Form submitted! (preview only)", "success")
              setPreviewForm(null)
            }}
            size="lg"
          >
            Submit (Preview)
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading forms...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Forms</h1>
            <p className="text-sm text-muted-foreground mt-1">Create and manage lead capture forms</p>
          </div>
          {hasPermission("forms", "create") ? (
            <Link href="/forms/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Create Form
              </Button>
            </Link>
          ) : (
            <Button disabled className="gap-2">Create Form</Button>
          )}
        </div>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-muted/50 px-5 py-3">
            <div className="text-sm font-medium">
              {selectedIds.size} selected
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={bulkActivate}>Activate</Button>
              <Button variant="outline" size="sm" onClick={bulkDeactivate}>Deactivate</Button>
              <Button variant="destructive" size="sm" onClick={bulkDelete}>Delete</Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">
                <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected ? true : undefined}
                    onCheckedChange={toggleAll}
                    aria-label="Select all forms"
                  />
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    {getSortIcon("name")}
                    <span>Form Name</span>
                  </div>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead
                  className="text-right cursor-pointer"
                  onClick={() => handleSort("submissions")}
                >
                    <div className="flex items-center gap-1 whitespace-nowrap">
                   {getSortIcon("submissions")}
                  <span>Submissions</span>
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer"
                  onClick={() => handleSort("views")}
                >
                   <div className="flex items-center gap-1 whitespace-nowrap">
                   {getSortIcon("views")}
                   <span>Views</span>
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer"
                  onClick={() => handleSort("conversionRate")}
                >
                     <div className="flex items-center gap-1 whitespace-nowrap">
                   {getSortIcon("conversionRate")}
                   <span>Conversion</span>
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("updated_at")}
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                {getSortIcon("updated_at")}
                <span>Last Modified</span>
                  </div>
                </TableHead>
                <TableHead className="text-right w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredForms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-64 text-center text-muted-foreground">
                    No forms found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredForms.map(form => {
                  const isSelected = selectedIds.has(form.id)
                  return (
                    <TableRow
                      key={form.id}
                      className={isSelected ? "bg-muted/60" : "hover:bg-muted/40"}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(form.id)}
                          aria-label={`Select form ${form.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/forms/${form.id}/edit`}
                          className="hover:text-primary transition-colors"
                        >
                          {form.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-md truncate">
                        {form.description || <span className="italic opacity-60">No description</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[form.is_active ? "active" : "inactive"]}>
                          {form.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{form.submissions?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell className="text-right">{form.views?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell className="text-right font-semibold text-blue-700">
                        {form.conversionRate != null ? `${form.conversionRate}%` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatLastModified(form.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/forms/${form.id}/edit`} className="flex items-center gap-2">
                                <Edit className="h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPreviewForm(form)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(form.id)} className="cursor-pointer">
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/forms/${form.id}/submissions`} className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" /> Submissions
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleFormStatus(form)} className="cursor-pointer">
                              <Power className="mr-2 h-4 w-4" />
                              {form.is_active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(form.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Simple pagination placeholder */}
          <div className="flex items-center justify-between border-t px-6 py-4 text-sm text-muted-foreground">
            <div>
              Showing <span className="font-medium">{filteredForms.length}</span> of{" "}
              <span className="font-medium">{forms.length}</span> forms
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewForm !== null} onOpenChange={open => !open && setPreviewForm(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b bg-muted/40">
            <DialogTitle className="text-2xl">Preview: {previewForm?.name}</DialogTitle>
            {previewForm?.description && (
              <DialogDescription className="mt-1">
                {previewForm.description}
              </DialogDescription>
            )}
          </DialogHeader>
          {previewForm && <FormPreviewContent form={previewForm} />}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}