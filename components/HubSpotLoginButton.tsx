// components/HubSpotLoginButton.tsx
import { Button } from "@/components/ui/button";
import { Plug, Unplug, Loader2 } from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";

interface Props {
  connected: boolean;
  loading?: boolean;
  onDisconnectSuccess: () => void;
}

export default function HubSpotLoginButton({
  connected,
  loading = false,
  onDisconnectSuccess,
}: Props) {
  const handleConnect = async () => {
    try {
      const res = await axiosClient.get("/hubspot/auth-url");
      if (res.data.success) {
        window.location.href = res.data.data.auth_url;
      } else {
        showToast("Failed to start connection", "error");
      }
    } catch (err) {
      showToast("Connection error", "error");
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect HubSpot? Auto-sync will stop.")) return;
    try {
      await axiosClient.delete("/integrations/hubspot");
      showToast("Disconnected successfully", "success");
      onDisconnectSuccess();
    } catch (err) {
      showToast("Failed to disconnect", "error");
    }
  };

  if (loading) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking...
      </Button>
    );
  }

  return connected ? (
    <Button variant="outline" className="w-full text-destructive" onClick={handleDisconnect}>
      <Unplug className="mr-2 h-4 w-4" />
      Disconnect HubSpot
    </Button>
  ) : (
    <Button className="w-full" onClick={handleConnect}>
      <Plug className="mr-2 h-4 w-4" />
      Connect to HubSpot
    </Button>
  );
}