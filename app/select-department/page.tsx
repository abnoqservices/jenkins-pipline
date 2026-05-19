"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Loader2 } from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { useLabels } from '@/app/context/TenantLabelsContext';
interface Department {
  id: number;
  name: string;
  description?: string;
}

export default function SelectDepartmentPage() {
  const router = useRouter();
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selecting, setSelecting] = React.useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState<number | null>(null);
  const { getLabel, labels } = useLabels();
  const handleSelectDepartment = React.useCallback(async (departmentId: number | null, autoSelect = false) => {
    if (selecting) return;

    setSelecting(true);
    try {
      const response = await axiosClient.post("/auth/select-department", {
        department_id: departmentId,
      });

      if (response.data.success) {
        // Update token first
        const newToken = response.data.data.access_token;
        localStorage.setItem("token", newToken);
        
        // Store department info
        if (departmentId) {
          localStorage.setItem("selectedDepartmentId", departmentId.toString());
          const dept = departments.find(d => d.id === departmentId);
          if (dept) {
            localStorage.setItem("selectedDepartmentName", dept.name);
          }
        }
        
        // Clear login data after storing token
        localStorage.removeItem("loginData");
        
        if (!autoSelect) {
          showToast(`${getLabel('label.department')} selected successfully`, "success");
        }
        
        // Use window.location to ensure a full reload and proper token state
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Failed to select department",
        "error"
      );
      setSelecting(false);
    }
  }, [selecting, departments, router]);

  React.useEffect(() => {
    // Get departments from localStorage (set during login)
    const loginData = localStorage.getItem("loginData");
    if (loginData) {
      try {
        const data = JSON.parse(loginData);
        if (data.departments && Array.isArray(data.departments)) {
          const deptList = data.departments;
          setDepartments(deptList);
          
          // If only one department, auto-select it
          if (deptList.length === 1) {
            const singleDeptId = deptList[0].id;
            handleSelectDepartment(singleDeptId, true);
            return;
          }
        } else {
          // No departments, go to dashboard
          router.push("/dashboard");
          return;
        }
      } catch (e) {
        console.error("Error parsing login data:", e);
        router.push("/signin");
        return;
      }
    } else {
      router.push("/signin");
      return;
    }
    setLoading(false);
  }, [handleSelectDepartment, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (departments.length === 0 && !selecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No {getLabel('label.department')}</CardTitle>
            <CardDescription>
              You are not a member of any {getLabel('label.department')}. Please contact your administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/signin")} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Select {getLabel('label.department')}</CardTitle>
          <CardDescription>
            Please select a {getLabel('label.department')} to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {departments.map((department) => (
            <Button
              key={department.id}
              variant={selectedDepartmentId === department.id ? "default" : "outline"}
              className="w-full justify-start h-auto py-4 px-4"
              onClick={() => handleSelectDepartment(department.id)}
              disabled={selecting}
            >
              <div className="text-left flex-1">
                <div className="font-semibold">{department.name}</div>
                {department.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {department.description}
                  </div>
                )}
              </div>
              {selecting && selectedDepartmentId === department.id && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
