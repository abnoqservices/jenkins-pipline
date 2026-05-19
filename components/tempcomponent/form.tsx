"use client";

import React, { useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2 } from "lucide-react";

interface FormProps {
  productId?: number;
  form_title?: string;
  form_id?: string;
  createForm?: boolean;
}

interface FormField {
  id: number;
  label: string;
  key: string;
  type: string;
  options?: any;
  rules?: any;
  conditions?: any;
  order: number;
  is_required: boolean;
}

interface FormSection {
  id: number;
  title: string;
  order: number;
  fields: FormField[];
}

interface FormData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  version: number;
  sections: FormSection[];
  fields: FormField[];
}

export default function Form({ productId, form_title, form_id,createForm }: FormProps) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    
    const fetchForm = async () => {
      if (!form_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setSubmitError(null);
        
        // Use public endpoint for forms (no authentication required)
        const response = await axiosClient.get(`/public/forms/${encodeURIComponent(form_id)}`);
        
        if (response.data.success) {
          setFormData(response.data.data);
        } else {
          console.error("Failed to fetch form:", response.data.message);
          setSubmitError(response.data.message || "Failed to load form");
        }
      } catch (error: any) {
        console.error("Error fetching form:", error);
        const status = error.response?.status;
        const message = error.response?.data?.message;
        
        if (status === 404) {
          setSubmitError(`Form "${form_id}" not found. Please verify the form ID or slug is correct.`);
        } else if (status === 401) {
          setSubmitError("You don't have permission to access this form.");
        } else if (status === 403) {
          setSubmitError("Access to this form is forbidden.");
        } else {
          setSubmitError(message || "Failed to load form. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [form_id]);

  const handleInputChange = (fieldKey: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
    // Clear error for this field when user starts typing
    if (fieldErrors[fieldKey]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!formData) return false;

    const errors: Record<string, string> = {};
    let isValid = true;

    // Validate all fields (from sections and root fields)
    const sections = Array.isArray(formData.sections) ? formData.sections : [];
    const fields = Array.isArray(formData.fields) ? formData.fields : [];
    
    const allFields: FormField[] = [
      ...sections.flatMap((section) => Array.isArray(section.fields) ? section.fields : []),
      ...fields,
    ];

    allFields.forEach((field) => {
      const value = formValues[field.key];

      if (field.is_required && (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0))) {
        errors[field.key] = `${field.label} is required`;
        isValid = false;
      }

      // Type-specific validation
      if (value !== undefined && value !== null && value !== "") {
        switch (field.type) {
          case "email":
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors[field.key] = "Please enter a valid email address";
              isValid = false;
            }
            break;
          case "url":
            try {
              new URL(value);
            } catch {
              errors[field.key] = "Please enter a valid URL";
              isValid = false;
            }
            break;
          case "number":
            if (isNaN(Number(value))) {
              errors[field.key] = "Please enter a valid number";
              isValid = false;
            }
            break;
        }
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData || !form_id) return;

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      const payload: any = {
        values: formValues,
      };

      if (productId) {
        payload.product_id = productId;
      }

      const response = await axiosClient.post(`/public/forms/${encodeURIComponent(form_id)}/submit`, payload);

      if (response.data.success) {
        setSubmitSuccess(true);
        setFormValues({});
        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      } else {
        setSubmitError(response.data.message || "Failed to submit form");
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      
      if (error.response?.data?.errors) {
        // Handle validation errors from server
        const serverErrors: Record<string, string> = {};
        Object.keys(error.response.data.errors).forEach((key) => {
          const messages = error.response.data.errors[key];
          serverErrors[key] = Array.isArray(messages) ? messages[0] : messages;
        });
        setFieldErrors(serverErrors);
      } else {
        setSubmitError(error.response?.data?.message || "Failed to submit form. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formValues[field.key] || "";
    const error = fieldErrors[field.key];
    const hasError = !!error;

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.key}
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.options?.placeholder}
              required={field.is_required}
              className={hasError ? "border-red-500" : ""}
            />
            {hasError && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleInputChange(field.key, val)}
              required={field.is_required}
            >
              <SelectTrigger className={hasError ? "border-red-500" : ""}>
                <SelectValue placeholder={field.options?.placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.choices?.map((choice: string, idx: number) => (
                  <SelectItem key={idx} value={choice.value}>
                    {choice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case "multi_select":
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.choices?.map((choice: string, idx: number) => (
                <div key={idx} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.key}-${idx}`}
                    checked={Array.isArray(value) && value.includes(choice)}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (checked) {
                        handleInputChange(field.key, [...currentValues, choice]);
                      } else {
                        handleInputChange(
                          field.key,
                          currentValues.filter((v) => v !== choice)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={`${field.key}-${idx}`} className="font-normal cursor-pointer">
                    {choice}
                  </Label>
                </div>
              ))}
            </div>
            {hasError && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case "radio":
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(val) => handleInputChange(field.key, val)}
              required={field.is_required}
            >
              {field.options?.choices?.map((choice: string, idx: number) => (
                <div key={idx} className="flex items-center space-x-2">
                  <RadioGroupItem value={choice} id={`${field.key}-${idx}`} />
                  <Label htmlFor={`${field.key}-${idx}`} className="font-normal cursor-pointer">
                    {choice}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {hasError && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case "checkbox":
        // Check if this is a WhatsApp opt-in field
        const isWhatsAppOptIn = field.key === "whatsapp_opt_in" || field.options?.is_whatsapp_opt_in;
        
        if (isWhatsAppOptIn) {
          // Single checkbox for WhatsApp opt-in
          return (
            <div key={field.id} className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.key}
                  checked={value === true || value === "true"}
                  onCheckedChange={(checked) => handleInputChange(field.key, checked)}
                />
                <Label htmlFor={field.key} className="font-normal cursor-pointer">
                  {field.label || "I agree to receive WhatsApp messages"}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              </div>
              {field.options?.description && (
                <p className="text-xs text-muted-foreground ml-6">
                  {field.options.description}
                </p>
              )}
              {hasError && <p className="text-sm text-red-500">{error}</p>}
            </div>
          );
        }
        
        // Regular checkbox group
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.choices?.map((choice: string, idx: number) => (
                <div key={idx} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.key}-${idx}`}
                    checked={Array.isArray(value) && value.includes(choice)}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (checked) {
                        handleInputChange(field.key, [...currentValues, choice]);
                      } else {
                        handleInputChange(
                          field.key,
                          currentValues.filter((v) => v !== choice)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={`${field.key}-${idx}`} className="font-normal cursor-pointer">
                    {choice}
                  </Label>
                </div>
              ))}
            </div>
            {hasError && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case "toggle":
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={value === true || value === "true"}
              onCheckedChange={(checked) => handleInputChange(field.key, checked)}
            />
            <Label htmlFor={field.key} className="font-normal cursor-pointer">
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {hasError && <p className="text-sm text-red-500 ml-2">{error}</p>}
          </div>
        );

      case "date":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="date"
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              required={field.is_required}
              className={hasError ? "border-red-500" : ""}
            />
            {hasError && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case "time":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="time"
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              required={field.is_required}
              className={hasError ? "border-red-500" : ""}
            />
            {hasError && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case "datetime":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="datetime-local"
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              required={field.is_required}
              className={hasError ? "border-red-500" : ""}
            />
            {hasError && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case "number":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.options?.placeholder}
              required={field.is_required}
              className={hasError ? "border-red-500" : ""}
            />
            {hasError && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case "hidden":
        return (
          <input
            key={field.id}
            type="hidden"
            name={field.key}
            value={value}
          />
        );

      default:
        // text, email, phone, url, password, etc.
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type={field.type === "phone" ? "tel" : field.type}
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.options?.placeholder}
              required={field.is_required}
              className={hasError ? "border-red-500" : ""}
            />
            {hasError && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
    }
  };

  if (!form_id) {
    return null;
  }

  if (loading) {
    return (
      <div className="card-header py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-500" />
        <p className="text-gray-500 mt-4">Loading form...</p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="card-header py-10 text-center">
        <p className="text-red-500">
          {submitError || `Form with ID "${form_id}" not found`}
        </p>
      </div>
    );
  }

  // Combine sections and root fields, sorted by order
  const allSections = (Array.isArray(formData.sections) ? [...formData.sections] : []).sort((a, b) => a.order - b.order);
  const rootFields = (Array.isArray(formData.fields) ? [...formData.fields] : []).sort((a, b) => a.order - b.order);

  return (
    <div className="card-header py-10">
      {/* Form Title */}
      {(form_title || formData.name) && (
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">
            {form_title || formData.name}
          </h2>
          {formData.description && (
            <p className="text-gray-600 mt-2">{formData.description}</p>
          )}
          <div className="w-20 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
        </div>
      )}

      {/* Success Message */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="text-green-800">Form submitted successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {submitError && !submitSuccess && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{submitError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        {/* Render sections with their fields */}
        {allSections.map((section) => (
          <div key={section.id} className="space-y-4">
            {section.title && (
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
                {section.title}
              </h3>
            )}
            <div className="space-y-4">
              {section.fields.map((field) => renderField(field))}
            </div>
          </div>
        ))}

        {/* Render root fields (fields not in any section) */}
        {rootFields.length > 0 && (
          <div className="space-y-4">
            {rootFields.map((field) => renderField(field))}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
