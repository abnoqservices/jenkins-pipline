"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { GripVertical, Plus, Trash2, Save } from "lucide-react"
import { Spinner } from "@/components/ui/spinner";
import axiosClient from "@/lib/axiosClient";

export default function CustomFieldsPage() {
  const [customFields, setCustomFields] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  // -----------------------------------
  // 🔹 Fetch FROM DB (GET API)
  // -----------------------------------
  React.useEffect(() => {
    async function loadFields() {
      try {
        const res= await axiosClient.get("/manageapi/customFieldmasterlist");
       // const res = await fetch("/api/custom-fields")
        const data = await res.data;

        if (data.success) {
          setCustomFields(
            data.fields.map((f: any) => ({
              id: f.id.toString(),
              name: f.name,
              type: f.type,
              required: f.required,
            }))
          )
        }
      } catch (err) {
        console.error("Failed to load fields:", err)
      }
      setLoading(false)
    }

    loadFields()
  }, [])

  // -----------------------------------
  // 🔹 Update field live when editing
  // -----------------------------------
  const updateField = (id: string, key: string, value: any) => {
    setCustomFields((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    )
  }

  // -----------------------------------
  // 🔹 Add new field
  // -----------------------------------
  const addField = () => {
    const newField = {
      id: Date.now().toString(),
      name: "",
      type: "text",
      required: false,
    }
    setCustomFields([...customFields, newField])
  }

  // -----------------------------------
  // 🔹 Remove field
  // -----------------------------------
  const removeField = (id: string) => {
    setCustomFields(customFields.filter((field) => field.id !== id))
  }

  // -----------------------------------
  // 🔹 Save to DB (POST API)
  // -----------------------------------
  const saveFields = async () => {
    setSaving(true)

    const payload = {
      fields: customFields.map((f) => ({
        name: f.name,
        type: f.type,
        required: f.required,
      })),
    }
   const res= await axiosClient.post("/manageapi/customFieldmastersave", payload);
   const data = await res.data;
    setSaving(false)
    alert(data.message)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-10">Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Custom Fields</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Define custom fields for product specifications and attributes
            </p>
          </div>

          <Button className="gap-2" onClick={saveFields} disabled={saving}>
          
            {saving ? <Spinner className="size-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? "Saving..." : "Save Draft"}
          </Button>
        </div>

        {/* Custom Fields Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Product Custom Fields</CardTitle>
            <CardDescription>Add and manage custom fields</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {customFields.map((field) => (
              <div
                key={field.id}
                className="flex items-center gap-4 rounded-lg border border-slate-200 p-4"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />

                <div className="flex-1 grid gap-4 sm:grid-cols-3">
                  {/* Field Name */}
                  <div className="space-y-2">
                    <Label className="text-xs">Field Name</Label>
                    <Input
                      value={field.name}
                      onChange={(e) =>
                        updateField(field.id, "name", e.target.value)
                      }
                      placeholder="e.g., Warranty"
                    />
                  </div>

                  {/* Field Type */}
                  <div className="space-y-2">
                    <Label className="text-xs">Field Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) =>
                        updateField(field.id, "type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="select">Dropdown</SelectItem>
                        <SelectItem value="textarea">Long Text</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Required Switch */}
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={field.required}
                      onCheckedChange={(v) =>
                        updateField(field.id, "required", v)
                      }
                    />
                    <Label className="text-sm">Required</Label>
                  </div>
                </div>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(field.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            {/* Add button */}
            <Button variant="outline" className="w-full gap-2" onClick={addField}>
              <Plus className="h-4 w-4" />
              Add Custom Field
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
