import { z } from "zod";
import { Field } from "@/types/form"; // ← make sure this type includes rules & options correctly

/**
 * Builds a Zod schema for a single field based on its type + rules + is_required
 */
function buildFieldSchema(field: Field): z.ZodTypeAny {
  let baseSchema: z.ZodTypeAny;

  // 1. Base type schema
  switch (field.type) {
    case "text":
    case "textarea":
    case "url":
    case "phone":
    case "password":
      baseSchema = z.string();
      break;

    case "email":
      baseSchema = z.string().email({ message: `Please enter a valid ${field.label.toLowerCase()}` });
      break;

    case "number":
    case "range":
      baseSchema = z.number({ invalid_type_error: `${field.label} must be a number` });
      break;

    case "date":
    case "time":
    case "datetime":
      baseSchema = z.string().pipe(z.coerce.date({ invalid_type_error: `Invalid ${field.type} format` }));
      break;

    case "select":
    case "radio":
      baseSchema = z.string();
      break;

    case "multi_select":
    case "checkbox":
      baseSchema = z.array(z.string());
      break;

    case "toggle":
      baseSchema = z.boolean();
      break;

    case "file":
    case "image":
      baseSchema = z.any(); // ← can be improved with FileList / custom validator later
      break;

    case "rating":
      const maxRating = field.options?.max ?? 5;
      baseSchema = z.number()
        .min(0, { message: `${field.label} cannot be below 0` })
        .max(maxRating, { message: `${field.label} cannot exceed ${maxRating}` });
      break;

    case "color":
      baseSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
        message: "Invalid color format (use #RRGGBB or #RGB)",
      });
      break;

    case "hidden":
      baseSchema = z.any().optional();
      break;

    default:
      baseSchema = z.string(); // fallback
  }

  let schema = baseSchema;

  // 2. Apply rules array (from API)
  if (field.rules && Array.isArray(field.rules)) {
    field.rules.forEach((rule) => {
      if (typeof rule === "string") {
        // Simple string rules
        switch (rule) {
          case "required":
            schema = addRequired(schema, field.label);
            break;
          case "email":
            if (schema instanceof z.ZodString) {
              schema = schema.email({ message: `Invalid ${field.label} format` });
            }
            break;
          case "url":
            if (schema instanceof z.ZodString) {
              schema = schema.url({ message: `Must be a valid URL` });
            }
            break;
          // add more string shortcuts if your backend supports them
        }
      } else if (rule && typeof rule === "object" && "type" in rule) {
        // Object-style rules
        const msg = rule.message || `${field.label} is invalid`;

        switch (rule.type) {
          case "min":
            if ("min" in schema) {
              schema = (schema as any).min(rule.value, { message: msg });
            }
            break;

          case "max":
            if ("max" in schema) {
              schema = (schema as any).max(rule.value, { message: msg });
            }
            break;

          case "length":
            if ("length" in schema) {
              schema = (schema as any).length(rule.value, { message: msg });
            }
            break;

          case "minLength":
            if (schema instanceof z.ZodString) {
              schema = schema.min(rule.value, { message: msg });
            }
            break;

          case "maxLength":
            if (schema instanceof z.ZodString) {
              schema = schema.max(rule.value, { message: msg });
            }
            break;

          case "regex":
            if (schema instanceof z.ZodString && rule.value) {
              schema = schema.regex(new RegExp(rule.value), { message: msg });
            }
            break;

          // Add more custom rule types here as needed
        }
      }
    });
  }

  // 3. Fallback required from is_required flag
  if (field.is_required) {
    schema = addRequired(schema, field.label);
  }

  return schema;
}

/**
 * Helper to enforce required validation depending on schema type
 */
function addRequired(schema: z.ZodTypeAny, label: string): z.ZodTypeAny {
  const requiredMessage = `${label} is required`;

  if (schema instanceof z.ZodString) {
    return schema.min(1, { message: requiredMessage });
  }
  if (schema instanceof z.ZodNumber) {
    return schema.refine((val) => val !== undefined && val !== null, { message: requiredMessage });
  }
  if (schema instanceof z.ZodArray) {
    return schema.min(1, { message: requiredMessage });
  }
  if (schema instanceof z.ZodBoolean) {
    return schema.refine((val) => val !== undefined, { message: requiredMessage });
  }

  // Fallback for other types
  return schema.refine((val) => val !== undefined && val !== null && val !== "", {
    message: requiredMessage,
  });
}

/**
 * Main function: creates full form schema from array of fields
 */
export function buildFormValidationSchema(fields: Field[]): z.ZodObject<Record<string, any>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    if (!field.key || !field.is_active) return;
    shape[field.key] = buildFieldSchema(field);
  });

  return z.object(shape);
}