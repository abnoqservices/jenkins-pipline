"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CheckCircle2, ChevronRight, Lightbulb, Loader2, ThumbsUp, Shield, Building2, Users, Mail } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { OnboardingHintForStep } from "./onboarding-hint-sections";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { motion } from "framer-motion";
import Logo from "@/public/pexifly_logo.png";
import GDPRLogo from "@/public/gdpr.png";

type Invite = { email: string; role_id: string | null };

const stepMeta = [
  { id: 1, label: "Security", title: "Secure your account", description: "Add two-factor authentication or continue without it for now.", icon: Shield },
  { id: 2, label: "Organization", title: "Name your organization", description: "Choose a display name and a unique URL slug for your organization.", icon: Building2 },
  { id: 3, label: "Department", title: "Create your first space", description: "Set how you refer to teams and create your first one.", icon: Users },
  { id: 4, label: "Invite team", title: "Invite teammates", description: "Optional — add emails now or skip and invite later.", icon: Mail },
  { id: 5, label: "Finish", title: "You’re ready", description: "Review and finish setup to continue to plans.", icon: CheckCircle2 },
];

export default function AccountSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [maxStepReached, setMaxStepReached] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [checkingStatus, setCheckingStatus] = React.useState(true);
  const [showFinalSuccess, setShowFinalSuccess] = React.useState(false);
  const [showOrgSaved, setShowOrgSaved] = React.useState(false);
  const [, setIsGoogleUser] = React.useState(false);
  const [organizationName, setOrganizationName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [departmentName, setDepartmentName] = React.useState("");
  const [departmentLabelName, setDepartmentLabelName] = React.useState("Department");
  const [departmentId, setDepartmentId] = React.useState<number | null>(null);
  const [invitations, setInvitations] = React.useState<Invite[]>([{ email: "", role_id: null }]);

  const [mfaEnabled, setMfaEnabled] = React.useState(false);
  const [mfaSetupStarted, setMfaSetupStarted] = React.useState(false);
  const [mfaSecret, setMfaSecret] = React.useState("");
  const [mfaQr, setMfaQr] = React.useState("");
  const [mfaCode, setMfaCode] = React.useState("");
  const [mfaError, setMfaError] = React.useState("");
  const [hintOpen, setHintOpen] = React.useState(false);

  const goToStep = React.useCallback((stepId: number) => {
    if (stepId < 1 || stepId > stepMeta.length) return;
    if (stepId > maxStepReached) return;
    setCurrentStep(stepId);
  }, [maxStepReached]);

  const advanceStep = React.useCallback((next: number) => {
    setCurrentStep(next);
    setMaxStepReached((prev) => Math.max(prev, next));
  }, []);

  // Check setup status on mount
  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axiosClient.get("/account-setup/status");
        if (res.data.success) {
          const data = res.data.data;

          if (data.is_google_user) {
            setIsGoogleUser(true);
          }

          if (data.is_account_set_up) {
            router.replace("/dashboard");
            return;
          }

          if (data.organization) {
            setOrganizationName(data.organization.name || "");
            setSlug(data.organization.slug || "");
          }
          if (data.has_department) {
            setCurrentStep(4);
            setMaxStepReached(4);
          } else {
            setCurrentStep(1);
            setMaxStepReached(1);
          }
        }
      } catch (error: unknown) {
        console.error("Failed to check setup status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkStatus();
  }, [router]);

  const startMfaSetup = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.post("/auth/mfa/setup");
      setMfaSetupStarted(true);
      setMfaSecret(res.data?.data?.secret || "");
      const rawQr = res.data?.data?.qr_code_svg;
      let parsedQr = "";
      if (typeof rawQr === "string") {
        parsedQr = rawQr;
      } else if (rawQr && typeof rawQr === "object") {
        parsedQr = String(
          (rawQr as { svg?: string }).svg ??
          (rawQr as { html?: string }).html ??
          (rawQr as { __html?: string }).__html ??
          (rawQr as { value?: string }).value ??
          ""
        );
      }
      setMfaQr(parsedQr);
    } catch {
      showToast("Failed to initialize 2FA setup", "error");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnableMfa = async () => {
    setMfaError("");
    if (mfaCode.length !== 6) {
      const message = "Enter a valid 6-digit code";
      setMfaError(message);
      showToast(message, "error");
      return;
    }
    setLoading(true);
    try {
      await axiosClient.post("/auth/mfa/enable", { code: mfaCode });
      setMfaEnabled(true);
      setMfaError("");
      advanceStep(2);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Invalid authenticator code";
      setMfaError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const skipMfaForNow = () => advanceStep(2);

  const saveOrganization = async () => {
    if (!organizationName.trim()) {
      showToast("Please enter organization name", "error");
      return;
    }
    if (!slug || slug.length < 3) {
      showToast("Please enter a slug with at least 3 characters", "error");
      return;
    }
    setLoading(true);
    try {
      await axiosClient.post("/account-setup/update-organization", {
        name: organizationName.trim(),
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      });
      setShowOrgSaved(true);
      setTimeout(() => {
        setShowOrgSaved(false);
        advanceStep(3);
      }, 1300);
    } catch (error: unknown) {
      showToast(
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
          "Failed to save organization",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const createDepartment = async () => {
    if (!departmentName) {
      showToast("Please enter department name", "error");
      return;
    }
    if (!departmentLabelName.trim()) {
      showToast("Please enter the terminology label", "error");
      return;
    }
    setLoading(true);
    try {
      const deptRes = await axiosClient.post("/account-setup/create-department", {
        name: departmentName.trim(),
        department_label_name: departmentLabelName.trim(),
      });
      if (deptRes.data?.data?.id) {
        setDepartmentId(deptRes.data.data.id);
      }
      advanceStep(4);
    } catch (error: unknown) {
      showToast(
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
          "Failed to create department",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const submitInvites = async () => {
    if (!departmentId) {
      advanceStep(5);
      return;
    }
    const validInvites = invitations.filter((i) => i.email.trim());
    if (validInvites.length === 0) {
      advanceStep(5);
      return;
    }
    setLoading(true);
    try {
      await axiosClient.post("/account-setup/send-invitations", {
        department_id: departmentId,
        invitations: validInvites.map((inv) => ({
          email: inv.email.trim(),
          role_id: inv.role_id || null,
        })),
      });
      advanceStep(5);
    } catch (error: unknown) {
      showToast(
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
          "Failed to send invitations",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = async () => {
    setLoading(true);
    try {
      await axiosClient.post("/account-setup/complete");
      setShowFinalSuccess(true);
      setTimeout(() => {
        router.push("/plans");
      }, 1800);
    } catch (error: unknown) {
      showToast(
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
          "Failed to complete setup",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Preparing your workspace…</p>
        </motion.div>
      </div>
    );
  }

  if (showFinalSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] p-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-xl"
        >
          <Card className="border border-border/60 bg-card text-center shadow-sm">
            <CardHeader className="pb-8 pt-10">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <ThumbsUp className="h-8 w-8 text-emerald-700" />
              </div>
              <CardTitle className="text-3xl font-semibold tracking-tight">Awesome, setup complete</CardTitle>
              <CardDescription className="mt-2 text-sm">
                Your workspace is ready. Redirecting you to plans…
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    );
  }

  const step = stepMeta[currentStep - 1];
  const StepIcon = step.icon;

  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      {/* Left — stepper (reference-style sidebar) */}
      <aside className="relative flex w-full shrink-0 flex-col border-b border-border bg-white px-6 py-8 lg:w-[min(22rem,100%)] lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
        <div className="mb-10 flex items-center gap-2">
          <Image src={Logo} alt="Pexifly" width={100} height={36} className="rounded-lg" />
          {/* <span className="text-lg font-semibold tracking-tight text-foreground">Pexifly</span> */}
        </div>

        <nav className="flex flex-1 flex-col" aria-label="Onboarding steps">
          {stepMeta.map((s, index) => {
            const isActive = s.id === currentStep;
            // Completed: every step before current, OR steps user already passed when navigating back
            const isComplete =
              s.id < currentStep || (s.id > currentStep && s.id <= maxStepReached);
            const isUpcoming = s.id > maxStepReached;
            const clickable = !isActive && s.id <= maxStepReached;

            return (
              <div key={s.id} className="relative flex gap-3">
                <div className="relative flex shrink-0 flex-col items-center">
                  {index > 0 && (
                    <div
                      className={`absolute bottom-full left-1/2 mb-0 h-3 w-px -translate-x-1/2 ${
                        stepMeta[index - 1].id < currentStep ||
                        (stepMeta[index - 1].id > currentStep &&
                          stepMeta[index - 1].id <= maxStepReached)
                          ? "bg-emerald-500/50"
                          : stepMeta[index - 1].id === currentStep
                            ? "bg-primary/40"
                            : "bg-border"
                      }`}
                      aria-hidden
                    />
                  )}
                  <div
                    className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : isComplete
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-muted-foreground/25 bg-muted/40 text-muted-foreground"
                    }`}
                    aria-hidden
                  >
                    {isComplete && !isActive ? <Check className="h-4 w-4" strokeWidth={3} /> : s.id}
                  </div>
                  {index < stepMeta.length - 1 && (
                    <div
                      className={`my-0.5 min-h-[1.25rem] w-px flex-1 ${
                        isComplete && !isUpcoming ? "bg-emerald-500/40" : isActive ? "bg-primary/30" : "bg-border"
                      }`}
                      aria-hidden
                    />
                  )}
                </div>
                <button
                  type="button"
                  disabled={!clickable && !isActive}
                  onClick={() => clickable && goToStep(s.id)}
                  className={`relative min-w-0 flex-1 rounded-lg py-2.5 pl-0 pr-8 pt-8 mb-6 pl-4 -mt-4 text-left transition-colors ${
                    clickable ? "cursor-pointer hover:bg-muted/60" : isActive ? "cursor-default" : "cursor-default"
                  } ${isActive ? "bg-primary/5" : ""}`}
                  aria-current={isActive ? "step" : undefined}
                >
                  <p
                    className={`text-[11px] -mt-4 font-semibold uppercase tracking-wider ${
                      isActive ? "text-primary" : isComplete ? "text-muted-foreground" : "text-muted-foreground/60"
                    }`}
                  >
                    Step {s.id}
                  </p>
                  <p
                    className={`text-sm font-semibold leading-snug ${
                      isActive ? "text-foreground" : isComplete ? "text-muted-foreground" : "text-muted-foreground/75"
                    }`}
                  >
                    {s.label}
                  </p>
                  {isActive && (
                    <ChevronRight className="absolute right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground/40 lg:block" />
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto hidden pt-8 lg:block">
          <div className="rounded-xl bg-primary/5 p-4 text-center text-xs text-muted-foreground">
          <Image src={GDPRLogo} alt="GDPR" width={150} height={100} className="rounded-lg mx-auto" />
            Secure onboarding — your data stays private.
          </div>
          
        </div>
      </aside>

      {/* Right — main panel */}
      <main className="relative flex min-h-[60vh] flex-1 flex-col bg-[#F9FAFB] lg:min-h-screen">
        <div className="flex justify-end px-6 pb-2 pt-6 lg:px-12 lg:pt-10">
          <Sheet open={hintOpen} onOpenChange={setHintOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-border bg-card shadow-sm hover:bg-muted/50"
              >
                <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
                Step guide
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-full flex-col gap-0 border-l p-0 sm:max-w-lg"
            >
              <SheetHeader className="shrink-0 space-y-1 border-b border-border px-6 py-5 text-left">
                <SheetTitle className="text-lg font-semibold">Guides</SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  Tips and context for <span className="font-medium text-foreground">{step.label}</span> — step {currentStep}{" "}
                  of {stepMeta.length}
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <OnboardingHintForStep step={currentStep} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="mx-auto w-full max-w-2xl flex-1 px-6 pb-12 pt-4 lg:px-12 lg:pt-2">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <StepIcon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{step.title}</h1>
            <p className="max-w-xl text-base text-muted-foreground">{step.description}</p>
          </motion.div>

          <div className="mt-8 space-y-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Two-factor authentication works with apps like Google Authenticator. You can skip and enable it later in
                  Settings.
                </p>
                {!mfaSetupStarted && (
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={startMfaSetup} disabled={loading} className="bg-primary">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable 2FA"}
                    </Button>
                    <Button variant="outline" onClick={skipMfaForNow}>
                      Skip for now
                    </Button>
                  </div>
                )}
                {mfaSetupStarted && (
                  <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
                    {mfaQr ? (
                      <div className="w-fit rounded-lg border border-border bg-white p-3">
                        <div dangerouslySetInnerHTML={{ __html: mfaQr }} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">QR is loading. You can use the secret key below.</p>
                    )}
                    <code className="block rounded-lg bg-muted px-3 py-2 text-sm">{mfaSecret}</code>
                    <Input
                      placeholder="Enter 6-digit code"
                      value={mfaCode}
                      onChange={(e) => {
                        setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        if (mfaError) setMfaError("");
                      }}
                      className="max-w-xs"
                    />
                    {mfaError ? <p className="text-sm text-destructive">{mfaError}</p> : null}
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={verifyAndEnableMfa} disabled={loading || mfaCode.length !== 6}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying…
                          </>
                        ) : (
                          "Verify & continue"
                        )}
                      </Button>
                      <Button variant="outline" onClick={skipMfaForNow}>
                        Skip for now
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Organization</strong> is your company root in Pexifly.{" "}
                    <strong className="text-foreground">Slug</strong> is a unique URL-safe id (e.g.{" "}
                    <code className="rounded bg-muted px-1">acme-inc</code>).
                  </p>
                </div>
                <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="space-y-2">
                    <Label>Organization name</Label>
                    <Input
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Organization slug</Label>
                    <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme-inc" />
                  </div>
                  <Button onClick={saveOrganization} disabled={loading} className="bg-primary">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save & continue"
                    )}
                  </Button>
                  {showOrgSaved && (
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" /> Organization saved
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Choose what to call a <strong className="text-foreground">department</strong> (Workspace, Team, Pod…),
                    then name your first one.
                  </p>
                </div>
                <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="space-y-2">
                    <Label>Terminology label</Label>
                    <Input
                      value={departmentLabelName}
                      onChange={(e) => setDepartmentLabelName(e.target.value)}
                      placeholder="Workspace"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{departmentLabelName || "Department"} name</Label>
                    <Input
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                      placeholder="Sales team"
                    />
                  </div>
                  <Button onClick={createDepartment} disabled={loading || !departmentName.trim()} className="bg-primary">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & continue"}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  {invitations.map((inv, idx) => (
                    <Input
                      key={idx}
                      className={idx > 0 ? "mt-3" : ""}
                      value={inv.email}
                      onChange={(e) => {
                        const next = [...invitations];
                        next[idx].email = e.target.value;
                        setInvitations(next);
                      }}
                      placeholder="teammate@company.com"
                      type="email"
                    />
                  ))}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setInvitations((p) => [...p, { email: "", role_id: null }])}
                    >
                      Add another
                    </Button>
                    <Button variant="outline" onClick={() => advanceStep(5)}>
                      Skip
                    </Button>
                    <Button onClick={submitInvites} disabled={loading} className="bg-primary">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm">
                  <p className="font-semibold text-emerald-900">Ready to go</p>
                  <p className="mt-1 text-sm text-emerald-800/90">
                    Finish onboarding to open plans. You can create products, events, and landing pages after this.
                  </p>
                  {mfaEnabled && <p className="mt-2 text-sm text-emerald-800">2FA is enabled on your account.</p>}
                </div>
                <Button onClick={completeSetup} disabled={loading} className="bg-primary" size="lg">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finish & go to plans"}
                </Button>
              </div>
            )}

            {currentStep > 1 && (
              <Button type="button" variant="ghost" className="text-muted-foreground" onClick={() => goToStep(currentStep - 1)}>
                ← Back to previous step
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
