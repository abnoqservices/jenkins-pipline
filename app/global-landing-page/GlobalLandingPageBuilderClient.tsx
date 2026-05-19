"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  GripVertical,
  Loader2,
  Trash2,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedCallback } from "use-debounce";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import FormBuilderDialog from "@/components/form-builder/FormBuilder";

const Perview = dynamic(() => import("@/app/(preview)/dummuypreview/page"), { ssr: false });

// ====================== CATEGORIES ======================
const CATEGORIES = [
  { value: "all-category", label: "All Category" },
  { value: "business", label: "Business" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "portfolio", label: "Portfolio" },
  { value: "restaurant", label: "Restaurant" },
];

// ====================== TEMPLATES ======================
const TEMPLATES = [
  { value: "blank", label: "Blank", image: "https://cdn.vectorstock.com/i/500p/65/35/no-picture-placeholder-icon-vector-30386535.jpg" },
  { value: "modern", label: "Modern", image: "https://cdn0070.qrcodechimp.com/images/digitalCard/dbcv2/digital-business-cards-template-engineer.webp" },
  { value: "minimal", label: "Minimal", image: "https://cdn0070.qrcodechimp.com/images/digitalCard/dbcv2/digital-business-cards-template-business.webp" },
  { value: "bold", label: "Bold", image: "https://cdn0070.qrcodechimp.com/images/digitalCard/dbcv2/digital-business-cards-template-finance.webp" },
  { value: "classic", label: "Classic", image: "https://cdn0070.qrcodechimp.com/images/digitalCard/dbcv2/digital-business-cards-template-finance.webp" },
  { value: "Pro", label: "Pro", image: "https://cdn0070.qrcodechimp.com/images/digitalCard/dbcv2/digital-business-cards-template-business-marketing.webp" },
];

