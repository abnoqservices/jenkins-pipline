// src/components/form-builder/FormPreview.tsx
"use client";

import { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import FieldRenderer from "./FieldRenderer";
import { useFormBuilder } from "@/hooks/useFormBuilder";
import { Field } from "@/types/form";
import { useState } from "react";
import { buildFormValidationSchema } from "@/lib/buildFormValidationSchema";

// ─── Default value helper ────────────────────────────────────────────────
const getDefaultValue = (field: Field): any => {
  switch (field.type) {
    case "multi_select":
    case "checkbox":
    case "multi_select_tags":
      return [];

    case "select":
    case "radio":
    case "dropdown":
      return "";

    case "number":
    case "range":
      return field.options?.min ?? 0;

    case "rating":
      return 0;

    case "file":
    case "image":
    case "signature":
      return null;

    case "date":
    case "time":
    case "datetime":
      return "";

    case "textarea":
    case "text":
    case "email":
    case "phone":
    case "url":
    case "password":
    default:
      return "";
  }
};

const generateDefaultValues = (fields: Field[]) => {
  return fields.reduce((acc, field) => {
    acc[field.key] = getDefaultValue(field);
    return acc;
  }, {} as Record<string, any>);
};

interface FormPreviewProps {
  formId: string;
  sectionId?: string;           // optional now
  fields?: Field[];             // if provided → section-only mode
  sectionTitle?: string;
}

export default function FormPreview({
  formId,
  sectionId,
  fields: propFields,
  sectionTitle: propSectionTitle,
}: FormPreviewProps) {
  const { form: builderForm } = useFormBuilder();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Decide which fields & title to use ───────────────────────────────
  let displayFields: Field[] = [];
  let displayTitle = "Form Preview";
  let isSectionOnlyMode = false;

  if (propFields && propFields.length > 0) {
    // Section-only preview (priority)
    displayFields = propFields;
    displayTitle = propSectionTitle || "Section Preview";
    isSectionOnlyMode = true;
  } else if (builderForm?.sections?.length) {
    // Full form fallback (old behavior)
    displayFields = builderForm.sections.flatMap((s) => s.fields || []);
    displayTitle = builderForm.title || "Full Form Preview";
  }

  const schema = useMemo(
    () => buildFormValidationSchema(displayFields),
    [displayFields]
  );

  const defaultValues = useMemo(
    () => generateDefaultValues(displayFields),
    [displayFields]
  );

  const methods = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting: formIsSubmitting, isSubmitted, isValid },
  } = methods;

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(null);

    try {
      console.log(
        isSectionOnlyMode
          ? `Section ${sectionId || "unknown"} preview submit:`
          : "Full form preview submit:",
        data
      );

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1400));

      setSubmitSuccess(true);
      methods.reset();
    } catch (err) {
      console.error("Preview submission error:", err);
      setSubmitError("Simulated submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasFields = displayFields.length > 0;
  const hasValidationErrors = isSubmitted && !isValid;

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4">
      <Card className="border-2 shadow-xl">
        <CardHeader className="pb-6 border-b">
          <CardTitle className="text-2xl font-bold">{displayTitle}</CardTitle>
          <CardDescription className="text-base mt-2">
            {isSectionOnlyMode
              ? `Section preview • Form #${formId.slice(0, 8)}...`
              : "Full form preview mode"}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8">
          {!hasFields ? (
            <div className="py-12 text-center text-muted-foreground space-y-6">
              <Alert variant="default" className="max-w-lg mx-auto">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>No fields available</AlertTitle>
                <AlertDescription className="mt-3">
                  {propFields === undefined || propFields?.length === 0 ? (
                    <>
                      <p className="mb-3">
                        No fields were passed and full form context is empty.
                      </p>
                      <p className="text-sm opacity-80">
                        Try passing <code>fields</code> prop or add fields in the builder.
                      </p>
                    </>
                  ) : (
                    "This section is empty."
                  )}
                </AlertDescription>
              </Alert>

              {/* Debug hint */}
              {!isSectionOnlyMode && builderForm?.sections?.length === 0 && (
                <div className="text-sm text-muted-foreground mt-4">
                  <p>Tip: Make sure you have added sections and fields in the form builder.</p>
                </div>
              )}
            </div>
          ) : (
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <section className="space-y-6">
                  {displayTitle !== "Form Preview" && (
                    <h3 className="text-xl font-semibold tracking-tight border-b pb-2">
                      {displayTitle}
                    </h3>
                  )}

                  <div className="space-y-8">
                    {displayFields
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <div
                          key={field.id}
                          className="transition-all duration-200 hover:shadow-sm rounded-md p-1"
                        >
                          <FieldRenderer field={field} mode="preview" />
                        </div>
                      ))}
                  </div>
                </section>

                {hasValidationErrors && (
                  <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Please fix the errors</AlertTitle>
                    <AlertDescription>
                      Some fields are invalid — check the highlighted ones.
                    </AlertDescription>
                  </Alert>
                )}

                {submitSuccess && (
                  <Alert className="mt-6 bg-green-50 border-green-200 text-green-800">
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                      {isSectionOnlyMode
                        ? "Section submission simulated successfully."
                        : "Form submission simulated successfully."}
                    </AlertDescription>
                  </Alert>
                )}

                {submitError && (
                  <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                <div className="pt-6 border-t">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto min-w-[200px]"
                    disabled={isSubmitting || formIsSubmitting || (isSubmitted && !isValid)}
                  >
                    {isSubmitting || formIsSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      isSectionOnlyMode ? "Test Section Submit" : "Test Full Form Submit"
                    )}
                  </Button>
                </div>
              </form>
            </FormProvider>
          )}
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground border-t pt-4 flex justify-between">
          <span>Preview mode — data is not saved</span>
          <span>{new Date().toLocaleDateString()}</span>
        </CardFooter>
      </Card>
    </div>
  );
}