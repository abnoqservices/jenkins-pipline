"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Upload,
  X,
  Save,
  CheckCircle,
  ArrowLeft,
  FileText,
  Sparkles,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { DashboardLayout } from "@/components/dashboard/layout";
import { useRouter, useSearchParams } from "next/navigation";
import { usePermissions } from "@/lib/usePermissions";
import { CategoryManager } from "@/components/category/CategoryManager";
import { ProductModelsCombobox } from "@/components/products/ProductModelsCombobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  applyTemplateInfoValues,
  deriveTemplateInfoFields,
  setProductHighlightsCount,
  type TemplateInfoField,
} from "@/lib/puck/product-template-info";

// ── Interfaces ──────────────────────────────────────────────────
interface Category {
  id: number;
  name: string;
  children: Category[];
  parent_id?: number;
}

interface ImageFile {
  id: string;
  url: string;
  file?: File;
  uploaded?: boolean;
}

interface PdfFile {
  id: string;
  name: string;
  file?: File;
  uploaded?: boolean;
}

interface FormDataType {
  name: string;
  sku: string;
  category: string;
  price: string;
  description: string;
  videoUrl: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  urlSlug: string;
  isActive: boolean;
}

interface CategoryCustomField {
  id: number;
  name: string;
  slug: string;
  data_type: "text" | "number" | "boolean" | "date" | "select" | "multiselect" | "file" | "image";
  is_required: boolean;
  options?: string[] | null;
}

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function NewProductPage() {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productIdFromUrl = searchParams.get("id")
    ? Number(searchParams.get("id"))
    : null;

  const [formData, setFormData] = React.useState<FormDataType>({
    name: "",
    sku: "",
    category: "",
    price: "",
    description: "",
    videoUrl: "",
    metaTitle: "",
    metaDescription: "",
    keywords: [],
    urlSlug: "",
    isActive: true,
  });

  const [flatCategories, setFlatCategories] = React.useState<Category[]>([]);
  const [treeCategories, setTreeCategories] = React.useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = React.useState(false);

  const [selectedImages, setSelectedImages] = React.useState<ImageFile[]>([]);
  const [pdfFiles, setPdfFiles] = React.useState<PdfFile[]>([]);
  const [tags, setTags] = React.useState<string[]>([]);
  const [newTag, setNewTag] = React.useState("");
  const [newKeyword, setNewKeyword] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("details");
  const [slugAvailable, setSlugAvailable] = React.useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = React.useState(false);
  const [aiGeneratingSeo, setAiGeneratingSeo] = React.useState(false);

  const [productId, setProductId] = React.useState<number | null>(productIdFromUrl);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = React.useState(!!productIdFromUrl);

  const [selectedModelIds, setSelectedModelIds] = React.useState<number[]>([]);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = React.useState(false);
  const [slugMessage, setSlugMessage] = React.useState("");
  const [slugSuggestion, setSlugSuggestion] = React.useState("");
  const [slugPopupOpen, setSlugPopupOpen] = React.useState(false);
  const [customFields, setCustomFields] = React.useState<CategoryCustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = React.useState<Record<number, unknown>>({});
  const [loadingCustomFields, setLoadingCustomFields] = React.useState(false);
  const [templateInfoFields, setTemplateInfoFields] = React.useState<TemplateInfoField[]>([]);
  const [templateInfoValues, setTemplateInfoValues] = React.useState<Record<string, string>>({});
  const [loadingTemplateInfo, setLoadingTemplateInfo] = React.useState(false);
  const [activeTemplateDoc, setActiveTemplateDoc] = React.useState<Record<string, unknown> | null>(null);
  // Check permission
  React.useEffect(() => {
    if (permissionsLoading) return;
    const needed = productId ? "update" : "create";
    if (!hasPermission("products", needed)) {
      showToast(`You don't have permission to ${needed} products`, "error");
      router.push("/products");
    }
  }, [permissionsLoading, hasPermission, router, productId]);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const buildTree = (flat: Category[]): Category[] => {
    const map = new Map<number, Category>();
    const roots: Category[] = [];

    flat.forEach((cat) => map.set(cat.id, { ...cat, children: [] }));

    flat.forEach((cat) => {
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id)!.children.push(map.get(cat.id)!);
      } else {
        roots.push(map.get(cat.id)!);
      }
    });

    return roots;
  };

  const loadCategories = React.useCallback(async (): Promise<Category[]> => {
    try {
      setLoadingCategories(true);

      const res = await axiosClient.get("/product-categories");

      if (res.data.success && Array.isArray(res.data.data)) {
        const flat = res.data.data as Category[];
        setFlatCategories(flat);
        setTreeCategories(buildTree(flat));
        return flat;
      }

      return [];
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to load categories", "error");
      return [];
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  React.useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      setIsLoadingProduct(true);
      try {
        const [prodRes, imgRes, docRes] = await Promise.all([
          axiosClient.get(`/products/${productId}`),
          axiosClient.get(`/product-images?product_id=${productId}`),
          axiosClient.get(`/product-documents?product_id=${productId}`),
        ]);

        const product = prodRes.data?.data || {};
        const currentName = product.name || "";
        const currentSlug = product.url_slug || "";

        setFormData({
          name: currentName,
          sku: product.sku || "",
          category: product.category_id ? String(product.category_id) : "",
          price: product.price !== null && product.price !== undefined ? String(product.price) : "",
          description: product.description || "",
          videoUrl: product.video_url || "",
          metaTitle: product.meta_title || currentName || "",
          metaDescription: product.meta_description || "",
          keywords:
            typeof product.keywords === "string"
              ? product.keywords
                  .split(",")
                  .map((k: string) => k.trim())
                  .filter(Boolean)
              : [],
          urlSlug: currentSlug || "",
          isActive: Boolean(product.is_active ?? true),
        });

        setTags(Array.isArray(product.tags) ? product.tags : []);
        setSelectedModelIds(
          Array.isArray(product.models) ? product.models.map((m: { id: number }) => m.id) : []
        );

        const existingValues: Record<number, unknown> = {};
        if (Array.isArray(product.custom_field_values)) {
          for (const row of product.custom_field_values) {
            const fieldId = Number(row.category_custom_field_id);
            if (!fieldId) continue;
            if (row.value_text !== null && row.value_text !== undefined) existingValues[fieldId] = row.value_text;
            else if (row.value_number !== null && row.value_number !== undefined) existingValues[fieldId] = row.value_number;
            else if (row.value_boolean !== null && row.value_boolean !== undefined) existingValues[fieldId] = row.value_boolean;
            else if (row.value_date !== null && row.value_date !== undefined) existingValues[fieldId] = row.value_date;
            else if (row.value_json !== null && row.value_json !== undefined) existingValues[fieldId] = row.value_json;
            else if (row.value_file_url !== null && row.value_file_url !== undefined) existingValues[fieldId] = row.value_file_url;
          }
        }
        setCustomFieldValues(existingValues);

        setSelectedImages(
          (imgRes.data?.data || []).map((img: { id: number; url: string }) => ({
            id: `img-${img.id}`,
            url: img.url,
            uploaded: true,
          }))
        );
        setPdfFiles(
          (docRes.data?.data || []).map((doc: { id: number; name: string }) => ({
            id: `doc-${doc.id}`,
            name: doc.name,
            uploaded: true,
          }))
        );
        setIsSlugManuallyEdited(Boolean(currentSlug));
      } catch (err: any) {
        showToast(err.response?.data?.message || "Failed to load product", "error");
        router.push("/products");
      } finally {
        setIsLoadingProduct(false);
      }
    };

    void loadProduct();
  }, [productId, router]);

  React.useEffect(() => {
    const categoryId = Number(formData.category);
    if (!categoryId) {
      setCustomFields([]);
      setCustomFieldValues({});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoadingCustomFields(true);
        const res = await axiosClient.get("/category-custom-fields", {
          params: { category_id: categoryId },
        });
        if (!cancelled && res.data?.success) {
          setCustomFields(Array.isArray(res.data.data) ? res.data.data : []);
        }
      } catch {
        if (!cancelled) {
          setCustomFields([]);
          showToast("Failed to load info fields", "error");
        }
      } finally {
        if (!cancelled) setLoadingCustomFields(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formData.category]);

  React.useEffect(() => {
    if (!productId) {
      setTemplateInfoFields([]);
      setTemplateInfoValues({});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoadingTemplateInfo(true);
        const res = await axiosClient.get(`/products/${productId}/landing-page`);
        if (!res.data?.success || cancelled) return;
        const data = res.data.data || {};
        const hasProductDoc =
          Array.isArray(data?.puck_document?.content) && data.puck_document.content.length > 0;
        const activeDoc = hasProductDoc ? data.puck_document : data.resolved_puck_template_document;
        if (cancelled) return;
        setActiveTemplateDoc(activeDoc && typeof activeDoc === "object" ? activeDoc : null);
      } catch {
        if (!cancelled) setTemplateInfoFields([]);
      } finally {
        if (!cancelled) setLoadingTemplateInfo(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  React.useEffect(() => {
    if (!activeTemplateDoc) {
      setTemplateInfoFields([]);
      setTemplateInfoValues({});
      return;
    }
    const fields = deriveTemplateInfoFields(activeTemplateDoc).filter(
      (f) => f.componentType.startsWith("Product") || f.componentType === "FormEmbedBlock"
    );
    setTemplateInfoFields(fields);
    setTemplateInfoValues((prev) => {
      const next: Record<string, string> = {};
      fields.forEach((f) => {
        next[f.id] = prev[f.id] ?? f.initialValue ?? "";
      });
      return next;
    });
  }, [activeTemplateDoc]);

  const generateSafeSku = (name: string) =>
    name
      ? name.toUpperCase().replace(/\s+/g, "").slice(0, 10) + "001"
      : "PROD" + Date.now().toString().slice(-6);

  const renderCategoryTree = (items: Category[], level = 0): React.ReactNode => {
    return items.map((cat) => (
      <React.Fragment key={cat.id}>
        <SelectItem value={cat.id.toString()}>
          <span style={{ paddingLeft: `${level * 20}px` }}>
            {level > 0 && "└─ "}
            {cat.name}
          </span>
        </SelectItem>
        {cat.children?.length > 0 && renderCategoryTree(cat.children, level + 1)}
      </React.Fragment>
    ));
  };

  const handleInputChange = <K extends keyof FormDataType>(field: K, value: FormDataType[K]) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && typeof value === "string" && !isSlugManuallyEdited) {
        updated.urlSlug = slugify(value);
      }
      return updated;
    });
  };

  React.useEffect(() => {
    if (!formData.name.trim()) return;
    const name = formData.name.trim();
    setFormData((prev) => {
      const updates: Partial<FormDataType> = {};
      if (!isSlugManuallyEdited && !prev.urlSlug?.trim()) updates.urlSlug = slugify(name);
      if (!prev.metaTitle) updates.metaTitle = name;
      if (!prev.metaDescription) {
        if (prev.description?.trim()) {
          const desc = prev.description.trim();
          updates.metaDescription = desc.length > 160 ? desc.slice(0, 157) + "..." : desc;
        } else {
          updates.metaDescription = `Buy ${name} online - Best price and quality.`;
        }
      }
      return { ...prev, ...updates };
    });
  }, [formData.name, formData.description, isSlugManuallyEdited]);

  React.useEffect(() => {
    const slug = (formData.urlSlug || "").trim();
    if (!slug) {
      setSlugAvailable(null);
      return;
    }
    let cancelled = false;
    setCheckingSlug(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await axiosClient.get("/products/check-slug", {
          params: { slug, exclude_id: productId || 0 },
        });
        if (cancelled) return;
        setSlugAvailable(Boolean(res.data?.data?.available));
      } catch {
        if (!cancelled) setSlugAvailable(null);
      } finally {
        if (!cancelled) setCheckingSlug(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [formData.urlSlug, productId]);

  const templateFieldGroups = React.useMemo(() => {
    const map = new Map<string, TemplateInfoField[]>();
    for (const f of templateInfoFields) {
      const arr = map.get(f.componentType) ?? [];
      arr.push(f);
      map.set(f.componentType, arr);
    }
    return Array.from(map.entries());
  }, [templateInfoFields]);

  const highlightsCount = React.useMemo(() => {
    if (!activeTemplateDoc || typeof activeTemplateDoc !== "object") return 1;
    const content = (activeTemplateDoc as { content?: unknown[] }).content;
    if (!Array.isArray(content)) return 1;
    const block = content.find(
      (b) => b && typeof b === "object" && String((b as { type?: string }).type) === "ProductHighlightsBlock"
    ) as { props?: { content?: { items?: unknown[] } } } | undefined;
    const items = block?.props?.content?.items;
    return Array.isArray(items) && items.length > 0 ? items.length : 1;
  }, [activeTemplateDoc]);

  const setTemplateInfoValue = React.useCallback((id: string, value: string) => {
    setTemplateInfoValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const buildCustomFieldPayload = React.useCallback(() => {
    type Row = {
      category_custom_field_id: number;
      value_text?: string | null;
      value_number?: number | null;
      value_boolean?: boolean | null;
      value_date?: string | null;
      value_json?: unknown;
      value_file_url?: string | null;
    };
    const rows: Row[] = [];
    for (const field of customFields) {
      const raw = customFieldValues[field.id];
      if (raw === undefined || raw === null) continue;
      if (typeof raw === "string" && raw.trim() === "") continue;

      const base: Row = { category_custom_field_id: field.id };
      switch (field.data_type) {
        case "number": {
          const n = typeof raw === "number" ? raw : Number(String(raw).replace(/,/g, ""));
          if (!Number.isFinite(n)) continue;
          rows.push({ ...base, value_number: n });
          break;
        }
        case "boolean":
          rows.push({ ...base, value_boolean: Boolean(raw) });
          break;
        case "date":
          rows.push({ ...base, value_date: String(raw) });
          break;
        case "multiselect":
          rows.push({ ...base, value_json: Array.isArray(raw) ? raw : [raw] });
          break;
        default:
          rows.push({ ...base, value_text: typeof raw === "string" ? raw : JSON.stringify(raw) });
      }
    }
    return rows;
  }, [customFields, customFieldValues]);

  const handleGenerateSeoWithAi = async () => {
    if (!formData.name.trim()) {
      showToast("Add a product name first", "error");
      return;
    }
    setAiGeneratingSeo(true);
    try {
      const res = await axiosClient.post("/products/seo-generate", {
        product_name: formData.name.trim(),
        product_description: formData.description.trim() || undefined,
      });
      if (!res.data?.success) {
        showToast(res.data?.message || "AI generation failed", "error");
        return;
      }
      const d = res.data.data || {};
      setFormData((prev) => ({
        ...prev,
        metaTitle: d.metaTitle || prev.metaTitle,
        metaDescription: d.metaDescription || prev.metaDescription,
        keywords: Array.isArray(d.keywords) && d.keywords.length > 0 ? d.keywords : prev.keywords,
      }));
      showToast("SEO fields updated", "success");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(e.response?.data?.message || "AI generation failed", "error");
    } finally {
      setAiGeneratingSeo(false);
    }
  };

  const statusEmoji = (ok: boolean) => (ok ? "🟢" : "🟠");

  const acceptSuggestedSlug = () => {
    if (!slugSuggestion) return;
    setFormData((prev) => ({ ...prev, urlSlug: slugSuggestion }));
    setIsSlugManuallyEdited(true);
    setSlugPopupOpen(false);
    setSlugAvailable(true);
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const removeKeyword = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }));
  };

  // ── File handlers (unchanged) ───────────────────────────────────
  const validateImage = async (file: File): Promise<boolean> => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast("Only JPG, JPEG, PNG allowed", "error");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast(`Image "${file.name}" must be ≤ 1MB`, "error");
      return false;
    }
    const isSquare = await new Promise<boolean>((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img.width === img.height);
      };
      img.onerror = () => resolve(false);
      img.src = url;
    });
    if (!isSquare) {
      showToast("Image must be square (1:1)", "error");
      return false;
    }
    return true;
  };

  const validateDocument = (file: File): boolean => {
    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      showToast("Only PDF, DOC, DOCX allowed", "error");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast(`File "${file.name}" exceeds 1MB`, "error");
      return false;
    }
    return true;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const valid = Array.from(e.target.files).filter(validateImage);
    const newImgs = valid.map((f, i) => ({
      id: `img-${Date.now()}-${i}`,
      url: URL.createObjectURL(f),
      file: f,
    }));
    setSelectedImages((p) => [...p, ...newImgs]);
    e.currentTarget.value = "";
  };

  const removeImage = (id: string) => {
    setSelectedImages((p) => {
      const removed = p.find((i) => i.id === id);
      if (removed?.file) URL.revokeObjectURL(removed.url);
      return p.filter((i) => i.id !== id);
    });
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const valid = Array.from(e.target.files).filter(validateDocument);
    const newDocs = valid.map((f, i) => ({
      id: `doc-${Date.now()}-${i}`,
      name: f.name,
      file: f,
    }));
    setPdfFiles((p) => [...p, ...newDocs]);
    e.currentTarget.value = "";
  };

  const removePdf = (id: string) => setPdfFiles((p) => p.filter((d) => d.id !== id));

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category: "",
      price: "",
      description: "",
      videoUrl: "",
      metaTitle: "",
      metaDescription: "",
      keywords: [],
      urlSlug: "",
      isActive: true,
    });
    setSelectedImages([]);
    setPdfFiles([]);
    setTags([]);
    setSelectedModelIds([]);
    setProductId(null);
    setNewTag("");
    setNewKeyword("");
  };

  // ── Save ────────────────────────────────────────────────────────
  const saveProduct = async (shouldPublish = false) => {
    if (!formData.name.trim()) return showToast("Product name required", "error");
    if (!formData.category) return showToast("Category required", "error");

    const action = productId ? "update" : "create";
    if (!hasPermission("products", action)) {
      showToast(`No permission to ${action} products`, "error");
      return null;
    }

    setIsSaving(true);

    try {
      const selectedDepartmentId = localStorage.getItem("selectedDepartmentId");
   
      const payload: any = {
      department_id: selectedDepartmentId ? parseInt(selectedDepartmentId) : null,
        name: formData.name.trim(),
        sku: formData.sku || generateSafeSku(formData.name),
        category_id: parseInt(formData.category),
        price: parseFloat(formData.price) || 0,
        description: formData.description || null,
        is_active: formData.isActive,
        tags,
        video_url: formData.videoUrl || null,
        meta_title: formData.metaTitle || formData.name,
        meta_description: formData.metaDescription || formData.description?.slice(0, 160) || null,
        keywords: formData.keywords.join(", ") || null,
        url_slug: formData.urlSlug || slugify(formData.name),
        model_ids: selectedModelIds.length > 0 ? selectedModelIds : null,
        custom_field_values: buildCustomFieldPayload(),
      };

      if (selectedDepartmentId) {
        payload.department_id = parseInt(selectedDepartmentId);
      }

      let response;
      let currentProductId = productId;

      if (!currentProductId) {
        response = await axiosClient.post("/products", {
          ...payload,
          status: shouldPublish ? "published" : "draft",
        });
        currentProductId = response.data?.data?.id || response.data?.id;
        setProductId(currentProductId);
      } else {
        payload.status = shouldPublish ? "published" : "draft";
        response = await axiosClient.put(`/products/${currentProductId}`, payload);
      }

      // Media
      if (selectedImages.length > 0 || pdfFiles.length > 0) {
        const mediaForm = new FormData();
        selectedImages.forEach((img) => img.file && mediaForm.append("images[]", img.file));
        pdfFiles.forEach((pdf) => pdf.file && mediaForm.append("pdfs[]", pdf.file));

        if (mediaForm.entries().next().done === false) {
          mediaForm.append("_method", "PUT");
          await axiosClient.post(`/products/${currentProductId}`, mediaForm);
        }
      }

      showToast(
        shouldPublish ? "Product published!" : "Product saved",
        "success"
      );
      return currentProductId;
    } catch (err: any) {
      const errors = err.response?.data?.errors;
    
      const msg =errors? Object.values(errors).flat().join("\n") : err.response?.data?.message || "Save failed";
    
      showToast(msg, "error");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = () => saveProduct(true);
  const handleSaveDraft = () => saveProduct(false);

  const handleSaveAndBack = async () => {
    const saved = await saveProduct(false);
    if (saved) {
      router.push("/products");
      resetForm();
    }
  };

  const handleCategoriesChanged = async () => {
    const updatedCategories = await loadCategories();
    const stillExists = updatedCategories.some((cat) => String(cat.id) === formData.category);
    if (formData.category && !stillExists) {
      setFormData((prev) => ({ ...prev, category: "" }));
    }
  };

  const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  const countCharacters = (text: string) => text.length;

  return (
    <DashboardLayout>
      {isLoadingProduct ? (
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="mr-2" />
          <span>Loading product...</span>
        </div>
      ) : (
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-slate-50 px-3 py-1 text-xs text-slate-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    Product setup
                  </div>
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {productId ? "Edit Product" : "Create Product"}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Structured setup with faster completion and lower scroll fatigue.
                  </p>
                  {productId ? <p className="mt-1 text-xs text-blue-600">Product ID: {productId}</p> : null}
                </div>
                <Button variant="outline" onClick={() => router.push("/products")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to products
                </Button>
              </div>
              <div className="mt-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <Input
                    value={formData.urlSlug}
                    onChange={(e) => {
                      setIsSlugManuallyEdited(true);
                      handleInputChange("urlSlug", slugify(e.target.value));
                    }}
                    placeholder="your-product-url"
                  />
                  <p className="text-xs text-muted-foreground">
                    <span
                      className={
                        checkingSlug
                          ? "text-muted-foreground"
                          : slugAvailable === true
                          ? "text-green-600"
                          : slugAvailable === false
                          ? "text-red-600"
                          : "text-muted-foreground"
                      }
                    >
                      {checkingSlug
                        ? "Checking availability..."
                        : slugAvailable === true
                        ? "Slug is available"
                        : slugAvailable === false
                        ? "Slug is already in use"
                        : "Slug will be generated from product title"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid h-auto w-full grid-cols-4 rounded-xl border bg-white p-1">
                <TabsTrigger value="details" className="rounded-lg py-2.5">
                  Details
                </TabsTrigger>
                <TabsTrigger value="media" className="rounded-lg py-2.5">
                  Media
                </TabsTrigger>
                <TabsTrigger value="seo" className="rounded-lg py-2.5">
                  SEO
                </TabsTrigger>
                <TabsTrigger value="info" className="rounded-lg py-2.5">
                  Info
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="m-0 space-y-4">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Product Name *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="e.g. Wireless Noise Cancelling Headphones"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SKU (optional)</Label>
                        <Input
                          value={formData.sku}
                          onChange={(e) => handleInputChange("sku", e.target.value)}
                          placeholder="e.g. HEADPHONE-X001"
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <div className="flex gap-2">
                          <Select
                            value={formData.category}
                            onValueChange={(v) => handleInputChange("category", v)}
                            disabled={loadingCategories}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={loadingCategories ? "Loading..." : "Select category"} />
                            </SelectTrigger>
                            <SelectContent>{renderCategoryTree(treeCategories)}</SelectContent>
                          </Select>
                          <CategoryManager
                            apiEndpoint="/product-categories"
                            onCategoriesChange={handleCategoriesChanged}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Price</Label>
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) => handleInputChange("price", e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        rows={5}
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Describe your product in detail..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Variants (optional)</Label>
                      <ProductModelsCombobox
                        selectedIds={selectedModelIds}
                        onSelectedIdsChange={setSelectedModelIds}
                        categoryId={formData.category}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Tags <span className="text-xs text-muted-foreground">(space to add)</span>
                      </Label>
                      <div className="flex min-h-[42px] flex-wrap gap-2 rounded-md border p-2 focus-within:ring-2 focus-within:ring-ring">
                        {tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="gap-1 px-3 py-1">
                            {tag}
                            <button type="button" onClick={() => removeTag(i)} className="inline-flex">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </Badge>
                        ))}
                        <input
                          type="text"
                          placeholder="e.g. wireless premium ..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              const t = newTag.trim();
                              if (t && !tags.includes(t)) setTags((p) => [...p, t]);
                              setNewTag("");
                            }
                            if (e.key === "Backspace" && newTag === "" && tags.length > 0) {
                              setTags((p) => p.slice(0, -1));
                            }
                          }}
                          className="min-w-[180px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Active</p>
                        <p className="text-sm text-muted-foreground">Visible after publishing</p>
                      </div>
                      <Switch checked={formData.isActive} onCheckedChange={(c) => handleInputChange("isActive", c)} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="m-0 space-y-4">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Media Assets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label>Video URL (optional)</Label>
                      <Input
                        value={formData.videoUrl}
                        onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Product Images</Label>
                      <p className="text-xs text-muted-foreground">
                        Max 1MB • JPG, JPEG, PNG • 1:1 square recommended
                      </p>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {selectedImages.map((img) => (
                          <div key={img.id} className="group relative aspect-square">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt="" className="h-full w-full rounded-lg border object-cover" />
                            <button
                              onClick={() => removeImage(img.id)}
                              className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:bg-slate-50">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Documents</Label>
                      <p className="text-xs text-muted-foreground">Max 1MB • PDF, DOC, DOCX</p>
                      {pdfFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-red-600" />
                            <span className="max-w-[240px] truncate text-sm">{file.name}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removePdf(file.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 hover:bg-slate-50">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          multiple
                          onChange={handlePdfUpload}
                          className="hidden"
                        />
                        <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
                        <span className="text-sm font-medium">Click to upload PDF / Word</span>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seo" className="m-0 space-y-4">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle>SEO Settings</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleGenerateSeoWithAi()}
                        disabled={aiGeneratingSeo}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {aiGeneratingSeo ? "Generating..." : "Generate with AI"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Meta Title</Label>
                        <div className="text-xs text-muted-foreground">
                          {countCharacters(formData.metaTitle)} / ~60 • {countWords(formData.metaTitle)} words
                        </div>
                      </div>
                      <Input
                        value={formData.metaTitle}
                        onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Meta Description</Label>
                        <div className="text-xs text-muted-foreground">
                          {countCharacters(formData.metaDescription)} / ~160 •{" "}
                          {countWords(formData.metaDescription)} words
                        </div>
                      </div>
                      <Textarea
                        rows={3}
                        value={formData.metaDescription}
                        onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Keywords <span className="text-xs text-muted-foreground">(space to add)</span>
                      </Label>
                      <div className="flex min-h-[42px] flex-wrap gap-2 rounded-md border bg-white p-2.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring">
                        {formData.keywords.map((kw, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1 text-sm"
                          >
                            {kw}
                            <button type="button" onClick={() => removeKeyword(index)} className="inline-flex">
                              <X className="h-3.5 w-3.5 transition-colors hover:text-destructive" />
                            </button>
                          </Badge>
                        ))}

                        <input
                          type="text"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              const trimmed = newKeyword.trim();
                              if (trimmed && !formData.keywords.includes(trimmed)) {
                                setFormData((prev) => ({
                                  ...prev,
                                  keywords: [...prev.keywords, trimmed],
                                }));
                              }
                              setNewKeyword("");
                            }

                            if (e.key === "Backspace" && newKeyword === "" && formData.keywords.length > 0) {
                              setFormData((prev) => ({
                                ...prev,
                                keywords: prev.keywords.slice(0, -1),
                              }));
                            }
                          }}
                          className="min-w-[180px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="info" className="m-0 space-y-4">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Product Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {!formData.category ? (
                      <p className="text-sm text-muted-foreground">
                        Select a category first to load product info fields.
                      </p>
                    ) : loadingTemplateInfo ? (
                      <p className="text-sm text-muted-foreground">Loading active template fields...</p>
                    ) : productId && templateInfoFields.length > 0 ? (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Fields generated from active product components in this product template.
                        </p>
                        <Accordion type="multiple" className="w-full rounded-lg border px-4">
                          {templateFieldGroups.map(([componentType, fields]) => (
                            <AccordionItem key={componentType} value={componentType}>
                              <AccordionTrigger className="py-3 text-sm">
                                {componentType.replace("Block", "")}
                              </AccordionTrigger>
                              <AccordionContent>
                                {componentType === "ProductHighlightsBlock" ? (
                                  <div className="mb-3 flex items-center gap-2 rounded-md border bg-muted/20 p-2">
                                    <span className="text-xs text-muted-foreground">No. of highlights</span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setActiveTemplateDoc((prev) =>
                                          prev ? setProductHighlightsCount(prev, Math.max(1, highlightsCount - 1)) : prev
                                        )
                                      }
                                    >
                                      -
                                    </Button>
                                    <span className="w-6 text-center text-sm font-medium">{Math.max(1, highlightsCount)}</span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setActiveTemplateDoc((prev) =>
                                          prev ? setProductHighlightsCount(prev, Math.max(1, highlightsCount + 1)) : prev
                                        )
                                      }
                                    >
                                      +
                                    </Button>
                                  </div>
                                ) : null}
                                <div className="space-y-4">
                                  {fields.map((field) => (
                                    <div key={field.id} className="space-y-2 rounded-md border p-3">
                                      <Label>{field.label}</Label>
                                      {field.type === "textarea" ? (
                                        <Textarea
                                          rows={4}
                                          value={templateInfoValues[field.id] ?? ""}
                                          onChange={(e) => setTemplateInfoValue(field.id, e.target.value)}
                                        />
                                      ) : (
                                        <Input
                                          type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
                                          value={templateInfoValues[field.id] ?? ""}
                                          onChange={(e) => setTemplateInfoValue(field.id, e.target.value)}
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </>
                    ) : productId ? (
                      <p className="text-sm text-muted-foreground">
                        No template-driven fields found for this product.
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Save the product first to edit fields from the assigned landing template.
                      </p>
                    )}

                    {formData.category && customFields.length > 0 ? (
                      <div className="space-y-4 border-t pt-4">
                        <p className="text-sm font-medium">Category info fields</p>
                        {loadingCustomFields ? (
                          <p className="text-sm text-muted-foreground">Loading fields...</p>
                        ) : (
                          customFields.map((cf) => (
                            <div key={cf.id} className="space-y-2">
                              <Label>
                                {cf.name}
                                {cf.is_required ? " *" : ""}
                              </Label>
                              {cf.data_type === "boolean" ? (
                                <Switch
                                  checked={Boolean(customFieldValues[cf.id])}
                                  onCheckedChange={(c) =>
                                    setCustomFieldValues((prev) => ({ ...prev, [cf.id]: c }))
                                  }
                                />
                              ) : (
                                <Input
                                  value={String(customFieldValues[cf.id] ?? "")}
                                  onChange={(e) =>
                                    setCustomFieldValues((prev) => ({
                                      ...prev,
                                      [cf.id]: e.target.value,
                                    }))
                                  }
                                />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Publish panel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1 text-sm text-slate-600">
                  <p>{statusEmoji(!!formData.name.trim())} Name</p>
                  <p>{statusEmoji(!!formData.category)} Category</p>
                  <p>{statusEmoji(!!formData.description.trim())} Description</p>
                  <p>{statusEmoji(selectedImages.length > 0)} Images</p>
                  <p>{statusEmoji(!!formData.metaTitle.trim())} Meta title</p>
                  <p>{statusEmoji(!!formData.metaDescription.trim())} Meta description</p>
                </div>

                <div className="space-y-2 pt-2">
                  <Button variant="outline" className="w-full" onClick={handleSaveAndBack} disabled={isSaving}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Save & Back
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleSaveDraft} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={isSaving}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isSaving ? (
                      <Spinner className="mr-2" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    {productId ? "Update & Publish" : "Publish"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        {slugPopupOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
              <h3 className="text-lg font-semibold">Slug Not Available</h3>
              <p className="text-sm text-slate-600 mt-2">{slugMessage}</p>

              {slugSuggestion && (
                <div className="mt-4 rounded-lg border bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Suggested slug</p>
                  <p className="text-sm font-medium text-slate-900">
                    {slugSuggestion}
                  </p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSlugPopupOpen(false)}
                >
                  Close
                </Button>
                {slugSuggestion && (
                  <Button type="button" onClick={acceptSuggestedSlug}>
                    Use Suggested Slug
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </DashboardLayout>
  );
}
