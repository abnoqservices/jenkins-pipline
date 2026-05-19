"use client";

import * as React from "react";
import type { Data, PuckAction } from "@measured/puck";
import { engagePuckConfig } from "@/lib/puck/engage-puck-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getPuckBlockVariants, isPuckVariantPickableType } from "@/lib/puck/engage-puck-variants";

const ROOT_ZONE = "root:default-zone";

function getZoneContentArray(data: Partial<Data>, zone: string): unknown[] {
  if (zone === ROOT_ZONE) {
    const c = data.content;
    return Array.isArray(c) ? c : [];
  }
  const z = data.zones?.[zone];
  return Array.isArray(z) ? z : [];
}

function readInsertedBlock(
  data: Partial<Data>,
  zone: string,
  index: number,
  expectedType: string
): { id: string } | null {
  const arr = getZoneContentArray(data, zone);
  const raw = arr[index];
  if (!raw || typeof raw !== "object" || !("type" in raw) || !("props" in raw)) return null;
  const item = raw as { type?: string; props?: { id?: string } };
  if (item.type !== expectedType) return null;
  const id = item.props?.id;
  if (typeof id !== "string" || !id) return null;
  return { id };
}

type PickSession = {
  componentType: string;
  componentId: string;
  zone: string;
  index: number;
};

type PuckHeaderArgs = {
  children: React.ReactNode;
  dispatch: (action: PuckAction) => void;
  state: unknown;
};

export type PuckEditorWithVariantPickerProps = Record<string, unknown> & {
  /** Same dynamic `Puck` instance the parent already imports from `@measured/puck`. */
  PuckComponent: React.ComponentType<Record<string, unknown>>;
  onAction?: (action: PuckAction, newState: { data: Data; ui: unknown }, prevState: { data: Data; ui: unknown }) => void;
  renderHeader?: (args: PuckHeaderArgs) => React.ReactElement;
};

/**
 * Wraps `<Puck />` so inserting a SaaS landing block from the sidebar opens a dialog to pick a preset layout.
 */
export function PuckEditorWithVariantPicker({
  PuckComponent,
  onAction: userOnAction,
  renderHeader: userRenderHeader,
  ...puckProps
}: PuckEditorWithVariantPickerProps) {
  const dispatchRef = React.useRef<((action: PuckAction) => void) | null>(null);
  const [session, setSession] = React.useState<PickSession | null>(null);

  const mergedOnAction = React.useCallback(
    (action: PuckAction, newState: { data: Data; ui: unknown }, prevState: { data: Data; ui: unknown }) => {
      userOnAction?.(action, newState, prevState);
      if (action.type !== "insert") return;
      if (!isPuckVariantPickableType(action.componentType)) return;
      const inserted = readInsertedBlock(
        newState.data,
        action.destinationZone,
        action.destinationIndex,
        action.componentType
      );
      if (!inserted) return;
      setSession({
        componentType: action.componentType,
        componentId: inserted.id,
        zone: action.destinationZone,
        index: action.destinationIndex,
      });
    },
    [userOnAction]
  );

  const mergedRenderHeader = React.useCallback(
    (args: PuckHeaderArgs) => {
      dispatchRef.current = args.dispatch;
      if (userRenderHeader) {
        return userRenderHeader(args);
      }
      return <>{args.children}</>;
    },
    [userRenderHeader]
  );

  const close = React.useCallback(() => setSession(null), []);

  const applyVariant = React.useCallback(
    (resolveProps: () => Record<string, unknown>) => {
      if (!session) return;
      const d = dispatchRef.current;
      if (!d) return;
      const nextProps = resolveProps();
      d({
        type: "replace",
        destinationZone: session.zone,
        destinationIndex: session.index,
        data: {
          type: session.componentType,
          props: {
            ...(nextProps as Record<string, unknown>),
            id: session.componentId,
          },
        },
      });
      close();
    },
    [session, close]
  );

  const variants = session ? getPuckBlockVariants(session.componentType) : [];
  const compEntry = session
    ? (engagePuckConfig.components as Record<string, { label?: string } | undefined>)[session.componentType]
    : undefined;
  const compLabel = compEntry?.label;

  return (
    <>
      <PuckComponent
        {...puckProps}
        onAction={mergedOnAction}
        renderHeader={mergedRenderHeader}
      />
      <Dialog open={!!session} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose a design</DialogTitle>
            <DialogDescription>
              {compLabel ? (
                <>
                  Each option is a different layout for <span className="font-medium text-foreground">{compLabel}</span>.
                  Pick one to start — you can still edit all content and styles in the sidebar.
                </>
              ) : (
                "Each option is a different layout. Pick one to start, then refine in the sidebar."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => applyVariant(v.resolveProps)}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.imageSrc}
                    alt=""
                    className="h-full w-full object-cover object-top transition duration-200 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <div className="font-semibold leading-snug">{v.title}</div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{v.description}</p>
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Keep default
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
