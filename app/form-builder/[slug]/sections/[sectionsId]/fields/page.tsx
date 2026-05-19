// src/app/form-builder/page.tsx
"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import QuickAddFieldButtons from "@/components/form-builder/QuickAddFieldButtons";
import SortableFieldItem from "@/components/form-builder/SortableFieldItem";
import FormFieldEditor from "@/components/form-builder/FormFieldEditor";
import FormPreview from "@/components/form-builder/FormPreview";
import { useFormBuilder } from "@/hooks/useFormBuilder";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PanelLeft, Eye, Save } from "lucide-react"; // ← optional: nice icons
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();

  const formId = params.slug as string;
  const sectionId = params.sectionsId as string;
  const { form, selectedFieldId, reorderFieldsInSection, saveForm } = useFormBuilder();

  const mainSection = form.sections.find((sec) => sec.id === "main");
  const fields = mainSection?.fields.sort((a, b) => a.order - b.order) || [];

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);

    const newFields = arrayMove(fields, oldIndex, newIndex);
    reorderFieldsInSection("main", newFields);
  };
  useEffect(() => {
    // If no sectionId provided, redirect to main section
    if (!sectionId) {
      router.replace(`/form-builder/${formId}/sections/main`);
    }

  }, [formId, sectionId]);
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header – sticky on mobile */}
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Form Builder
            </h1>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
              <Button size="sm" className="gap-1.5" onClick={saveForm}>
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <Tabs defaultValue="builder" className="space-y-6">
            <TabsList className="inline-flex h-10 w-full max-w-md mx-auto border bg-muted/40 backdrop-blur-sm rounded-lg p-1">
              <TabsTrigger value="builder" className="flex-1 text-sm sm:text-base">
                Builder
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1 text-sm sm:text-base">
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="mt-0 focus-visible:outline-none">
              {/* Responsive layout: 
                  mobile → vertical stack 
                  tablet → toolbox left + canvas + editor right 
                  desktop → full 3-column
              */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">
                {/* Toolbox – left sidebar (collapses to top on mobile) */}
                <div className="md:col-span-3 lg:col-span-3 xl:col-span-3">
                <QuickAddFieldButtons />
                </div>

                {/* Canvas – main working area */}
                <div className="md:col-span-4 lg:col-span-4 xl:col-span-4">
                  <div className="bg-card border rounded-xl p-5 sm:p-6 min-h-[60vh] lg:min-h-[70vh] shadow-sm">
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={fields.map((f) => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {fields.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-[50vh] text-center text-muted-foreground">
                            <p className="text-lg font-medium mb-2">
                              Your form is empty
                            </p>
                            <p className="text-sm">
                              Drag fields from the toolbox or click Quick Add
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {fields.map((field) => (
                              <SortableFieldItem
                                key={field.id}
                                field={field}
                                isSelected={selectedFieldId === field.id}
                              />
                            ))}
                          </div>
                        )}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>

                {/* Properties editor – right sidebar  <FormFieldEditor fieldId={selectedFieldId} />  */}
                <div className="md:col-span-5 lg:col-span-5 xl:col-span-5">
                  <div className="bg-card border rounded-xl p-4 shadow-sm sticky md:top-20">
                    {selectedFieldId ? (
                      <FormFieldEditor fieldId={selectedFieldId} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                        <p className="text-base font-medium mb-2">
                          No field selected
                        </p>
                        <p className="text-sm">
                          Click any field in the canvas to edit its properties
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-0 focus-visible:outline-none">
              <div className="bg-card border rounded-xl p-5 sm:p-6 shadow-sm min-h-[70vh]">
                <FormPreview  />
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </DashboardLayout>
  );
}