// ====================== TEMPLATE PRESETS ======================
const TEMPLATE_PRESETS: Record<string, Record<string, { sectionKey: string; initialContent?: Record<string, any> }[]>> = {
  business: {
    modern: [
      { sectionKey: "brand_header", initialContent: { brand_name: "My Business", tagline: "Premium Services" } },
      { sectionKey: "hero", initialContent: { title: "Grow Your Business", sub_title: "Professional Solutions" } },
      { sectionKey: "description", initialContent: { heading: "Our Story", description: "We bring the best to you..." } },
      { sectionKey: "image_gallery", initialContent: {} },
      { sectionKey: "cta", initialContent: { cta_text: "Get Quote", cta_action: "url", url: "https://example.com" } },
      { sectionKey: "customize_webpage", initialContent: { background_color: "#FFFFFF", primary_text_color: "#000000" } },
    ],
    minimal: [
      { sectionKey: "header", initialContent: { heading: "Minimal Business", subheading: "Clean & Simple" } },
      { sectionKey: "description", initialContent: { heading: "About Us", description: "Less is more." } },
      { sectionKey: "image_gallery", initialContent: {} },
      { sectionKey: "contact", initialContent: {} },
      { sectionKey: "cta", initialContent: { cta_text: "Get In Touch", cta_action: "popup" } },
      { sectionKey: "customize_webpage", initialContent: { background_color: "#F8F9FA" } },
    ],
    bold: [
      { sectionKey: "hero", initialContent: { title: "Bold Statement", sub_title: "Stand Out From The Crowd" } },
      { sectionKey: "product_header", initialContent: {} },
      { sectionKey: "image_gallery_coverflow", initialContent: {} },
      { sectionKey: "description", initialContent: { heading: "Why Us?", description: "Powerful products for powerful people" } },
      { sectionKey: "cta", initialContent: { cta_text: "Buy Now", cta_action: "url" } },
      { sectionKey: "customize_webpage", initialContent: { accent_color: "#FF0000", button_background_color: "#FF0000" } },
    ],
    classic: [
      { sectionKey: "brand_header", initialContent: { brand_name: "Classic Co.", tagline: "Since 1985" } },
      { sectionKey: "header", initialContent: { heading: "Timeless Elegance", subheading: "Quality you can trust" } },
      { sectionKey: "description", initialContent: { heading: "Our Heritage", description: "Crafted with passion..." } },
      { sectionKey: "social_links", initialContent: {} },
      { sectionKey: "contact", initialContent: {} },
      { sectionKey: "cta", initialContent: { cta_text: "Visit Us", cta_action: "url" } },
      { sectionKey: "customize_webpage", initialContent: { background_color: "#FAF7F0", primary_text_color: "#3A2F1E" } },
    ],
    Pro: [
      { sectionKey: "brand_header", initialContent: { brand_name: "Pro Business", tagline: "Since 1985" } },
      { sectionKey: "header", initialContent: { heading: "Timeless Elegance", subheading: "Quality you can trust" } },
      { sectionKey: "description", initialContent: { heading: "Our Heritage", description: "Crafted with passion..." } },
      { sectionKey: "social_links", initialContent: {} },
      { sectionKey: "contact", initialContent: {} },
      { sectionKey: "cta", initialContent: { cta_text: "Visit Us", cta_action: "url" } },
      { sectionKey: "customize_webpage", initialContent: { background_color: "#FAF7F0", primary_text_color: "#3A2F1E" } },
    ],
  },
  ecommerce: {
    modern: [
      { sectionKey: "brand_header", initialContent: { brand_name: "My Store", tagline: "Shop with Confidence" } },
      { sectionKey: "hero", initialContent: { title: "Big Summer Sale", sub_title: "Up to 70% Off" } },
      { sectionKey: "description", initialContent: { heading: "Featured Products", description: "Best selling items" } },
      { sectionKey: "image_gallery", initialContent: {} },
      { sectionKey: "cta", initialContent: { cta_text: "Shop Now", cta_action: "url" } },
      { sectionKey: "customize_webpage", initialContent: { background_color: "#FFFFFF" } },
    ],
  },
  portfolio: {
    modern: [
      { sectionKey: "brand_header", initialContent: { brand_name: "John Doe", tagline: "Creative Designer" } },
      { sectionKey: "hero", initialContent: { title: "Hello, I'm John", sub_title: "Turning ideas into reality" } },
      { sectionKey: "description", initialContent: { heading: "About Me", description: "Passionate creator..." } },
      { sectionKey: "image_gallery", initialContent: {} },
      { sectionKey: "cta", initialContent: { cta_text: "Hire Me", cta_action: "url" } },
      { sectionKey: "customize_webpage", initialContent: { background_color: "#0F172A", primary_text_color: "#FFFFFF" } },
    ],
  },
  restaurant: {
    modern: [
      { sectionKey: "brand_header", initialContent: { brand_name: "Spice Garden", tagline: "Authentic Indian Cuisine" } },
      { sectionKey: "hero", initialContent: { title: "Welcome to Spice Garden", sub_title: "Taste the Tradition" } },
      { sectionKey: "description", initialContent: { heading: "Our Menu", description: "Fresh ingredients, authentic flavors" } },
      { sectionKey: "image_gallery", initialContent: {} },
      { sectionKey: "cta", initialContent: { cta_text: "Reserve Table", cta_action: "popup" } },
      { sectionKey: "customize_webpage", initialContent: { background_color: "#FFF7ED" } },
    ],
  },
};
type ActiveSection = {
  id: number;
  sectionKey: string;
  label: string;
  enabled: boolean;
  content: Record<string, any>;
  schema: any;
};

// ====================== CONFIRM MODAL ======================
type ConfirmModalProps = {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmModal({ open, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-5">
        <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel} className="px-5">Cancel</Button>
          <Button size="sm" onClick={onConfirm} className="px-5 bg-violet-600 hover:bg-violet-700 text-white">OK</Button>
        </div>
      </div>
    </div>
  );
}

