
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import axiosClient from '@/lib/axiosClient';
import { showToast } from '@/lib/showToast';

type Labels = Record<string, string>;

interface TenantLabelsContextType {
  labels: Labels;
  getLabel: (key: string) => string;
  refreshLabels: () => Promise<void>;
  isLoading: boolean;
}

const TenantLabelsContext = createContext<TenantLabelsContextType | undefined>(
  undefined
);

export function TenantLabelsProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Labels>({});
  const [isLoading, setIsLoading] = useState(true);

  const refreshLabels = async () => {
    if (typeof window === "undefined") return;
  
    const token = localStorage.getItem("token");
  
    // 🚫 Stop if token not available
    if (!token) {
      console.warn("[TenantLabels] No token found — skipping API call");
      setIsLoading(false);
      return;
    }
  
    console.log("[TenantLabels] Token found — fetching labels");
  
    setIsLoading(true);
  
    try {
      const response = await axiosClient.get('/custom-terms');
  
      let receivedLabels: Labels = {};
  
      if (response.data?.success && response.data?.data) {
        receivedLabels = response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        receivedLabels = response.data;
      }
  
      setLabels(receivedLabels);
  
    } catch (error: any) {
      console.error("[TenantLabels] Labels fetch failed:", error);
  
      if (error.response?.status === 401) {
        console.warn("[TenantLabels] Unauthorized — token invalid or expired");
        localStorage.removeItem("token"); // optional cleanup
      }
  
      showToast(
        error.response?.data?.message || "Failed to load custom labels",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (typeof window !== "undefined") {
      refreshLabels();
    }
  }, []);
  const getLabel = (key: string): string => {
    const value = labels[key];
    if (value) return value;

    // Fallback: convert key to readable format
    const fallback = key.split('.').pop() || key;
   
    return fallback;
  };

  const value: TenantLabelsContextType = {
    labels,
    getLabel,
    refreshLabels,
    isLoading,
  };

  return (
    <TenantLabelsContext.Provider value={value}>
      {children}
    </TenantLabelsContext.Provider>
  );
}

export function useLabels(): TenantLabelsContextType {
  const context = useContext(TenantLabelsContext);

  if (!context) {
    console.warn('[TenantLabels] useLabels used outside TenantLabelsProvider — fallback active');
    return {
      labels: {},
      getLabel: (key: string) => key.split('.').pop() || key,
      refreshLabels: async () => {
        console.warn('[TenantLabels] refreshLabels called outside provider — no effect');
      },
      isLoading: false,
    };
  }

  return context;
}