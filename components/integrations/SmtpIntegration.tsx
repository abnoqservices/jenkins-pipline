"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardDescription, CardFooter,
  CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";

import { CheckCircle2, Loader2, Trash2, Mail, Plus, Plug } from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";

interface SmtpAccount {
  id: number;
  email: string;
  status: "connected" | "disconnected" | "expired";
  created_at?: string;
}

export function SmtpIntegration() {
  const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState<number | null>(null);

  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [testRecipient, setTestRecipient] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  const [form, setForm] = useState({
    host: "smtp.gmail.com",
    port: 587,
    username: "",
    password: "",
    encryption: "tls" as "tls" | "ssl" | "",
    from_email: "",
    from_name: "Pexifly",
  });

  // Load Accounts
  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/integrations/smtp");
      setSmtpAccounts(res.data?.data || []);
    } catch {
      showToast("Failed to load SMTP accounts", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Toggle Status - with proper message handling (same as Google)
  const handleToggleStatus = async (id: number) => {
    setTogglingId(id);

    try {
      const res = await axiosClient.post("/integrations/smtp/toggleStatus", { id });

      if (res.data?.success) {
        showToast(res.data.message, "success");   // Shows clear message like "Google Gmail has been disconnected..."
        loadAccounts();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update status";
      showToast(msg, "error");
      loadAccounts(); // Refresh to correct state
    } finally {
      setTogglingId(null);
    }
  };

  // Connect SMTP
  const handleConnect = async () => {
    setConnecting(true);

    try {
      await axiosClient.post("/integrations/smtp", form);
      showToast("SMTP connected successfully!", "success");

      setConnectDialogOpen(false);
      loadAccounts();

      // Reset form
      setForm({
        host: "smtp.gmail.com",
        port: 587,
        username: "",
        password: "",
        encryption: "tls",
        from_email: "",
        from_name: "Pexifly",
      });

    } catch (err: any) {
      const res = err.response?.data;
      if (res?.errors) {
        const firstError = Object.values(res.errors)[0][0];
        showToast(firstError, "error");
      } else {
        showToast(res?.message || "Connection failed", "error");
      }
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect
  const handleDisconnectClick = (id: number) => {
    setAccountToDisconnect(id);
    setDisconnectDialogOpen(true);
  };

  const handleDisconnect = async () => {
    if (!accountToDisconnect) return;
    try {
      await axiosClient.delete(`/integrations/smtp/accounts/${accountToDisconnect}`);
      showToast("SMTP account disconnected successfully", "success");
      loadAccounts();
    } catch {
      showToast("Failed to disconnect", "error");
    } finally {
      setDisconnectDialogOpen(false);
      setAccountToDisconnect(null);
    }
  };

  // Test Email
  const openTestModal = (id: number) => {
    setSelectedAccountId(id);
    setTestRecipient("");
    setTestDialogOpen(true);
  };

  const handleSendTest = async () => {
    if (!testRecipient.trim()) {
      showToast("Please enter recipient email", "error");
      return;
    }

    setSendingTest(true);
    try {
      await axiosClient.post("/integrations/smtp/send-test", {
        account_id: selectedAccountId,
        email: testRecipient,
      });
      showToast("Test email sent successfully!", "success");
      setTestDialogOpen(false);
    } catch {
      showToast("Failed to send test email", "error");
    } finally {
      setSendingTest(false);
    }
  };

  const hasConnected = smtpAccounts.some(a => a.status === "connected");

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">SMTP Email</CardTitle>
              {hasConnected && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            </div>
            <CardDescription className="text-xs">
              {hasConnected ? "Active" : "Not connected"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : smtpAccounts.length > 0 ? (
            <div className="space-y-3">
              {smtpAccounts.map((acc) => (
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
                          disabled={togglingId === acc.id}
                          onCheckedChange={() => handleToggleStatus(acc.id)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {acc.status === "connected" ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTestModal(acc.id)}
                      disabled={acc.status !== "connected" || togglingId === acc.id}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Send Test
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnectClick(acc.id)}
                      disabled={togglingId === acc.id}
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
              No SMTP accounts configured yet.
            </div>
          )}
        </CardContent>

        {hasConnected === false && smtpAccounts.length === 0 && (
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => setConnectDialogOpen(true)} 
              size="sm"
            >
              <Plug className="mr-2 h-4 w-4" />
              Connect SMTP Account
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Connect SMTP Dialog - Compact */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect SMTP Server</DialogTitle>
            <DialogDescription>Enter your SMTP credentials</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Host</Label>
              <Input
                value={form.host}
                onChange={e => setForm({ ...form, host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Port</Label>
                <Input
                  type="number"
                  value={form.port}
                  onChange={e => setForm({ ...form, port: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Encryption</Label>
                <Select value={form.encryption} onValueChange={(v: any) => setForm({ ...form, encryption: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tls">TLS</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Username / Email</Label>
              <Input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">From Name</Label>
              <Input
                value={form.from_name}
                onChange={e => setForm({ ...form, from_name: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleConnect} disabled={connecting} className="w-full">
              {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect SMTP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Dialog */}
      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect SMTP Account?</AlertDialogTitle>
            <AlertDialogDescription>This will stop email sending until reconnected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} className="bg-destructive">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>Quick test via your SMTP account</DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Label className="text-xs">Recipient Email</Label>
            <Input
              placeholder="recipient@example.com"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)} disabled={sendingTest}>
              Cancel
            </Button>
            <Button onClick={handleSendTest} disabled={sendingTest || !testRecipient.trim()}>
              {sendingTest ? "Sending..." : "Send Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}