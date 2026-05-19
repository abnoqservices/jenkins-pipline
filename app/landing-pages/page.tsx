"use client";

import * as React from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  Edit,
  ExternalLink,
  BarChart3,
  Layout,
  X,
  Link2,
  CheckCircle2,
  Palette,
  Check,
  Paintbrush,
  Loader2,
  List,
  Grid3X3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import axiosClient from "@/lib/axiosClient";
import { DashboardLayout } from "@/components/dashboard/layout";
import { usePageStore } from "@/lib/pageStore";
import LandingPageBuilder from "@/app/landing-pages/new/page";
import dynamic from "next/dynamic";
import { usePermissions } from "@/lib/usePermissions";
import { showToast as showToastLib } from "@/lib/showToast";
import { PermissionRestrictedButton } from "@/components/PermissionRestrictedButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";



const Button = ({ children, className = "", variant = "default", size = "default", onClick, disabled, ...props }: any) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50",
    ghost: "hover:bg-gray-100",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    lg: "h-12 px-8 text-lg",
    sm: "h-9 px-3 text-sm",
    icon: "h-10 w-10",
  };
  return (
    <button
      className={`${baseStyles} ${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = "", ...props }: any) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  />
);

const Card = ({ children, className = "" }: any) => (
  <div className={`rounded-lg border bg-white  ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = "" }: any) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children }: any) => <h3 className="text-xl font-semibold">{children}</h3>;

const CardContent = ({ children, className = "" }: any) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Badge = ({ children, className = "", variant = "default" }: any) => {
  const variantStyles = {
    default: "bg-gray-100 text-gray-800",
    secondary: "bg-blue-100 text-blue-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantStyles[variant] || variantStyles.default} ${className}`}>
      {children}
    </span>
  );
};


const Toast = ({ message, type = "success", onClose }: { message: string; type?: "success" | "error"; onClose: () => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-2xl text-white font-medium flex items-center gap-3 animate-in slide-in-from-bottom-3 ${type === "success" ? "bg-green-600" : "bg-red-600"}`}>
      {type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <X className="h-5 w-5" />}
      {message}
    </div>
  );
};

const CustomizeButton = ({ 
  onClick, 
  size = "default",
  loading = false 
}: { 
  onClick: () => void; 
  size?: "default" | "sm"; 
  loading?: boolean;
}) => {
  const isSmall = size === "sm";

  return (
    <Button
      onClick={onClick}
      disabled={loading}
      variant="default"
      size={isSmall ? "sm" : "default"}
      className={`
        bg-purple-600 hover:bg-purple-700 text-white font-semibold 
        ${isSmall ? "px-3" : "px-6"}
        transition-all duration-200 group
      `}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <svg className={`h-5 w-5 ${isSmall ? "" : "mr-2"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className={`${isSmall ? "hidden sm:inline" : " Customize Landing Page"} font-medium`}>
           </span>
        </>
      )}
    </Button>
  );
};

type LandingPage = {
  id: number;
  userId: number | null;
  name: string;
  url: string;
  views: number;
  conversions: number;
  status: string;
  lastModified: string;
  template: string;
  isActive: boolean;
};

