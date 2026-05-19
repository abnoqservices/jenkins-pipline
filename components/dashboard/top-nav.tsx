"use client"

import * as React from "react"
import { 
  Bell, ChevronDown, User, Settings, LogOut, 
  Mail, Phone, Calendar, Shield, Edit2, X, Check, Upload, Building2, 
  Loader2, Building, Menu
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useLabels } from '@/app/context/TenantLabelsContext'

interface TopNavProps {
  onMenuClick: () => void
}

interface Department {
  id: number
  name: string
  description?: string
}

interface Profile {
  name: string
  email: string
  phone?: string
  avatar?: string
  role?: string
  createdAt?: string
  department?: { id: number; name: string }
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { getLabel } = useLabels()
  const router = useRouter()

  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [availableDepartments, setAvailableDepartments] = React.useState<Department[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState<number | null>(null)
  const [selectedDepartmentName, setSelectedDepartmentName] = React.useState<string>("")
  const [isSwitchingDepartment, setIsSwitchingDepartment] = React.useState(false)
  const [switchingToDepartmentId, setSwitchingToDepartmentId] = React.useState<number | null>(null)
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedName, setEditedName] = React.useState("")
  const [editedAvatar, setEditedAvatar] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // ── helpers ──────────────────────────────────────────────────────────────

  const sortDepartments = (depts: Department[], activeDeptId: number | null): Department[] => {
    if (!activeDeptId) return depts
    return [
      ...depts.filter((d) => d.id === activeDeptId),
      ...depts.filter((d) => d.id !== activeDeptId),
    ]
  }

  const shallowEqual = (a: any, b: any): boolean => {
    if (a === b) return true
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    return keysA.every((key) => a[key] === b[key])
  }

