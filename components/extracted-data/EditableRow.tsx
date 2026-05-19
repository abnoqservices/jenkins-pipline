import { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

type InputType = "text" | "tel" | "email" | "url";

interface EditableRowProps {
  icon: LucideIcon;
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  type?: InputType;
}

export function EditableRow({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: EditableRowProps) {
  // Hide if null and not being edited
  if (value === null) return null;

  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 transition-all hover:border-primary/30 hover:shadow-subtle">
      <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
  <div className="relative">
    <Input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      type={type}
      className="bg-white backdrop-blur-sm pr-10"
    />
    <svg 
      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
      width="16" 
      height="16"
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  </div>
</div>
    </div>
  );
}