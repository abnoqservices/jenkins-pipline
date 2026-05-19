"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ExternalLink, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared metadata row — matches “guide” style from reference */
export function HintMetadataRow({
  estimatedMinutes,
  helpfulLabel,
  updatedLabel,
  className,
}: {
  estimatedMinutes?: number;
  helpfulLabel?: string;
  updatedLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-4 text-xs text-muted-foreground",
        className
      )}
    >
      {estimatedMinutes != null && (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
          <span>{estimatedMinutes} min read</span>
        </span>
      )}
      {helpfulLabel && (
        <span className="inline-flex items-center gap-1.5">
          <ThumbsUp className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
          <span>{helpfulLabel}</span>
        </span>
      )}
      {updatedLabel && (
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
          <span>{updatedLabel}</span>
        </span>
      )}
    </div>
  );
}

function HintCallout({
  title,
  children,
  variant = "muted",
}: {
  title?: string;
  children: React.ReactNode;
  variant?: "muted" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-sm leading-relaxed shadow-sm",
        variant === "accent"
          ? "border-amber-200/80 bg-amber-50/90 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
          : "border-border bg-muted/40 text-foreground"
      )}
    >
      {title ? <p className="mb-2 font-semibold">{title}</p> : null}
      <div className="text-muted-foreground [&_strong]:text-foreground">{children}</div>
    </div>
  );
}

function StepHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{kicker}</p>
      <h2 className="text-xl font-bold leading-tight tracking-tight text-foreground">{title}</h2>
    </div>
  );
}

/** Step 1 — Security / 2FA */
export function OnboardingHintSecurity() {
  return (
    <div className="space-y-5">
      <StepHeading kicker="Security" title="How two-factor authentication (2FA) helps you" />
      <HintMetadataRow estimatedMinutes={3} helpfulLabel="Recommended for all accounts" updatedLabel="Onboarding guide" />
      <HintCallout title="Why it matters" variant="accent">
        <p>
          2FA adds a second check after your password. Even if someone learns your password, they still need your phone or
          authenticator app to sign in.
        </p>
      </HintCallout>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Step 1 — Install an authenticator</p>
        <ol className="list-inside list-decimal space-y-2 pl-1">
          <li>Install Google Authenticator, Authy, or 1Password on your phone.</li>
          <li>Tap <strong>Enable 2FA</strong> here, then scan the QR code with the app.</li>
          <li>Enter the 6-digit code to confirm — codes refresh every 30 seconds.</li>
        </ol>
      </div>
      <HintCallout>
        <p>
          <strong className="text-foreground">Prefer to skip?</strong> You can continue and turn on 2FA anytime under{" "}
          <strong className="text-foreground">Settings → Security</strong>.
        </p>
      </HintCallout>
      <Button asChild className="w-full bg-primary font-semibold" size="lg">
        <a href="mailto:support@pexifly.com?subject=2FA%20setup%20help">
          Email support about 2FA
          <ExternalLink className="ml-2 h-4 w-4 opacity-80" />
        </a>
      </Button>
    </div>
  );
}

/** Step 2 — Organization */
export function OnboardingHintOrganization() {
  return (
    <div className="space-y-5">
      <StepHeading kicker="Organization" title="Naming your workspace" />
      <HintMetadataRow estimatedMinutes={2} helpfulLabel="Shown across your org" updatedLabel="Onboarding guide" />
      <HintCallout title="Organization name">
        <p>This is the display name for your company or team — visible to members and on exports where relevant.</p>
      </HintCallout>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Slug (URL-safe ID)</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>Use lowercase letters, numbers, and hyphens only (e.g. <code className="rounded bg-muted px-1">acme-inc</code>).</li>
          <li>Keep it short and stable — it may appear in links and integrations.</li>
          <li>You can refine branding later; the slug should stay unique in the system.</li>
        </ul>
      </div>
      <HintCallout variant="accent">
        <p>
          <strong className="text-foreground">Tip:</strong> Match your slug to your email domain when possible so teammates
          recognize the workspace instantly.
        </p>
      </HintCallout>
    </div>
  );
}

/** Step 3 — Department */
export function OnboardingHintDepartment() {
  return (
    <div className="space-y-5">
      <StepHeading kicker="Structure" title="Departments and terminology" />
      <HintMetadataRow estimatedMinutes={3} helpfulLabel="First space setup" updatedLabel="Onboarding guide" />
      <p className="text-sm leading-relaxed text-muted-foreground">
        A <strong className="text-foreground">department</strong> (or whatever you call it) is a workspace boundary for
        products, events, and permissions. Your label sets the language your team sees in the product.
      </p>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Examples</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>
            Label <strong className="text-foreground">“Workspace”</strong> — common for agencies.
          </li>
          <li>
            Label <strong className="text-foreground">“Team”</strong> — common for internal orgs.
          </li>
          <li>
            Label <strong className="text-foreground">“Brand”</strong> — when each unit is a separate brand.
          </li>
        </ul>
      </div>
      <HintCallout>
        <p>You can add more departments later. The first one gets you through onboarding quickly.</p>
      </HintCallout>
    </div>
  );
}

/** Step 4 — Invites */
export function OnboardingHintInvites() {
  return (
    <div className="space-y-5">
      <StepHeading kicker="Collaboration" title="Inviting your team" />
      <HintMetadataRow estimatedMinutes={2} helpfulLabel="Optional step" updatedLabel="Onboarding guide" />
      <HintCallout title="Totally optional" variant="accent">
        <p>
          You can skip invites and add people later from the team or department settings. Use this step if you already
          know who should join.
        </p>
      </HintCallout>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Before you invite</p>
        <ol className="list-inside list-decimal space-y-2 pl-1">
          <li>Use work emails so invites land in the right inbox.</li>
          <li>Recipients will get instructions to join your organization.</li>
          <li>You can send more invitations anytime after onboarding.</li>
        </ol>
      </div>
    </div>
  );
}

/** Step 5 — Finish */
export function OnboardingHintFinish() {
  return (
    <div className="space-y-5">
      <StepHeading kicker="Wrap-up" title="What happens when you finish" />
      <HintMetadataRow estimatedMinutes={1} helpfulLabel="Last step" updatedLabel="Onboarding guide" />
      <p className="text-sm leading-relaxed text-muted-foreground">
        Completing setup marks your organization ready to use. You&apos;ll continue to <strong className="text-foreground">Plans</strong>{" "}
        where you can choose how you want to bill — then you&apos;re into the product.
      </p>
      <HintCallout>
        <p>
          After onboarding you can create <strong className="text-foreground">products</strong>,{" "}
          <strong className="text-foreground">events</strong>, and <strong className="text-foreground">landing pages</strong>{" "}
          from the dashboard.
        </p>
      </HintCallout>
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Need help after launch?</p>
        <p className="mt-1">
          Email{" "}
          <a href="mailto:support@pexifly.com" className="font-medium text-primary hover:underline">
            support@pexifly.com
          </a>{" "}
          — we&apos;re happy to help with setup or permissions.
        </p>
      </div>
    </div>
  );
}

/** Renders the hint body for the active onboarding step — swap sections freely in this file. */
export function OnboardingHintForStep({ step }: { step: number }) {
  switch (step) {
    case 1:
      return <OnboardingHintSecurity />;
    case 2:
      return <OnboardingHintOrganization />;
    case 3:
      return <OnboardingHintDepartment />;
    case 4:
      return <OnboardingHintInvites />;
    case 5:
      return <OnboardingHintFinish />;
    default:
      return null;
  }
}
