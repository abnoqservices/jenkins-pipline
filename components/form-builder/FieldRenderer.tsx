// src/components/form-builder/FieldRenderer.tsx
"use client";

import React from "react";
import { Field } from "@/types/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { Eye, EyeOff, Star, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldRendererProps {
  field: Field;
  mode: "builder" | "preview";
}

export default function FieldRenderer({ field, mode }: FieldRendererProps) {
  // Safely access form context – only in preview mode we expect it to exist
  const ctx = mode === "preview" ? useFormContext() : null;

  // Destructure with fallback to undefined
  const register = ctx?.register;
  const watch = ctx?.watch;
  const setValue = ctx?.setValue;
  const errors = ctx?.formState?.errors;

  const isDisabled = mode === "builder";
  const fieldError = errors?.[field.key];
  const hasError = !!fieldError && mode === "preview";

  const errorClasses = hasError
    ? "border-red-500 focus-visible:ring-red-500 focus-visible:ring-offset-red-500"
    : "border-input focus-visible:ring-ring";

  // Reusable error message
  const ErrorMessage = () =>
    hasError ? (
      <p className="text-sm text-red-600 mt-1.5">
        {String(fieldError?.message ?? "This field is invalid")}
      </p>
    ) : null;

  const renderLabel = () => (
    <Label htmlFor={field.key} className="mb-1.5 block">
      {field.label}
      {field.is_required && <span className="text-red-500 ml-1">*</span>}
    </Label>
  );

  switch (field.type) {
    // Text-like fields
    case "text":
    case "email":
    case "number":
    case "phone":
    case "date":
    case "time":
    case "password": {
      const inputType = field.type === "password" ? "password" : field.type;

      const PasswordInput = () => {
        const [show, setShow] = React.useState(false);
        return (
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              className={cn("pr-10", errorClasses)}
              disabled={isDisabled}
              placeholder={field.options?.placeholder || ""}
              {...(register ? register(field.key) : {})}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShow(!show)}
              disabled={isDisabled}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        );
      };

      return (
        <div className="space-y-1.5">
          {renderLabel()}
          {field.type === "password" ? <PasswordInput /> : (
            <Input
              type={inputType}
              className={errorClasses}
              disabled={isDisabled}
              placeholder={field.options?.placeholder || ""}
              {...(register ? register(field.key) : {})}
            />
          )}
          <ErrorMessage />
        </div>
      );
    }

    case "textarea":
      return (
        <div className="space-y-1.5">
          {renderLabel()}
          <Textarea
            className={cn(errorClasses, "min-h-[90px]")}
            disabled={isDisabled}
            placeholder={field.options?.placeholder || ""}
            {...(register ? register(field.key) : {})}
          />
          <ErrorMessage />
        </div>
      );

    // Select
    case "select": {
      const value = watch?.(field.key) as string | undefined;

      return (
        <div className="space-y-1.5">
          {renderLabel()}
          <Select
            disabled={isDisabled}
            value={value}
            onValueChange={(val) => setValue?.(field.key, val, { shouldValidate: true })}
          >
            <SelectTrigger className={errorClasses}>
              <SelectValue placeholder={field.options?.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.choices?.map((choice: string, i: number) => (
                <SelectItem key={i} value={choice}>
                  {choice}
                </SelectItem>
              )) ?? <SelectItem value="">No options available</SelectItem>}
            </SelectContent>
          </Select>
          <ErrorMessage />
        </div>
      );
    }

    // Multi Select
    case "multi_select": {
      const selected = (watch?.(field.key) as string[]) ?? [];
      const options = (field.options?.choices ?? []).map((c: string) => ({
        label: c,
        value: c,
      }));

      return (
        <div className="space-y-1.5">
          {renderLabel()}
          <MultiSelect
            options={options}
            value={selected}
            onValueChange={(vals) => setValue?.(field.key, vals, { shouldValidate: true })}
            placeholder={field.options?.placeholder || "Select options..."}
            disabled={isDisabled}
            className={cn(hasError && "border-red-500 focus-within:border-red-500")}
          />
          <ErrorMessage />
        </div>
      );
    }

    // Radio
    case "radio":
      return (
        <div className="space-y-1.5">
          {renderLabel()}
          <RadioGroup
            disabled={isDisabled}
            onValueChange={(val) => setValue?.(field.key, val, { shouldValidate: true })}
            className={cn(hasError && "text-red-600")}
          >
            {field.options?.choices?.map((choice: string, i: number) => (
              <div key={i} className="flex items-center space-x-2">
                <RadioGroupItem value={choice} id={`${field.key}-${i}`} />
                <Label htmlFor={`${field.key}-${i}`}>{choice}</Label>
              </div>
            )) ?? <div className="text-sm text-muted-foreground">No options</div>}
          </RadioGroup>
          <ErrorMessage />
        </div>
      );

    // Checkbox (simple version)
    case "checkbox":
      return (
        <div className="space-y-1.5">
          {renderLabel()}
          <div className={cn("space-y-2", hasError && "text-red-600")}>
            {field.options?.choices?.map((choice: string, i: number) => (
              <div key={i} className="flex items-center space-x-2">
                <Checkbox id={`${field.key}-${i}`} disabled={isDisabled} />
                <Label htmlFor={`${field.key}-${i}`}>{choice}</Label>
              </div>
            )) ?? <div className="text-sm text-muted-foreground">No options</div>}
          </div>
          <ErrorMessage />
        </div>
      );

    // Rating
    case "rating": {
      const current = Number(watch?.(field.key) ?? 0);
      const max = field.options?.max ?? 5;
      const size = field.options?.size ?? 28;

      return (
        <div className="space-y-1.5">
          {renderLabel()}
          <div className="flex items-center gap-1">
            {Array.from({ length: max }).map((_, i) => {
              const val = i + 1;
              const active = current >= val;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setValue?.(field.key, val, { shouldValidate: true })}
                  className={cn(
                    "focus:outline-none transition-all",
                    isDisabled ? "opacity-60 cursor-not-allowed" : "hover:scale-110"
                  )}
                >
                  <Star
                    size={size}
                    className={cn(
                      active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                    )}
                    strokeWidth={active ? 0 : 1.5}
                  />
                </button>
              );
            })}
            {current > 0 && (
              <span className="ml-3 text-sm text-muted-foreground">
                {current} / {max}
              </span>
            )}
          </div>
          <ErrorMessage />
        </div>
      );
    }

    // Range (Slider)
    case "range":
      return (
        <div className="space-y-1.5">
          {renderLabel()}
          <Slider
            defaultValue={[field.options?.min || 0]}
            min={field.options?.min || 0}
            max={field.options?.max || 100}
            step={field.options?.step || 1}
            disabled={isDisabled}
            onValueChange={(vals) => setValue?.(field.key, vals[0], { shouldValidate: true })}
          />
          <ErrorMessage />
        </div>
      );

    // File / Image
    case "file":
    case "image": {
      const isImage = field.type === "image";
      const accept = isImage
        ? "image/*"
        : field.options?.allowed_types?.map((ext: string) => `.${ext}`).join(",") || "*/*";

      const maxSizeKB = field.options?.max_size ?? 2048;
      const currentFile = watch?.(field.key) as File | null | undefined;

      return (
        <div className="space-y-2">
          {renderLabel()}

          {mode === "preview" ? (
            <FileDropzone
              onFilesChange={(files) => {
                if (files?.length) {
                  setValue?.(field.key, files[0], { shouldValidate: true });
                }
              }}
              accept={accept}
              maxFiles={1}
              maxSize={maxSizeKB * 1024}
              className={cn(hasError && "border-red-500")}
            />
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/40">
              <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">
                {isImage ? "Image" : "File"} upload (preview mode only)
              </p>
            </div>
          )}

          {currentFile && mode === "preview" && (
            <div className="mt-3 text-sm">
              {isImage && currentFile.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(currentFile)}
                  alt="Preview"
                  className="max-h-40 object-contain rounded border"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currentFile.name}</span>
                  <span className="text-muted-foreground">
                    ({(currentFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
          )}

          <ErrorMessage />

          <p className="text-xs text-muted-foreground mt-2">
            Max size: {maxSizeKB} KB • {isImage ? "Images" : "Files"} allowed
          </p>
        </div>
      );
    }

    default:
      return (
        <div className="text-destructive text-sm">
          Unsupported field type: <strong>{field.type}</strong>
        </div>
      );
  }
}