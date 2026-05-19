"use client";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from 'lucide-react';
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import HubSpotLoginButton from '@/components/HubSpotLoginButton';

interface HubSpotSettings {
  connected: boolean;
  is_auto_sync_enabled: boolean;
  is_manual_sync_enabled: boolean;
}

export function HubSpotIntegration() {
  const [hubspot, setHubspot] = useState<HubSpotSettings>({
    connected: false,
    is_auto_sync_enabled: false,
    is_manual_sync_enabled: false,
  });
  const [hubspotLoading, setHubspotLoading] = useState(true);
  const [savingHubspotSettings, setSavingHubspotSettings] = useState(false);

  // Fetch HubSpot status on mount
  const fetchHubSpotStatus = useCallback(async () => {
    try {
      setHubspotLoading(true);
      const res = await axiosClient.get("/integrations/hubspot");
      const data = res.data;
      setHubspot({
        connected: !!data.connected,
        is_auto_sync_enabled: !!data.is_auto_sync_enabled,
        is_manual_sync_enabled: !!data.is_manual_sync_enabled,
      });
    } catch (err) {
      console.error("Failed to fetch HubSpot status", err);
      showToast("Could not load HubSpot settings", "error");
    } finally {
      setHubspotLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHubSpotStatus();
  }, [fetchHubSpotStatus]);

  // Save sync settings
  const saveHubSpotSyncSettings = async () => {
    if (!hubspot.connected) return;
    setSavingHubspotSettings(true);
    try {
      await axiosClient.post("/hubspot/sync-settings", {
        auto_sync: hubspot.is_auto_sync_enabled,
        manual_sync: hubspot.is_manual_sync_enabled,
      });
      showToast("HubSpot sync settings updated", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save settings", "error");
    } finally {
      setSavingHubspotSettings(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              HubSpot CRM
              {hubspot.connected && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            </CardTitle>
            <CardDescription>
              {hubspot.connected ? "Connected" : "Not connected"}
            </CardDescription>
          </div>
          {hubspot.connected && <Switch checked={true} disabled />}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {hubspotLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : hubspot.connected ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-sync" className="text-base font-medium">
                  Auto-sync new leads
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync new contacts and leads to HubSpot
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={hubspot.is_auto_sync_enabled}
                onCheckedChange={(checked) =>
                  setHubspot((prev) => ({ ...prev, is_auto_sync_enabled: checked }))
                }
                disabled={savingHubspotSettings}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="manual-sync" className="text-base font-medium">
                  Manual push / sync
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow manual sync of selected records to HubSpot
                </p>
              </div>
              <Switch
                id="manual-sync"
                checked={hubspot.is_manual_sync_enabled}
                onCheckedChange={(checked) =>
                  setHubspot((prev) => ({ ...prev, is_manual_sync_enabled: checked }))
                }
                disabled={savingHubspotSettings}
              />
            </div>

            {/* <div className="pt-2 flex justify-end">
              <Button
                size="sm"
                onClick={saveHubSpotSyncSettings}
                disabled={savingHubspotSettings}
              >
                {savingHubspotSettings ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save settings"
                )}
              </Button>
            </div> */}
          </div>
        ) : (
          <p className="text-center py-6 text-muted-foreground">
            Connect HubSpot to enable sync options
          </p>
        )}
      </CardContent>
 
      <CardFooter>
        <HubSpotLoginButton
          connected={hubspot.connected}
          loading={hubspotLoading}
          onDisconnectSuccess={() => {
            showToast("HubSpot disconnected", "success");
            fetchHubSpotStatus();
          }}
        />
      </CardFooter>
    </Card>
  );
}