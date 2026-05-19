'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/components/ui/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

interface Field {
  tempId: string;
  type: string;
  label: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  description?: string;
  options?: { label: string; value: string }[];
  rules?: { type: string; value?: any; message?: string }[];
}

interface Section {
  tempId: string;
  title?: string;
  description?: string;
  fields: Field[];
}

interface FormData {
  name?: string;
  description?: string;
}

interface LivePreviewProps {
  formData: FormData;
  sections: Section[];
  selectedField?: { sectionTempId: string; fieldTempId: string };
  onFieldSelect?: (sectionTempId: string, fieldTempId: string) => void;
}

export default function LivePreview({
  formData,
  sections,
  selectedField,
  onFieldSelect,
}: LivePreviewProps) {
  // Stable key to detect structure changes
  const formStructureKey = JSON.stringify(
    sections.map((s) => ({
      id: s.tempId,
      fields: s.fields.map((f) => ({
        id: f.tempId,
        type: f.type,
        name: f.name || f.tempId,
      })),
    }))
  );

  const createFieldSchema = (field: Field): z.ZodTypeAny => {
    const isRequired = field.required || field.rules?.some((r) => r.type === 'required');
    let schema: z.ZodTypeAny;

    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'password':
      case 'phone':
      case 'url':
        schema = z.string();
        break;

      case 'email':
        schema = z.string().email({ message: 'Please enter a valid email address' });
        break;

      case 'number':
      case 'rating':
      case 'range':
        schema = z.coerce.number();
        break;

      case 'date':
      case 'datetime':
        schema = z.coerce.date({ invalid_type_error: 'Invalid date' });
        break;

      case 'time':
        schema = z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:MM)');
        break;

      case 'select':
      case 'radio':
        schema = z.string();
        break;

      case 'multi_select':
      case 'checkbox':
        schema = z.array(z.string());
        break;

      case 'toggle':
        schema = z.boolean();
        break;

      case 'file':
      case 'image':
        schema = z.any().optional();
        break;

      case 'color':
        schema = z.string().regex(/^#[0-9A-Fa-f]{6}$/i, 'Invalid hex color');
        break;

      case 'hidden':
        return z.any().optional();

      default:
        schema = z.string();
    }

    // Apply custom rules
    if (['text', 'textarea', 'password', 'email', 'url', 'phone'].includes(field.type)) {
      field.rules?.forEach((rule) => {
        if (rule.type === 'min_length') {
          schema = (schema as z.ZodString).min(rule.value ?? 0, rule.message);
        }
        if (rule.type === 'max_length') {
          schema = (schema as z.ZodString).max(rule.value ?? Infinity, rule.message);
        }
        if (rule.type === 'regex' && rule.value) {
          schema = (schema as z.ZodString).regex(new RegExp(rule.value), rule.message);
        }
      });
    }

    if (['number', 'rating', 'range'].includes(field.type)) {
      field.rules?.forEach((rule) => {
        if (rule.type === 'min') schema = (schema as z.ZodNumber).min(rule.value, rule.message);
        if (rule.type === 'max') schema = (schema as z.ZodNumber).max(rule.value, rule.message);
      });
    }

    // Required logic
    if (isRequired) {
      if (['multi_select', 'checkbox'].includes(field.type)) {
        schema = (schema as z.ZodArray<any>).nonempty({ message: 'At least one option is required' });
      } else if (['select', 'radio'].includes(field.type)) {
        schema = (schema as z.ZodString).refine((v) => v && v !== '', { message: 'Required' });
      } else if (['file', 'image'].includes(field.type)) {
        schema = schema.refine(
          (v) => v && (v instanceof FileList ? v.length > 0 : true),
          { message: 'File is required' }
        );
      } else {
        schema = schema.refine((v) => v !== undefined && v !== null && v !== '', {
          message: 'Required',
        });
      }
    } else {
      schema = schema.optional().nullable();
    }

    return schema;
  };

  const buildSchema = () => {
    const shape: Record<string, z.ZodTypeAny> = {};
    sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.type === 'hidden') return;
        const name = field.name || field.tempId;
        shape[name] = createFieldSchema(field);
      });
    });
    return z.object(shape);
  };

  const schema = buildSchema();

  const form = useForm<any>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: getSafeDefaultValues(sections),
  });

  const { register, handleSubmit, control, formState: { errors }, watch, setValue, reset } = form;

  function getSafeDefaultValues(sections: Section[]) {
    const defaults: Record<string, any> = {};

    sections.forEach((section) => {
      section.fields.forEach((field) => {
        const name = field.name || field.tempId;

        if (['text', 'textarea', 'password', 'email', 'url', 'phone', 'number', 'date', 'time', 'datetime', 'color'].includes(field.type)) {
          defaults[name] = '';
        } else if (['select', 'radio'].includes(field.type)) {
          defaults[name] = '';
        } else if (['multi_select', 'checkbox'].includes(field.type)) {
          defaults[name] = [];
        } else if (field.type === 'toggle') {
          defaults[name] = false;
        }
        // file/image → leave undefined
      });
    });

    return defaults;
  }

  // Reset when form structure changes
  useEffect(() => {
    reset(getSafeDefaultValues(sections), {
      keepDefaultValues: false,
      keepValues: false,
      keepErrors: false,
      keepDirty: false,
      keepIsSubmitted: false,
      keepTouched: false,
      keepIsValid: false,
    });
  }, [formStructureKey, reset]);

  // Fix value type mismatches between single ↔ multi fields
  useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (!name) return;

      const field = sections
        .flatMap((s) => s.fields)
        .find((f) => (f.name || f.tempId) === name);

      if (!field) return;

      const current = values[name];

      if (['select', 'radio'].includes(field.type) && Array.isArray(current)) {
        setValue(name, current[0] ?? '', { shouldValidate: true });
      }

      if (['multi_select', 'checkbox'].includes(field.type) && !Array.isArray(current) && current != null) {
        setValue(name, [String(current)], { shouldValidate: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue, sections]);

  const onSubmit = (data: any) => {
    toast({
      title: "Form Submitted (Preview)",
      description: "This is a simulation — no data was actually sent.",
    });
    console.log('Submitted preview data:', data);
  };

  const isSelected = (sectionId: string, fieldId: string) =>
    selectedField?.sectionTempId === sectionId && selectedField?.fieldTempId === fieldId;

  const renderField = (field: Field, sectionTempId: string) => {
    const name = field.name || field.tempId;
    const error = errors[name];
    const isReq = field.required || field.rules?.some((r) => r.type === 'required');

    const labelContent = (
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          {field.label || 'Input Field'}
          {isReq && <span className="text-red-600 ml-1.5">*</span>}
        </Label>
        {field.description && (
          <span className="text-xs text-muted-foreground">{field.description}</span>
        )}
      </div>
    );

    const commonClasses = `
      transition-all duration-200
      ${isSelected(sectionTempId, field.tempId)
        ? 'border-2 border-primary bg-primary/5'
        : 'border-border hover:border-primary/40 hover:bg-primary/5'}
      rounded-lg cursor-pointer
    `;

    switch (field.type) {
      // ── Text-like inputs ───────────────────────────────────────
      case 'text':
      case 'email':
      case 'url':
      case 'password':
      case 'phone':
      case 'number':
      case 'date':
      case 'time':
      case 'datetime':
      case 'color': {
        const typeMap: Record<string, string> = {
          email: 'email',
          phone: 'tel',
          url: 'url',
          password: 'password',
          number: 'number',
          date: 'date',
          time: 'time',
          datetime: 'datetime-local',
          color: 'color',
          text: 'text',
        };

        return (
          <div className={commonClasses} onClick={() => onFieldSelect?.(sectionTempId, field.tempId)}>
            {labelContent}
            <div className="mt-3">
              <Input
                type={typeMap[field.type] || 'text'}
                placeholder={field.placeholder}
                {...register(name)}
              />
              {error && <p className="mt-1.5 text-sm text-destructive">{error.message as string}</p>}
            </div>
          </div>
        );
      }

      case 'textarea':
        return (
          <div className={commonClasses} onClick={() => onFieldSelect?.(sectionTempId, field.tempId)}>
            {labelContent}
            <div className="mt-3">
              <Textarea
                placeholder={field.placeholder}
                {...register(name)}
              />
              {error && <p className="mt-1.5 text-sm text-destructive">{error.message as string}</p>}
            </div>
          </div>
        );

      // ── Select / Radio / Checkbox ──────────────────────────────
      case 'select':
        return (
          <div className={commonClasses} onClick={() => onFieldSelect?.(sectionTempId, field.tempId)}>
            {labelContent}
            <div className="mt-3">
              <Controller
                name={name}
                control={control}
                render={({ field: rhf }) => {
                  let safeValue = '';
                  if (typeof rhf.value === 'string') safeValue = rhf.value;
                  else if (Array.isArray(rhf.value)) safeValue = rhf.value[0] ?? '';
                  else if (rhf.value != null) safeValue = String(rhf.value);

                  return (
                    <Select onValueChange={rhf.onChange} value={safeValue}>
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || 'Select option...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {error && <p className="mt-1.5 text-sm text-destructive">{error.message as string}</p>}
            </div>
          </div>
        );

        case 'radio':
          return (
            <div
              className={commonClasses}
              onClick={() => onFieldSelect?.(sectionTempId, field.tempId)}
            >
              {labelContent}
        
              <Controller
                name={name}
                control={control}
                render={({ field: controllerField }) => (
                  <RadioGroup
                    onValueChange={controllerField.onChange}
                    value={controllerField.value}
                    className="mt-3 space-y-2.5"
                  >
                    {field.options?.map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2.5">
                        <RadioGroupItem
                          value={opt.value}
                          id={`${name}-${opt.value}`}
                        />
                        <Label htmlFor={`${name}-${opt.value}`}>
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              />
        
              {error && (
                <p className="mt-2 text-sm text-destructive">
                  {error.message as string}
                </p>
              )}
            </div>
          );

      case 'multi_select':
      case 'checkbox':
        return (
          <div className={commonClasses} onClick={() => onFieldSelect?.(sectionTempId, field.tempId)}>
            {labelContent}
            <div className="mt-1 space-y-2.5">
              {field.options?.map((opt) => {
                const checked = (watch(name) || []).includes(opt.value);
                return (
                  <div key={opt.value} className="flex items-center space-x-2.5">
                    <Checkbox
                      id={`${name}-${opt.value}`}
                      checked={checked}
                      onCheckedChange={(checked) => {
                        const current = watch(name) || [];
                        setValue(
                          name,
                          checked ? [...current, opt.value] : current.filter((v) => v !== opt.value),
                          { shouldValidate: true }
                        );
                      }}
                    />
                    <Label htmlFor={`${name}-${opt.value}`}>{opt.label}</Label>
                  </div>
                );
              })}
            </div>
            {error && <p className="mt-2 text-sm text-destructive">{error.message as string}</p>}
          </div>
        );

      case 'toggle':
        return (
          <div className={commonClasses} onClick={() => onFieldSelect?.(sectionTempId, field.tempId)}>
            <div className="flex items-center justify-between">
              {labelContent}
              <Switch
                checked={watch(name) ?? false}
                onCheckedChange={(checked) => setValue(name, checked, { shouldValidate: true })}
              />
            </div>
            {error && <p className="mt-1.5 text-sm text-destructive">{error.message as string}</p>}
          </div>
        );
        
        case 'text': {
          return (
            <div className={commonClasses} onClick={() => onFieldSelect?.(sectionTempId, field.tempId)}>
              {labelContent}
              <div className="mt-3">
                <Input
                  type="text"
                  placeholder={field.placeholder}
                  {...register(name)}
                />
                {error && <p className="mt-1.5 text-sm text-destructive">{error.message as string}</p>}
              </div>
            </div>
          );
        }
      case 'file':
      case 'image':
        return (
          <div className={commonClasses} onClick={() => onFieldSelect?.(sectionTempId, field.tempId)}>
            {labelContent}
            <div className="mt-3 border-2 border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground bg-muted/30">
              {field.type === 'image' ? 'Image upload area' : 'File upload area'}
              <br />
              (preview simulation — click area to edit field)
            </div>
            {error && <p className="mt-2 text-sm text-destructive">{error.message as string}</p>}
          </div>
        );

      default:
        return (
          <div className={commonClasses} onClick={() => onFieldSelect?.(sectionTempId, field.tempId)}>
            <p className="text-muted-foreground italic">Unsupported field type: {field.type}</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Form Preview</CardTitle>
          <CardDescription>Interact with the form — validation works in real-time</CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 max-w-2xl mx-auto">
            <div className="text-center space-y-3 pb-8">
              <h1 className="text-3xl font-bold">{formData.name || 'Untitled Form'}</h1>
              {formData.description && (
                <p className="text-muted-foreground">{formData.description}</p>
              )}
            </div>

            {sections.map((section) => (
              <div key={section.tempId} className="mb-10">
                {section.title && (
                  <h3 className="text-xl font-semibold mb-5">{section.title}</h3>
                )}

                <div className="space-y-6">
                  {section.fields.map((field) => (
                    <React.Fragment key={field.tempId}>
                      {renderField(field, section.tempId)}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-10">
              <Button type="submit" size="lg" className="w-full">
                Submit Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}