  const getInitials = (name?: string) => {
    if (!name?.trim()) return "U"
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0][0].toUpperCase()
  }

  // ── select a department locally (no API) ─────────────────────────────────
  const applyDepartment = (id: number, name: string) => {
    setSelectedDepartmentId(id)
    setSelectedDepartmentName(name)
    localStorage.setItem("selectedDepartmentId", id.toString())
    localStorage.setItem("selectedDepartmentName", name)
  }

  // ── boot: read cache first, then refresh in background ───────────────────
  React.useEffect(() => {
    // 1. Profile from cache
    const cachedProfile = localStorage.getItem("userprofile-cache")
    if (cachedProfile) {
      try {
        const data = JSON.parse(cachedProfile) as Profile
        setProfile(data)
        setEditedName(data.name)
      } catch {}
    }

    // 2. Department from cache — resolvedId drives sorting below
    const cachedDeptId   = localStorage.getItem("selectedDepartmentId")
    const cachedDeptName = localStorage.getItem("selectedDepartmentName")
    const resolvedId     = cachedDeptId ? Number(cachedDeptId) : null

    if (resolvedId)      setSelectedDepartmentId(resolvedId)
    if (cachedDeptName)  setSelectedDepartmentName(cachedDeptName)  // ← shows name in trigger immediately

    // 3. Background refresh — pass resolvedId so active dept goes to top
    fetchAvailableDepartments(resolvedId)
    refreshProfileQuietly()
  }, [])

  // ── background profile refresh ───────────────────────────────────────────
  const refreshProfileQuietly = async () => {
    try {
      const res = await axiosClient.get("/auth/me")
      if (!res.data?.data) return

      const fresh = res.data.data
      const relevant: Profile = {
        name:       fresh.name,
        email:      fresh.email,
        phone:      fresh.phone,
        avatar:     fresh.avatar,
        role:       fresh.role,
        createdAt:  fresh.createdAt,
        department: fresh.department,
      }

      setProfile((prev) => {
        if (prev && shallowEqual(prev, relevant)) return prev
        localStorage.setItem("userprofile-cache", JSON.stringify(relevant))
        setEditedName(relevant.name)
        return relevant
      })

      // Auto-set dept only when user has NO saved preference
      const hasSavedDept = !!localStorage.getItem("selectedDepartmentId")
      if (!hasSavedDept && fresh.department?.id && fresh.department?.name) {
        applyDepartment(fresh.department.id, fresh.department.name)
        // re-sort now that we know active id
        setAvailableDepartments((prev) => sortDepartments(prev, fresh.department.id))
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.clear()
        router.replace("/signin")
      }
    }
  }

  // ── fetch departments from API ────────────────────────────────────────────
  const fetchAvailableDepartments = async (activeDeptId: number | null = null) => {
    try {
      const res = await axiosClient.get("/auth/me")
      let departments: Department[] = []

      if (res.data?.data?.departments?.length) {
        departments = res.data.data.departments
      } else if (res.data?.data?.organization?.departments?.length) {
        departments = res.data.data.organization.departments
      }

      if (departments.length > 0) {
        // ✅ always sort active dept to top
        setAvailableDepartments(sortDepartments(departments, activeDeptId))

        // ✅ if nothing saved yet, auto-pick first and SET NAME so trigger shows it
        if (!activeDeptId) {
          const first = departments[0]
          applyDepartment(first.id, first.name)
        } else {
          // Ensure the name in state matches what the API returned
          // (handles case where name changed on the server)
          const activeDept = departments.find((d) => d.id === activeDeptId)
          if (activeDept && activeDept.name) {
            setSelectedDepartmentName(activeDept.name)
            localStorage.setItem("selectedDepartmentName", activeDept.name)
          }
        }
        return
      }

      // Fallback endpoint
      const deptRes = await axiosClient.get("/departments")
      if (deptRes.data?.success && deptRes.data?.data?.length) {
        const depts: Department[] = deptRes.data.data
        setAvailableDepartments(sortDepartments(depts, activeDeptId))

        if (!activeDeptId && depts[0]) {
          applyDepartment(depts[0].id, depts[0].name)
        } else if (activeDeptId) {
          const activeDept = depts.find((d) => d.id === activeDeptId)
          if (activeDept) setSelectedDepartmentName(activeDept.name)
        }
      }
    } catch (err) {
      console.error("Failed to load departments", err)
    }
  }

  // ── switch department ─────────────────────────────────────────────────────
  const handleSwitchDepartment = async (deptId: number) => {
    if (isSwitchingDepartment || deptId === selectedDepartmentId) return

    setIsSwitchingDepartment(true)
    setSwitchingToDepartmentId(deptId)

    try {
      const res = await axiosClient.post("/auth/select-department", { department_id: deptId })

      if (res.data.success) {
        localStorage.setItem("token", res.data.data.access_token)

        const dept = availableDepartments.find((d) => d.id === deptId)
        if (dept) {
          applyDepartment(dept.id, dept.name)
          setAvailableDepartments((prev) => sortDepartments(prev, dept.id))
        }

        showToast("Department switched successfully", "success")
        window.location.reload()
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to switch department", "error")
    } finally {
      setIsSwitchingDepartment(false)
      setSwitchingToDepartmentId(null)
    }
  }

  // ── theme ─────────────────────────────────────────────────────────────────
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  // ── auth ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await axiosClient.post("/auth/logout").catch(() => {})
    } finally {
      localStorage.clear()
      sessionStorage.clear()
      delete axiosClient.defaults.headers.common["Authorization"]
      showToast("Logged out successfully", "success")
      router.replace("/signin")
    }
  }

  // ── profile editing ───────────────────────────────────────────────────────
  const startEditing = () => {
    setEditedName(profile?.name || "")
    setEditedAvatar(null)
    setAvatarPreview(null)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditedAvatar(null)
    setAvatarPreview(null)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEditedAvatar(file)
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    if (!editedName.trim()) {
      showToast("Name is required", "error")
      return
    }
    try {
      const formData = new FormData()
      formData.append("name", editedName)
      if (editedAvatar) formData.append("avatar", editedAvatar)

      const res = await axiosClient.put("/auth/updateProfile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (res.data?.data) {
        const updated: Profile = {
          ...profile!,
          name:   res.data.data.name,
          avatar: res.data.data.avatar,
        }
        setProfile(updated)
        localStorage.setItem("userprofile-cache", JSON.stringify(updated))
        showToast("Profile updated successfully!", "success")
        setIsEditing(false)
        setEditedAvatar(null)
        setAvatarPreview(null)
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update profile", "error")
    }
  }

  const currentAvatar = avatarPreview || profile?.avatar

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white dark:bg-gray-950 px-6 justify-between">

        {/* Left side */}
        <div className="flex-1 max-w-xl">
          <div className="flex items-center gap-2">
            {/* Mobile menu */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>

            {/* Scan */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => router.push("/scan")}>
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/10460/10460903.png"
                      alt="Scan visiting card"
                      className="h-6 w-6 object-contain"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Scan Visiting Card</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* Department switcher */}
          {availableDepartments.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isSwitchingDepartment}
                >
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium max-w-[140px] truncate">
                    {/* ✅ selectedDepartmentName is always a string now, never null */}
                    {selectedDepartmentName || "Select Department"}
                  </span>
                  {isSwitchingDepartment
                    ? <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                    : <ChevronDown className="h-3 w-3 shrink-0" />
                  }
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Switch {getLabel('label.department')}</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {availableDepartments.map((dept) => {
                  const isActive       = dept.id === selectedDepartmentId
                  const isSwitchingThis = switchingToDepartmentId === dept.id

                  return (
                    <DropdownMenuItem
                      key={dept.id}
                      onClick={() => !isActive && handleSwitchDepartment(dept.id)}
                      disabled={isSwitchingDepartment && !isSwitchingThis}
                      className={`cursor-pointer ${isActive ? "bg-blue-50 text-blue-700" : ""}`}
                    >
                      <Building2 className="mr-2 h-4 w-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{dept.name}</div>
                        {dept.description && (
                          <div className="text-xs text-muted-foreground truncate">{dept.description}</div>
                        )}
                      </div>
                      {isSwitchingThis
                        ? <Loader2 className="ml-2 h-4 w-4 animate-spin shrink-0" />
                        : isActive
                          ? <Check className="ml-2 h-4 w-4 text-blue-600 shrink-0" />
                          : null
                      }
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <p className="p-4 text-center text-sm text-gray-500">No new notifications</p>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-3 rounded-full hover:bg-gray-100">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={currentAvatar} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {getInitials(profile?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden md:inline ml-2">
                  {profile?.name || "User"}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/departments" className="flex items-center">
                  <Building className="mr-2 h-4 w-4" /> Create {getLabel('label.department')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </header>

      {/* Profile Sheet */}
      <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <SheetContent side="right" className="w-96 overflow-y-auto">
          <SheetHeader className="px-6 pt-6">
            <div className="flex items-center justify-between">
              <SheetTitle>{isEditing ? "Edit Profile" : "Profile Details"}</SheetTitle>
              {!isEditing ? (
                <Button size="sm" onClick={startEditing} variant="ghost">
                  <Edit2 className="h-4 w-4 mr-1" /> Edit
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={cancelEditing}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={saveProfile}>
                    <Check className="h-4 w-4 mr-1" /> Save
                  </Button>
                </div>
              )}
            </div>
            <SheetDescription>
              {isEditing ? "Update your profile information" : "Your account information"}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 px-6">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                  <AvatarImage src={avatarPreview || currentAvatar} />
                  <AvatarFallback className="text-3xl bg-blue-600 text-white">
                    {getInitials(editedName || profile?.name)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Upload className="h-6 w-6 text-white" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="mt-6 w-full">
              {isEditing ? (
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="mt-2"
                    placeholder="Enter your name"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-2xl font-bold">{profile?.name || "—"}</h3>
                  <p className="text-sm text-gray-500 mt-1">{profile?.role || "—"}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 px-6 space-y-6">
            <div className="flex items-center gap-4">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profile?.email || "—"}</p>
              </div>
            </div>

            {profile?.phone && (
              <div className="flex items-center gap-4">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            )}

            {profile?.department?.name && (
              <div className="flex items-center gap-4">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{profile.department.name}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="mt-10 px-6 flex gap-3 pb-6">
              <Button variant="outline" className="flex-1" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={saveProfile}>
                Update Profile
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
