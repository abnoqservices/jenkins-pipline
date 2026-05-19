'use client'

import { DashboardLayout } from "@/components/dashboard/layout"
import { useState, useEffect } from 'react'
import { useRouter } from "next/navigation"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, Plus, ChevronsUpDown, Check } from 'lucide-react'
import CustomField from '@/app/customers/custom-fields/page'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import axiosClient from '@/lib/axiosClient'
import { showToast } from '@/lib/showToast'

// ────────────────────────────────────────────────
// TYPES & SCHEMA
// ────────────────────────────────────────────────

interface CustomField {
  id: number
  key: string
  label: string
  type: string
  options: { choices?: string[] } | null
  is_required: boolean
  is_active: boolean
  order: number
}

const contactSchema = z.object({
  first_name: z.string().max(255).optional().nullable(),
  last_name: z.string().max(255).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(255).optional().nullable(),
  company: z.string().max(255).optional().nullable(),
  contact_type: z.enum(['manual', 'manual_bulk_import', 'ai_detection', 'visitor_capture', 'api']).optional(),
  contact_source: z.enum(['dashboard', 'csv_import', 'factors_ai', 'clearbit', 'website', 'product_lp', 'zapier']).optional(),
  identified_at: z.date().optional().nullable(),
  status: z.enum(['active', 'archived']).optional(),
  deduplicate: z.boolean().default(true),
  source_metadata_json: z.string().optional().nullable(),
})

type ContactForm = z.infer<typeof contactSchema>

const defaultValues: ContactForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  company: '',
  contact_type: 'manual',
  contact_source: 'dashboard',
  identified_at: undefined,
  status: 'active',
  deduplicate: true,
  source_metadata_json: '',
}

// ────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────

