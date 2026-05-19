"use client";

import * as React from "react";
import NextImage from "next/image";
import { useDebouncedCallback } from "use-debounce";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { usePermissions } from "@/lib/usePermissions";
import { cn } from "@/lib/utils";

export interface ProductModelOption {
  id: number;
  name: string;
  sku: string;
  image?: string | null;
}

function slugifySkuBase(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
  return base || "MODEL";
}

function uniqueSkuFromName(name: string): string {
  return `${slugifySkuBase(name)}-${Date.now().toString(36).toUpperCase()}`;
}

/** Stable default — inline `[]` in default params is a new reference every render and breaks [linkedModels] effects. */
const EMPTY_LINKED_MODELS: ProductModelOption[] = [];

export interface ProductModelsComboboxProps {
  selectedIds: number[];
  onSelectedIdsChange: (ids: number[]) => void;
  /** Parent product category — applied to quick-created variant SKUs when set */
  categoryId?: string;
  disabled?: boolean;
  /** Linked models when editing (names for chips even if not in search results) */
  linkedModels?: ProductModelOption[];
  /** Omit this product from search (e.g. current product when editing) */
  excludeProductId?: number | null;
  label?: string;
  description?: string;
}

export function ProductModelsCombobox({
  selectedIds,
  onSelectedIdsChange,
  categoryId,
  disabled = false,
  linkedModels = EMPTY_LINKED_MODELS,
  excludeProductId = null,
  label = "Variant models",
  description = "Search products to link as variants, or create a new SKU and attach it.",
}: ProductModelsComboboxProps) {
  const { hasPermission, loading: permLoading } = usePermissions();
  const canCreate = hasPermission("products", "create");

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [listResults, setListResults] = React.useState<ProductModelOption[]>([]);
  const [loadingList, setLoadingList] = React.useState(false);

  const [modelsCache, setModelsCache] = React.useState<
    Record<number, ProductModelOption>
  >({});

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createSku, setCreateSku] = React.useState("");
  const [createPrice, setCreatePrice] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    setModelsCache((prev) => {
      const next = { ...prev };
      for (const m of linkedModels) {
        next[m.id] = { ...m, sku: m.sku || "—" };
      }
      return next;
    });
  }, [linkedModels]);

  const fetchModels = React.useCallback(async (q: string) => {
    setLoadingList(true);
    try {
      const params: Record<string, string> = { limit: "50" };
      if (q.trim()) params.search = q.trim();
      if (excludeProductId != null && excludeProductId > 0) {
        params.exclude_product_id = String(excludeProductId);
      }
      const res = await axiosClient.get("/products/available-models", { params });
      if (res.data?.success && Array.isArray(res.data.data)) {
        const rows: ProductModelOption[] = res.data.data.map((row: any) => ({
          id: row.id,
          name: row.name,
          sku: row.sku ?? "—",
          image: row.image ?? null,
        }));
        setListResults(rows);
        setModelsCache((prev) => {
          const next = { ...prev };
          for (const m of rows) next[m.id] = m;
          return next;
        });
      } else {
        setListResults([]);
      }
    } catch {
      showToast("Failed to load models", "error");
      setListResults([]);
    } finally {
      setLoadingList(false);
    }
  }, [excludeProductId]);

  const debouncedFetch = useDebouncedCallback((q: string) => {
    void fetchModels(q);
  }, 300);

  const toggle = (model: ProductModelOption) => {
    setModelsCache((prev) => ({ ...prev, [model.id]: model }));
    onSelectedIdsChange(
      selectedIds.includes(model.id)
        ? selectedIds.filter((id) => id !== model.id)
        : [...selectedIds, model.id]
    );
  };

  const remove = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectedIdsChange(selectedIds.filter((mid) => mid !== id));
  };

  const selectedChips = selectedIds.map((id) => modelsCache[id]);

  const handleCreateModel = async () => {
    const name = createName.trim();
    if (!name) {
      showToast("Model name is required", "error");
      return;
    }
    if (!canCreate) {
      showToast("You do not have permission to create products", "error");
      return;
    }

    setCreating(true);
    try {
      const selectedDepartmentId = localStorage.getItem("selectedDepartmentId");
      const payload: Record<string, unknown> = {
        name,
        sku: createSku.trim() || uniqueSkuFromName(name),
        is_active: true,
        status: "published",
        meta_title: name,
      };
      if (categoryId) {
        const cid = parseInt(categoryId, 10);
        if (!Number.isNaN(cid)) payload.category_id = cid;
      }
      if (createPrice.trim() !== "") {
        const p = parseFloat(createPrice);
        if (!Number.isNaN(p)) payload.price = p;
      }
      if (selectedDepartmentId) {
        payload.department_id = parseInt(selectedDepartmentId, 10);
      }

      const res = await axiosClient.post("/products", payload);
      const raw = res.data?.data;
      const id = raw?.id ?? res.data?.id;
      if (!id) throw new Error("No product id returned");

      const created: ProductModelOption = {
        id: Number(id),
        name: raw?.name ?? name,
        sku: raw?.sku ?? (payload.sku as string),
        image: raw?.images?.[0]?.url ?? null,
      };

      setModelsCache((prev) => ({ ...prev, [created.id]: created }));
      if (!selectedIds.includes(created.id)) {
        onSelectedIdsChange([...selectedIds, created.id]);
      }
      setListResults((prev) => {
        if (prev.some((p) => p.id === created.id)) return prev;
        return [created, ...prev];
      });

      showToast("Model created and linked", "success");
      setCreateOpen(false);
      setCreateName("");
      setCreateSku("");
      setCreatePrice("");
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join("\n")
        : err.response?.data?.message || "Failed to create model";
      showToast(msg, "error");
    } finally {
      setCreating(false);
    }
  };

  const busy = disabled || permLoading;

  return (
    <div className="space-y-2">
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            void fetchModels(search);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between text-left font-normal h-auto min-h-10 py-1.5 px-3",
              selectedIds.length === 0 && "text-muted-foreground"
            )}
            disabled={busy}
          >
            <div className="flex flex-1 flex-wrap gap-1 items-center overflow-hidden">
              {selectedIds.length === 0 ? (
                <span className="text-muted-foreground">
                  Search or add variant models…
                </span>
              ) : (
                <>
                  {selectedChips.slice(0, 2).map((m) =>
                    m ? (
                      <Badge
                        key={m.id}
                        variant="secondary"
                        className="text-xs px-2 py-0.5"
                      >
                        {m.name}
                      </Badge>
                    ) : null
                  )}
                  {selectedIds.length > 2 && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      +{selectedIds.length - 2}
                    </Badge>
                  )}
                </>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full sm:w-[460px] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex gap-2 items-center border-b px-2 py-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <CommandInput
                  placeholder="Search by name or SKU…"
                  value={search}
                  onValueChange={(v) => {
                    setSearch(v);
                    debouncedFetch(v);
                  }}
                  className="pl-8 h-10"
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="shrink-0 h-10 w-10"
                title="Create new model"
                disabled={!canCreate || busy}
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2.5 border-b bg-muted/30">
                {selectedIds.map((id) => {
                  const m = modelsCache[id];
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="gap-1 pl-2.5 pr-1.5 py-1 text-sm"
                    >
                      {m?.name ?? `Product #${id}`}
                      <button
                        type="button"
                        onClick={(e) => remove(id, e)}
                        className="rounded hover:bg-muted-foreground/20 p-0.5 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-accent border-b border-dashed"
              disabled={!canCreate || busy}
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Create new model &amp; link</span>
            </button>

            <CommandList className="max-h-[280px]">
              {loadingList ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading…
                </div>
              ) : listResults.length === 0 ? (
                <CommandEmpty className="py-6 text-sm text-muted-foreground">
                  No matching products. Use + to create a new model SKU.
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {listResults.map((model) => {
                    const isSelected = selectedIds.includes(model.id);
                    return (
                      <CommandItem
                        key={model.id}
                        value={String(model.id)}
                        onSelect={() => toggle(model)}
                        className="px-3 py-2.5 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {model.image ? (
                            <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden border">
                              <NextImage
                                src={model.image}
                                alt={model.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground border">
                              —
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">
                              {model.name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              SKU: {model.sku}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary ml-2 shrink-0" />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>New model (SKU)</DialogTitle>
            <DialogDescription>
              Creates a separate product and links it as a variant of this one.
              You can fill in details later from the product list.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-model-name">Name *</Label>
              <Input
                id="new-model-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Headphones — Midnight Blue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-model-sku">SKU (optional)</Label>
              <Input
                id="new-model-sku"
                value={createSku}
                onChange={(e) => setCreateSku(e.target.value)}
                placeholder="Auto-generated if empty"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-model-price">Price (optional)</Label>
              <Input
                id="new-model-price"
                type="number"
                min="0"
                step="0.01"
                value={createPrice}
                onChange={(e) => setCreatePrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreateModel()}
              disabled={creating || !createName.trim()}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating…
                </>
              ) : (
                "Create & link"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
