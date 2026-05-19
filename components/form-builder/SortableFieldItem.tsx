// src/components/form-builder/SortableFieldItem.tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import FieldRenderer from "./FieldRenderer";
import { Field } from "@/types/form";
import { useFormBuilder } from "@/hooks/useFormBuilder";
import { Button } from "@/components/ui/button";

interface SortableFieldItemProps {
  field: Field;
  isSelected: boolean;
}

export default function SortableFieldItem({ field, isSelected }: SortableFieldItemProps) {
  const { selectField, removeField } = useFormBuilder();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative mb-4 rounded-lg border p-4 bg-white ${isSelected ? "border-primary shadow-md" : "border-gray-200 hover:border-gray-400"}`}
      onClick={() => selectField(field.id)}
    >
      <div
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab opacity-0 group-hover:opacity-100"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-gray-500" />
      </div>
      <FieldRenderer field={field} mode="builder" />
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          removeField(field.id);
        }}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}