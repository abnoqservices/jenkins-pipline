"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Building2, Download, Eye, Lock, Plus, Settings, Trash2, Users, EyeOff } from "lucide-react"

import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"
import CustomLabelsForm from "@/components/CustomLabelsForm"

const TERM_KEYS = ["label.department"]

const MAX_IMAGE_SIZE_BYTES = 100 * 1024
const MAX_IMAGE_WIDTH = 512
const MAX_IMAGE_HEIGHT = 512

const SOCIAL_PLATFORMS = [
  "Website",
  "LinkedIn",
  "Facebook",
  "Instagram",
  "X",
  "YouTube",
  "Other",
]

interface SocialLink {
  platform: string
  url: string
}

interface NotificationPreference {
  key: string
  label: string
  description?: string
  enabled: boolean
}

interface ProfileForm {
  name: string
  email: string
  phone: string
  job_title: string
  industry: string
  website: string
  bio: string
  timezone: string
  language: string
  avatar_url: string
  social_links: SocialLink[]
  notification_preferences: NotificationPreference[]
}

interface AuthForm {
  old_password: string
  password: string
  password_confirmation: string
}

interface DepartmentUser {
  id: number
  name: string
  email: string
  role_id?: number | null
}

interface Department {
  id: number
  name: string
  description?: string | null
  industry?: string | null
  logo_url?: string | null
  users: DepartmentUser[]
}

interface BillingFeature {
  key: string
  label: string
  enabled: boolean
}

interface BillingPlan {
  id: number
  name: string
  slug: string
  description?: string | null
  price: number
  formatted_price: string
  billing_period: string
  currency: string
  is_current: boolean
  razorpay_plan_id?: string | null
  limits: {
    departments: string
    products_per_department: string
    forms_per_department: string
    customers_per_department: string
  }
  features: BillingFeature[]
}

interface SubscriptionInfo {
  status?: string | null
  razorpay_subscription_id?: string | null
  starts_at?: string | null
  ends_at?: string | null
}

interface BillingInfo {
  current_plan?: BillingPlan | null
  plans?: BillingPlan[]
  subscription?: SubscriptionInfo
}

const emptyProfile: ProfileForm = {
  name: "",
  email: "",
  phone: "",
  job_title: "",
  industry: "",
  website: "",
  bio: "",
  timezone: "utc",
  language: "en",
  avatar_url: "",
  social_links: [],
  notification_preferences: [],
}

const validateImageUpload = (
  file: File,
  options: { label: string; requireSquare?: boolean }
): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      showToast(`${options.label} must be a valid image file.`, "error")
      resolve(false)
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast(`${options.label} must be 100 KB or less.`, "error")
      resolve(false)
      return
    }

    const imageUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(imageUrl)

      if (image.width > MAX_IMAGE_WIDTH || image.height > MAX_IMAGE_HEIGHT) {
        showToast(`${options.label} must be 500x500 pixels or smaller.`, "error")
        resolve(false)
        return
      }

      if (options.requireSquare && image.width !== image.height) {
        showToast(`${options.label} must be a square image with 1:1 ratio.`, "error")
        resolve(false)
        return
      }

      resolve(true)
    }

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl)
      showToast(`Please upload a valid image for ${options.label}.`, "error")
      resolve(false)
    }

    image.src = imageUrl
  })
}

