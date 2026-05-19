"use client";

import { useFormBuilder } from "@/hooks/useFormBuilder";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FieldList() {
  const { fields, selectField, selectedFieldId, removeField, reorderFields } = useFormBuilder();

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    if (fromIndex === dropIndex) return;
    reorderFields(fromIndex, dropIndex);
  };

  return (
    <div className="space-y-3">
      {sortedFields.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          No fields yet • Click quick-add buttons above
        </div>
      ) : (
        sortedFields.map((field, idx) => (
          <div
            key={field.id}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, idx)}
            className={cn(
              "group flex items-center gap-3 p-3 border rounded-lg cursor-move",
              selectedFieldId === field.id
                ? "border-primary bg-primary/5"
                : "hover:border-primary/50 bg-card"
            )}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{field.label}</div>
              <div className="text-xs text-muted-foreground">
                {field.type} • {field.key}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => selectField(field.id)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeField(field.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}