export default function CreateContactPage() {
  const router = useRouter()
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [customValues, setCustomValues] = useState<Record<string, any>>({})
  const [loadingCustomFields, setLoadingCustomFields] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  })

  useEffect(() => {
    const fetchCustomFields = async () => {
      try {
        const res = await axiosClient.get('/contacts/custom-fields')
        if (res.data.success) {
          const active = res.data.data
            .filter((f: CustomField) => f.is_active)
            .sort((a: CustomField, b: CustomField) => a.order - b.order)
          setCustomFields(active)
        }
      } catch (err) {
        showToast('Could not load custom fields', 'error')
      } finally {
        setLoadingCustomFields(false)
      }
    }
    fetchCustomFields()
  }, [])

  const resetForm = () => {
    form.reset(defaultValues)
    setCustomValues({})
  }

  const preparePayload = (values: ContactForm) => {
    const payload: any = {}

    if (values.first_name?.trim()) payload.first_name = values.first_name.trim()
    if (values.last_name?.trim()) payload.last_name = values.last_name.trim()
    if (values.email?.trim()) payload.email = values.email.trim()
    if (values.phone?.trim()) payload.phone = values.phone.trim()
    if (values.company?.trim()) payload.company = values.company.trim()

    payload.contact_type = 'manual'
    payload.contact_source = 'dashboard'
    if (values.status) payload.status = values.status
    payload.deduplicate = values.deduplicate

    if (values.identified_at) {
      payload.identified_at = format(values.identified_at, "yyyy-MM-dd'T'HH:mm:ssXXX")
    }

    if (values.source_metadata_json?.trim()) {
      try {
        payload.source_metadata = JSON.parse(values.source_metadata_json)
      } catch {
        showToast('Invalid JSON in source metadata — saved without it', 'warning')
      }
    }

    return payload
  }

  const handleApiError = (err: any) => {
    const res = err.response
    if (res?.status === 409) {
      showToast(`Duplicate email detected (ID: ${res.data.data?.duplicate_id || '?'})`, 'warning')
    } else if (res?.status === 422) {
      Object.entries(res.data.errors || {}).forEach(([key, msgs]: [string, any]) => {
        form.setError(key as any, { message: msgs.join(', ') })
      })
      showToast('Please fix the validation errors shown in the form', 'error')
    } else {
      showToast(res?.data?.message || 'Failed to create contact', 'error')
    }
  }

  const onSubmit = async (values: ContactForm) => {
    setSubmitting(true)

    const payload = preparePayload(values)

    try {
      const createRes = await axiosClient.post('/contacts', payload)
      const contactId = createRes.data.data.id

      showToast(createRes.data.message, 'success')

      // Save custom fields
      if (Object.keys(customValues).length > 0) {
        try {
          await axiosClient.put(`/contacts/${contactId}/custom-fields`, {
            fields: customValues,
          })
        } catch (cfErr: any) {
          showToast(
            cfErr.response?.data?.message || 'Custom fields saved partially',
            'warning'
          )
        }
      }

      resetForm()

    } catch (err: any) {
      handleApiError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const renderCustomFieldInput = (field: CustomField) => {
    const key = field.key;
    const value = customValues[key];
    const choices = field.options?.choices || [];
  
    // ─── Text-like fields ───
    if (["text", "email", "phone", "url", "number"].includes(field.type)) {
      return (
        <Input
          type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
          value={value ?? ""}
          onChange={(e) => setCustomValues((prev) => ({ ...prev, [key]: e.target.value }))}
        />
      );
    }
  
    if (field.type === "textarea") {
      return (
        <Textarea
          value={value ?? ""}
          onChange={(e) => setCustomValues((prev) => ({ ...prev, [key]: e.target.value }))}
          rows={3}
        />
      );
    }
  
    // ─── Date ───
    if (field.type === "date") {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              {value ? format(new Date(value), "PPP") : "Pick a date"}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(date) =>
                setCustomValues((prev) => ({
                  ...prev,
                  [key]: date ? date.toISOString() : null,
                }))
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    }
  
    // ─── Boolean ───
    if (field.type === "boolean") {
      return (
        <div className="pt-2">
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => setCustomValues((prev) => ({ ...prev, [key]: checked }))}
          />
        </div>
      );
    }
  
    // ─── Single select ───
    if (field.type === "select") {
      return (
        <Select
          value={value ?? ""}
          onValueChange={(val) => setCustomValues((prev) => ({ ...prev, [key]: val }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select option..." />
          </SelectTrigger>
          <SelectContent>
            {choices.map((choice) => (
              <SelectItem key={choice} value={choice}>
                {choice}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
  
    // ─── Radio (single choice with visible buttons) ───
    if (field.type === "radio") {
      return (
        <div className="space-y-3 pt-1">
          {choices.map((choice) => (
            <div key={choice} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${key}-${choice}`}
                name={key}
                value={choice}
                checked={value === choice}
                onChange={() => setCustomValues((prev) => ({ ...prev, [key]: choice }))}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor={`${key}-${choice}`}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {choice}
              </label>
            </div>
          ))}
        </div>
      );
    }
  
    // ─── Checkbox / multi_select ───
 // ─── Checkbox (shows list of checkboxes) ───
if (field.type === "checkbox") {
  const selected = Array.isArray(value) ? value : [];

  return (
    <div className="space-y-3 pt-1">
      {choices.map((choice) => {
        const isChecked = selected.includes(choice);
        return (
          <div key={choice} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`${key}-${choice}`}
              checked={isChecked}
              onChange={() => {
                const next = isChecked
                  ? selected.filter((v) => v !== choice)
                  : [...selected, choice];
                setCustomValues((prev) => ({ ...prev, [key]: next.length ? next : [] }));
              }}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor={`${key}-${choice}`}
              className="text-sm font-medium leading-none cursor-pointer select-none"
            >
              {choice}
            </label>
          </div>
        );
      })}
    </div>
  );
}

// ─── Multi-select (dropdown / tags style) ───
if (field.type === "multi_select") {
  const selected = Array.isArray(value) ? value : [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between text-left font-normal h-auto min-h-10 py-2 px-3",
            selected.length === 0 && "text-muted-foreground"
          )}
        >
          <div className="flex flex-wrap gap-1.5 max-w-[calc(100%-24px)]">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">Select options...</span>
            ) : (
              selected.map((item) => (
                <div
                  key={item}
                  className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded flex items-center gap-1"
                >
                  {item}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = selected.filter((v) => v !== item);
                      setCustomValues((prev) => ({ ...prev, [key]: next.length ? next : [] }));
                    }}
                    className="text-primary/70 hover:text-primary ml-1"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search or type..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {choices.map((choice) => {
                const isSelected = selected.includes(choice);
                return (
                  <CommandItem
                    key={choice}
                    value={choice}
                    onSelect={() => {
                      const nextSelected = isSelected
                        ? selected.filter((v) => v !== choice)
                        : [...selected, choice];
                      setCustomValues((prev) => ({
                        ...prev,
                        [key]: nextSelected.length ? nextSelected : [],
                      }));
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <span>{choice}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
  
    // Fallback
    return (
      <Input
        disabled
        placeholder={`Unsupported field type: ${field.type}`}
      />
    );
  };
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">Add New Contact</h1>
            <p className="text-muted-foreground mt-1">
              Fill the form below — you can keep adding contacts one after another.
            </p>
          </div>
        </div>
    
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>New Contact</CardTitle>
                <CardDescription>
                  Core details + any custom fields your team uses
                </CardDescription>
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button variant="outline" size="lg" className="bg-primary text-white text-slate-50">
      <Plus className="mr-2 h-4 w-4" />
      Add Field
    </Button>
  </DialogTrigger>

  <DialogContent className="!max-w-6xl w-[95vw] !max-h-[92vh] p-0 flex flex-col overflow-y-auto">
  

    <div className="mt-6">
   
      <CustomField onSuccess={() => { setOpen(false)  }} onCancel={() => setOpen(false)} />
    </div>
  </DialogContent>
</Dialog>
            </div>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <CardContent className="grid gap-10 md:grid-cols-2 pb-8">
                {/* Core fields */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold tracking-tight">Basic Information</h3>

                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="identified_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identified At</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : "Pick date"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2 space-y-6">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deduplicate"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="deduplicate"
                          />
                          <FormLabel htmlFor="deduplicate" className="cursor-pointer">
                            Prevent duplicates
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Custom fields */}
                <div className="space-y-6">
                  <div className="pb-1">
                    <h3 className="text-xl font-semibold tracking-tight text-primary">
                       Additional Details
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Business-specific information
                    </p>
                  </div>

                  {loadingCustomFields ? (
                    <div className="py-10 text-center text-muted-foreground bg-slate-50/50 rounded-lg border">
                      <Loader2 className="mx-auto h-7 w-7 animate-spin mb-3" />
                      <p className="font-medium">Loading custom fields...</p>
                    </div>
                  ) : customFields.length === 0 ? (
                    <div className="py-10 px-6 text-center text-muted-foreground bg-slate-50/50 rounded-lg border border-dashed">
                      <p className="font-medium mb-1">No custom fields defined yet</p>
                      <p className="text-sm">
                        Create them in <strong>Settings → Custom Fields</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 bg-slate-50/40 p-6 rounded-lg border">
                      {customFields.map((cf) => (
                        <div key={cf.id} className="space-y-2">
                          <FormLabel className="flex items-center gap-1.5 font-medium">
                            {cf.label}
                            {cf.is_required && <span className="text-red-500 text-xs font-semibold">*</span>}
                          </FormLabel>

                          {renderCustomFieldInput(cf)}

                          <p className="text-xs text-muted-foreground italic">
                            {cf.type}
                            {cf.options?.choices && ` • ${cf.options.choices.length} options`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-4 pt-6 border-t bg-slate-50/70 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                <Button
                  type="submit"
                  disabled={submitting || loadingCustomFields}
                  className="min-w-[180px]"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? 'Creating...' : 'Create Contact'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
   
    </DashboardLayout>
  )
}