export default function SettingsPage() {
  const router = useRouter()

  const [profile, setProfile] = React.useState<ProfileForm>(emptyProfile)
  const [organizationName, setOrganizationName] = React.useState("")
  const [organizationLogoUrl, setOrganizationLogoUrl] = React.useState("")
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [billing, setBilling] = React.useState<BillingInfo>({})
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [authSaving, setAuthSaving] = React.useState(false)
  const [hasPassword, setHasPassword] = React.useState(true)

  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [organizationLogoFile, setOrganizationLogoFile] = React.useState<File | null>(null)
  const [showPassword, setShowPassword] = React.useState({
    old: false,
    new: false,
    confirm: false,
  })
  const [authForm, setAuthForm] = React.useState<AuthForm>({
    old_password: "",
    password: "",
    password_confirmation: "",
  })

  const initials = React.useMemo(() => {
    return (
      profile.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "U"
    )
  }, [profile.name])

  const avatarPreview = React.useMemo(() => {
    return avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url
  }, [avatarFile, profile.avatar_url])

  const logoPreview = React.useMemo(() => {
    return organizationLogoFile ? URL.createObjectURL(organizationLogoFile) : organizationLogoUrl
  }, [organizationLogoFile, organizationLogoUrl])

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long."
    }

    if (!/[A-Za-z]/.test(password)) {
      return "Password must contain at least one letter."
    }

    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number."
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Password must contain at least one special character."
    }

    return null
  }

  React.useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)

      try {
        const [profileRes, departmentsRes, billingRes] = await Promise.allSettled([
          axiosClient.get("/profile"),
          axiosClient.get("/departments"),
          axiosClient.get("/billing/profile"),
        ])

        if (profileRes.status === "fulfilled") {
          const data = profileRes.value.data?.data || {}
          const loadedProfile = data.profile || {}

          setProfile({
            ...emptyProfile,
            name: data.user?.name || "",
            email: data.user?.email || "",
            avatar_url: loadedProfile.avatar_url || data.user?.avatar || "",
            phone: loadedProfile.phone || "",
            job_title: loadedProfile.job_title || "",
            industry: loadedProfile.industry || "",
            website: loadedProfile.website || "",
            bio: loadedProfile.bio || "",
            timezone: loadedProfile.timezone || "utc",
            language: loadedProfile.language || "en",
            social_links: Array.isArray(loadedProfile.social_links)
              ? loadedProfile.social_links
              : [],
            notification_preferences: Array.isArray(loadedProfile.notification_preferences)
              ? loadedProfile.notification_preferences
              : [],
          })

          setOrganizationName(data.organization?.name || "")
          setOrganizationLogoUrl(data.organization?.logo_url || "")
          setHasPassword(Boolean(data.user?.has_password))

          if (Array.isArray(data.departments)) {
            setDepartments(data.departments)
          }
        }

        if (departmentsRes.status === "fulfilled") {
          setDepartments(departmentsRes.value.data?.data || [])
        }

        if (billingRes.status === "fulfilled") {
          setBilling(billingRes.value.data?.data || {})
        }
      } catch (error) {
        showToast("Failed to load profile settings", "error")
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const updateProfileField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null

    if (!file) {
      setAvatarFile(null)
      return
    }

    const isValid = await validateImageUpload(file, {
      label: "Profile image",
      requireSquare: true,
    })

    if (!isValid) {
      event.target.value = ""
      setAvatarFile(null)
      return
    }

    setAvatarFile(file)
  }

  const handleOrganizationLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null

    if (!file) {
      setOrganizationLogoFile(null)
      return
    }

    const isValid = await validateImageUpload(file, {
      label: "Company logo",
      requireSquare: false,
    })

    if (!isValid) {
      event.target.value = ""
      setOrganizationLogoFile(null)
      return
    }

    setOrganizationLogoFile(file)
  }

  const appendProfileFormData = () => {
    const formData = new FormData()

    formData.append("name", profile.name)
    formData.append("email", profile.email)
    formData.append("phone", profile.phone || "")
    formData.append("job_title", profile.job_title || "")
    formData.append("industry", profile.industry || "")
    formData.append("website", profile.website || "")
    formData.append("bio", profile.bio || "")
    formData.append("timezone", profile.timezone || "utc")
    formData.append("language", profile.language || "en")

    profile.social_links.forEach((link, index) => {
      formData.append(`social_links[${index}][platform]`, link.platform)
      formData.append(`social_links[${index}][url]`, link.url)
    })

    profile.notification_preferences.forEach((item, index) => {
      formData.append(`notification_preferences[${index}][key]`, item.key)
      formData.append(`notification_preferences[${index}][label]`, item.label)
      formData.append(`notification_preferences[${index}][description]`, item.description || "")
      formData.append(`notification_preferences[${index}][enabled]`, item.enabled ? "1" : "0")
    })

    if (avatarFile) {
      formData.append("avatar", avatarFile)
    } else if (profile.avatar_url) {
      formData.append("avatar_url", profile.avatar_url)
    }

    if (organizationLogoFile) {
      formData.append("organization_logo", organizationLogoFile)
    }

    return formData
  }

  const handleSaveProfile = async () => {
    setSaving(true)

    try {
      const res = await axiosClient.put("/profile", appendProfileFormData(), {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const data = res.data?.data || {}

      setProfile((prev) => ({
        ...prev,
        name: data.user?.name || prev.name,
        email: data.user?.email || prev.email,
        avatar_url: data.profile?.avatar_url || prev.avatar_url,
        ...(data.profile || {}),
      }))

      setOrganizationLogoUrl(data.organization?.logo_url || organizationLogoUrl)
      setHasPassword(Boolean(data.user?.has_password ?? hasPassword))
      setAvatarFile(null)
      setOrganizationLogoFile(null)

      showToast(res.data?.message || "Profile updated successfully", "success")
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to update profile", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleAuthSubmit = async () => {
    if (authForm.password !== authForm.password_confirmation) {
      showToast("New password and confirmation do not match", "error")
      return
    }

    const passwordError = validatePassword(authForm.password)

    if (passwordError) {
      showToast(passwordError, "error")
      return
    }

    setAuthSaving(true)

    try {
      const endpoint = hasPassword ? "/password/change" : "/password/set"

      const payload = hasPassword
        ? authForm
        : {
            password: authForm.password,
            password_confirmation: authForm.password_confirmation,
          }

      const res = await axiosClient.post(endpoint, payload)

      setAuthForm({
        old_password: "",
        password: "",
        password_confirmation: "",
      })

      setHasPassword(true)

      showToast(res.data?.message || "Password saved successfully", "success")
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to save password", "error")
    } finally {
      setAuthSaving(false)
    }
  }

  const addSocialLink = () => {
    updateProfileField("social_links", [
      ...profile.social_links,
      { platform: "LinkedIn", url: "" },
    ])
  }

  const updateSocialLink = (index: number, patch: Partial<SocialLink>) => {
    updateProfileField(
      "social_links",
      profile.social_links.map((link, currentIndex) =>
        currentIndex === index ? { ...link, ...patch } : link
      )
    )
  }

  const removeSocialLink = (index: number) => {
    updateProfileField(
      "social_links",
      profile.social_links.filter((_, currentIndex) => currentIndex !== index)
    )
  }

  const handleNotificationToggle = async (index: number, enabled: boolean) => {
    const nextPreferences = profile.notification_preferences.map((item, currentIndex) =>
      currentIndex === index ? { ...item, enabled } : item
    )

    updateProfileField("notification_preferences", nextPreferences)

    try {
      await axiosClient.put("/profile", {
        ...profile,
        notification_preferences: nextPreferences,
      })

      showToast("Notification settings updated", "success")
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to update notification settings", "error")
    }
  }

  const formatDate = (value?: string | null) => {
    if (!value) return "Not set"

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value))
  }

  const currentPlan = billing.current_plan || billing.plans?.find((plan) => plan.is_current)
  const subscriptionStatus = billing.subscription?.status || "not active"

  const handleViewPlan = () => {
    router.push("/plans")
  }

  const handleDownloadInvoice = async (planId: number) => {
    try {
      const response = await axiosClient.get(`/billing/invoice/${planId}`, {
        responseType: "blob",
      })

      const fileUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")

      link.href = fileUrl
      link.download = `invoice-plan-${planId}.html`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(fileUrl)

      showToast("Invoice downloaded successfully", "success")
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to download invoice", "error")
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, department access, settings, authentication, and billing.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="team">Team members</TabsTrigger>
            <TabsTrigger value="labeling">Labeling</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="setting">Setting</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal and organization-facing details</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="group relative h-20 w-20 overflow-hidden rounded-full border"
                    onClick={() => document.getElementById("avatar_file")?.click()}
                  >
                    <Avatar className="h-full w-full">
                      <AvatarImage src={avatarPreview} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>

                    <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="px-2 text-center text-xs font-medium text-white">
                        Change photo
                      </span>
                    </div>
                  </button>

                  <Input
                    id="avatar_file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />

                  <div className="space-y-1">
                    <Label>Profile Image</Label>
                    <p className="text-xs text-muted-foreground">
                      {avatarFile ? avatarFile.name : "Square image, max 500x500px and 100KB"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => updateProfileField("name", e.target.value)}
                      placeholder="e.g. Enter Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={profile.email} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => updateProfileField("phone", e.target.value)}
                      placeholder="e.g. Enter Phone Number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job_title">What do you do?</Label>
                    <Input
                      id="job_title"
                      value={profile.job_title}
                      onChange={(e) => updateProfileField("job_title", e.target.value)}
                      placeholder="e.g. Bussiness Owner, Marketing Manager"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="organization">Company / Organization Name</Label>
                    <Input id="organization" value={organizationName} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization_logo">Company Logo</Label>

                    <div className="flex items-center gap-3">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Company logo"
                          className="h-12 w-12 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                          Logo
                        </div>
                      )}

                      <Input
                        id="organization_logo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleOrganizationLogoFileChange}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-muted-foreground">
                          {organizationLogoFile
                            ? organizationLogoFile.name
                            : "Any shape, max 500x500px and 100KB"}
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        className="shrink-0 bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => document.getElementById("organization_logo")?.click()}
                      >
                        Browse
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Your Industry</Label>
                    <Input
                      id="industry"
                      value={profile.industry}
                      onChange={(e) => updateProfileField("industry", e.target.value)}
                      placeholder="e.g. Retail, E-commerce, Manufacturing"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={profile.website}
                      onChange={(e) => updateProfileField("website", e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Your Time Zone</Label>
                    <Select
                      value={profile.timezone}
                      onValueChange={(value) => updateProfileField("timezone", value)}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc">UTC</SelectItem>
                        <SelectItem value="asia-kolkata">Asia/Kolkata (India)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Tell us about yourself</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio || ""}
                    onChange={(e) => updateProfileField("bio", e.target.value)}
                    rows={4}
                    placeholder="Write a short introduction about yourself..."
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Add your social profiles</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={addSocialLink}
                    >
                      <Plus className="h-4 w-4" />
                      Add Social Link
                    </Button>
                  </div>

                  {profile.social_links.map((link, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-[180px_1fr_auto]"
                    >
                      <Select
                        value={link.platform}
                        onValueChange={(value) => updateSocialLink(index, { platform: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOCIAL_PLATFORMS.map((platform) => (
                            <SelectItem key={platform} value={platform}>
                              {platform}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateSocialLink(index, { url: e.target.value })}
                        placeholder="https://yourprofile.com"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSocialLink(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {!profile.social_links.length && (
                    <p className="text-sm text-muted-foreground">
                      No social profiles added yet. Click Add Social Link to add one.
                    </p>
                  )}
                </div>

                <Button onClick={handleSaveProfile} disabled={saving || loading}>
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="labeling" className="space-y-6">
            <Card>
              <CustomLabelsForm termKeys={TERM_KEYS} />
            </Card>
          </TabsContent>

          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Settings</CardTitle>

                <CardDescription>
                  {hasPassword
                    ? "Change your account password."
                    : "Set a password for this Google account so you can also sign in with email and password."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {hasPassword && (
                    <div className="relative space-y-2 md:col-span-2">
                      <Label htmlFor="old_password">Current Password</Label>
                      <Input
                        id="old_password"
                        type={showPassword.old ? "text" : "password"}
                        value={authForm.old_password}
                        onChange={(e) =>
                          setAuthForm((prev) => ({ ...prev, old_password: e.target.value }))
                        }
                      />
                      <span
                        className="absolute right-3 top-9 cursor-pointer"
                        onClick={() =>
                          setShowPassword((prev) => ({ ...prev, old: !prev.old }))
                        }
                      >
                        {showPassword.old ? <EyeOff size={18} /> : <Eye size={18} />}
                      </span>
                    </div>
                  )}

                  <div className="relative space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type={showPassword.new ? "text" : "password"}
                      value={authForm.password}
                      onChange={(e) =>
                        setAuthForm((prev) => ({ ...prev, password: e.target.value }))
                      }
                    />
                    <span
                      className="absolute right-3 top-9 cursor-pointer"
                      onClick={() =>
                        setShowPassword((prev) => ({ ...prev, new: !prev.new }))
                      }
                    >
                      {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </span>

                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters and include one letter, one number, and one special character.
                    </p>
                  </div>

                  <div className="relative space-y-2">
                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                    <Input
                      id="password_confirmation"
                      type={showPassword.confirm ? "text" : "password"}
                      value={authForm.password_confirmation}
                      onChange={(e) =>
                        setAuthForm((prev) => ({
                          ...prev,
                          password_confirmation: e.target.value,
                        }))
                      }
                    />
                    <span
                      className="absolute right-3 top-9 cursor-pointer"
                      onClick={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                    >
                      {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </span>
                  </div>
                </div>

                <Button onClick={handleAuthSubmit} disabled={authSaving}>
                  <Lock className="mr-2 h-4 w-4" />
                  {authSaving ? "Saving..." : hasPassword ? "Change Password" : "Set Password"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setting" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Setting</CardTitle>
                <CardDescription>Choose what updates should appear for your account</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {profile.notification_preferences.map((item, index) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <p className="font-medium">{item.label}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>

                    <Switch
                      checked={item.enabled}
                      onCheckedChange={(enabled) => handleNotificationToggle(index, enabled)}
                    />
                  </div>
                ))}

                {!profile.notification_preferences.length && (
                  <p className="text-sm text-muted-foreground">No notification preferences found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Team members are grouped by members from your organization
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {departments.map((department) => (
                  <div key={department.id} className="rounded-lg border border-border p-4">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{department.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {department.description || "No department description"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {department.users?.length || 0}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(department.users || []).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-md bg-secondary/50 p-3"
                        >
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>

                          {member.role_id && (
                            <span className="rounded-full bg-background px-2 py-1 text-xs text-muted-foreground">
                              Role #{member.role_id}
                            </span>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => router.push(`/departments/${department.id}`)}
                          >
                            <Settings className="h-4 w-4" />
                            Manage
                          </Button>
                        </div>
                      ))}

                      {!department.users?.length && (
                        <p className="text-sm text-muted-foreground">
                          No users linked to this department.
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {!departments.length && (
                  <p className="text-sm text-muted-foreground">No departments found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Details</CardTitle>
                <CardDescription>
                  Current plan, subscription dates, payment id, and available actions
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {currentPlan ? (
                  <div className="grid gap-3 rounded-lg border-2 border-primary bg-primary/5 p-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{currentPlan.name}</p>
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                          Current Plan
                        </span>
                        <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                          {subscriptionStatus.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Subscription</p>
                      <p className="text-sm font-medium">
                        {formatDate(billing.subscription?.starts_at)} to{" "}
                        {formatDate(billing.subscription?.ends_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Pay ID</p>
                      <p className="max-w-[180px] truncate text-sm font-medium">
                        {billing.subscription?.razorpay_subscription_id || "Not set"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-sm font-semibold capitalize">
                        {currentPlan.formatted_price} / {currentPlan.billing_period}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleViewPlan}>
                        <Eye className="h-4 w-4" />
                        View Plan
                      </Button>

                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => handleDownloadInvoice(currentPlan.id)}
                      >
                        <Download className="h-4 w-4" />
                        Download Invoice
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No active plan is mapped with this organization.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Plans</CardTitle>
                <CardDescription>
                  Higher plans are available for upgrade; current and lower plans are disabled
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {billing.plans?.map((plan) => {
                  const isDowngradeOrCurrent = currentPlan ? plan.price <= currentPlan.price : false
                  const actionLabel = plan.is_current
                    ? "Current"
                    : isDowngradeOrCurrent
                      ? "Downgrade Disabled"
                      : "Upgrade"

                  return (
                    <div
                      key={plan.id}
                      className={`grid gap-3 rounded-lg border p-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] lg:items-center ${
                        plan.is_current ? "border-primary bg-primary/5" : "border-border"
                      } ${isDowngradeOrCurrent && !plan.is_current ? "opacity-60" : ""}`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{plan.name}</p>
                          {plan.is_current && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                              Current Plan
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Subscription</p>
                        <p className="text-sm font-medium">
                          {plan.is_current
                            ? `${formatDate(billing.subscription?.starts_at)} to ${formatDate(
                                billing.subscription?.ends_at
                              )}`
                            : "Starts after upgrade"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Pay ID</p>
                        <p className="max-w-[180px] truncate text-sm font-medium">
                          {plan.is_current
                            ? billing.subscription?.razorpay_subscription_id || "Not set"
                            : "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="text-sm font-semibold capitalize">
                          {plan.formatted_price} / {plan.billing_period}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleViewPlan}>
                          <Eye className="h-4 w-4" />
                          View Plan
                        </Button>

                        <Button
                          size="sm"
                          disabled={isDowngradeOrCurrent}
                          onClick={() => {
                            window.location.href = `/plans?plan=${plan.slug}`
                          }}
                        >
                          {actionLabel}
                        </Button>

                        {plan.is_current && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleDownloadInvoice(plan.id)}
                          >
                            <Download className="h-4 w-4" />
                            Invoice
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {!billing.plans?.length && (
                  <p className="text-sm text-muted-foreground">No active plans found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
