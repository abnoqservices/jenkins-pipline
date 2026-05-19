// components/integrations/SalesforceIntegration.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Plug } from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";

export default function SalesforceIntegration() {
  const [connected, setConnected] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [manualSync, setManualSync] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchParams = useSearchParams();

  // Check for success redirect from callback
  useEffect(() => {
    if (searchParams.get("salesforce") === "success") {
      showToast("Salesforce connected successfully!", "success");
      loadStatus();
    }
  }, [searchParams]);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/integrations/salesforce");
      const data = res.data;

      setConnected(data.connected ?? false);
      setAutoSync(data.is_auto_sync_enabled ?? false);
      setManualSync(data.is_manual_sync_enabled ?? false);
    } catch (err: any) {
      console.error("Failed to load Salesforce status", err);
      showToast("Could not load Salesforce status", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const res = await axiosClient.get("/integrations/salesforce/auth-url");

      if (res.data.success && res.data.data?.auth_url) {
        window.location.href = res.data.data.auth_url;
      } else {
        showToast("Failed to get authorization URL", "error");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Could not start connection";
      showToast(msg, "error");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Salesforce?")) return;

    try {
      await axiosClient.post("/integrations/salesforce/disconnect");
      showToast("Salesforce disconnected successfully", "success");
      loadStatus();
    } catch (err: any) {
      showToast("Failed to disconnect", "error");
    }
  };

  const handleSaveSettings = async () => {
    if (!connected) return;

    setSaving(true);
    try {
      await axiosClient.post("/integrations/salesforce/sync-settings", {
        auto_sync: autoSync,
        manual_sync: manualSync,
      });
      showToast("Settings saved successfully", "success");
    } catch (err: any) {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Salesforce CRM
              {connected && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            </CardTitle>
            <CardDescription>
              {connected ? "Connected" : "Not connected"}
            </CardDescription>
          </div>
          {connected && <Switch checked={true} disabled />}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : connected ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-sync" className="text-base font-medium">
                  Auto-sync new records
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically push new contacts/leads to Salesforce
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="manual-sync" className="text-base font-medium">
                  Manual sync
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow manual sync of selected records
                </p>
              </div>
              <Switch
                id="manual-sync"
                checked={manualSync}
                onCheckedChange={setManualSync}
                disabled={saving}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                size="sm"
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save settings"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-center py-6 text-muted-foreground">
            Connect Salesforce to enable sync options
          </p>
        )}
      </CardContent>

      <CardFooter className="justify-end">
        {connected ? (
          <Button variant="outline" onClick={handleDisconnect}  className="w-full text-destructive">
              <Unplug className="mr-2 h-4 w-4" /> Disconnect Salesforce
          </Button>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={connecting || loading}
            className="w-full"
          >  <Plug className="mr-2 h-4 w-4" />
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Salesforce"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}