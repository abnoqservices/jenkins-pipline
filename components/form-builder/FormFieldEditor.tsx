// src/components/form-builder/FormFieldEditor.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, Plus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useFormBuilder } from "@/hooks/useFormBuilder";
import { Field, FieldRule } from "@/types/form";
import { fieldSchema } from "@/lib/formSchema";
import { toast } from "@/components/ui/use-toast"; // ← assuming you have shadcn toast

interface FormFieldEditorProps {
  fieldId: string;
}
const getAvailableRules = (fieldType: Field["type"]): { value: string; label: string }[] => {
  switch (fieldType) {
    case "text":
    case "textarea":
      return [
        { value: "required", label: "Required" },
        { value: "minLength", label: "Minimum Length" },
        { value: "maxLength", label: "Maximum Length" },
        { value: "pattern", label: "Pattern (Regex)" },
      ];
    case "email":
      return [
        { value: "required", label: "Required" },
        { value: "minLength", label: "Minimum Length" },
        { value: "maxLength", label: "Maximum Length" },
        { value: "pattern", label: "Pattern (Regex)" },
        { value: "email", label: "Valid Email" },
      ];
    case "number":
    case "range":
      return [
        { value: "required", label: "Required" },
        { value: "min", label: "Minimum Value" },
        { value: "max", label: "Maximum Value" },
        { value: "step", label: "Step" },
      ];
    case "phone":
      return [
        { value: "required", label: "Required" },
        { value: "minLength", label: "Minimum Length (e.g. 10)" },
        { value: "maxLength", label: "Maximum Length" },
        { value: "pattern", label: "Pattern (Regex)" },
      ];
    case "password":
      return [
        { value: "required", label: "Required" },
        { value: "minLength", label: "Minimum Length (e.g. 8)" },
        { value: "maxLength", label: "Maximum Length" },
      ];
    case "date":
    case "time":
      return [{ value: "required", label: "Required" }];
    case "select":
    case "multi_select":
    case "radio":
    case "checkbox":
    case "file":
    case "image":
      return [{ value: "required", label: "Required" }];
    case "rating":
      return [
        { value: "required", label: "Required" },
        { value: "min", label: "Minimum Rating" },
        { value: "max", label: "Maximum Rating" },
      ];
    default:
      return [{ value: "required", label: "Required" }];
  }
};


export default function FormFieldEditor({ fieldId }: FormFieldEditorProps) {
  const { form: builderForm, updateField } = useFormBuilder();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedField = builderForm.sections
    .flatMap((sec) => sec.fields)
    .find((f) => f.id === fieldId);

  if (!selectedField) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-10 text-muted-foreground">
            No field selected or field not found
          </div>
        </CardContent>
      </Card>
    );
  }

  const form = useForm<Field>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      ...selectedField,
      rules: selectedField.rules || [],
      options: selectedField.options || {},
    },
  });

  const { fields: ruleFields, append, remove } = useFieldArray({
    control: form.control,
    name: "rules",
  });

  useEffect(() => {
    form.reset(selectedField);
    setSaveStatus("idle");     // reset status when field changes
    setErrorMessage(null);
  }, [selectedField, form]);

  const onSubmit = async (data: Field) => {
    setSaveStatus("saving");
    setErrorMessage(null);

    try {
      // Simulate small delay (realistic feel) – remove if updateField is sync
      await new Promise((resolve) => setTimeout(resolve, 400));

      // The actual update
      updateField(fieldId, data);

      setSaveStatus("success");
      toast({
        title: "Field saved",
        description: "Your changes have been applied successfully.",
        variant: "default",
      });

      // Optional: auto-hide success after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);

    } catch (err: any) {
      console.error("Field save failed:", err);
      setSaveStatus("error");
      setErrorMessage(err.message || "Failed to save field. Please try again.");

      toast({
        title: "Save failed",
        description: err.message || "Something went wrong while saving the field.",
        variant: "destructive",
      });
    }
  };

  const isChoiceField = ["select", "multi_select", "radio", "checkbox"].includes(selectedField.type);
  const availableRules = getAvailableRules(selectedField.type);

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Edit Field</CardTitle>
        <CardDescription>
          Type: <span className="font-medium capitalize">{selectedField.type}</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Feedback banner */}
            {saveStatus === "success" && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Saved successfully</AlertTitle>
                <AlertDescription>Field changes applied.</AlertDescription>
              </Alert>
            )}

            {saveStatus === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Save failed</AlertTitle>
                <AlertDescription>{errorMessage || "An error occurred. Please try again."}</AlertDescription>
              </Alert>
            )}

            {/* Basic fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

             
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key (identifier) *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>Used in form data (no spaces/special chars recommended)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               </div>
            {/* Required switch */}
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Required field</FormLabel>
                <FormDescription>
                  User must provide a value to submit the form
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={form.watch("is_required")}
                  onCheckedChange={(checked) => form.setValue("is_required", checked, { shouldValidate: true })}
                />
              </FormControl>
            </FormItem>

            {/* Placeholder */}
            {["text", "textarea", "email", "number", "phone", "date", "time", "password", "select", "multi_select"].includes(
              selectedField.type
            ) && (
              <FormField
                control={form.control}
                name="options.placeholder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placeholder text</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="e.g. Enter your name..." />
                    </FormControl>
                    <FormDescription>Hint shown when field is empty</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Choices */}
            {isChoiceField && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/40">
                {/* ... keep your existing choices UI unchanged ... */}
              </div>
            )}

            {/* Rules Section – keep most of your code, just minor cleanup */}
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Validation Rules</Label>
                <Select
                  onValueChange={(ruleType) => {
                    if (ruleType === "required") {
                      form.setValue("is_required", true, { shouldValidate: true });
                    } else {
                      append({
                        type: ruleType,
                        value: ["min", "max", "minLength", "maxLength", "step"].includes(ruleType) ? "0" : "",
                        message: "",
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px] h-8">
                    <SelectValue placeholder="Add rule..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRules.map((rule) => (
                      <SelectItem
                        key={rule.value}
                        value={rule.value}
                        disabled={rule.value === "required" && form.watch("is_required")}
                      >
                        {rule.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {ruleFields.map((ruleField, index) => {
                  const ruleType = form.watch(`rules.${index}.type`);
                  const isRequiredRule = ruleType === "required";

                  return (
                    <div
                      key={ruleField.id}
                      className="flex flex-col sm:flex-row gap-3 items-start sm:items-end border rounded-md p-3 bg-background"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                          {ruleType}
                        </div>

                        {isRequiredRule ? (
                          <div className="flex items-center space-x-2 pt-1">
                            <Switch
                              checked={form.watch("is_required")}
                              onCheckedChange={(checked) => form.setValue("is_required", checked)}
                            />
                            <Label>Required field</Label>
                          </div>
                        ) : (
                          <>
                            <FormField
                              control={form.control}
                              name={`rules.${index}.value`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Value</FormLabel>
                                  <FormControl>
                                    <Input
                                      type={["min", "max", "minLength", "maxLength", "step"].includes(ruleType) ? "number" : "text"}
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`rules.${index}.message`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Error Message</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      value={field.value ?? ""}
                                      placeholder="e.g. Please enter at least 8 characters"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 mt-6 sm:mt-0"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}

                {ruleFields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No custom rules added yet. Select from dropdown above.
                  </p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={saveStatus === "saving" || form.formState.isSubmitting}
              >
                {saveStatus === "saving" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : saveStatus === "success" ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  "Save Field Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}