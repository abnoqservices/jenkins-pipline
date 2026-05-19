/**
 * Utility to get organization ID from user context
 */

export function getOrganizationId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      return null;
    }

    const user = JSON.parse(userStr);
    return user.organization_id?.toString() || null;
  } catch (error) {
    console.error("Error getting organization ID:", error);
    return null;
  }
}

/**
 * Get organization ID from API (fetches fresh data)
 */
export async function fetchOrganizationId(): Promise<string | null> {
  try {
    const axiosClient = (await import("@/lib/axiosClient")).default;
    const response = await axiosClient.get("/auth/me");
    
    if (response.data?.data?.organization_id) {
      return response.data.data.organization_id.toString();
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching organization ID:", error);
    return null;
  }
}
