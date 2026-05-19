/**
 * API client for automation service
 * Handles all communication with the Python automation service
 */

import axios from "axios";
import { getOrganizationId } from "@/lib/utils/orgId";
import { showToast } from "@/lib/showToast";
import type {
  Automation,
  AutomationCreatePayload,
  AutomationUpdatePayload,
  AutomationExecution,
  ExecutionLog,
  AutomationVersionSummary,
  AutomationVersionDetail,
} from "@/lib/types/workflow";

const AUTOMATION_API_URL = process.env.NEXT_PUBLIC_AUTOMATION_API || "http://localhost:8001";

/**
 * Create axios instance for automation service
 * Includes org ID and auth headers
 */
function createAutomationClient() {
  const client = axios.create({
    baseURL: AUTOMATION_API_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // Add org ID and auth token to every request
  client.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
      const orgId = getOrganizationId();
      const token = localStorage.getItem("token");

      if (orgId) {
        config.headers["X-ORG-ID"] = orgId;
      }

      // Include Authorization header (may be verified by backend middleware)
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return config;
  });

  // Handle errors
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const message = error.response?.data?.detail || error.message || "An error occurred";
      console.error("Automation API Error:", error);
      return Promise.reject(error);
    }
  );

  return client;
}

const automationClient = createAutomationClient();

/**
 * Automations API
 */
export const automationsApi = {
  /**
   * List all automations for the organization
   */
  async list(): Promise<Automation[]> {
    const response = await automationClient.get<Automation[]>("/automations");
    return response.data;
  },

  /**
   * Get a specific automation
   */
  async get(id: string): Promise<Automation> {
    const response = await automationClient.get<Automation>(`/automations/${id}`);
    return response.data;
  },

  /**
   * Create a new automation
   */
  async create(payload: AutomationCreatePayload): Promise<Automation> {
    const response = await automationClient.post<Automation>("/automations", payload);
    return response.data;
  },

  /**
   * Update an automation
   */
  async update(id: string, payload: AutomationUpdatePayload): Promise<Automation> {
    const response = await automationClient.put<Automation>(`/automations/${id}`, payload);
    return response.data;
  },

  /**
   * Activate an automation
   */
  async activate(id: string): Promise<Automation> {
    const response = await automationClient.post<Automation>(`/automations/${id}/activate`);
    return response.data;
  },

  /**
   * Pause an automation
   */
  async pause(id: string): Promise<Automation> {
    const response = await automationClient.post<Automation>(`/automations/${id}/pause`);
    return response.data;
  },

  /**
   * Delete an automation (if implemented in backend)
   */
  async delete(id: string): Promise<void> {
    await automationClient.delete(`/automations/${id}`);
  },

  /**
   * List version snapshots for an automation
   */
  async listVersions(id: string): Promise<AutomationVersionSummary[]> {
    const response = await automationClient.get<AutomationVersionSummary[]>(
      `/automations/${id}/versions`
    );
    return response.data;
  },

  /**
   * Get a specific version snapshot
   */
  async getVersion(id: string, version: number): Promise<AutomationVersionDetail> {
    const response = await automationClient.get<AutomationVersionDetail>(
      `/automations/${id}/versions/${version}`
    );
    return response.data;
  },

  /**
   * Restore an automation to a prior version
   */
  async restoreVersion(id: string, version: number): Promise<Automation> {
    const response = await automationClient.post<Automation>(
      `/automations/${id}/versions/${version}/restore`
    );
    return response.data;
  },
};

/**
 * Executions API
 */
export const executionsApi = {
  /**
   * List executions (optionally filtered by automation_id)
   */
  async execute(
    automationId: string,
    eventData: any = {}
  ): Promise<any> {
    const payload = {
      automation_id: automationId,
      event_data: {
        data: eventData.data || eventData,   // email, form_fields, etc.
        organization_id: eventData.organization_id,
        message: eventData.message,          // optional custom message
      },
    };

    const response = await automationClient.post(`/automations/${automationId}/execute`, payload);
    return response.data;
  },

  /**
   * Optional: Execute single action directly (for testing)
   */
  async executeAction(actionType: string, config: any, eventData: any = {}): Promise<any> {
    const payload = {
      action_type: actionType,
      config: config,
      event_data: eventData,
    };
    const response = await automationClient.post("/actions/execute", payload);
    return response.data;
  },

  async list(automationId?: string): Promise<AutomationExecution[]> {
    const params = automationId ? { automation_id: automationId } : {};
    const response = await automationClient.get<AutomationExecution[]>("/executions", { params });
    return response.data;
  },

  /**
   * Get a specific execution
   */
  async get(id: string): Promise<AutomationExecution> {
    const response = await automationClient.get<AutomationExecution>(`/executions/${id}`);
    return response.data;
  },

  /**
   * Get logs for an execution
   */
  async getLogs(id: string): Promise<ExecutionLog[]> {
    const response = await automationClient.get<ExecutionLog[]>(`/executions/${id}/logs`);
    return response.data;
  },
};
