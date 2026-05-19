"use client";

import { useState, useEffect, useCallback } from "react";
import axiosClient from "@/lib/axiosClient"; // adjust path if needed

export interface Permission {
  id: number;
  name: string;
  slug: string;
  resource: string;
  action: string;
  level?: "organization" | "department";
}

export interface RoleInfo {
  id: number | null;
  name: string;
  slug: string;
  level: "organization" | "department";
}

export function usePermissions() {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [departmentRole, setDepartmentRole] = useState<RoleInfo | null>(null);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/auth/me");
      
      if (res.data?.success || res.data?.data) {
        const userData = res.data.data || res.data;
        
        const normalizePermissions = (value: unknown): Permission[] => {
          if (!Array.isArray(value)) return [];
          return value.filter(
            (perm): perm is Permission =>
              Boolean(perm) &&
              typeof perm === "object" &&
              typeof (perm as Permission).resource === "string" &&
              typeof (perm as Permission).action === "string"
          );
        };

        // New `/auth/me` shape uses:
        // - permissions.department (array)
        // - roles.department (object)
        // Keep backward compatibility with older payload shapes.
        const permissionList = normalizePermissions(
          userData.permissions?.department ??
            userData.department_role?.permissions ??
            userData.role?.permissions ??
            userData.permissions
        );
        setAllPermissions(permissionList);

        // Get role info
        if (userData.roles?.department) {
          setDepartmentRole({
            id: userData.roles.department.id,
            name: userData.roles.department.name,
            slug: userData.roles.department.slug,
            level: "department",
          });
        } else if (userData.department_role) {
          setDepartmentRole({
            id: userData.department_role.id,
            name: userData.department_role.name,
            slug: userData.department_role.slug,
            level: "department",
          });
        } else if (userData.role) {
          setDepartmentRole({
            id: userData.role.id,
            name: userData.role.name,
            slug: userData.role.slug,
            level: "organization",
          });
        } else {
          setDepartmentRole(null);
        }

        const orgRoleSlug =
          userData.roles?.organization?.slug ||
          userData.organization_role?.slug ||
          userData.role?.slug ||
          "";
        setIsOrgAdmin(orgRoleSlug === "admin" || orgRoleSlug === "super_admin");
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      setAllPermissions([]);
      setDepartmentRole(null);
      setIsOrgAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (resource: string, action: string): boolean => {
      if (loading) return false;
      
      // Admin/super admin roles typically have all permissions
      if (isOrgAdmin || departmentRole?.slug === "admin" || departmentRole?.slug === "super_admin") {
        return true;
      }

      if (!Array.isArray(allPermissions)) return false;

      const normalizeResource = (value: string) =>
        value.toLowerCase().replace(/_/g, "-");
      const normalizeAction = (value: string) => {
        const v = value.toLowerCase();
        return v === "view" ? "read" : v;
      };

      const targetResource = normalizeResource(resource);
      const targetAction = normalizeAction(action);

      return allPermissions.some(
        (perm) => {
          const permResource = normalizeResource(perm.resource);
          const permAction = normalizeAction(perm.action);
          return permResource === targetResource && permAction === targetAction;
        }
      );
    },
    [allPermissions, departmentRole, isOrgAdmin, loading]
  );

  /**
   * Check if user can perform any action on a resource
   */
  const canAccessResource = useCallback(
    (resource: string): boolean => {
      if (loading) return false;
      if (isOrgAdmin || departmentRole?.slug === "admin" || departmentRole?.slug === "super_admin") return true;

      if (!Array.isArray(allPermissions)) return false;

      return allPermissions.some(
        (perm) => perm.resource.toLowerCase() === resource.toLowerCase()
      );
    },
    [allPermissions, departmentRole, isOrgAdmin, loading]
  );

  /**
   * Check multiple permissions (returns true if user has ALL permissions)
   */
  const hasAllPermissions = useCallback(
    (checks: Array<{ resource: string; action: string }>): boolean => {
      if (loading) return false;
      if (isOrgAdmin || departmentRole?.slug === "admin" || departmentRole?.slug === "super_admin") return true;
      
      return checks.every((check) => hasPermission(check.resource, check.action));
    },
    [hasPermission, departmentRole, isOrgAdmin, loading]
  );

  /**
   * Check multiple permissions (returns true if user has ANY permission)
   */
  const hasAnyPermission = useCallback(
    (checks: Array<{ resource: string; action: string }>): boolean => {
      if (loading) return false;
      if (isOrgAdmin || departmentRole?.slug === "admin" || departmentRole?.slug === "super_admin") return true;
      
      return checks.some((check) => hasPermission(check.resource, check.action));
    },
    [hasPermission, departmentRole, isOrgAdmin, loading]
  );

  return {
    loading,
    isOrgAdmin,
    departmentRole,
    allPermissions,
    hasPermission,
    canAccessResource,
    hasAllPermissions,
    hasAnyPermission,
    refetch: fetchPermissions,
  };
}