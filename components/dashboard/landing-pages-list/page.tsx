"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, Plus, Calendar, MoreVertical } from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Config = {
  id: number;
  category: string;
  template: string;
  sections_count: number;
  created_at: string;
  updated_at: string;
};

interface LandingPagesListProps {
  showCreateButton?: boolean;
  maxItems?: number;
  className?: string;
}

export default function LandingPagesList({
  showCreateButton = true,
  maxItems,
  className = "",
}: LandingPagesListProps) {
  const [configs, setConfigs] = React.useState<Config[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const router = useRouter();

  const fetchConfigs = async () => {
    try {
      const deptId = localStorage.getItem("selectedDepartmentId");
      if (!deptId) return;

      const res = await axiosClient.get("/landing-page/global/list", {
        params: { department_id: deptId },
      });

      if (res.data.success) {
        let data = res.data.data;
        if (maxItems) data = data.slice(0, maxItems);
        setConfigs(data);
      }
    } catch (error) {
      showToast("Failed to load landing page configs", "error");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchConfigs();
  }, [maxItems]);

  const handleEdit = (config: Config) => {
    router.push(
      `/global-landing-page?config_id=${config.id}&category=${config.category}&template=${config.template}`
    );
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await axiosClient.delete(`/landing-page/global/${deleteId}`);
      showToast("Landing page config deleted successfully", "success");
      fetchConfigs(); // Refresh list
    } catch (error) {
      showToast("Failed to delete config", "error");
    } finally {
      setDeleteId(null);
    }
  };

  const handleCreateNew = () => {
    router.push("/global-landing-page");
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Landing Pages</h2>
        {showCreateButton && (
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        )}
      </div>

      {configs.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl">
          <p className="text-muted-foreground mb-4">No landing page configs found</p>
          {showCreateButton && (
            <Button onClick={handleCreateNew}>Create Your First Config</Button>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium capitalize">
                      {config.category}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {config.template}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {config.sections_count}
                        <span className="text-xs text-muted-foreground">sections</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {config.updated_at}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(config)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(config.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  landing page configuration and all its sections.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}