// src/lib/formSchema.ts
import { z } from "zod";

// ────────────────────────────────────────────────
// Field type literal union (matches your Field.type)
const fieldTypes = [
  "text",
  "textarea",
  "email",
  "number",
  "phone",
  "date",
  "time",
  "password",
  "select",
  "multi_select",
  "radio",
  "checkbox",
  "file",
  "image",
  "rating",
  "range",
] as const;

export const fieldTypeEnum = z.enum(fieldTypes);

// ────────────────────────────────────────────────
// Rule schema – basic but extensible
export const fieldRuleSchema = z.object({
  type: z.string().min(1, { message: "Rule type is required" }),
  value: z.union([z.number(), z.string(), z.boolean()]).optional(),
  message: z.string().optional().default("Invalid value"),
});

// ────────────────────────────────────────────────
// Main schema for creating / editing a single Field
export const fieldSchema = z.object({
  id: z.string().min(1, { message: "ID is required" }),

  label: z
    .string()
    .min(1, { message: "Label is required" })
    .max(120, { message: "Label is too long (max 120 characters)" }),

  key: z
    .string()
    .min(1, { message: "Key is required" })
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      { message: "Key must start with letter or underscore and contain only letters, numbers, or underscores" }
    )
    .max(60, { message: "Key is too long (max 60 characters)" }),

  type: fieldTypeEnum,

  is_required: z.boolean().default(false),
  is_active: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
  form_section_id: z.number().int().nullable().default(null),

  // Flexible options – most reliable cross-version approach
  options: z.record(z.any()).refine(
    (val) => {
      // Basic structural validation (optional – remove if too strict)
      if ("choices" in val && val.choices !== undefined && !Array.isArray(val.choices)) {
        return false;
      }
      if ("min" in val && val.min !== undefined && typeof val.min !== "number") {
        return false;
      }
      if ("max" in val && val.max !== undefined && typeof val.max !== "number") {
        return false;
      }
      if ("max_size" in val && val.max_size !== undefined && typeof val.max_size !== "number") {
        return false;
      }
      return true;
    },
    { message: "Invalid structure in field options (e.g. choices must be array, min/max must be numbers)" }
  ),

  rules: z
    .array(fieldRuleSchema)
    .max(12, { message: "Maximum 12 rules per field" })
    .refine(
      (rules) => {
        const types = rules.map((r) => r.type);
        return new Set(types).size === types.length;
      },
      { message: "Duplicate rule types are not allowed" }
    )
    .default([]),
});

// ────────────────────────────────────────────────
// Stricter version – enforces required options per field type
// Use this when saving/submitting to backend or final validation
export const strictFieldSchema = fieldSchema.superRefine((data, ctx) => {
  const opts = data.options;

  // Choices required for selection-based fields
  if (["select", "multi_select", "radio", "checkbox"].includes(data.type)) {
    if (!opts.choices || !Array.isArray(opts.choices) || opts.choices.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one choice is required for this field type",
        path: ["options", "choices"],
      });
    }
  }

  // min/max required for rating & range
  if (["rating", "range"].includes(data.type)) {
    if (typeof opts.min !== "number" || typeof opts.max !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "min and max values are required for rating/range fields",
        path: ["options"],
      });
    }
    if (opts.min >= opts.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "min must be less than max",
        path: ["options"],
      });
    }
  }

  // File/image specific
  if (["file", "image"].includes(data.type)) {
    if (typeof opts.max_size !== "number" || opts.max_size < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "max_size (in KB) must be a positive number",
        path: ["options", "max_size"],
      });
    }
  }

  // Optional: add more per-type rules (password minLength, etc.)
});

// ────────────────────────────────────────────────
// Type exports for convenience
export type FieldSchema = z.infer<typeof fieldSchema>;
export type StrictFieldSchema = z.infer<typeof strictFieldSchema>;