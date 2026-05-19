"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Users,
  Shield,
  Edit,
  Trash2,
  UserPlus,
  ArrowLeft,
  Mail,
} from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import Link from "next/link";
import { showToast } from "@/lib/showToast";
import { useLabels } from '@/app/context/TenantLabelsContext';
interface DepartmentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department_role?: {
    id: number;
    name: string;
    slug: string;
    type: string;
  };
}

interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  type: "system" | "custom";
  is_active: boolean;
  permissions?: Permission[];
}

interface Permission {
  id: number;
  name: string;
  slug: string;
  resource: string;
  action: string;
}

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = params.id as string;

  const [department, setDepartment] = React.useState<any>(null);
  const [users, setUsers] = React.useState<DepartmentUser[]>([]);
  const [roles, setRoles] = React.useState<{ system_roles: Role[]; custom_roles: Role[] }>({
    system_roles: [],
    custom_roles: [],
  });
  const [permissions, setPermissions] = React.useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("users");
  const { getLabel, labels } = useLabels();
  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<Role | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  // Form states
  const [inviteForm, setInviteForm] = React.useState({
    invitations: [{ email: "", role_id: null as string | null }],
  });
  const [pendingInvitations, setPendingInvitations] = React.useState<any[]>([]);
  const [roleForm, setRoleForm] = React.useState({
    name: "",
    description: "",
    permission_ids: [] as number[],
  });

  React.useEffect(() => {
    if (departmentId) {
      loadAllData();
    }
  }, [departmentId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDepartment(),
        loadUsers(),
        loadRoles(),
        loadPermissions(),
        loadPendingInvitations(),
      ]);
    } catch (err) {
      console.error(`Error loading ${getLabel('label.department')} data:`, err);
      showToast(`Failed to load ${getLabel('label.department')} data`, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const res = await axiosClient.get(`/departments/${departmentId}/pending-invitations`);
      if (res.data.success) {
        setPendingInvitations(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Failed to load pending invitations:", err);
    }
  };

  const loadDepartment = async () => {
    try {
      const res = await axiosClient.get(`/departments/${departmentId}`);
      if (res.data.success) {
        setDepartment(res.data.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to load department";
      showToast(msg, "error");
      throw err;
    }
  };

  const loadUsers = async () => {
    try {
      const res = await axiosClient.get(`/departments/${departmentId}/users`);
      if (res.data.success) {
        setUsers(res.data.data || []);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to load users";
      showToast(msg, "error");
      throw err;
    }
  };

  const loadRoles = async () => {
    try {
      const res = await axiosClient.get(`/departments/${departmentId}/roles`);
      if (res.data.success) {
        setRoles(res.data.data || { system_roles: [], custom_roles: [] });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to load roles";
      showToast(msg, "error");
      throw err;
    }
  };

  const loadPermissions = async () => {
    try {
      const res = await axiosClient.get("/permissions");
      if (res.data.success) {
        setPermissions(res.data.data || {});
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to load permissions";
      showToast(msg, "error");
      throw err;
    }
  };

  const handleInviteUsers = async () => {
    setIsLoading(true);
    try {
      const validInvitations = inviteForm.invitations.filter((inv) => inv.email.trim() !== "");

      if (validInvitations.length === 0) {
        showToast("Please enter at least one valid email address", "error");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const inv of validInvitations) {
        if (!emailRegex.test(inv.email.trim())) {
          showToast(`Invalid email format: ${inv.email}`, "error");
          return;
        }
      }

      const res = await axiosClient.post(`/departments/${departmentId}/invite-users`, {
        invitations: validInvitations.map((inv) => ({
          email: inv.email.trim(),
          role_id: inv.role_id || null,
        })),
      });

      if (res.data.success) {
        if (res.data.data?.errors?.length > 0) {
          showToast(
            `Some invitations failed: ${res.data.data.errors.join(", ")}`,
            "warning"
          );
        } else {
          showToast("Invitations sent successfully", "success");
        }
        setInviteDialogOpen(false);
        setInviteForm({ invitations: [{ email: "", role_id: null }] });
        await Promise.all([loadUsers(), loadPendingInvitations()]);
      } else {
        showToast(res.data.message || "Failed to send invitations", "error");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to invite users";
      showToast(msg, "error");
    }finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: number, roleId: string | null) => {
    try {
      const payload = { role_id: roleId ? parseInt(roleId) : null };

      const res = await axiosClient.put(
        `/departments/${departmentId}/users/${userId}/role`,
        payload
      );

      if (res.data.success) {
        showToast("User role updated successfully", "success");
        await loadUsers();
      } else {
        showToast(res.data.message || "Failed to update user role", "error");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update user role";
      showToast(msg, "error");
    }
  };

  const handleSaveRole = async () => {
    try {
      if (!roleForm.name.trim()) {
        showToast("Role name is required", "error");
        return;
      }

      let res;
      const payload = {
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        permission_ids: roleForm.permission_ids,
      };

      if (editingRole) {
        res = await axiosClient.put(
          `/departments/${departmentId}/roles/${editingRole.id}`,
          payload
        );
      } else {
        res = await axiosClient.post(`/departments/${departmentId}/roles`, payload);
      }

      if (res.data.success) {
        showToast(
          editingRole ? "Role updated successfully" : "Role created successfully",
          "success"
        );
        setRoleDialogOpen(false);
        setEditingRole(null);
        setRoleForm({ name: "", description: "", permission_ids: [] });
        await loadRoles();
      } else {
        showToast(res.data.message || "Failed to save role", "error");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save role";
      showToast(msg, "error");
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("Are you sure you want to delete this role? This cannot be undone.")) return;

    try {
      const res = await axiosClient.delete(`/departments/${departmentId}/roles/${roleId}`);

      if (res.data.success) {
        showToast("Role deleted successfully", "success");
        await loadRoles();
      } else {
        showToast(res.data.message || "Failed to delete role", "error");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to delete role";
      showToast(msg, "error");
    }
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || "",
      permission_ids: role.permissions?.map((p) => p.id) || [],
    });
    setRoleDialogOpen(true);
  };

  const allRoles = [...roles.system_roles, ...roles.custom_roles];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading {getLabel('label.department')}...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!department) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/departments">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{getLabel('label.department')} Not Found</h1>
              <p className="text-muted-foreground mt-1">
                The {getLabel('label.department')} you're looking for doesn't exist or you don't have access.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/departments">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{department.name}</h1>
              <p className="text-muted-foreground mt-1">
                {department.description || "No description provided"}
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles">
              <Shield className="h-4 w-4 mr-2" />
              Roles & Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{getLabel('label.department')} Members</CardTitle>
                    <CardDescription>Manage users and their roles in this {getLabel('label.department')}</CardDescription>
                  </div>
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Users
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Invite Users to {getLabel('label.department')}</DialogTitle>
                        <DialogDescription>
                          Enter email addresses and optionally assign roles. Invitations will be sent via email.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {inviteForm.invitations.map((inv, index) => (
                          <div key={index} className="flex gap-3 items-end">
                            <div className="flex-1 space-y-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                placeholder="user@example.com"
                                value={inv.email}
                                onChange={(e) => {
                                  const newInv = [...inviteForm.invitations];
                                  newInv[index].email = e.target.value;
                                  setInviteForm({ ...inviteForm, invitations: newInv });
                                }}
                              />
                            </div>
                            <div className="w-48 space-y-2">
                              <Label>Role (optional)</Label>
                              <Select
                                value={inv.role_id || "none"}
                                onValueChange={(value) => {
                                  const newInv = [...inviteForm.invitations];
                                  newInv[index].role_id = value === "none" ? null : value;
                                  setInviteForm({ ...inviteForm, invitations: newInv });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No Role</SelectItem>
                                  {allRoles.map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                      {role.name} {role.type === "system" && "(System)"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {inviteForm.invitations.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const newInv = inviteForm.invitations.filter((_, i) => i !== index);
                                  setInviteForm({ ...inviteForm, invitations: newInv });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}

                        <Button
                          variant="outline"
                          onClick={() =>
                            setInviteForm({
                              ...inviteForm,
                              invitations: [...inviteForm.invitations, { email: "", role_id: null }],
                            })
                          }
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add another email
                        </Button>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setInviteDialogOpen(false);
                            setInviteForm({ invitations: [{ email: "", role_id: null }] });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleInviteUsers} disabled={isLoading}>
                            {isLoading ? "Sending..." : "Send Invitations"}
                          </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>

              <CardContent>
                {pendingInvitations.length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Pending Invitations ({pendingInvitations.length})
                    </h3>
                    <div className="space-y-2">
                      {pendingInvitations.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{inv.email}</span>
                            {inv.role && <Badge variant="secondary">{inv.role.name}</Badge>}
                            <span className="text-muted-foreground text-xs">
                              Expires {new Date(inv.expires_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>{getLabel('label.department')} Role</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.department_role?.id.toString() || "none"}
                            onValueChange={(value) =>
                              handleUpdateUserRole(user.id, value === "none" ? null : value)
                            }
                          >
                            <SelectTrigger className="w-56">
                              <SelectValue placeholder="No role assigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Role</SelectItem>
                              {allRoles.map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.name}
                                  {role.type === "system" && " (System)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" disabled>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No members in this department yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Roles & Permissions</CardTitle>
                    <CardDescription>
                      Manage custom roles and their permissions for this {getLabel('label.department')}
                    </CardDescription>
                  </div>
                  <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingRole(null);
                          setRoleForm({ name: "", description: "", permission_ids: [] });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Custom Role
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingRole ? "Edit Role" : "Create Custom Role"}
                        </DialogTitle>
                        <DialogDescription>
                          Define or modify a custom role with specific permissions
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 py-4">
                        <div className="space-y-2">
                          <Label>Role Name *</Label>
                          <Input
                            value={roleForm.name}
                            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                            placeholder="e.g. Content Manager, Moderator, Analyst"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={roleForm.description}
                            onChange={(e) =>
                              setRoleForm({ ...roleForm, description: e.target.value })
                            }
                            placeholder="Describe the responsibilities and access level..."
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Permissions</Label>
                          <div className="border rounded-md p-4 max-h-80 overflow-y-auto bg-slate-50/50">
                            {Object.entries(permissions).map(([resource, perms]) => (
                              <div key={resource} className="mb-6">
                                <h4 className="font-medium capitalize mb-3 text-slate-700">
                                  {resource}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-2">
                                  {perms.map((perm) => (
                                    <div key={perm.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`perm-${perm.id}`}
                                        checked={roleForm.permission_ids.includes(perm.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setRoleForm({
                                              ...roleForm,
                                              permission_ids: [...roleForm.permission_ids, perm.id],
                                            });
                                          } else {
                                            setRoleForm({
                                              ...roleForm,
                                              permission_ids: roleForm.permission_ids.filter(
                                                (id) => id !== perm.id
                                              ),
                                            });
                                          }
                                        }}
                                      />
                                      <Label
                                        htmlFor={`perm-${perm.id}`}
                                        className="text-sm font-normal cursor-pointer"
                                      >
                                        {perm.action}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setRoleDialogOpen(false);
                            setEditingRole(null);
                            setRoleForm({ name: "", description: "", permission_ids: [] });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveRole}>
                          {editingRole ? "Update Role" : "Create Role"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* System Roles */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">System Roles</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roles.system_roles.map((role) => (
                      <Card key={role.id} className="bg-slate-50/70">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{role.name}</CardTitle>
                            <Badge variant="secondary">System</Badge>
                          </div>
                          <CardDescription className="text-sm mt-1">
                            {role.description || "No description"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground">
                            {role.permissions?.length || 0} permission
                            {role.permissions?.length !== 1 ? "s" : ""}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Custom Roles */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Custom Roles</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roles.custom_roles.map((role) => (
                      <Card key={role.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{role.name}</CardTitle>
                            <Badge>Custom</Badge>
                          </div>
                          <CardDescription className="text-sm mt-1">
                            {role.description || "No description"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {role.permissions?.length || 0} permission
                              {role.permissions?.length !== 1 ? "s" : ""}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditRole(role)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteRole(role.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {roles.custom_roles.length === 0 && (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        No custom roles created yet
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}