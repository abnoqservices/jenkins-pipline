"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/dashboard/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  GripVertical,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { useParams } from "next/navigation";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PuckProductEditor } from "@/components/landing/PuckProductEditor";
import { VisualEditorLayout } from "@/components/dashboard/visual-editor-layout";
import Link from "next/link";
import { LegacyPageThemePanel } from "@/components/landing/LegacyPageThemePanel";
import { useDebouncedCallback } from "use-debounce";

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

const Perview = dynamic(() => import("@/app/(preview)/dummuypreview/page"), { ssr: false });

type GlobalSection = {
  key: string;
  name: string;
  schema: any;
  group?: string;
  sub_group?: string | null;
};

type ActiveSection = {
  sectionId?: number;
  sectionKey: string;
  label: string;
  enabled: boolean;
  content: Record<string, any>;
  schema: any;
  saving?: boolean;
};

export default function LandingPageBuilder({ productId }: { productId?: number }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [previewVisible, setPreviewVisible] = React.useState(true);
  const [globalSections, setGlobalSections] = React.useState<GlobalSection[]>([]);
  const [groupedGlobals, setGroupedGlobals] = React.useState<
    Record<string, Record<string | "null", GlobalSection[]>>
  >({});
  const [activeSections, setActiveSections] = React.useState<ActiveSection[]>([]);
  const [reordering, setReordering] = React.useState(false);
  const [landingPageMode, setLandingPageMode] = React.useState<"legacy_sections" | "puck">(
    "legacy_sections"
  );
  const [puckDocument, setPuckDocument] = React.useState<Record<string, unknown> | null>(null);
  const [resolvedPuckTemplate, setResolvedPuckTemplate] = React.useState<Record<string, unknown>>(
    {}
  );
  const [puckPublished, setPuckPublished] = React.useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState("");

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
    
        const selectedDepartmentId = localStorage.getItem("selectedDepartmentId");
    
        const globalRes = await axiosClient.get("/landing-page/sections", {
          params: {
            department_id: selectedDepartmentId,
          },
        });
    
        if (globalRes.data.success) {
          const sections = globalRes.data.data.sections.filter((s: any) => s.is_active);
          setGlobalSections(sections);
          setGroupedGlobals(globalRes.data.data.grouped || {});
        }
    
        let active: ActiveSection[] = [];
    
        if (productId) {
          const productRes = await axiosClient.get(`/products/${productId}/landing-page`, {
            params: {
              department_id: selectedDepartmentId,
            },
          });
    
          if (productRes.data.success && productRes.data.data) {
            const d = productRes.data.data;
            setLandingPageMode(d.landing_page_mode === "puck" ? "puck" : "legacy_sections");
            setPuckDocument(d.puck_document ?? null);
            setPuckPublished(!!d.puck_is_published);
            setResolvedPuckTemplate(d.resolved_puck_template_document ?? {});

            if (d.sections?.length > 0) {
              active = d.sections
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((sec: any) => ({
                  sectionId: sec.id,
                  sectionKey: sec.global_section.key,
                  label: sec.global_section.name,
                  enabled: sec.is_published,
                  content: sec.content || {},
                  schema: sec.global_section.schema,
                }));
            }
          }
        }
    
        setActiveSections(active);
      } catch (error) {
        showToast("Failed to load landing page data", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const handleAddSection = async (sectionKey: string) => {
    if (!productId || !sectionKey) return;

    try {
      const res = await axiosClient.post(`/products/${productId}/landing-page/sections`, {
        global_section_key: sectionKey,
      });

      if (res.data.success) {
        const newSec = res.data.data;
        setActiveSections((prev) => [
          ...prev,
          {
            sectionId: newSec.id,
            sectionKey: newSec.global_section.key,
            label: newSec.global_section.name,
            enabled: newSec.is_published,
            content: newSec.content || {},
            schema: newSec.global_section.schema,
          },
        ]);
        showToast("Section added successfully", "success");
      }
    } catch (error) {
      showToast("Failed to add section", "error");
    }
  };

  const togglePublish = async (sec: ActiveSection) => {
    if (!productId || !sec.sectionId) return;

    const newEnabled = !sec.enabled;
    setActiveSections((prev) =>
      prev.map((s) => (s.sectionId === sec.sectionId ? { ...s, enabled: newEnabled } : s))
    );

    try {
      await axiosClient.patch(`/products/${productId}/landing-page/sections/${sec.sectionId}/publish`, {
        is_published: newEnabled,
      });
      showToast(newEnabled ? "Section published" : "Section unpublished", "success");
    } catch (error) {
      setActiveSections((prev) =>
        prev.map((s) => (s.sectionId === sec.sectionId ? { ...s, enabled: !newEnabled } : s))
      );
      showToast("Failed to update publish status", "error");
    }
  };

  const removeSection = async (sec: ActiveSection) => {
    if (!productId || !sec.sectionId) return;

    setActiveSections((prev) => prev.filter((s) => s.sectionId !== sec.sectionId));

    try {
      await axiosClient.delete(`/products/${productId}/landing-page/sections/${sec.sectionId}`);
      showToast("Section removed", "success");
    } catch (error) {
      showToast("Failed to remove section", "error");
    }
  };

  const onDragEnd = async ({ active, over }: any) => {
    if (!over || active.id === over.id || !productId) return;

    const oldIndex = activeSections.findIndex((s) => s.sectionId === active.id);
    const newIndex = activeSections.findIndex((s) => s.sectionId === over.id);
    const newOrder = arrayMove(activeSections, oldIndex, newIndex);

    setActiveSections(newOrder);
    setReordering(true);

    try {
      await axiosClient.post(`/products/${productId}/landing-page/reorder`, {
        sections: newOrder.map((sec, idx) => ({
          section_id: sec.sectionId,
          sort_order: idx + 1,
        })),
      });
      showToast("Order saved", "success");
    } catch (error) {
      showToast("Failed to reorder sections", "error");
      setActiveSections(activeSections);
    } finally {
      setReordering(false);
    }
  };

  const switchLandingMode = React.useCallback(
    async (mode: "legacy_sections" | "puck") => {
      if (!productId) return;
      try {
        await axiosClient.patch(`/products/${productId}/landing-page/mode`, {
          landing_page_mode: mode,
        });
        setLandingPageMode(mode);
        const res = await axiosClient.get(`/products/${productId}/landing-page`);
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          setPuckDocument(d.puck_document ?? null);
          setResolvedPuckTemplate(d.resolved_puck_template_document ?? {});
          setPuckPublished(!!d.puck_is_published);
        }
        showToast(
          mode === "puck" ? "Using visual editor (Puck)" : "Using section builder",
          "success"
        );
      } catch {
        showToast("Failed to switch builder mode", "error");
      }
    },
    [productId]
  );

  const getBaseSection = (key: string) => key.split('_dept_')[0];

  const customizeWebpageSection = activeSections.find(
    (s) => getBaseSection(s.sectionKey) === "customize_webpage" && s.sectionId
  );

  const customizeSection = activeSections.find(
    (s) => getBaseSection(s.sectionKey) === 'customize_webpage' && s.enabled
  );
  
  const customStyles = customizeSection?.content || {};
  
  const previewPayload = {
    templateName: "modern",
    sections: activeSections
      .filter(
        (s) =>
          s.enabled &&
          getBaseSection(s.sectionKey) !== 'customize_webpage' // ✅ exclude properly
      )
      .map((s) => ({
        section: getBaseSection(s.sectionKey), // ✅ normalize here too (important!)
        content: s.content,
      })),
    styles: {
      primaryColor: customStyles.primary_text_color || "#000000",
      backgroundColor: customStyles.background_color || "#FFFFFF",
      textColor: customStyles.primary_text_color || "#000000",
      secondaryTextColor: customStyles.secondary_text_color || "#666666",
      accentColor: customStyles.accent_color || "#007BFF",
      linkColor: customStyles.link_color || "#007BFF",
      buttonBackgroundColor: customStyles.button_background_color || "#007BFF",
      buttonTextColor: customStyles.button_text_color || "#FFFFFF",
      headlineSize: 28,
      paragraphSize: 16,
    },
  };
  const pageTitle = productId ? `Customize Product Landing Page` : "Global Landing Page Builder";

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-12 w-12 animate-spin" />
          <p className="ml-4 text-lg">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (productId && landingPageMode === "puck") {
    return (
      <VisualEditorLayout>
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-background px-2 sm:px-3">
          <Button variant="ghost" size="sm" asChild className="h-8 gap-1.5 px-2 text-muted-foreground">
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Products</span>
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <Tabs
            value={landingPageMode}
            onValueChange={(v) => {
              void switchLandingMode(v as "legacy_sections" | "puck");
            }}
            className="w-auto"
          >
            <TabsList className="h-8 p-0.5">
              <TabsTrigger value="legacy_sections" className="px-2.5 text-xs sm:px-3 sm:text-sm">
                Sections
              </TabsTrigger>
              <TabsTrigger value="puck" className="px-2.5 text-xs sm:px-3 sm:text-sm">
                Visual editor
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <span className="ml-auto truncate text-xs text-muted-foreground tabular-nums">#{productId}</span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <PuckProductEditor
            productId={productId}
            initialDocument={puckDocument}
            resolvedTemplateDocument={resolvedPuckTemplate}
            puckPublished={puckPublished}
            placeholderSections={activeSections.map((s) => ({
              sectionKey: s.sectionKey,
              content: s.content,
            }))}
          />
        </div>
      </VisualEditorLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>

        {productId ? (
          <Tabs
            value={landingPageMode}
            onValueChange={(v) => {
              void switchLandingMode(v as "legacy_sections" | "puck");
            }}
          >
            <TabsList>
              <TabsTrigger value="legacy_sections">Section builder</TabsTrigger>
              <TabsTrigger value="puck">Visual editor (Puck)</TabsTrigger>
            </TabsList>
          </Tabs>
        ) : null}

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Controls */}
          <div className="space-y-6 lg:col-span-3">
            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Sections</h2>
              <p className="text-sm text-muted-foreground">
                Drag to reorder • Click to expand and edit content
              </p>
            </div>

            {productId ? (
              <LegacyPageThemePanel
                productId={productId}
                customizeSection={
                  customizeWebpageSection?.sectionId
                    ? {
                        sectionId: customizeWebpageSection.sectionId,
                        content: customizeWebpageSection.content,
                      }
                    : null
                }
                onContentChange={(content) => {
                  const sid = customizeWebpageSection?.sectionId;
                  if (!sid) return;
                  setActiveSections((prev) =>
                    prev.map((s) => (s.sectionId === sid ? { ...s, content } : s))
                  );
                }}
                onAddCustomizeSection={async () => handleAddSection("customize_webpage")}
              />
            ) : null}

            {/* Sections List */}
            {activeSections.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={activeSections.map((s) => s.sectionId!)}
                  strategy={verticalListSortingStrategy}
                >
                  <Accordion type="multiple" className="space-y-4">
                    {activeSections.map((item) => (
                      <SortableSectionItem
                        productId={productId}
                        key={item.sectionId}
                        item={item}
                        onTogglePublish={() => togglePublish(item)}
                        onRemove={() => removeSection(item)}
                        onContentChange={(content) =>
                          setActiveSections((prev) =>
                            prev.map((s) =>
                              s.sectionId === item.sectionId ? { ...s, content } : s
                            )
                          )
                        }
                        disabled={reordering}
                      />
                    ))}
                  </Accordion>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-muted rounded-full">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No sections yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {productId
                        ? "Add your first section below to get started"
                        : "Global mode – no sections available."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Add Section Button - Appears after accordions */}
            {productId && (
              <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal h-auto py-6 px-4 border-2 border-dashed hover:border-solid hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Plus className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Add a New Section</div>
                          <div className="text-xs text-muted-foreground font-normal">
                            Search and select a section to add
                          </div>
                        </div>
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search sections..." className="h-9" />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No sections found.</CommandEmpty>

                        {Object.entries(groupedGlobals).map(([group, subGroups]) => (
                          <CommandGroup
                            key={group}
                            heading={group.charAt(0).toUpperCase() + group.slice(1)}
                          >
                            {Object.entries(subGroups).map(([subGroup, secs]) => (
                              <React.Fragment key={subGroup}>
                                {subGroup !== "null" && (
                                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {subGroup}
                                  </div>
                                )}
                                {secs.map((s) => {
                                  // Check if section is already added
                                  const isAlreadyAdded = activeSections.some(
                                    (active) => active.sectionKey === s.key
                                  );
                                  
                                  return (
                                    <CommandItem
                                      key={s.key}
                                      value={s.key}
                                      onSelect={(currentValue) => {
                                        if (!isAlreadyAdded) {
                                          handleAddSection(currentValue);
                                          setSelectedValue("");
                                        }
                                      }}
                                      disabled={isAlreadyAdded}
                                      className={isAlreadyAdded ? "opacity-50 cursor-not-allowed" : ""}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          selectedValue === s.key ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      <span className="flex-1">{s.name}</span>
                                      {isAlreadyAdded && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                          (Added)
                                        </span>
                                      )}
                                    </CommandItem>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </CommandGroup>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {productId && (
            <div className="-mt-30 fixed right-[5rem] w-[420px] !top-40 lg:inset-y-0 lg:col-span-2 lg:pointer-events-none lg:z-10">
              <div className="w-full h-[80%] lg:max-w-lg lg:pointer-events-auto">
                {previewVisible && (
                  <Card className="shadow-none border-none bg-transparent mx-auto lg:mx-0 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between">
                      {/* <div>
                        <CardTitle className="text-lg lg:text-xl">Preview</CardTitle>
                        <CardDescription className="text-xs lg:text-sm">
                          Live view on mobile device
                        </CardDescription>
                      </div> */}

                      {/* <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-gray-100"
                        onClick={() => setPreviewVisible(false)}
                      >
                        <EyeOff className="h-5 w-5" />
                      </Button> */}
                    </CardHeader>

                    <CardContent className="flex justify-center">
                      <div
                        className="h-[600px] relative shadow-2xl w-full max-w-[320px] 
                        aspect-[9/19.5] border-[14px] border-black rounded-[45px] bg-black overflow-hidden"
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-full rounded-[31px] overflow-hidden bg-white shadow-inner">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-black rounded-b-3xl z-20" />

                            {/* Content */}
                            <div className="w-full h-full overflow-y-auto scrollbar-hide">
                              <Perview data={previewPayload} productId={productId} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!previewVisible && (
                  <div className="bottom-6 right-6 z-50 lg:bottom-8 lg:right-8">
                    <Button
                      size="lg"
                      className="shadow-2xl rounded-full px-6 py-3 flex items-center gap-2 font-medium"
                      onClick={() => setPreviewVisible(true)}
                    >
                      <Eye className="h-5 w-5" />
                      Show Preview
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function SortableSectionItem({
  productId,
  item,
  onTogglePublish,
  onRemove,
  onContentChange,
  disabled,
}: {
  productId?: number;
  item: ActiveSection;
  onTogglePublish: () => void;
  onRemove: () => void;
  onContentChange: (content: Record<string, any>) => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.sectionId!,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // ── Debounce the save to backend ───────────────────────────────
  const debouncedSave = useDebouncedCallback(
    (newContent: Record<string, any>) => {
      if (!item.sectionId) return;
    
      // Show saving indicator
      // You can also pass saving state up if you want to show it in parent
      axiosClient.put(`/products/${productId}/landing-page/sections/${item.sectionId}`, {
          content: newContent,
        })
        .then(() => {
          // Optional: success toast / remove loading
        })
        .catch(() => {
          showToast("Failed to save section content", "error");
        });
    },
    600 // 600ms - good balance between responsiveness and request count
  );

  const handleFieldChange = (key: string, value: any) => {
    const newContent = { ...item.content, [key]: value };

    // 1. Immediate local update (no lag in UI)
    onContentChange(newContent);

    // 2. Debounced backend save
    debouncedSave(newContent);
  };

  return (
    <AccordionItem 
      value={item.sectionKey} 
      className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow" 
      ref={setNodeRef} 
      style={style}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <AccordionTrigger className="flex items-center gap-3 flex-1 hover:no-underline text-left py-0">
          <GripVertical
            className="h-5 w-5 text-gray-400 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          />

          <span className="font-medium text-base">{item.label}</span>

          {/* You can add saving indicator here if you track it */}
        </AccordionTrigger>

        <div className="flex items-center gap-3 ml-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {item.enabled ? "Published" : "Draft"}
            </span>
            <Switch
              checked={item.enabled}
              onCheckedChange={onTogglePublish}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>

      <AccordionContent className="px-6 pb-6 space-y-6 pt-6 bg-gray-50/50">
  {item.schema?.fields?.length > 0 ? (
    item.schema.fields.map((field: any) => (
      <div key={field.key} className="space-y-2">
        <Label htmlFor={field.key}>
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </Label>

        {/* TEXT */}
        {field.type === "text" && (
          <Input
            id={field.key}
            value={item.content[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder || field.label}
          />
        )}

        {/* TEXTAREA */}
        {field.type === "textarea" && (
          <Textarea
            id={field.key}
            value={item.content[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder || field.label}
            rows={field.rows || 5}
          />
        )}

        {/* NUMBER */}
        {field.type === "number" && (
          <Input
            type="number"
            id={field.key}
            value={item.content[field.key] ?? ""}
            onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
            placeholder={field.placeholder || field.label}
          />
        )}

        {/* BOOLEAN (Switch) */}
        {field.type === "boolean" && (
          <div className="flex items-center space-x-3">
            <Switch
              id={field.key}
              checked={!!item.content[field.key]}
              onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
            />
            <Label htmlFor={field.key} className="cursor-pointer">
              {item.content[field.key] ? "Enabled" : "Disabled"}
            </Label>
          </div>
        )}

        {/* URL */}
        {field.type === "url" && (
          <Input
            type="url"
            id={field.key}
            value={item.content[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder || "https://example.com"}
          />
        )}

        {/* EMAIL */}
        {field.type === "email" && (
          <Input
            type="email"
            id={field.key}
            value={item.content[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder || "name@example.com"}
          />
        )}

        {/* DATE */}
        {field.type === "date" && (
          <Input
            type="date"
            id={field.key}
            value={item.content[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        )}

        {/* IMAGE - URL input + preview */}
        {field.type === "image" && (
  <div className="space-y-3">
   

    <div className="flex items-center gap-4">
      {/* Thumbnail Preview */}
      <div className="shrink-0">
        {item.content[field.key] ? (
          <div className="relative group">
            <img
              src={item.content[field.key]}
              alt="Thumbnail"
              className="w-24 h-24 object-cover rounded-lg border "
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleFieldChange(field.key, "")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <Input
          type="file"
          accept="image/*"
          id={`upload-thumb-${field.key}`}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
              showToast("Please select a valid image", "error");
              return;
            }

            if (file.size > 5 * 1024 * 1024) {
              showToast("Image too large (max 5MB)", "error");
              return;
            }

            const reader = new FileReader();
            reader.onload = () => {
              handleFieldChange(field.key, reader.result as string);
            };
            reader.readAsDataURL(file);
          }}
        />

        <Button
          size="sm"
          variant={item.content[field.key] ? "outline" : "default"}
          onClick={() => document.getElementById(`upload-thumb-${field.key}`)?.click()}
        >
          {item.content[field.key] ? "Change" : "Upload"} Image
        </Button>

        {item.content[field.key] && (
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleFieldChange(field.key, "")}
          >
            Remove
          </Button>
        )}
      </div>
    </div>

 
    <p className="text-xs text-muted-foreground">
      Recommended: Square or landscape • Max 5MB • JPG, PNG, WebP
    </p>
  </div>
)}

       
        {field.type === "file" && (
          <div className="space-y-3">
            <Input
              type="file"
              id={field.key}
              accept={field.accept || "image/*"}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

             
                handleFieldChange(field.key, "Uploading...");

               
                const reader = new FileReader();
                reader.onload = () => {
                  const base64 = reader.result as string;
                  handleFieldChange(field.key, base64); 
                };
                reader.readAsDataURL(file);

            
              }}
            />
            {item.content[field.key] && typeof item.content[field.key] === "string" && (
              <div className="relative">
                {field.accept?.includes("image/") ? (
                  <img
                    src={item.content[field.key]}
                    alt="Uploaded preview"
                    className="w-full max-h-96 object-contain rounded-lg border bg-gray-50"
                  />
                ) : (
                  <div className="p-4 border rounded-lg bg-gray-50 text-sm">
                    File uploaded: {item.content[field.key].split("/").pop() || "File"}
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => handleFieldChange(field.key, "")}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    ))
  ) : (
    <p className="text-sm text-muted-foreground">
      No editable fields defined for this section.
    </p>
  )}
</AccordionContent>
    </AccordionItem>
  );
}