export default function LandingPagesPage() {
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = React.useState(true);
  const [pages, setPages] = React.useState<LandingPage[]>([]);
  const [activePage, setActivePage] = React.useState<LandingPage | null>(null);
  const [showLinkModal, setShowLinkModal] = React.useState(false);
  const [generatedLink, setGeneratedLink] = React.useState("");
  const [selectedPage, setSelectedPage] = React.useState<LandingPage | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = React.useState(false);

  // Loading states
  const [activatingId, setActivatingId] = React.useState<number | null>(null);
  const [deactivating, setDeactivating] = React.useState(false);
  const [editingPageName, setEditingPageName] = React.useState<string>("Landing Page");
  const { templateId, userId, setTemplate } = usePageStore(); 
  const router = useRouter();

  // Toast state
  const [toast, setToast] = React.useState<{ message: string; type: "success" | "error" } | null>(null);

  const currentUserId = 1;

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  const parseApiData = (rawData: any[]): LandingPage[] => {
    return rawData.map(item => ({
      id: parseInt(item.id, 10),
      userId: item.userId === null ? null : parseInt(item.userId, 10),
      name: item.name,
      url: item.url,
      views: parseInt(item.views || "0", 10),
      conversions: parseInt(item.conversions || "0", 10),
      status: item.status,
      lastModified: item.lastModified || item.updatedAt,
      template: item.template,
      isActive: item.isActive === "1" || item.isActive === true,
    }));
  };

  React.useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/Templates/list?userId=${currentUserId}`);
        let data = response.data;

        if (!Array.isArray(data)) {
          data = data.pages || data.data || [];
        }

        const parsedPages = parseApiData(data);
        setPages(parsedPages);

        const active = parsedPages.find(p => p.isActive) || null;
        setActivePage(active);
      } catch (error) {
        console.error("Failed to fetch landing pages:", error);
        showToast("Failed to load pages", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const availablePages = pages.filter(page => {
    const isDefault = page.userId === null;
    const isUserOwned = page.userId === currentUserId;
    const isNotActive = !page.isActive;
    return (isDefault || isUserOwned) && isNotActive;
  });

  const generateDynamicURL = (page: LandingPage) => {
    return `https://yourdomain.com/preview/${page.id}`;
  };

  const handleGenerateLink = (page: LandingPage) => {
    setSelectedPage(page);
    const link = generateDynamicURL(page);
    setGeneratedLink(link);
    setShowLinkModal(true);
    setCopied(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInNewTab = () => {
    window.open(generatedLink, "_blank");
  };

  const handleActivatePage = async (page: LandingPage) => {
    if (!hasPermission("landing_pages", "update")) {
      showToastLib("You don't have permission to activate landing pages", "error");
      return;
    }
    
    setActivatingId(page.id);

    try {
      const res = await axiosClient.post(`/templates/activate`, {
        userId: Number(currentUserId),
        templateId: Number(page.id)
      });

      const updatedTemplates = res.data.templates || res.data;
      const activePageData = res.data.activePage;

      const parsedPages = parseApiData(updatedTemplates);
      setPages(parsedPages);
      setActivePage(activePageData);

      showToast(`"${page.name}" is now live!`, "success");
    } catch (error: any) {
      console.error("Failed to activate page", error);
      const msg = error.response?.data?.message || "Failed to activate page";
      showToast(msg, "error");
    } finally {
      setActivatingId(null);
    }
  };

  const handleDeactivateActivePage = async () => {
    if (!activePage) return;

    if (!hasPermission("landing_pages", "update")) {
      showToastLib("You don't have permission to deactivate landing pages", "error");
      return;
    }

    setDeactivating(true);

    try {
      await axiosClient.post(`/templates/deactivate`, {
        userId: currentUserId,
        templateId: activePage.id,
      });

      const updatedPages = pages.map(p => ({ ...p, isActive: false }));
      setPages(updatedPages);
      setActivePage(null);

      showToast("Landing page deactivated successfully", "success");
    } catch (error: any) {
      console.error("Failed to deactivate", error);
      showToast("Failed to deactivate page", "error");
    } finally {
      setDeactivating(false);
    }
  };

  // Open Customize Modal with correct templateId & userId
  const openCustomizeModal = (page: LandingPage) => {
    setTemplate(page.id, page.userId);
    setEditingPageName(page.name); // Set the name
    setIsCustomizeModalOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading your landing pages...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 relative">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Landing Pages</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and publish your product landing pages</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Active Page Section */}
          {activePage && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">Active Landing Page</h2>
                  <Badge className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </div>
              </div>

              <Card className="overflow-hidden border-2 border-green-500 ">
                <div className="md:flex">
                  <div className="bg-gray-100 p-8">
                    <div className="aspect-[5/7] w-40 relative rounded-lg overflow-hidden bg-white shadow-xl">
                      <img src={activePage.url} alt={activePage.name} className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="p-8 flex-1">
                    <h3 className="text-2xl font-bold mb-4">{activePage.name}</h3>

                    <div className="grid grid-cols-3 gap-6 mb-8">
                      <div className="bg-blue-50 p-5 rounded-xl text-center">
                        <div className="text-3xl font-bold text-blue-600">{activePage.views.toLocaleString()}</div>
                        <div className="text-sm text-gray-600 mt-1">Total Views</div>
                      </div>
                      <div className="bg-green-50 p-5 rounded-xl text-center">
                        <div className="text-3xl font-bold text-green-600">{activePage.conversions}</div>
                        <div className="text-sm text-gray-600 mt-1">Conversions</div>
                      </div>
                      <div className="bg-purple-50 p-5 rounded-xl text-center">
                        <div className="text-3xl font-bold text-purple-600">
                          {activePage.views > 0 ? ((activePage.conversions / activePage.views) * 100).toFixed(1) : "0"}%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Conversion Rate</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      {/* Main Customize Button */}
                      <CustomizeButton 
                        onClick={() => openCustomizeModal(activePage)}
                      />

                      <Button variant="outline" onClick={() => handleGenerateLink(activePage)}>
                        <Link2 className="h-4 w-4 mr-2" /> Share Link
                      </Button>
                      <PermissionRestrictedButton
                        hasPermission={hasPermission("landing_pages", "update")}
                        requiredPermission="Update Landing Pages"
                        resource="landing pages"
                        action="deactivate"
                        variant="outline"
                        className="text-red-600 border-red-300"
                        onClick={handleDeactivateActivePage}
                        disabled={deactivating || !hasPermission("landing_pages", "update")}
                      >
                        {deactivating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deactivating...
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        )}
                      </PermissionRestrictedButton>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Template Selection */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {activePage ? "Switch to Another Template" : "Choose a Template to Activate"}
              </h2>

              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${viewMode === "list" ? "bg-white text-blue-600 " : "text-gray-600 hover:text-gray-900"}`}
                >
                  <List className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${viewMode === "grid" ? "bg-white text-blue-600 " : "text-gray-600 hover:text-gray-900"}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>

            {availablePages.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-gray-500">No templates available at the moment.</p>
              </Card>
            ) : viewMode === "list" ? (
              /* List View */
              <div className="space-y-4">
                {availablePages.map((page) => (
                  <Card 
                    key={page.id} 
                    className={`overflow-hidden hover: transition-all group bg-white border ${
                      hasPermission("landing_pages", "update") ? "cursor-pointer" : "cursor-not-allowed opacity-75"
                    }`} 
                    onClick={() => {
                      if (hasPermission("landing_pages", "update")) {
                        handleActivatePage(page);
                      } else {
                        showToastLib("You don't have permission to activate landing pages", "error");
                      }
                    }}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-20 h-28 rounded-lg overflow-hidden bg-gray-100 ">
                          <img src={page.url} alt={page.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        {page.userId === null && <Badge className="absolute -top-2 -left-2 bg-blue-100 text-blue-800 text-xs">Default</Badge>}
                        {page.userId === currentUserId && <Badge className="absolute -top-2 -left-2 bg-purple-100 text-purple-800 text-xs">Yours</Badge>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 truncate">{page.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">Updated {new Date(page.lastModified).toLocaleDateString()}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /><span>{page.views.toLocaleString()}</span></div>
                          <div className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /><span>{page.conversions}</span></div>
                          {page.views > 0 && <div className="text-green-600 font-medium">{((page.conversions / page.views) * 100).toFixed(1)}%</div>}
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="outline" className="h-9 w-9 p-0" onClick={(e) => { e.stopPropagation(); window.open(page.url, "_blank"); }}>
                          <Eye className="h-4 w-4" />
                        </Button>

                    
                        <div onClick={(e) => e.stopPropagation()}>
                          <CustomizeButton 
                            size="sm"
                            onClick={() => openCustomizeModal(page)}
                          />
                        </div>

                        <PermissionRestrictedButton
                          hasPermission={hasPermission("landing_pages", "update")}
                          requiredPermission="Update Landing Pages"
                          resource="landing pages"
                          action="activate"
                          size="sm"
                          className="h-9 px-3"
                          onClick={(e) => { e.stopPropagation(); handleActivatePage(page); }}
                          disabled={activatingId === page.id || !hasPermission("landing_pages", "update")}
                        >
                          {activatingId === page.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </PermissionRestrictedButton>
                      </div>

                      <div className="sm:hidden">
                        <PermissionRestrictedButton
                          hasPermission={hasPermission("landing_pages", "update")}
                          requiredPermission="Update Landing Pages"
                          resource="landing pages"
                          action="activate"
                          size="sm"
                          className="h-10 px-4 text-sm"
                          onClick={(e) => { e.stopPropagation(); handleActivatePage(page); }}
                          disabled={activatingId === page.id || !hasPermission("landing_pages", "update")}
                        >
                          {activatingId === page.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Activating...
                            </>
                          ) : (
                            "Activate"
                          )}
                        </PermissionRestrictedButton>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {availablePages.map((page) => (
                  <Card key={page.id} className="overflow-hidden hover:shadow-2xl transition-all cursor-pointer group">
                    <div className="aspect-[5/7] relative rounded-lg overflow-hidden bg-white">
                      <img src={page.url} alt={page.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); window.open(page.url, "_blank"); }}>
                            <Eye className="h-4 w-4 mr-2" /> Preview
                          </Button>
                        </div>
                      </div>
                      {page.userId === null && <Badge className="absolute top-3 left-3 bg-blue-100 text-blue-800 text-xs">Default</Badge>}
                      {page.userId === currentUserId && <Badge className="absolute top-3 left-3 bg-purple-100 text-purple-800 text-xs">Yours</Badge>}
                    </div>

                    <CardContent className="p-5">
                      <h4 className="font-semibold text-lg mb-2 line-clamp-1">{page.name}</h4>
                      <p className="text-sm text-gray-500 mb-4">Last updated: {new Date(page.lastModified).toLocaleDateString()}</p>
                      <div className="flex gap-2">
                        <PermissionRestrictedButton
                          hasPermission={hasPermission("landing_pages", "update")}
                          requiredPermission="Update Landing Pages"
                          resource="landing pages"
                          action="activate"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleActivatePage(page)}
                          disabled={activatingId === page.id || !hasPermission("landing_pages", "update")}
                        >
                          {activatingId === page.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </PermissionRestrictedButton>
                        <CustomizeButton 
                          size="sm"
                          onClick={() => openCustomizeModal(page)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

      
          {showLinkModal && selectedPage && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
                <div className="bg-green-50 p-6 border-b border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                      <div>
                        <h3 className="text-xl font-bold">Shareable Link Ready!</h3>
                        <p className="text-sm text-gray-600">{selectedPage.name}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowLinkModal(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex gap-3">
                    <Input value={generatedLink} readOnly className="font-mono text-sm" />
                    <Button onClick={handleCopyLink}>{copied ? "Copied!" : "Copy"}</Button>
                  </div>
                  <Button className="w-full mt-4" onClick={handleOpenInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Open in New Tab
                  </Button>
                </div>
              </div>
            </div>
          )}

       
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

    
          {isCustomizeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col animate-in fade-in duration-300">
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <h2 className="text-2xl font-bold">
  Customize: <span className="text-white/90">"{editingPageName}"</span>
</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 rounded-full"
                    onClick={() => setIsCustomizeModalOpen(false)}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                  
                  <LandingPageBuilder 
                    templateId={templateId} 
                    userId={userId} 
                    onClose={() => setIsCustomizeModalOpen(false)} 
                  />
                    </div>

             
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}