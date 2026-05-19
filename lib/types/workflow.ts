/**
 * TypeScript types for workflow/automation system
 */

// Step types
export type StepType = "condition" | "action" | "delay" | "transform" | "loop";

export type TransformOp =
  | { op: "set"; var: string; value: any }
  | { op: "extract"; var: string; from: string }
  | { op: "unset"; var: string };

export interface TransformConfig {
  operations: TransformOp[];
}

export interface LoopConfig {
  over: string;
  end_step: number;
  iterator_var?: string;
}

// Condition types
export type ConditionType = 
  | "email_exists"
  | "phone_exists"
  | "whatsapp_opt_in"
  | "form_field_equals"
  | "form_field_greater_than";

// Action types
export type ActionType =
  | "send_email"
  | "send_whatsapp"
  | "send_sms"
  | "http_request";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type HttpBodyType = "json" | "form" | "raw" | "none";

// Execution status
export type ExecutionStatus = "running" | "completed" | "stopped" | "failed";

// Log status
export type LogStatus = "success" | "failed" | "skipped";

// Step configuration interfaces
export interface ConditionConfig {
  condition_type: ConditionType;
  field_name?: string; // For form_field_equals, form_field_greater_than
  expected_value?: any; // For form_field_equals
  threshold?: number; // For form_field_greater_than
  on_true_step?: number | null; // Optional step order to jump to when condition passes
  on_false_step?: number | "stop" | null; // Optional step order or "stop" when condition fails
}

export interface ActionConfig {
  action_type: ActionType;
  template_id?: string;
  message?: string; // For WhatsApp messages
  whatsapp_account_id?: string; // WhatsApp account to use
  form_id?: string; // Optional form filter for lead.form_submitted trigger
  phone_field_key?: string; // Field key to use as recipient phone
  template_params?: Record<string, any>; // Template parameters

  // http_request fields
  method?: HttpMethod;
  url?: string;
  headers?: Record<string, string>;
  query_params?: Record<string, string>;
  body_type?: HttpBodyType;
  body?: any;
  timeout_seconds?: number;
  success_status_codes?: number[];
  fail_on_error_status?: boolean;

  // send_email fields
  email_field_key?: string;
  subject?: string;
  html_body?: string;
  text_body?: string;
  from_email?: string;
  from_name?: string;
  reply_to?: string;
  cc?: string[];
  bcc?: string[];
  dynamic_template_data?: Record<string, any>;

  // Error handling / retry policy
  max_retries?: number;
  backoff_initial_seconds?: number;
  backoff_factor?: number;
  backoff_max_seconds?: number;
  on_failure?: "stop" | "continue" | { jump_to: number };
}

export interface DelayConfig {
  seconds: number;
}

export type StepConfig = ConditionConfig | ActionConfig | DelayConfig | TransformConfig | LoopConfig;

// Step interface
export interface AutomationStep {
  id?: string;
  automation_id?: string;
  order: number;
  type: StepType;
  config: StepConfig;
}

// Automation interface
export interface Automation {
  id: string;
  org_id: string;
  name: string;
  trigger_event: string;
  is_active: boolean;
  created_at: string;
  schedule_cron?: string | null;
  schedule_timezone?: string | null;
  schedule_last_run_at?: string | null;
  version?: number;
  steps?: AutomationStep[];
}

export interface AutomationVersionSummary {
  id: string;
  version: number;
  name: string;
  trigger_event: string;
  schedule_cron?: string | null;
  schedule_timezone?: string | null;
  step_count: number;
  note?: string | null;
  created_at: string | null;
  created_by?: string | null;
  is_current: boolean;
}

export interface AutomationVersionDetail extends AutomationVersionSummary {
  steps: Array<Omit<AutomationStep, "id" | "automation_id">>;
}

// Execution log interface
export interface ExecutionLog {
  id: string;
  execution_id: string;
  step_order: number;
  status: LogStatus;
  message: string | null;
  created_at: string;
}

// Execution interface
export interface AutomationExecution {
  id: string;
  automation_id: string;
  entity_id: string; // lead_id from Laravel
  status: ExecutionStatus;
  current_step: number;
  started_at: string;
  finished_at: string | null;
  event_id: string | null;
  logs?: ExecutionLog[];
}

// Create/Update automation payload
export interface AutomationCreatePayload {
  name: string;
  trigger_event: string;
  steps: Omit<AutomationStep, "id" | "automation_id">[];
  schedule_cron?: string | null;
  schedule_timezone?: string | null;
}

export interface AutomationUpdatePayload {
  name?: string;
  trigger_event?: string;
  is_active?: boolean;
  steps?: Omit<AutomationStep, "id" | "automation_id">[];
  schedule_cron?: string | null;
  schedule_timezone?: string | null;
}
