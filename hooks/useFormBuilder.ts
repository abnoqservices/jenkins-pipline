// src/hooks/useFormBuilder.ts
import { create } from 'zustand';
import { Form, Field, FormSection } from '@/types/form';

// ──────────────────────────────────────────────
// NO HOOKS allowed here – this runs only once at module load
// ──────────────────────────────────────────────

interface FormBuilderState {
  form: Form;
  selectedFieldId: string | null;
  setForm: (form: Form) => void;
  addField: (sectionId: string | null, newField: Field) => void;
  updateField: (fieldId: string, updates: Partial<Field>) => void;
  removeField: (fieldId: string) => void;
  reorderFieldsInSection: (sectionId: string, newFields: Field[]) => void;
  selectField: (fieldId: string | null) => void;
  saveForm: () => void;
}

export const useFormBuilder = create<FormBuilderState>((set, get) => ({
  form: {
    name: 'My New Form',
    sections: [{ id: 'main', title: 'Main Section', description: '', order: 0, fields: [] }],
  },
  selectedFieldId: null,

  setForm: (form) => set({ form }),

  addField: (sectionId, newField) => {
    set((state) => {
      const sections = state.form.sections.map((sec) => {
        if (sec.id === sectionId) {
          const fields = [...sec.fields, { ...newField, order: sec.fields.length }];
          return { ...sec, fields };
        }
        return sec;
      });
      return { form: { ...state.form, sections } };
    });
    set({ selectedFieldId: newField.id });
  },

  updateField: (fieldId, updates) => {
    set((state) => {
      const sections = state.form.sections.map((sec) => ({
        ...sec,
        fields: sec.fields.map((f) =>
          f.id === fieldId ? { ...f, ...updates } : f
        ),
      }));
      return { form: { ...state.form, sections } };
    });
  },

  removeField: (fieldId) => {
    set((state) => {
      const sections = state.form.sections.map((sec) => ({
        ...sec,
        fields: sec.fields.filter((f) => f.id !== fieldId).map((f, i) => ({ ...f, order: i })),
      }));
      return { form: { ...state.form, sections }, selectedFieldId: null };
    });
  },

  reorderFieldsInSection: (sectionId, newFields) => {
    set((state) => {
      const sections = state.form.sections.map((sec) => {
        if (sec.id === sectionId) {
          return { ...sec, fields: newFields.map((f, i) => ({ ...f, order: i })) };
        }
        return sec;
      });
      return { form: { ...state.form, sections } };
    });
  },

  selectField: (selectedFieldId) => set({ selectedFieldId }),

  saveForm: () => {
    const form = get().form;
    console.log('Saved Form JSON:', JSON.stringify(form, null, 2));
    // TODO: Send to API here (if you want full form save later)
  },
}));