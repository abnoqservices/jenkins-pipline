// src/types/form.ts

/**
 * Possible validation rule types (expandable)
 */
export type RuleType =
  | "required"
  | "minLength"
  | "maxLength"
  | "min"
  | "max"
  | "step"
  | "email"
  | "url"
  | "pattern"           // regex
  | "phone"             // basic phone validation
  | "equals"            // exact match (useful for confirm password)
  | "oneOf"             // value must be one of array
  | "notOneOf";         // value must NOT be one of array

/**
 * Strongly typed rule with appropriate value type per rule
 */
export interface FieldRule {
  type: RuleType;
  /**
   * The constraint value (depends on type):
   * - minLength/maxLength → number
   * - min/max/step → number
   * - pattern → string (regex source)
   * - equals → string
   * - oneOf/notOneOf → string[]
   * - required/email/url/phone → no value needed (or boolean)
   */
  value?: number | string | string[] | boolean;
  /**
   * Custom error message (falls back to default if omitted)
   */
  message?: string;
}

/**
 * Common options shared across field types
 */
export interface BaseFieldOptions {
  placeholder?: string;
  helperText?: string;          // small text below field
  defaultValue?: any;
}

/**
 * Type-specific options (discriminated union would be ideal, but keeping flat for simplicity)
 */
export interface FieldOptions extends BaseFieldOptions {
  // select / multi_select / radio / checkbox
  choices?: string[];           // or { label: string; value: string }[] later
  multiple?: boolean;

  // number / range
  min?: number;
  max?: number;
  step?: number;

  // file / image
  max_size?: number;            // KB
  allowed_types?: string[];     // ["jpg", "png", "pdf", ...]

  // rating
  ratingMax?: number;           // usually 5
  ratingIcon?: string;          // optional – could be emoji or lucide name

  // password
  showStrengthMeter?: boolean;

  // generic catch-all (use sparingly)
  [key: string]: any;
}

/**
 * Main field definition
 */
export interface Field {
  id: string;                   // unique per field (uuid or timestamp+random)
  label: string;
  key: string;                  // form data key (should be unique per form)
  type:
    | "text"
    | "textarea"
    | "email"
    | "password"                // ← added
    | "number"
    | "phone"
    | "date"
    | "time"                    // ← added
    | "select"
    | "multi_select"
    | "radio"
    | "checkbox"
    | "file"
    | "image"
    | "rating"
    | "range";
  options: FieldOptions;
  rules?: Array<{
    type: string;
    value?: string | number;
    message?: string;
  }>;
  is_required: boolean;
  is_active: boolean;
  order: number;
  form_section_id: number | null;

  // Optional future extensions (add when needed)
  // conditions?: FieldCondition | null;     // show/hide logic
  // description?: string;
  // helpLink?: string;
}