export default function GlobalLandingPageBuilder() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSwitching, setIsSwitching] = React.useState(false);
  const searchParams = useSearchParams();
  const configIdFromUrl = searchParams.get("config_id");
  const urlCategory = searchParams.get("category");
  const urlTemplate = searchParams.get("template");

  const [selectedTemplate, setSelectedTemplate] = React.useState<string>();
  const [selectedCategory, setSelectedCategory] = React.useState<string>();
  const [globalSections, setGlobalSections] = React.useState<any[]>([]);
  const [createdFormId, setCreatedFormId] = React.useState<string | null>(null);

  const [confirmModal, setConfirmModal] = React.useState<{ open: boolean; message: string; onConfirm: () => void }>({
    open: false,
    message: "",
    onConfirm: () => {},
  });

  const [activeSections, setActiveSections] = React.useState<ActiveSection[]>([]);
  const [groupedGlobals, setGroupedGlobals] = React.useState<Record<string, Record<string | "null", any[]>>>({});
  const [reordering, setReordering] = React.useState(false);

  const [formBuilderOpen, setFormBuilderOpen] = React.useState(false);
  const [currentFormSectionId, setCurrentFormSectionId] = React.useState<number | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const router = useRouter();

  const showConfirm = (message: string): Promise<boolean> =>
    new Promise((resolve) => {
      setConfirmModal({
        open: true,
        message,
        onConfirm: () => {
          setConfirmModal((prev) => ({ ...prev, open: false }));
          resolve(true);
        },
      });
    });

  const closeConfirm = () => setConfirmModal((prev) => ({ ...prev, open: false }));

  const handleFormSaved = (formId: string) => {
    setCreatedFormId(formId);
    if (currentFormSectionId !== null) {
      setActiveSections((prev) =>
        prev.map((section) =>
          section.id === currentFormSectionId
            ? { ...section, content: { ...section.content, form_id: formId } }
            : section
        )
      );
      debouncedSave(currentFormSectionId, {
        ...activeSections.find((s) => s.id === currentFormSectionId)?.content,
        form_id: formId,
      });
      showToast(`Form created! ID "${formId}" saved in section.`, "success");
    } else {
      showToast(`Form created successfully! ID: ${formId}`, "success");
    }
    setFormBuilderOpen(false);
    setCurrentFormSectionId(null);
  };

  // Fetch Initial Data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const deptId = localStorage.getItem("selectedDepartmentId");

        let endpoint = "/landing-page/global";
        let params: any = { department_id: deptId };

        if (configIdFromUrl) {
          params.config_id = configIdFromUrl;
          if (urlCategory) params.category = urlCategory;
          if (urlTemplate) params.template = urlTemplate;
        } else {
          params.category = selectedCategory;
          params.template = selectedTemplate;
        }

        const [sectionsRes, configRes] = await Promise.all([
          axiosClient.get("/landing-page/sections", { params: { department_id: deptId } }),
          axiosClient.get(endpoint, { params }),
        ]);

        if (sectionsRes.data.success) {
          const sections = sectionsRes.data.data.sections.filter((s: any) => s.is_active);
          setGlobalSections(sections);
          setGroupedGlobals(sectionsRes.data.data.grouped || {});
        }

        if (configRes.data.success) {
          const config = configRes.data.data;
          setSelectedTemplate(config.template || "modern");
          setSelectedCategory(config.category || "business");

          const sections: ActiveSection[] = (config.sections || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((s: any) => ({
              id: s.id,
              sectionKey: s.global_section.key,
              label: s.global_section.name,
              enabled: s.is_published,
              content: s.content || {},
              schema: s.global_section.schema,
            }));

          setActiveSections(sections);
        }
      } catch (error) {
        showToast("Failed to load global landing page", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [configIdFromUrl, urlCategory, urlTemplate]);

  const loadTemplateForCategory = async (category: string, template: string) => {
    const deptId = localStorage.getItem("selectedDepartmentId");
    try {
      await axiosClient.patch("/landing-page/global", { template, category, department_id: deptId });

      const preset = TEMPLATE_PRESETS[category]?.[template] || TEMPLATE_PRESETS.business[template] || [];

      for (const sec of activeSections) {
        await axiosClient.delete(`/landing-page/global/sections/${sec.id}`);
      }

      const newActive: ActiveSection[] = [];

      for (const p of preset) {
        const res = await axiosClient.post("/landing-page/global/sections", {
          global_section_key: p.sectionKey,
          department_id: deptId,
          template,
          category,
        });

        if (res.data.success) {
          const newSec = res.data.data;
          newActive.push({
            id: newSec.id,
            sectionKey: newSec.global_section.key,
            label: newSec.global_section.name,
            enabled: true,
            content: { ...p.initialContent, ...newSec.content },
            schema: newSec.global_section.schema,
          });
        }
      }

      setActiveSections(newActive);
      setSelectedTemplate(template);
      setSelectedCategory(category);
      showToast(`Switched to ${template} template for ${category}`, "success");
    } catch (error) {
      showToast("Failed to switch template", "error");
    }
  };

  const handleCategoryChange = async (newCategory: string) => {
    if (newCategory === selectedCategory || isSwitching) return;
    const confirmed = await showConfirm(`Switch to "${newCategory}" category?\n\nThis will replace current sections.`);
    if (!confirmed) return;

    setIsSwitching(true);
    setSelectedCategory(newCategory);
    setSelectedTemplate("modern");
    await loadTemplateForCategory(newCategory, "modern");
    setIsSwitching(false);
  };

  const handleTemplateChange = async (newTemplate: string) => {
    if (newTemplate === selectedTemplate || isSwitching) return;
    const confirmed = await showConfirm(`Switch to "${newTemplate}" template?\n\nThis will replace all current sections.`);
    if (!confirmed) return;

    setIsSwitching(true);
    await loadTemplateForCategory(selectedCategory!, newTemplate);
    setIsSwitching(false);
  };

  const scrollTemplates = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: direction === "left" ? -240 : 240, behavior: "smooth" });
  };

  const handleAddSection = async (sectionKey: string) => {
    try {
      const res = await axiosClient.post("/landing-page/global/sections", {
        global_section_key: sectionKey,
        department_id: localStorage.getItem("selectedDepartmentId"),
        template: selectedTemplate,
        category: selectedCategory,
      });

      if (res.data.success) {
        const newSec = res.data.data;
        setActiveSections((prev) => [
          ...prev,
          {
            id: newSec.id,
            sectionKey: newSec.global_section.key,
            label: newSec.global_section.name,
            enabled: true,
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
    const newEnabled = !sec.enabled;
    setActiveSections((prev) =>
      prev.map((s) => (s.id === sec.id ? { ...s, enabled: newEnabled } : s))
    );

    try {
      await axiosClient.patch(`/landing-page/global/sections/${sec.id}/publish`, { is_published: newEnabled });
    } catch (error) {
      setActiveSections((prev) =>
        prev.map((s) => (s.id === sec.id ? { ...s, enabled: sec.enabled } : s))
      );
      showToast("Failed to update status", "error");
    }
  };

  const removeSection = async (id: number) => {
    setActiveSections((prev) => prev.filter((s) => s.id !== id));
    try {
      await axiosClient.delete(`/landing-page/global/sections/${id}`);
      showToast("Section removed", "success");
    } catch (error) {
      showToast("Failed to remove section", "error");
    }
  };

  const onDragEnd = async ({ active, over }: any) => {
    if (!over || active.id === over.id) return;

    const oldIndex = activeSections.findIndex((s) => s.id === active.id);
    const newIndex = activeSections.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(activeSections, oldIndex, newIndex);

    setActiveSections(newOrder);
    setReordering(true);

    try {
      await axiosClient.post("/landing-page/global/reorder", {
        sections: newOrder.map((s, idx) => ({ section_id: s.id, sort_order: idx + 1 })),
      });
    } catch (error) {
      setActiveSections(activeSections);
      showToast("Failed to reorder", "error");
    } finally {
      setReordering(false);
    }
  };

  const debouncedSave = useDebouncedCallback(async (sectionId: number, newContent: Record<string, any>) => {
    try {
      await axiosClient.put(`/landing-page/global/sections/${sectionId}`, { content: newContent });
    } catch (error) {
      showToast("Failed to save content", "error");
    }
  }, 600);

  const handleFieldChange = (sectionId: number, key: string, value: any) => {
    setActiveSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, content: { ...s.content, [key]: value } } : s
      )
    );
    debouncedSave(sectionId, { ...activeSections.find((s) => s.id === sectionId)?.content, [key]: value });
  };

  const openFormBuilderForSection = (sectionId: number) => {
    setCurrentFormSectionId(sectionId);
    setFormBuilderOpen(true);
  };

  const previewPayload = {
    templateName: selectedTemplate,
    category: selectedCategory,
    sections: activeSections
      .filter((s) => s.enabled)
      .map((s) => ({
        section: s.sectionKey.split("_dept_")[0],
        content: s.content,
      })),
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ConfirmModal
        open={confirmModal.open}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />

      <div className="max-w-7xl mx-auto p-6 space-y-10">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ArrowLeft className="cursor-pointer" onClick={() => router.back()} />
            Global Landing Page Builder
          </h1>
          <p className="text-slate-600 mt-1">Choose category and template • Customize components</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-10">
            {/* Category & Template Selector */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-3">1. Select Category</h2>
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  disabled={isSwitching}
                  className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-[180px]"
                >
                  <option value="" disabled>Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">
                  2. Choose Template for <span className="capitalize text-violet-600">{selectedCategory}</span>
                </h2>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">Select a design style</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => scrollTemplates("left")} disabled={isSwitching}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => scrollTemplates("right")} disabled={isSwitching}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-4 snap-x scrollbar-hide">
                  {TEMPLATES.map((tpl) => {
                    const isActive = selectedTemplate === tpl.value;
                    return (
                      <div
                        key={tpl.value}
                        onClick={() => handleTemplateChange(tpl.value)}
                        className={`group flex-shrink-0 snap-start cursor-pointer rounded-2xl overflow-hidden border-2 bg-white transition-all duration-200 ${isActive ? "border-violet-600 shadow-lg scale-[1.03]" : "border-gray-200 hover:border-violet-300 hover:shadow-md"} ${isSwitching ? "opacity-50 pointer-events-none" : ""}`}
                        style={{ width: 100 }}
                      >
                        <div className="relative overflow-hidden" style={{ width: 100, height: 173 }}>
                          <img src={tpl.image} alt={tpl.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          {isActive && <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full p-0.5 shadow"><Check className="h-3 w-3" /></div>}
                        </div>
                        <div className="px-1 py-2 text-center">
                          <p className="text-xs font-semibold truncate">{tpl.label}</p>
                          {isActive && <p className="text-[10px] text-violet-600 font-medium">Active</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Components Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Components</h2>
                <p className="text-sm text-muted-foreground">Drag to reorder • Click to edit content</p>
              </div>

              {activeSections.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={activeSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <Accordion type="multiple" className="space-y-4">
                      {activeSections.map((item) => (
                        <SortableSectionItem
                          key={item.id}
                          item={item}
                          onTogglePublish={() => togglePublish(item)}
                          onRemove={() => removeSection(item.id)}
                          onFieldChange={(key, value) => handleFieldChange(item.id, key, value)}
                          onOpenFormBuilder={() => openFormBuilderForSection(item.id)}
                          disabled={reordering || isSwitching}
                        />
                      ))}
                    </Accordion>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="border-2 border-dashed rounded-2xl p-12 text-center text-muted-foreground">
                  Select a category and template above to load default components
                </div>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full py-8 text-base border-dashed border-2 rounded-2xl hover:border-violet-500"
                    disabled={isSwitching}
                  >
                    <Plus className="mr-3 h-5 w-5" />
                    Add New Component
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[480px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search components..." />
                    <CommandList className="max-h-[420px]">
                      <CommandEmpty>No components found.</CommandEmpty>
                      {Object.entries(groupedGlobals).map(([group, subGroups]) => (
                        <CommandGroup key={group} heading={group.charAt(0).toUpperCase() + group.slice(1)}>
                          {Object.entries(subGroups).map(([subGroup, sections]) => (
                            <React.Fragment key={subGroup}>
                              {subGroup !== "null" && (
                                <div className="px-4 py-1 text-xs uppercase text-muted-foreground">{subGroup}</div>
                              )}
                              {Array.isArray(sections) && sections.map((sec: any) => {
                                const isAdded = activeSections.some((a) => a.sectionKey === sec.key);
                                return (
                                  <CommandItem
                                    key={sec.key}
                                    onSelect={() => !isAdded && handleAddSection(sec.key)}
                                    disabled={isAdded || isSwitching}
                                  >
                                    {typeof sec.name === "string" ? sec.name : "Unnamed Component"}
                                    {isAdded && <span className="ml-auto text-xs text-gray-400">(Added)</span>}
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
          </div>

          {/* RIGHT SIDE - Live Preview */}
          <div className="lg:col-span-1 flex justify-center">
            <div className="sticky top-6 self-start">
              <h2 className="text-xl font-semibold mb-4 text-center">Live Preview</h2>
              <div className="mx-auto w-[300px] bg-black rounded-[48px] p-3 shadow-2xl">
                <div className="bg-white rounded-[38px] overflow-hidden relative h-[580px]">
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-5 bg-black rounded-full z-50" />
                  <div className="h-full overflow-y-auto">
                    <Perview data={previewPayload} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Builder Dialog */}
      <FormBuilderDialog
        open={formBuilderOpen}
        onOpenChange={setFormBuilderOpen}
        onFormSaved={handleFormSaved}
      />
    </DashboardLayout>
  );
}

// ====================== SAFE SORTABLE SECTION ITEM ======================
function SortableSectionItem({
  item,
  onTogglePublish,
  onRemove,
  onFieldChange,
  onOpenFormBuilder,
  disabled,
}: {
  item: ActiveSection;
  onTogglePublish: () => void;
  onRemove: () => void;
  onFieldChange: (key: string, value: any) => void;
  onOpenFormBuilder: () => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
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
          <GripVertical className="h-5 w-5 text-gray-400 cursor-grab active:cursor-grabbing" {...attributes} {...listeners} />
          <span className="font-medium text-base">{item.label}</span>
        </AccordionTrigger>

        <div className="flex items-center gap-3 ml-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{item.enabled ? "Published" : "Draft"}</span>
            <Switch checked={item.enabled} onCheckedChange={onTogglePublish} onClick={(e) => e.stopPropagation()} />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>

      <AccordionContent className="px-6 pb-6 space-y-6 pt-6 bg-gray-50/50">
        {Array.isArray(item.schema?.fields) && item.schema.fields.length > 0 ? (
          item.schema.fields.map((field: any, index: number) => {
            const currentValue = item.content?.[field?.key];
            const safeLabel = typeof field?.label === "string" ? field.label : `Field ${index + 1}`;

            return (
              <div key={field?.key || `field-${index}`} className="space-y-2">
                <Label htmlFor={field?.key} className="text-sm font-medium">
                  {safeLabel}
                  {field?.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {field?.type === "text" && (
                  <Input
                    id={field.key}
                    value={typeof currentValue === "string" ? currentValue : ""}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    placeholder={typeof field.placeholder === "string" ? field.placeholder : ""}
                  />
                )}

                {field?.type === "textarea" && (
                  <Textarea
                    id={field.key}
                    value={typeof currentValue === "string" ? currentValue : ""}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    placeholder={typeof field.placeholder === "string" ? field.placeholder : ""}
                    rows={5}
                  />
                )}

                {field?.type === "boolean" && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <Switch
                      id={field.key}
                      checked={!!currentValue}
                      onCheckedChange={(checked) => onFieldChange(field.key, checked)}
                    />
                    <Label htmlFor={field.key} className="cursor-pointer">
                      {currentValue ? "Enabled" : "Disabled"}
                    </Label>

                    {field.key === "createForm" && (
                      <Button size="lg" onClick={onOpenFormBuilder} className="ml-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Form
                      </Button>
                    )}
                  </div>
                )}

                {field?.key === "form_id" && (
                  <Input
                    id={field.key}
                    value={typeof currentValue === "string" ? currentValue : "No form created yet"}
                    readOnly
                    className="bg-gray-100 font-mono text-sm"
                  />
                )}

                {/* Fallback for unknown field types */}
                {!["text", "textarea", "boolean"].includes(field?.type) && field?.key !== "form_id" && (
                  <Input
                    id={field?.key}
                    value={typeof currentValue === "string" || typeof currentValue === "number" ? String(currentValue) : ""}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    placeholder="Enter value..."
                  />
                )}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">No editable fields defined for this section.</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}