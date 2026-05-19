"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Shield, ArrowUpRight } from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";     // ← your custom toast
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLabels } from '@/app/context/TenantLabelsContext';

interface Department {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  users?: Array<{
    id: number;
    name: string;
    email: string;
    pivot?: { role_id: number | null };
  }>;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const { getLabel } = useLabels();

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = React.useState(false);
  const [planLimitInfo, setPlanLimitInfo] = React.useState<{
    current: number;
    limit: number;
    remaining: number;
  } | null>(null);

  const [createForm, setCreateForm] = React.useState({
    name: "",
    description: "",
  });
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/departments");
      if (res.data.success) {
        setDepartments(res.data.data || []);
      }
    } catch (err: any) {
      showToast(
        err.response?.data?.message || `Failed to load ${getLabel('label.department')} list`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async () => {
    const deptName = createForm.name.trim();

    if (!deptName) {
      showToast(`${getLabel('label.department')} name is required`, "error");
      return;
    }

    if (deptName.length < 2) {
      showToast(`${getLabel('label.department')} name is too short (min 2 characters)`, "warning");
      return;
    }

    setCreating(true);

    try {
      const res = await axiosClient.post("/departments", {
        name: deptName,
        description: createForm.description.trim() || null,
        is_active: true,
      });

      if (res.data.success) {
        showToast(
          `${getLabel('label.department')} "${deptName}" created successfully`,
          "success"
        );
        setCreateDialogOpen(false);
        setCreateForm({ name: "", description: "" });
        await loadDepartments();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message;

      // Handle plan limit exceeded
      if (
        err.response?.data?.usage?.allowed === false &&
        msg?.toLowerCase().includes("limit")
      ) {
        setPlanLimitInfo({
          current: err.response.data.usage.current,
          limit: err.response.data.usage.limit,
          remaining: err.response.data.usage.remaining ?? 0,
        });
        setCreateDialogOpen(false);
        setUpgradeDialogOpen(true);
        showToast(`You've reached the ${getLabel('label.department')} limit for your current plan`, "warning");
      } else {
        showToast(
          msg || `Could not create ${getLabel('label.department')}. Please try again.`,
          "error"
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUpgrade = () => {
    setUpgradeDialogOpen(false);
    router.push("/plans");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading {getLabel('label.department')}s...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{getLabel('label.department')}s</h1>
            <p className="text-muted-foreground mt-1">
              Manage your {getLabel('label.department')}s, members, and access rights
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New {getLabel('label.department')}
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New {getLabel('label.department')}</DialogTitle>
                <DialogDescription>
                  Add a new {getLabel('label.department')} to your organization. You can invite members afterwards.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Marketing, Support, Development..."
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    disabled={creating}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Team responsible for customer support and issue resolution..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    disabled={creating}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDepartment} disabled={creating}>
                  {creating ? "Creating..." : `Create ${getLabel('label.department')}`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Upgrade Plan Dialog */}
        <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Plan Limit Reached</DialogTitle>
              <DialogDescription>
                Your current plan doesn't allow more {getLabel('label.department')}s.
              </DialogDescription>
            </DialogHeader>

            {planLimitInfo && (
              <div className="rounded-lg border bg-amber-50/70 p-5 space-y-3 my-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Used / Limit:</span>
                  <span className="font-medium">
                    {planLimitInfo.current} / {planLimitInfo.limit}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-medium text-amber-700">
                    {planLimitInfo.remaining}
                  </span>
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Upgrade your plan to create additional {getLabel('label.department')}s and unlock more features.
            </p>

            <DialogFooter className="flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleUpgrade} className="w-full sm:w-auto">
                Upgrade Plan
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg font-medium">No {getLabel('label.department')}s yet</p>
            <p className="mt-1">Create your first {getLabel('label.department')} to start organizing your team.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept) => (
              <Card key={dept.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="leading-tight">{dept.name}</CardTitle>
                    <Badge variant={dept.is_active ? "default" : "secondary"}>
                      {dept.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {dept.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Users className="h-4 w-4 mr-2" />
                    {dept.users?.length || 0} member{dept.users?.length !== 1 ? "s" : ""}
                  </div>

                  <Link href={`/departments/${dept.id}`}>
                    <Button variant="outline" className="w-full">
                      <Shield className="h-4 w-4 mr-2" />
                      Manage {getLabel('label.department')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}