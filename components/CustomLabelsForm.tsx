// app/settings/custom-labels/page.tsx
'use client';

import { useLabels } from '@/app/context/TenantLabelsContext';
import { useEffect, useState } from 'react';
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";           // ← assume you have shadcn/ui or similar
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";                   // ← optional: for spinner

const TERM_KEYS = [
  
  'label.department',
 
  // Add more keys here as needed
];

type FormValues = Record<string, string>;

export default function CustomLabelsPage() {
  const { getLabel, refreshLabels } = useLabels();
  const [values, setValues] = useState<FormValues>({});
  const [formData, setFormData] = useState<FormValues>({});
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        const res = await axiosClient.get('/custom-terms');
        const serverValues = res.data.data || {};
        setValues(serverValues);
        setFormData(serverValues); // initialize editable copy
      } catch (err) {
        showToast("Could not load current labels", "error");
      }
    };
    fetchCurrent();
  }, []);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    const newValue = (formData[key] || '').trim();
    if (!newValue) return;

    // Optional: don't save if same as current
    if (newValue === (values[key] || getLabel(key))) return;

    setSavingKey(key);
    setLoading(true);

    try {
      await axiosClient.put('/custom-terms', {
        term_key: key,
        custom_value: newValue,
      });

      showToast(`"${key}" updated successfully`, "success");

      // Update local state
      setValues((prev) => ({ ...prev, [key]: newValue }));
      await refreshLabels();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Failed to update label",
        "error"
      );
    } finally {
      setSavingKey(null);
      setLoading(false);
    }
  };

  const isDirty = (key: string) =>
    (formData[key] || '').trim() !== (values[key] || getLabel(key)).trim();

  return (
    <div className="min-h-screen bg-gray-50/40 dark:bg-gray-950/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Customize System Terms
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
                   You can rename important system terms to match your organization’s needs. Changes will take effect as soon as you save.

          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          Only admins or authorized users can edit these settings.
          </p>
        </div>


        {/* Main Card */}
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {TERM_KEYS.map((key) => {
              const defaultLabel = getLabel(key);
              const currentCustom = values[key];
              const displayValue = formData[key] ?? currentCustom ?? '';

              return (
                <div
                  key={key}
                  className="p-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {key}
                    </Label>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Default: <span className="font-medium">{defaultLabel}</span>
                    </p>
                    {currentCustom && currentCustom !== defaultLabel && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                        Current custom value: {currentCustom}
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="relative flex-1 min-w-[260px]">
                      <Input
                        value={displayValue}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={`Default: ${defaultLabel}`}
                        disabled={loading && savingKey !== key}
                        className="pr-24"
                      />
                      {isDirty(key) && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-600 dark:text-amber-400 pointer-events-none">
                          unsaved
                        </span>
                      )}
                    </div>

                    <Button
                      onClick={() => handleSave(key)}
                      disabled={!isDirty(key) || loading}
                      variant={isDirty(key) ? "default" : "outline"}
                      size="sm"
                      className="min-w-[90px]"
                    >
                      {savingKey === key ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {TERM_KEYS.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No customizable terms defined yet.
            </div>
          )}
        </div>

        {/* Optional footer note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Changes are applied instantly after saving. Refresh the page if labels
          don't update in other areas.
        </div>
      </div>
    </div>
  );
}