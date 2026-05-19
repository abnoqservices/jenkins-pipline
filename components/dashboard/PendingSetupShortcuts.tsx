"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axiosClient from "@/lib/axiosClient";
import { ClipboardList, ShoppingBag, CalendarDays, Rocket, Check, ArrowRight } from "lucide-react";

type Step = {
  key: string;
  num: string;
  label: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  chipClass: string;
  done: boolean;
};

export default function PendingSetupShortcuts() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [products, setProducts] = React.useState(0);
  const [events, setEvents] = React.useState(0);
  const [forms, setForms] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      try {
        const [pRes, eRes, fRes] = await Promise.all([
          axiosClient.get("/products"),
          axiosClient.get("/events"),
          axiosClient.get("/forms"),
        ]);
        const productList = Array.isArray(pRes.data?.data)
          ? pRes.data.data
          : Array.isArray(pRes.data?.data?.data)
            ? pRes.data.data.data
            : [];
        setProducts(productList.length);
        setEvents(Array.isArray(eRes.data?.data) ? eRes.data.data.length : 0);
        setForms(Array.isArray(fRes.data?.data) ? fRes.data.data.length : 0);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return null;

  const steps: Step[] = [
    {
      key: "product", num: "Step 1",
      label: "Add products", desc: "Goods, downloads, or services",
      href: "/products/new",
      icon: <ShoppingBag className="h-4 w-4" />,
      iconBg: "bg-orange-50", iconColor: "text-orange-600",
      chipClass: "bg-orange-50 text-orange-800 border-orange-200",
      done: products > 0,
    },
    {
      key: "event", num: "Step 2",
      label: "Create event & link products", desc: "Webinar, workshop, or session",
      href: "/events/new",
      icon: <CalendarDays className="h-4 w-4" />,
      iconBg: "bg-blue-50", iconColor: "text-blue-600",
      chipClass: "bg-blue-50 text-blue-800 border-blue-200",
      done: events > 0,
    },
    {
      key: "form", num: "Step 3",
      label: "Setup form & automations", desc: "Capture leads and trigger flows",
      href: "/forms/new",
      icon: <ClipboardList className="h-4 w-4" />,
      iconBg: "bg-violet-50", iconColor: "text-violet-600",
      chipClass: "bg-violet-50 text-violet-800 border-violet-200",
      done: forms > 0,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const pendingCount = steps.length - doneCount;

  if (pendingCount === 0) return null;

  return (
    <div className="col-span-12 overflow-hidden rounded-xl border border-gray-100 bg-white">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100">
            <Rocket className="h-3.5 w-3.5 text-gray-500" />
          </span>
          <div>
            <p className="text-[13px] font-medium text-gray-900">
              Get started —{" "}
              <span className="text-gray-500">{pendingCount} step{pendingCount !== 1 ? "s" : ""} remaining</span>
            </p>
            <p className="text-[11px] text-gray-400">Complete these to unlock the full experience</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="h-1 w-20 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-700"
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>
          <span className="tabular-nums text-[11px] text-gray-400">{doneCount}/{steps.length}</span>
        </div>
      </div>

      {/* Steps row */}
      <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {steps.map((step) => (
          <StepRow key={step.key} step={step} onGo={(href) => router.push(href)} />
        ))}
      </div>
    </div>
  );
}

function StepRow({ step, onGo }: { step: Step; onGo: (href: string) => void }) {
  return (
    <button
      className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150
        ${step.done ? "cursor-default opacity-40" : "hover:bg-gray-50"}`}
      onClick={() => !step.done && onGo(step.href)}
      disabled={step.done}
    >
      {/* Icon */}
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${step.iconBg} ${step.iconColor}`}>
        {step.icon}
      </span>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">{step.num}</p>
        <p className="truncate text-[16px] font-medium text-gray-900">{step.label}</p>
        <p className="truncate text-[13px] text-gray-400">{step.desc}</p>
      </div>

      {/* Chip */}
      {step.done ? (
        <span className="flex flex-shrink-0 items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
          <Check className="h-3 w-3" /> Done
        </span>
      ) : (
        <span className={`flex flex-shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${step.chipClass}
          group-hover:gap-1.5`}>
          {step.label.split(" ")[0]}
          <ArrowRight className="h-2.5 w-2.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </span>
      )}
    </button>
  );
}