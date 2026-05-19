"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import {
  Search,
  Download,
  Mail,
  Phone,
  Tag,
  Calendar,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Save,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { usePermissions } from "@/lib/usePermissions";
import { PermissionRestrictedButton ,PermissionRestrictedMenuItem} from "@/components/PermissionRestrictedButton";
// ────────────────────────────────────────────────
// Types
interface Contact {
  id: number
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  company: string | null
  contact_type: string
  contact_source: string
  status: "active" | "archived"
  created_at: string
  updated_at: string
}

interface DetailResponse {
  success: boolean
  data: Contact & {
    notes?: any[]
    custom_field_values?: any[]
    activities?: any[]
  }
}

interface PaginatedResponse {
  success: boolean
  data: {
    current_page: number
    data: Contact[]
    per_page: number
    total: number
  }
}

// ────────────────────────────────────────────────
export default function CustomersPage() {
  const router = useRouter()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<DetailResponse["data"] | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Contact>>({})

  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  // Selection & Sync
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [showSyncDialog, setShowSyncDialog] = useState(false)
  const [syncCrm, setSyncCrm] = useState<"hubspot" | "">("")

  // Loading states for actions
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const fetchContacts = async () => {
    setLoading(true)
    try {
      const params: any = { per_page: perPage, page: currentPage }
      if (searchQuery) params.search = searchQuery
      if (statusFilter !== "all") params.status = statusFilter

      const res = await axiosClient.get<PaginatedResponse>("/contacts", { params })
      if (res.data.success) {
        setContacts(res.data.data.data)
        setTotal(res.data.data.total)
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to load contacts", "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchContactDetail = async (id: number) => {
    try {
      const res = await axiosClient.get<DetailResponse>(`/contacts/${id}`)
      if (res.data.success) {
        setSelectedContact(res.data.data)
        setFormData(res.data.data)
        setIsEditing(false)
      }
    } catch {
      showToast("Failed to load contact details", "error")
    }
  }

  const handleUpdate = async () => {
    if (!selectedContact) return
    setIsSaving(true)
    try {
      const res = await axiosClient.put(`/contacts/${selectedContact.id}`, formData)
      if (res.data.success) {
        showToast("Contact updated successfully", "success")
        setSelectedContact(res.data.data || { ...selectedContact, ...formData })
        setIsEditing(false)
        fetchContacts()
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to update contact", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await axiosClient.delete(`/contacts/${deleteId}`)
      showToast("Contact deleted", "success")
      setDeleteId(null)
      fetchContacts()
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to delete", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [currentPage, perPage, searchQuery, statusFilter])

  useEffect(() => {
    setSelectAll(false)
    setSelectedIds([])
  }, [contacts])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
    } else {
      setSelectedIds(contacts.map(c => c.id))
    }
    setSelectAll(!selectAll)
  }

  const handleSyncToHubSpot = async () => {
    if (selectedIds.length === 0) return

    setIsSyncing(true)
    try {
      const response = await axiosClient.post('/integrations/hubspot/sync/contacts', {
        contact_ids: selectedIds,
      })

      const data = response.data

      if (data?.success) {
        showToast(
          `Synced ${data.synced?.length ?? selectedIds.length} contact(s) successfully`,
          "success"
        )
        setSelectedIds([])
        setShowSyncDialog(false)
        // Optional: refresh list
        // fetchContacts()
      } else {
        showToast(data?.message || data?.error || "Sync completed with issues", "error")
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to sync contacts to HubSpot"
      showToast(errorMsg, "error")
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your contacts and relationships
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
          <PermissionRestrictedButton
            hasPermission={hasPermission("contacts", "create")}
            requiredPermission="Create contacts"
            resource="contacts"
            action="create"
            asChild
          >
            <Button className="gap-2" onClick={() => router.push("/customers/create")}>
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
</PermissionRestrictedButton>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>

            {selectedIds.length > 0 && (
              <Button
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setShowSyncDialog(true)}
                disabled={isSyncing}
              >
                <Upload className="h-4 w-4" />
                Sync {selectedIds.length} to CRM
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsContent value="list" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, phone..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={perPage.toString()}
                  onValueChange={v => {
                    setPerPage(Number(v))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="15">15 / page</SelectItem>
                    <SelectItem value="25">25 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading contacts...
                </div>
              ) : contacts.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No contacts found</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-16 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map(contact => {
                        const isSelected = selectedIds.includes(contact.id)
                        return (
                          <TableRow key={contact.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(contact.id)}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </TableCell>
                            <TableCell
                              className="cursor-pointer font-medium"
                              onClick={() => fetchContactDetail(contact.id)}
                            >
                              {contact.first_name} {contact.last_name}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                {contact.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    {contact.email}
                                  </div>
                                )}
                                {contact.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    {contact.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{contact.company || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{contact.contact_source}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={contact.status === "active" ? "default" : "secondary"}
                              >
                                {contact.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => fetchContactDetail(contact.id)}
                                    className="gap-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => fetchContactDetail(contact.id)}
                                    className="gap-2"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive gap-2"
                                    onClick={() => setDeleteId(contact.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between border-t px-6 py-4 text-sm text-muted-foreground">
                    <div>
                      Showing {(currentPage - 1) * perPage + 1}–
                      {Math.min(currentPage * perPage, total)} of {total}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage * perPage >= total}
                        onClick={() => setCurrentPage(p => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete contact?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The contact will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90 flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── CRM Sync Sheet ── */}
        <Sheet open={showSyncDialog} onOpenChange={setShowSyncDialog}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader className="pb-6 border-b">
              <SheetTitle className="text-xl">Sync to CRM</SheetTitle>
              <SheetDescription className="mt-1.5 text-base">
                Sync {selectedIds.length} selected contact{selectedIds.length !== 1 ? "s" : ""} to your connected CRM.
              </SheetDescription>
            </SheetHeader>

            <div className="py-6 space-y-4">  {/* reduced py-8 → py-6 */}
  <div
    className={`
      group flex items-center gap-4 p-4 border rounded-lg cursor-pointer
      transition-all duration-200
      hover:border-primary/60 hover:shadow-md hover:bg-primary/3
      ${syncCrm === "hubspot"
        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
        : "border-border bg-card"
      }
    `}
    onClick={() => setSyncCrm("hubspot")}
  >
    {/* Logo */}
    <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded bg-white p-1.5 shadow-sm border border-gray-200/70">
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/3/3f/HubSpot_Logo.svg"
        alt="HubSpot"
        className="w-full h-full object-contain"
        width={40}
        height={40}
      />
    </div>

    {/* Text content – very compact */}
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-base leading-tight">
        HubSpot
      </div>
      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
        Create or update contacts (upsert by email)
      </p>
    </div>

    {/* Optional selected indicator */}
    {syncCrm === "hubspot" && (
      <div className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
        ✓
      </div>
    )}
  </div>

  {/* Add more CRM cards here in the same style – they won't take much space */}
</div>

            <SheetFooter className="pt-6 border-t gap-4 sm:gap-3">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => setShowSyncDialog(false)}
                disabled={isSyncing}
              >
                Cancel
              </Button>
              <Button
                disabled={!syncCrm || isSyncing}
                onClick={handleSyncToHubSpot}
                className="flex-1 sm:flex-none min-w-[140px] flex items-center gap-2"
              >
                {isSyncing && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* ── Contact Detail / Edit Sheet ── */}
        <Sheet
          open={!!selectedContact}
          onOpenChange={open => {
            if (!open) {
              setSelectedContact(null)
              setIsEditing(false)
            }
          }}
        >
          <SheetContent
            className="w-full sm:w-[460px] lg:w-[500px] xl:w-[540px] p-0 gap-0"
          >
            {selectedContact && (
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="px-6 pt-6 pb-5 border-b bg-muted/40">
                  <SheetTitle className="text-xl tracking-tight">
                    {isEditing ? "Edit Contact" : "Contact Details"}
                  </SheetTitle>
                  <SheetDescription className="mt-1.5 text-base">
                    {isEditing
                      ? "Update the contact's information below"
                      : "View or edit this contact's details"}
                  </SheetDescription>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-7 space-y-8">
                  {isEditing ? (
                    <div className="space-y-7">
                      <div>
                        <h3 className="text-sm font-semibold mb-4 text-foreground/90">
                          Personal Information
                        </h3>
                        <div className="grid grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">First Name</label>
                            <Input
                              value={formData.first_name || ""}
                              onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                              disabled={isSaving}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Last Name</label>
                            <Input
                              value={formData.last_name || ""}
                              onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                              disabled={isSaving}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            type="email"
                            value={formData.email || ""}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            disabled={isSaving}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Phone</label>
                          <Input
                            value={formData.phone || ""}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            disabled={isSaving}
                          />
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Company</label>
                          <Input
                            value={formData.company || ""}
                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Status</label>
                          <Select
                            value={formData.status}
                            onValueChange={v =>
                              setFormData({ ...formData, status: v as "active" | "archived" })
                            }
                            disabled={isSaving}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-7">
                      <div className="space-y-4.5">
                        {selectedContact.email && (
                          <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                            <span className="break-all">{selectedContact.email}</span>
                          </div>
                        )}
                        {selectedContact.phone && (
                          <div className="flex items-center gap-3 text-sm">
                            <Phone className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                            <span>{selectedContact.phone}</span>
                          </div>
                        )}
                        {selectedContact.company && (
                          <div className="flex items-center gap-3 text-sm">
                            <Tag className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                            <span>{selectedContact.company}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                          <span>
                            Created on{" "}
                            {new Date(selectedContact.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t space-y-5">
                        <div>
                          <p className="text-sm font-medium mb-1.5">Status</p>
                          <Badge
                            variant={selectedContact.status === "active" ? "default" : "secondary"}
                            className="text-sm px-3 py-1"
                          >
                            {selectedContact.status}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-1.5">Source / Type</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{selectedContact.contact_source}</Badge>
                            <Badge variant="outline">{selectedContact.contact_type}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t bg-muted/30 mt-auto">
                  <div className="flex justify-end gap-3">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          disabled={isSaving}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdate}
                          disabled={isSaving}
                          className="flex items-center gap-2 min-w-[140px]"
                        >
                          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                          {isSaving ? "Saving..." : (
                            <>
                              <Save className="h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => setSelectedContact(null)}>
                          Close
                        </Button>
                        <Button onClick={() => setIsEditing(true)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Contact
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  )
}