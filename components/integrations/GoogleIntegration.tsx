"use client";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Plug, Loader2, Trash2, Mail } from 'lucide-react';
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";

interface GoogleAccount {
  id: number;
  email: string;
  status: "connected" | "disconnected" | "expired";
  created_at?: string;
}

interface GoogleIntegrationProps {
  onRefresh?: () => void;        // Optional: Refresh other integrations (SMTP/WhatsApp)
}

export function GoogleIntegration({ onRefresh }: GoogleIntegrationProps) {
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([]);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<number | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [disconnectGoogleDialogOpen, setDisconnectGoogleDialogOpen] = useState(false);
  const [googleAccountToDisconnect, setGoogleAccountToDisconnect] = useState<number | null>(null);

  // Test Email Modal states
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [selectedGoogleAccountId, setSelectedGoogleAccountId] = useState<number | null>(null);
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [testEmailMessage] = useState(
    "This is a test email sent via Gmail API from your Pexifly account."
  );
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  // Load Google accounts
  const loadGoogleAccounts = useCallback(async () => {
    try {
      setLoadingGoogle(true);
      setGoogleError(null);
      const res = await axiosClient.get("/integrations/google");
      setGoogleAccounts(res.data?.data || res.data?.accounts || []);
    } catch (err: any) {
      console.error("Failed to load Google accounts", err);
      setGoogleError("Could not fetch connected Google accounts");
      showToast("Could not load Google accounts", "error");
    } finally {
      setLoadingGoogle(false);
    }
  }, []);

  useEffect(() => {
    loadGoogleAccounts();
  }, [loadGoogleAccounts]);

  // Connect Google
  const handleConnectGoogle = async () => {
    try {
      setConnectingGoogle(true);
      setGoogleError(null);
      const res = await axiosClient.get("integrations/google/auth-url");
      if (!res.data?.success || !res.data?.data?.auth_url) {
        throw new Error("No authorization URL received");
      }
      window.location.href = res.data.data.auth_url;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Could not start Google connection";
      setGoogleError(msg);
      showToast(msg, "error");
    } finally {
      setConnectingGoogle(false);
    }
  };

  // Toggle Status - with clear message support
  const handleToggleStatus = async (accountId: number) => {
    if (togglingStatus) return;

    setTogglingStatus(accountId);
    try {
      const res = await axiosClient.patch(`/integrations/google/accounts/${accountId}/toggle`);

      if (res.data?.success) {
        showToast(res.data.message, "success");   // Shows: "SMTP has been disconnected. Google Gmail is now active."
        loadGoogleAccounts();
        onRefresh?.();   // Refresh other integrations (SMTP) if passed
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update status";
      showToast(msg, "error");
    } finally {
      setTogglingStatus(null);
    }
  };

  // Disconnect Google
  const handleDisconnectGoogleClick = (accountId: number) => {
    setGoogleAccountToDisconnect(accountId);
    setDisconnectGoogleDialogOpen(true);
  };

  const handleDisconnectGoogle = async () => {
    if (!googleAccountToDisconnect) return;
    try {
      await axiosClient.delete(`integrations/google/accounts/${googleAccountToDisconnect}`);
      showToast("Google account disconnected successfully", "success");
      loadGoogleAccounts();
      onRefresh?.();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to disconnect Google account", "error");
    } finally {
      setDisconnectGoogleDialogOpen(false);
      setGoogleAccountToDisconnect(null);
    }
  };

  // Test Email
  const openTestEmailModal = (accountId: number) => {
    setSelectedGoogleAccountId(accountId);
    setTestEmailRecipient("");
    setTestEmailDialogOpen(true);
  };

  const handleSendTestEmail = async () => {
    if (!selectedGoogleAccountId || !testEmailRecipient.trim()) {
      showToast("Please enter a valid recipient email", "error");
      return;
    }
    setSendingTestEmail(true);
    try {
      await axiosClient.post("integrations/google/send-test", {
        account_id: selectedGoogleAccountId,
        email: testEmailRecipient.trim(),
        message: testEmailMessage.trim(),
      });
      showToast("Test email sent successfully!", "success");
      setTestEmailDialogOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to send test email", "error");
    } finally {
      setSendingTestEmail(false);
    }
  };

  const hasConnectedGoogle = googleAccounts.some(acc => acc.status === "connected");

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Google Gmail</CardTitle>
              {hasConnectedGoogle && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            </div>
            <CardDescription className="text-xs">
              {hasConnectedGoogle ? "Active" : "Not connected"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-6">
          {loadingGoogle ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : googleAccounts.length > 0 ? (
            <div className="space-y-3">
              {googleAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{acc.email}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge
                        variant={acc.status === "connected" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {acc.status}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={acc.status === "connected"}
                          disabled={togglingStatus === acc.id || acc.status === "expired"}
                          onCheckedChange={() => handleToggleStatus(acc.id)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {acc.status === "connected" ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTestEmailModal(acc.id)}
                      disabled={togglingStatus === acc.id || acc.status !== "connected"}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Send Test
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnectGoogleClick(acc.id)}
                      disabled={togglingStatus === acc.id}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-4">
              <p className="font-medium mb-2">Requirements:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Google Cloud Project with Gmail API enabled</li>
                <li>OAuth 2.0 Client ID & Secret (Web application)</li>
                <li>Correct redirect URI in Google Console</li>
                <li>Scope: https://www.googleapis.com/auth/gmail.send</li>
              </ul>
            </div>
          )}

          {googleError && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm">
              {googleError}
            </div>
          )}
        </CardContent>

        {!hasConnectedGoogle && !loadingGoogle && googleAccounts.length === 0 &&(
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleConnectGoogle}
              disabled={connectingGoogle || loadingGoogle}
            >
              <Plug className="mr-2 h-4 w-4" />
              {connectingGoogle ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Google Gmail Account"
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Disconnect Dialog */}
      <AlertDialog open={disconnectGoogleDialogOpen} onOpenChange={setDisconnectGoogleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google Gmail?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke email sending access until reconnected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDisconnectGoogle}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Email Modal */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test message using your connected Gmail account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">To</Label>
              <Input
                id="recipient"
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={testEmailMessage}
                readOnly
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestEmailDialogOpen(false)}
              disabled={sendingTestEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTestEmail}
              disabled={sendingTestEmail || !testEmailRecipient.trim()}
            >
              {sendingTestEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Test Email"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}