"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Edit,
  Copy,
  QrCode,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Eye,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { useToast } from "@/components/ui/use-toast";
import { usePermissions } from "@/lib/usePermissions";

import { PermissionRestrictedButton, PermissionRestrictedMenuItem } from "@/components/PermissionRestrictedButton";

type Category = {
  id: number;
  name: string;
  children?: Category[];
};

type Product = {
  id: number;
  image: string;
  name: string;
  sku: string;
  category: string;
  categoryId: number;
  price: string;
  scans: number;
  views: number;
  leads: number;
  status: boolean;
  description?: string;
  qr_code_url?: string;
  url_slug?: string;
  org_slug?: string;
  realScans?: number;
  realViews?: number;
  realLeads?: number;
  analyticsLoading?: boolean;
};

type SortConfig = {
  key: keyof Product | 'realScans' | 'realViews' | 'realLeads';
  direction: 'asc' | 'desc';
} | null;

export default function ProductsPage() {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedProducts, setSelectedProducts] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [totalItems, setTotalItems] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  // Edit Drawer
  const [editDrawerOpen, setEditDrawerOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // QR Dialog
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = React.useState(false);
  const [selectedProductForQR, setSelectedProductForQR] = React.useState<Product | null>(null);
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);
  const [analyticsCache, setAnalyticsCache] = React.useState<Record<number, {
    unique_visitors: number;
    page_views: number;
    form_submissions: number;
  }>>({});

  const router = useRouter();
  const { toast } = useToast();

  const openProductPublicLanding = (p: Product) => {
    const org = p.org_slug?.trim();
    const slug = p.url_slug?.trim();
    if (!org || !slug) {
      toast({
        title: "Preview unavailable",
        description:
          "This product needs an organization slug and URL slug before the public landing page can be opened.",
        variant: "destructive",
      });
      return;
    }
    const path = `/${encodeURIComponent(org)}/${encodeURIComponent(slug)}`;
    window.open(path, "_blank", "noopener,noreferrer");
  };

  const [formData, setFormData] = React.useState({
    name: "",
    sku: "",
    price: "",
    categoryId: "none",
    description: "",
    is_active: true,
  });

  const allSelected = selectedProducts.length === products.length && products.length > 0;
  const someSelected = selectedProducts.length > 0 && !allSelected;

  // ────────────────────────────────────────────────
  // Load Categories
  // ────────────────────────────────────────────────
  const loadCategories = async () => {
    try {
      const res = await axiosClient.get("/product-categories");
      if (res.data.success) {
        setCategories(res.data.data || []);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to load categories",
        variant: "destructive",
      });
    }
  };

  // ────────────────────────────────────────────────
  // Fetch Products
  // ────────────────────────────────────────────────
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const selectedDepartmentId = localStorage.getItem("selectedDepartmentId");

      const params: any = { page, per_page: perPage };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (categoryFilter !== "all") params.category_id = categoryFilter;
      if (statusFilter !== "all") params.is_active = statusFilter === "active" ? 1 : 0;
      if (selectedDepartmentId) params.department_id = parseInt(selectedDepartmentId);

      const res = await axiosClient.get("/products", { params });

      if (res.data.success && res.data.data) {
        const apiData = res.data.data.data || [];
        const pagination = res.data.data;
   
        const productData: Product[] = apiData.map((item: any) => ({
          id: item.id,
          image: item.images?.[0]?.url || "https://www.thekeepingroomnc.com/wp-content/uploads/2020/04/image-placeholder.jpg",
          name: item.name,
          sku: item.sku || "N/A",
          category: item.category?.name || "Uncategorized",
          categoryId: item.category?.id || 0,
          price: item.price ? `$${parseFloat(item.price).toFixed(2)}` : "0.00",
          scans: item.scans || 0,
          views: item.views || 0,
          leads: item.leads || 0,
          status: item.is_active ?? true,
          description: item.description,
          qr_code_url: item.qr_code_url,
          url_slug: item.url_slug,
          org_slug: item.organization?.slug,
          realScans: analyticsCache[item.id]?.unique_visitors,
          realViews: analyticsCache[item.id]?.page_views,
          realLeads: analyticsCache[item.id]?.form_submissions,
          analyticsLoading: false,
        }));

        setProducts(productData);
        setTotalItems(pagination.total || pagination.meta?.total || productData.length);
      }
    } catch (e: any) {
      // toast({
      //   title: "Error",
      //   description: e.response?.data?.message,
      //   variant: "destructive",
      // });
      console.error("Failed to fetch products:", e);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Load Analytics (on hover)
  // ────────────────────────────────────────────────
  const loadProductAnalytics = async (productId: number) => {
    if (analyticsCache[productId]) return;

    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, analyticsLoading: true } : p
    ));

    try {
      const res = await axiosClient.get(`/analytics/products/${productId}/metrics`);
      if (res.data.success && res.data.data?.metrics) {
        const m = res.data.data.metrics;
        setAnalyticsCache(prev => ({
          ...prev,
          [productId]: {
            unique_visitors: m.unique_visitors ?? 0,
            page_views: m.page_views ?? 0,
            form_submissions: m.form_submissions ?? 0,
          }
        }));

        setProducts(prev => prev.map(p =>
          p.id === productId
            ? {
                ...p,
                realScans: m.unique_visitors ?? 0,
                realViews: m.page_views ?? 0,
                realLeads: m.form_submissions ?? 0,
                analyticsLoading: false,
              }
            : p
        ));
      }
    } catch (err) {
      console.error("Analytics load failed:", err);
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, analyticsLoading: false } : p
      ));
    }
  };

  // ────────────────────────────────────────────────
  // Edit Product
  // ────────────────────────────────────────────────
  const loadProductForEdit = async (productId: number) => {
    try {
      const res = await axiosClient.get(`/products/${productId}`);
      if (res.data.success) {
        const item = res.data.data;
        setFormData({
          name: item.name || "",
          sku: item.sku || "",
          price: item.price?.toString() || "",
          categoryId: item.category_id || item.category?.id ? String(item.category_id ?? item.category?.id) : "none",
          description: item.description || "",
          is_active: item.is_active ?? true,
        });
      }
    } catch (err: any) {
      // toast({
      //   title: "Error",
      //   description: err.response?.data?.message,
      //   variant: "destructive",
      // });
      console.error("Failed to load product for edit:", err);
    }
  };

  const saveProduct = async () => {
    if (!editingProduct) return;
    if (!hasPermission("products", "update")) {
      showToast("No permission to update products", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        sku: formData.sku,
        price: formData.price ? parseFloat(formData.price) : null,
        category_id: formData.categoryId === "none" ? null : parseInt(formData.categoryId),
        description: formData.description,
        is_active: formData.is_active,
      };

      await axiosClient.put(`/products/${editingProduct.id}`, payload);
      toast({ title: "Success", description: "Product updated" });
      setEditDrawerOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Update failed",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ────────────────────────────────────────────────
  // Delete Single Product
  // ────────────────────────────────────────────────
  const deleteProduct = async (productId: number) => {
    if (!hasPermission("products", "delete")) {
      showToast("No permission to delete products", "error");
      return;
    }

    if (!confirm("Delete this product?")) return;

    setIsDeleting(true);
    try {
      await axiosClient.delete(`/products/${productId}`);
      toast({ title: "Deleted", description: "Product removed" });
      fetchProducts();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Delete failed",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ────────────────────────────────────────────────
  // Bulk Delete
  // ────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    const count = selectedProducts.length;
    if (!confirm(`Delete ${count} product${count === 1 ? '' : 's'}? This cannot be undone.`)) return;

    try {
      await axiosClient.delete('/products/bulk', {
        data: { ids: selectedProducts.map(Number) }
      });

      toast({
        title: "Success",
        description: `${count} product${count === 1 ? ' was' : 's were'} deleted`
      });

      setSelectedProducts([]);
      fetchProducts();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err.response?.data?.message || "Could not delete products"
      });
    }
  };

  // ────────────────────────────────────────────────
  // Export QR Data (CSV with QR URLs)
  // ────────────────────────────────────────────────
  const exportQRCodesCSV = () => {
    if (selectedProducts.length === 0) {
      toast({ title: "Nothing selected", variant: "default" });
      return;
    }

    const selected = products.filter(p => selectedProducts.includes(p.id.toString()));

    const rows = [
      ['Product Name', 'SKU', 'Price', 'Landing URL', 'QR Code URL'],
      ...selected.map(p => [
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        p.price,
        p.url_slug ? `${window.location.origin}/preview/${p.url_slug}` : '',
        p.qr_code_url || ''
      ])
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qrcodes_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", description: "QR data CSV downloaded" });
  };

  // ────────────────────────────────────────────────
  // Export Selected Products (full data)
  // ────────────────────────────────────────────────
  const handleExportSelectedCSV = () => {
    if (selectedProducts.length === 0) return;

    const selected = products.filter(p => selectedProducts.includes(p.id.toString()));

    const headers = [
      'ID', 'Name', 'SKU', 'Category', 'Price', 'Status',
      'Scans (fallback)', 'Views (fallback)', 'Leads (fallback)',
      'Real Scans', 'Real Views', 'Real Leads',
      'Landing URL', 'QR Code URL'
    ];

    const rows = selected.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.category,
      p.price,
      p.status ? 'Active' : 'Inactive',
      p.scans,
      p.views,
      p.leads,
      p.realScans ?? '',
      p.realViews ?? '',
      p.realLeads ?? '',
      p.url_slug ? `${window.location.origin}/preview/${p.url_slug}` : '',
      p.qr_code_url || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: `Exported ${selected.length} product${selected.length === 1 ? '' : 's'}`
    });
  };

  // ────────────────────────────────────────────────
  // Effects
  // ────────────────────────────────────────────────
  React.useEffect(() => {
    fetchProducts();
  }, [page, perPage, searchQuery, categoryFilter, statusFilter]);

  React.useEffect(() => {
    loadCategories();
  }, []);

  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryFilter, statusFilter, perPage]);

  // ────────────────────────────────────────────────
  // Selection Handlers
  // ────────────────────────────────────────────────
  const toggleAll = () => {
    setSelectedProducts(allSelected ? [] : products.map(p => p.id.toString()));
  };

  const toggleProduct = (id: number) => {
    const idStr = id.toString();
    setSelectedProducts(prev =>
      prev.includes(idStr) ? prev.filter(p => p !== idStr) : [...prev, idStr]
    );
  };

  // ────────────────────────────────────────────────
  // Action Handlers
  // ────────────────────────────────────────────────
  const openEditDrawer = async (product: Product) => {
    setEditingProduct(product);
    await loadProductForEdit(product.id);
    setEditDrawerOpen(true);
  };

  const openfullupdate = (product: Product) => {
    router.push(`/products/update?id=${product.id}`);
  };

  const openQRCodeDialog = (product: Product) => {
    setSelectedProductForQR(product);
    setQrCodeDialogOpen(true);
  };

  const handleCloneProduct = async (product: Product) => {
    if (!hasPermission("products", "create")) {
      showToast("No permission to clone products", "error");
      return;
    }

    if (!confirm(`Clone "${product.name}"?`)) return;

    try {
      const response = await axiosClient.post(`/products/${product.id}/clone`);
      if (response.data.success) {
        showToast("Product cloned", "success");
        fetchProducts();
      } else {
        showToast(response.data.message || "Failed", "error");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Clone failed", "error");
    }
  };

  const renderCategoryTree = (items: Category[], level = 0): React.ReactNode => {
    return items.map((cat) => (
      <React.Fragment key={cat.id}>
        <SelectItem value={cat.id.toString()}>
          <span style={{ paddingLeft: `${level * 20}px` }}>
            {level > 0 && "└─ "}
            {cat.name}
          </span>
        </SelectItem>
        {cat.children && cat.children.length > 0 && renderCategoryTree(cat.children, level + 1)}
      </React.Fragment>
    ));
  };

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / perPage) : 1;
  const startItem = totalItems === 0 ? 0 : (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, totalItems);

  const getSortedProducts = () => {
    if (!sortConfig) return products;

    return [...products].sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof Product];
      let bVal: any = b[sortConfig.key as keyof Product];

      if (sortConfig.key === 'realScans') {
        aVal = a.realScans ?? a.scans ?? 0;
        bVal = b.realScans ?? b.scans ?? 0;
      }
      if (sortConfig.key === 'realViews') {
        aVal = a.realViews ?? a.views ?? 0;
        bVal = b.realViews ?? b.views ?? 0;
      }
      if (sortConfig.key === 'realLeads') {
        aVal = a.realLeads ?? a.leads ?? 0;
        bVal = b.realLeads ?? b.leads ?? 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: SortConfig['key'] }) => {
    const isActive = sortConfig?.key === sortKey;
    const direction = isActive ? sortConfig!.direction : null;

    return (
      <TableHead
        className="cursor-pointer select-none whitespace-nowrap"
        onClick={() => {
          setSortConfig(prev => {
            if (prev?.key === sortKey) {
              return { key: sortKey, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key: sortKey, direction: 'asc' };
          });
        }}
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          {isActive && (
            <span className="text-xs opacity-70 font-bold">
              {direction === 'asc' ? '↑' : '↓'}
            </span>
          )}
          {!isActive && <span className="text-xs opacity-30">↕</span>}
        </div>
      </TableHead>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your product catalog and QR codes
            </p>
          </div>
          <PermissionRestrictedButton
            hasPermission={hasPermission("products", "create")}
            requiredPermission="Create Products"
            resource="products"
            action="create"
            asChild
          >
            <Link href="/products/new">
            <Plus className="h-4 w-4 mr-2" />
                Add Product
             
            </Link>
          </PermissionRestrictedButton>
        </div>

        {/* Filters & Bulk Actions */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-card p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {renderCategoryTree(categories)}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" disabled>
                <Filter className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem>Export as XLSX</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-primary/10 px-4 py-2.5 text-sm">
              <span className="font-medium text-primary">
                {selectedProducts.length} selected
              </span>
              <div className="flex flex-wrap gap-2">
              {hasPermission("products", "read") && (
  <Button  variant="outline"
  size="sm"
  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer" onClick={exportQRCodesCSV}>
    Export QR Data
  </Button>
)}

{hasPermission("products", "read") && (
  <Button  variant="outline"
  size="sm"
  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer" onClick={handleExportSelectedCSV}>
    Export Products
  </Button>
)}

{hasPermission("products", "delete") && (
  <Button
    variant="outline"
    size="sm"
    className="text-destructive hover:text-destructive/90 border-destructive/30 hover:border-destructive/50"
    onClick={handleBulkDelete}
  >
    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
    Delete
  </Button>
)}
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <TooltipProvider>
          <div className="rounded-xl border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <SortableHeader label="Name" sortKey="name" />
                  <SortableHeader label="SKU" sortKey="sku" />
                  <TableHead>Category</TableHead>
                  <SortableHeader label="Price" sortKey="price" />
                  <SortableHeader label="Scans" sortKey="realScans" />
                  <SortableHeader label="Views" sortKey="realViews" />
                  <SortableHeader label="Leads" sortKey="realLeads" />
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10">
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                      {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                        ? "No products match your filters"
                        : "No products found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow
                      key={p.id}
                      className="group"
                      onMouseEnter={() => loadProductAnalytics(p.id)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(p.id.toString())}
                          onCheckedChange={() => toggleProduct(p.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Image
                          src={p.image}
                          alt={p.name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell>
                        {hasPermission("products", "read") ? (
                          <button
                            onClick={() => openEditDrawer(p)}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {p.name}
                          </button>
                        ) : (
                          <span className="font-medium">{p.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.category}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{p.price}</TableCell>

                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help inline-flex items-center gap-1">
                              {p.analyticsLoading ? (
                                <span className="text-xs">...</span>
                              ) : (
                                p.realScans !== undefined ? p.realScans : p.scans
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Real unique visitors (QR scans)</TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {p.analyticsLoading ? "..." : (p.realViews !== undefined ? p.realViews : p.views)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Page views</TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help font-medium text-green-700">
                              {p.analyticsLoading ? "..." : (p.realLeads !== undefined ? p.realLeads : p.leads)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Form submissions (leads)</TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell className="text-center">
                      {p.status 
  ? <Badge >Active</Badge> 
  : <Badge >Inactive</Badge>
}

    
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <PermissionRestrictedMenuItem
                              hasPermission={hasPermission("products", "update")}
                            >
                              <DropdownMenuItem onSelect={() => openfullupdate(p)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit (Full)
                              </DropdownMenuItem>
                            </PermissionRestrictedMenuItem>

                            <PermissionRestrictedMenuItem
                              hasPermission={hasPermission("products", "create")}
                            >
                              <DropdownMenuItem onSelect={() => handleCloneProduct(p)}>
                                <Copy className="mr-2 h-4 w-4" /> Clone
                              </DropdownMenuItem>
                            </PermissionRestrictedMenuItem>

                            <PermissionRestrictedMenuItem
                              hasPermission={hasPermission("products", "read")}
                            >
                              <DropdownMenuItem onSelect={() => openQRCodeDialog(p)}>
                                <QrCode className="mr-2 h-4 w-4" /> QR Code
                              </DropdownMenuItem>
                            </PermissionRestrictedMenuItem>

                            <PermissionRestrictedMenuItem
                              hasPermission={hasPermission("products", "read")}
                            >
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  openProductPublicLanding(p);
                                }}
                              >
                                <Globe className="mr-2 h-4 w-4" /> Landing Page (preview)
                              </DropdownMenuItem>
                            </PermissionRestrictedMenuItem>

                            {hasPermission("products", "delete") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deleteProduct(p.id)}
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TooltipProvider>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t bg-card px-6 py-4">
          <div className="text-sm text-muted-foreground">
            {totalItems > 0 ? (
              <>Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong> products</>
            ) : (
              "No products to display"
            )}
          </div>
          <div className="flex items-center gap-3">
            <Select value={perPage.toString()} onValueChange={(v) => setPerPage(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Sheet */}
      <Sheet open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <div className="sticky top-0 bg-background border-b z-10">
            <SheetHeader className="px-6 py-4">
              <SheetTitle className="text-2xl font-bold">Edit Product</SheetTitle>
              <SheetDescription>Update product information</SheetDescription>
            </SheetHeader>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {renderCategoryTree(categories)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="status">Active</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t sticky bottom-0 bg-background">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditDrawerOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={saveProduct} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* QR Code Dialog */}
      <Dialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>QR code for {selectedProductForQR?.name || "this product"}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            {selectedProductForQR?.qr_code_url ? (
              <>
                <div className="p-4 bg-white rounded-lg border-2 border-slate-200">
                  <Image
                    src={selectedProductForQR.qr_code_url}
                    alt={`QR Code for ${selectedProductForQR.name}`}
                    width={256}
                    height={256}
                    className="w-64 h-64"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Product: <span className="font-medium">{selectedProductForQR.name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">SKU: {selectedProductForQR.sku}</p>
                  {selectedProductForQR?.url_slug && (
            <p className="text-xs text-muted-foreground break-all">
              URL: {window.location.origin}/{selectedProductForQR.org_slug}/{selectedProductForQR.url_slug}
            </p>
          )}
                          </div>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (selectedProductForQR?.qr_code_url) {
                        window.open(selectedProductForQR.qr_code_url, "_blank");
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (selectedProductForQR?.url_slug && selectedProductForQR?.org_slug) {
                        const baseUrl = window.location.origin;
                    
                        const finalUrl = `${baseUrl}/${selectedProductForQR.org_slug}/${selectedProductForQR.url_slug}`;
                    
                        navigator.clipboard.writeText(finalUrl);
                    
                        toast({
                          title: "Copied",
                          description: "QR code URL copied to clipboard",
                        });
                      }
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 space-y-2">
                <QrCode className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">QR code not available</p>
                <p className="text-xs text-muted-foreground">
                  Generated automatically on product creation
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}