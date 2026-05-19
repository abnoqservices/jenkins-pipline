'use client'

import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, ArrowRight, X, Sparkles, Loader2 } from 'lucide-react'
import { useState, useRef } from "react"
import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axiosClient from "@/lib/axiosClient"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

const productFields = [
  { value: "name", label: "Product Name", required: true },
  { value: "sku", label: "SKU", required: true },
  { value: "description", label: "Description", required: false },
  { value: "price", label: "Price", required: false },
  { value: "category", label: "Category", required: false },
  { value: "category_id", label: "Category ID", required: false },
  { value: "tags", label: "Tags", required: false },
  { value: "meta_title", label: "Meta Title", required: false },
  { value: "meta_description", label: "Meta Description", required: false },
  { value: "keywords", label: "Keywords", required: false },
  { value: "video_url", label: "Video URL", required: false },
  { value: "url_slug", label: "URL Slug", required: false },
  { value: "is_active", label: "Is Active", required: false },
  { value: "status", label: "Status", required: false },
]

export default function BulkImportPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [selectedDepartmentName, setSelectedDepartmentName] = React.useState<string | null>(null)
  
  // Get department name on mount
  React.useEffect(() => {
    const deptName = localStorage.getItem("selectedDepartmentName")
    if (deptName) {
      setSelectedDepartmentName(deptName)
    }
  }, [])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [filePath, setFilePath] = useState<string>("")
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
  const [showMapping, setShowMapping] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [sampleData, setSampleData] = useState<any>({})
  const [sampleDataRows, setSampleDataRows] = useState<any[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const mappingSectionRef = React.useRef<HTMLDivElement>(null)
  const [uploading, setUploading] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importOptions, setImportOptions] = useState({
    skip_duplicates: true,
    generate_seo: false,
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadedFile(file)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await axiosClient.post('/products/import/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (res.data.success) {
        const { headers, sample_data, sample_data_rows, total_rows, file_path } = res.data.data
        setCsvHeaders(headers)
        setSampleData(sample_data)
        setSampleDataRows(sample_data_rows || [])
        setTotalRows(total_rows)
        setFilePath(file_path)

        // Basic auto-mapping
        const autoMapping: Record<string, string> = {}
        headers.forEach((header: string) => {
          const normalized = header.toLowerCase()
          const match = productFields.find(f => 
            normalized.includes(f.value) || f.value.includes(normalized)
          )
          if (match) {
            autoMapping[header] = match.value
          }
        })
        setFieldMapping(autoMapping)

        // Parse preview data from sample
        const preview = sample_data_rows && sample_data_rows.length > 0 
          ? sample_data_rows.slice(0, 5) 
          : [sample_data]
        setPreviewData(preview)
        setShowMapping(true)

        // Auto-scroll to mapping section
        setTimeout(() => {
          mappingSectionRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
        }, 300)

        toast({
          title: "File uploaded",
          description: `Found ${total_rows} rows. Map your fields to continue.`,
        })
      }
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.response?.data?.message || "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleAISuggestions = async () => {
    if (csvHeaders.length === 0) return

    setSuggesting(true)
    try {
      const res = await axiosClient.post('/products/import/suggest-mappings', {
        csv_headers: csvHeaders,
        sample_data: sampleData,
        sample_data_rows: sampleDataRows, // Send multiple rows for better AI understanding
      })

      if (res.data.success) {
        const suggestions = res.data.data.mappings
        // Only update non-empty mappings (don't overwrite user selections with null)
        const updatedMapping = { ...fieldMapping }
        Object.keys(suggestions).forEach(key => {
          if (suggestions[key] && suggestions[key] !== 'skip') {
            updatedMapping[key] = suggestions[key]
          }
        })
        setFieldMapping(updatedMapping)
        toast({
          title: "AI suggestions applied",
          description: "Field mappings have been updated with AI suggestions.",
        })
      }
    } catch (err: any) {
      console.error('AI suggestion error:', err)
      toast({
        title: "Failed to get suggestions",
        description: err.response?.data?.message || err.response?.data?.error || "AI service unavailable. You can map fields manually.",
        variant: "destructive",
      })
    } finally {
      setSuggesting(false)
    }
  }

  const handleMappingChange = (csvHeader: string, productField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvHeader]: productField === "skip" ? "" : productField
    }))
  }

  const handleImport = async () => {
    console.log('Import button clicked', { filePath, fieldMapping, importOptions })
    
    // Validate file path exists
    if (!filePath) {
      console.error('No file path')
      toast({
        title: "No file selected",
        description: "Please upload a CSV file first",
        variant: "destructive",
      })
      return
    }

    // Validate required fields are mapped
    const requiredFields = productFields.filter(f => f.required)
    const mappedFields = Object.values(fieldMapping).filter(v => v && v !== "skip" && v !== "")
    
    console.log('Required fields check', { requiredFields: requiredFields.map(f => f.value), mappedFields })
    
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f.value))
    if (missingRequired.length > 0) {
      console.error('Missing required fields', missingRequired)
      toast({
        title: "Missing required fields",
        description: `Please map: ${missingRequired.map(f => f.label).join(', ')}`,
        variant: "destructive",
      })
      return
    }

    console.log('Starting import...')
    setImporting(true)
    try {
      // Get the active department ID from localStorage (the one shown in navbar)
      const selectedDepartmentId = localStorage.getItem("selectedDepartmentId")
      
      if (!selectedDepartmentId) {
        toast({
          title: "Error",
          description: "No department selected. Please select a department from the navbar.",
          variant: "destructive",
        })
        setImporting(false)
        return
      }
      
      const departmentId = parseInt(selectedDepartmentId)
      const payload: any = {
        file_path: filePath,
        field_mapping: fieldMapping,
        options: importOptions,
        // CRITICAL: Always include department_id to ensure products are scoped to the active department
        // This ensures duplicate checking (SKU, etc.) only happens within the department scope
        department_id: departmentId,
      }
      
      console.log('Import payload with department_id:', payload)
      console.log('Importing to department ID:', departmentId)
      
      const res = await axiosClient.post('/products/import/import', payload)
      console.log('Import response:', res.data)

      if (res.data.success) {
        const { success, failed, skipped, errors } = res.data.data
        
        // Check if errors are related to duplicate SKUs across departments
        const duplicateErrors = errors?.filter((err: any) => 
          err.message?.toLowerCase().includes('sku') && 
          err.message?.toLowerCase().includes('already exists')
        ) || []
        
        if (duplicateErrors.length > 0) {
          console.warn('⚠️ BACKEND ISSUE: Duplicate SKU errors detected. These should be checked within department scope only.', {
            department_id: departmentId,
            department_name: localStorage.getItem("selectedDepartmentName"),
            errors: duplicateErrors,
            note: 'The backend is checking for duplicate SKUs globally instead of within the department scope. Same SKUs should be allowed in different departments.'
          })
          
          // Show detailed error message
          const errorDetails = duplicateErrors.map((err: any) => 
            `Row ${err.row}: ${err.message}`
          ).join('\n')
          
          toast({
            title: "Import completed with warnings",
            description: `Successfully imported ${success} products. ${failed > 0 ? `${failed} failed.` : ''} ${skipped > 0 ? `${skipped} skipped.` : ''}\n\n⚠️ ${duplicateErrors.length} duplicate SKU error(s) detected. These SKUs may exist in OTHER departments, not the current one (Department ID: ${departmentId}). The backend should check duplicates within department scope only.`,
            variant: "default",
            duration: 10000, // Show longer for important message
          })
          
          // Also log full error details
          console.error('Full duplicate error details:', errorDetails)
        } else {
          toast({
            title: "Import completed",
            description: `Successfully imported ${success} products. ${failed > 0 ? `${failed} failed.` : ''} ${skipped > 0 ? `${skipped} skipped.` : ''}`,
          })
        }

        if (errors && errors.length > 0) {
          console.log('Import errors:', errors)
          console.log('Department ID used:', departmentId)
          console.log('Department Name:', localStorage.getItem("selectedDepartmentName"))
        }

        // Redirect to products page after successful import
        setTimeout(() => {
          router.push('/products')
        }, 2000)
      } else {
        throw new Error(res.data.message || 'Import failed')
      }
    } catch (err: any) {
      console.error('Import error:', err)
      console.error('Error response:', err.response)
      const departmentId = localStorage.getItem("selectedDepartmentId")
      console.error('Department ID that was used:', departmentId)
      
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to import products"
      
      // Check if error is related to duplicate SKUs
      if (errorMessage.toLowerCase().includes('sku') && errorMessage.toLowerCase().includes('already exists')) {
        toast({
          title: "Import failed - Duplicate SKU",
          description: `${errorMessage}. Note: Duplicate checking should be scoped to the current department (ID: ${departmentId}). Please ensure the backend checks duplicates within department scope.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Import failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    // Create CSV template
    const headers = productFields.filter(f => f.required || f.value === 'description').map(f => f.label)
    const csvContent = headers.join(',') + '\n'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Bulk Import Products</h1>
              <p className="text-muted-foreground mt-2">
                Import multiple products at once using CSV files with AI-powered field mapping
              </p>
            </div>
            {selectedDepartmentName && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Importing to:</p>
                <p className="text-sm font-semibold text-blue-600">
                  {selectedDepartmentName}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg font-bold text-primary">1</span>
                </div>
                <CardTitle className="text-base">Download Template</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Download our CSV template with all required fields
              </p>
              <Button variant="outline" className="w-full" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg font-bold text-primary">2</span>
                </div>
                <CardTitle className="text-base">Fill in Data</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add your product details including names, descriptions, prices, and categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg font-bold text-primary">3</span>
                </div>
                <CardTitle className="text-base">Upload & Import</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload your completed file, map fields with AI assistance, and import
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Supported formats: CSV (max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 hover:border-primary/50 transition-colors cursor-pointer">
              {uploading ? (
                <>
                  <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                  <p className="text-sm font-medium">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">CSV files (max 10MB)</p>
                </>
              )}
              {uploadedFile && !uploading && (
                <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{uploadedFile.name}</span>
                </div>
              )}
              <input 
                type="file" 
                accept=".csv,.txt" 
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </CardContent>
        </Card>

        {showMapping && (
          <div ref={mappingSectionRef}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Map Your Fields</CardTitle>
                    <CardDescription>
                      Match your CSV columns to product fields. Use AI to get smart suggestions.
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleAISuggestions}
                    disabled={suggesting}
                  >
                    {suggesting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Get AI Suggestions
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center font-medium text-sm text-muted-foreground pb-3 border-b">
                    <div>Your Column</div>
                    <div></div>
                    <div>Maps To</div>
                  </div>
                  
                  {csvHeaders.map(header => (
                    <div key={header} className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-lg border">
                        <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-sm">{header}</span>
                      </div>
                      
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      
                      <Select
                        value={fieldMapping[header] || ""}
                        onValueChange={(value) => handleMappingChange(header, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Skip this column</SelectItem>
                          {productFields.map(field => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Required fields</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Make sure to map all required fields: {productFields.filter(f => f.required).map(f => f.label).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={importOptions.skip_duplicates}
                      onChange={(e) => setImportOptions({ ...importOptions, skip_duplicates: e.target.checked })}
                      className="rounded"
                    />
                    Skip duplicate products (by SKU within current department)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={importOptions.generate_seo}
                      onChange={(e) => setImportOptions({ ...importOptions, generate_seo: e.target.checked })}
                      className="rounded"
                    />
                    Generate SEO content (meta title, description, keywords) using AI
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview Data</CardTitle>
                <CardDescription>
                  Review how your data will be imported (showing sample row from {totalRows} total rows)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {csvHeaders.filter(h => fieldMapping[h] && fieldMapping[h] !== "skip").map(header => (
                          <th key={header} className="text-left p-3 font-medium">
                            {productFields.find(f => f.value === fieldMapping[header])?.label || header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-slate-50">
                          {csvHeaders.filter(h => fieldMapping[h] && fieldMapping[h] !== "skip").map(header => (
                            <td key={header} className="p-3">{row[header] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('Import button clicked')
                      handleImport()
                    }} 
                    className="flex-1"
                    disabled={importing || !filePath}
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        Import {totalRows} Products
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowMapping(false)
                      setUploadedFile(null)
                      setFieldMapping({})
                      setFilePath("")
                    }}
                    disabled={importing}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
