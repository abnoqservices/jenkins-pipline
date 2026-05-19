"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, Plug, Loader2, Trash2 } from 'lucide-react';
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";

interface WhatsAppAccount {
  id: number | string;
  provider?: "meta" | "aisensy";
  phone_number: string;
  phone_number_id?: string;
  whatsapp_business_account_id?: string;
  default_campaign_name?: string;
  status: "connected" | "disconnected" | "expired";
  business_account_name?: string;
  created_at?: string;
}

export function WhatsAppIntegration() {
  const [whatsappAccounts, setWhatsappAccounts] = useState<WhatsAppAccount[]>([]);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [connectingWhatsApp, setConnectingWhatsApp] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState<number | null>(null);
  const [testRecipient, setTestRecipient] = useState("");
  const [testMessage, setTestMessage] = useState("Hello! This is a live WhatsApp test from Pexifly.");
  const [aisensyApiKey, setAisensyApiKey] = useState("");
  const [aisensyCampaignName, setAisensyCampaignName] = useState("");
  const [aisensyPhoneNumber, setAisensyPhoneNumber] = useState("");
  const [aisensyBusinessName, setAisensyBusinessName] = useState("");
  const [aisensyBaseUrl, setAisensyBaseUrl] = useState("https://backend.aisensy.com");
  const [connectingAisensy, setConnectingAisensy] = useState(false);

  // Fix: allow both sync and async listeners
  const messageListenerRef = useRef<(event: MessageEvent) => void | Promise<void> | null>(null);

  const loadWhatsAppAccounts = useCallback(async () => {
    try {
      setLoadingWhatsApp(true);
      setWhatsappError(null);
      const res = await axiosClient.get("/whatsapp/accounts");
      setWhatsappAccounts(res.data?.data || res.data || []);
    } catch (err: any) {
      console.error("Failed to load WhatsApp accounts", err);
      setWhatsappError("Could not fetch connected WhatsApp accounts");
      showToast("Could not load WhatsApp accounts", "error");
    } finally {
      setLoadingWhatsApp(false);
    }
  }, []);

  useEffect(() => {
    loadWhatsAppAccounts();
  }, [loadWhatsAppAccounts]);

  const handleConnectWhatsApp = async () => {
    try {
      setConnectingWhatsApp(true);
      setWhatsappError(null);

      const res = await axiosClient.get("/whatsapp/auth-url");
      if (!res.data?.success || !res.data?.data?.auth_url) {
        throw new Error("No authorization URL received");
      }

      const authUrl = res.data.data.auth_url;

      const width = 800;
      const height = 900;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        "whatsapp_embedded_signup",
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      // Remove previous listener
      if (messageListenerRef.current) {
        window.removeEventListener('message', messageListenerRef.current as any);
        messageListenerRef.current = null;
      }

      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== "https://www.facebook.com") return;

        const data = event.data;

        if (data?.code) {
          try {
            const completeRes = await axiosClient.post("/whatsapp/complete-embedded", {
              code: data.code,
              waba_id: data.waba_id || data.whatsapp_business_account_id,
              phone_number_id: data.phone_number_id || data.phoneId,
            });

            if (completeRes.data?.success) {
              showToast("WhatsApp connected successfully!", "success");
              loadWhatsAppAccounts();
            } else {
              throw new Error(completeRes.data?.message || "Backend failed to process");
            }
          } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to complete WhatsApp connection";
            console.error(msg, err);
            showToast(msg, "error");
            setWhatsappError(msg);
          } finally {
            window.removeEventListener('message', handleMessage);
            messageListenerRef.current = null;
            popup?.close();
          }
        }
      };

      window.addEventListener('message', handleMessage);
      messageListenerRef.current = handleMessage;

      // Cleanup if popup closed without message
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
          messageListenerRef.current = null;
          setConnectingWhatsApp(false);
        }
      }, 500);

      // We don't set connectingWhatsApp false immediately anymore
      // It will be set in the message handler or when popup closes

    } catch (err: any) {
      console.error("Failed to start WhatsApp connection", err);
      const msg = err.message || "Could not start WhatsApp connection";
      setWhatsappError(msg);
      showToast(msg, "error");
      setConnectingWhatsApp(false);
    }
  };

  const handleDisconnectClick = (accountId: number) => {
    setAccountToDisconnect(accountId);
    setDisconnectDialogOpen(true);
  };

  const handleDisconnectWhatsApp = async () => {
    if (!accountToDisconnect) return;
    try {
      await axiosClient.delete(`/whatsapp/accounts/${accountToDisconnect}`);
      showToast("WhatsApp account disconnected successfully", "success");
      loadWhatsAppAccounts();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to disconnect WhatsApp account", "error");
    } finally {
      setDisconnectDialogOpen(false);
      setAccountToDisconnect(null);
    }
  };

  const handleSendTestMessage = async (accountId: number | string) => {
    if (!testRecipient.trim()) {
      showToast("Enter a recipient number in E.164 format", "error");
      return;
    }

    const account = whatsappAccounts.find((acc) => acc.id === accountId);
    if (!account) {
      showToast("Account not found", "error");
      return;
    }

    const provider = account.provider || "meta";
    const requiresPhoneNumberId = provider === "meta" && account.id !== "test-sandbox";

    if (requiresPhoneNumberId && !account.phone_number_id) {
      showToast("Missing phone number ID for this account", "error");
      return;
    }

    try {
      const isMetaSandbox = account.id === "test-sandbox";
      await axiosClient.post("/whatsapp/send-message", {
        account_id: accountId,
        phone_number_id: account.phone_number_id || undefined,
        to: testRecipient.trim(),
        message_type: isMetaSandbox ? "template" : "text",
        template_name: isMetaSandbox ? "hello_world" : undefined,
        language: isMetaSandbox ? "en_US" : undefined,
        message: isMetaSandbox ? undefined : (testMessage.trim() || "Hello from Pexifly"),
      });
      showToast(
        isMetaSandbox
          ? "Sandbox template sent (hello_world). Check your WhatsApp test recipient."
          : "Test message sent successfully!",
        "success"
      );
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to send test message", "error");
    }
  };

  const handleConnectAiSensy = async () => {
    if (!aisensyApiKey.trim() || !aisensyCampaignName.trim() || !aisensyPhoneNumber.trim()) {
      showToast("AiSensy API key, campaign name, and phone number are required", "error");
      return;
    }

    try {
      setConnectingAisensy(true);
      await axiosClient.post("/whatsapp/aisensy/connect", {
        api_key: aisensyApiKey.trim(),
        campaign_name: aisensyCampaignName.trim(),
        phone_number: aisensyPhoneNumber.trim(),
        business_account_name: aisensyBusinessName.trim() || "AiSensy Account",
        api_base_url: aisensyBaseUrl.trim() || "https://backend.aisensy.com",
      });
      showToast("AiSensy account connected successfully!", "success");
      setAisensyApiKey("");
      loadWhatsAppAccounts();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to connect AiSensy account", "error");
    } finally {
      setConnectingAisensy(false);
    }
  };

  const hasConnectedWhatsApp = whatsappAccounts.some((acc) => acc.status === "connected");

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                WhatsApp Business
                {hasConnectedWhatsApp && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </CardTitle>
              <CardDescription>
                {hasConnectedWhatsApp ? "Connected" : "Not connected"}
              </CardDescription>
            </div>
            {hasConnectedWhatsApp && <Switch checked={true} disabled />}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-3 border rounded-lg p-4">
            <p className="text-sm font-medium">Review recording sender test</p>
            <Input
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="Recipient phone, e.g. 9198XXXXXXXX"
            />
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Message to send"
            />
            <p className="text-xs text-muted-foreground">
              Use the same recipient number in your native WhatsApp app while recording.
            </p>
          </div>

          <div className="grid gap-3 border rounded-lg p-4">
            <p className="text-sm font-medium">Connect AiSensy Account</p>
            <Input
              value={aisensyApiKey}
              onChange={(e) => setAisensyApiKey(e.target.value)}
              placeholder="AiSensy API Key"
            />
            <Input
              value={aisensyCampaignName}
              onChange={(e) => setAisensyCampaignName(e.target.value)}
              placeholder="Live API campaign name"
            />
            <Input
              value={aisensyPhoneNumber}
              onChange={(e) => setAisensyPhoneNumber(e.target.value)}
              placeholder="WhatsApp number, e.g. +9198XXXXXXXX"
            />
            <Input
              value={aisensyBusinessName}
              onChange={(e) => setAisensyBusinessName(e.target.value)}
              placeholder="Account label (optional)"
            />
            <Input
              value={aisensyBaseUrl}
              onChange={(e) => setAisensyBaseUrl(e.target.value)}
              placeholder="AiSensy API base URL"
            />
            <Button
              variant="outline"
              onClick={handleConnectAiSensy}
              disabled={connectingAisensy}
            >
              {connectingAisensy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting AiSensy...
                </>
              ) : (
                "Connect AiSensy"
              )}
            </Button>
          </div>

          {loadingWhatsApp ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : whatsappAccounts.length > 0 ? (
            <div className="space-y-4">
              {whatsappAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{acc.phone_number}</p>
                    <p className="text-sm text-muted-foreground">
                      Provider: {(acc.provider || "meta").toUpperCase()}
                    </p>
                    {acc.whatsapp_business_account_id && (
                      <p className="text-sm text-muted-foreground">
                        WABA ID: {acc.whatsapp_business_account_id}
                      </p>
                    )}
                    {acc.provider === "aisensy" && acc.default_campaign_name && (
                      <p className="text-sm text-muted-foreground">
                        Campaign: {acc.default_campaign_name}
                      </p>
                    )}
                    <p className="text-xs">
                      Status:{" "}
                      <Badge
                        variant={acc.status === "connected" ? "default" : "secondary"}
                        className={
                          acc.status === "connected"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : ""
                        }
                      >
                        {acc.status}
                      </Badge>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendTestMessage(acc.id)}
                      disabled={connectingWhatsApp || acc.status !== "connected"}
                    >
                      Send Test
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => typeof acc.id === "number" && handleDisconnectClick(acc.id)}
                      disabled={connectingWhatsApp || typeof acc.id !== "number"}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground border-t pt-6">
              <p className="font-medium mb-2">Requirements:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Meta for Developers App with WhatsApp product enabled</li>
                <li>WhatsApp Business Account (not personal WhatsApp)</li>
                <li>Phone number not linked to personal account</li>
                <li>Correct redirect URI in Meta dashboard</li>
              </ul>
            </div>
          )}

          {whatsappError && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm">
              {whatsappError}
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-end">
          <Button
            className="w-full"
            onClick={handleConnectWhatsApp}
            disabled={connectingWhatsApp || loadingWhatsApp}
          >
            <Plug className="mr-2 h-4 w-4" />
            {connectingWhatsApp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect WhatsApp Business Account"
            )}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect WhatsApp?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop sending messages via this number until reconnected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDisconnectWhatsApp}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}