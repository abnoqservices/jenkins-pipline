import { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SocialLinkEditableProps {
  icon: LucideIcon;
  url: string | null;
  label: string;
  onChange: (value: string | null) => void;
}

export function SocialLinkEditable({
  icon: Icon,
  url,
  label,
  onChange,
}: SocialLinkEditableProps) {
  return (
    <div className="flex-1 min-w-[220px]">
      <div className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all">
        <Icon className="w-4 h-4 text-primary" />
        <Input
          value={url ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={`${label} URL`}
          className="border-0 bg-transparent focus-visible:ring-0 p-0 h-auto text-sm"
        />
      </div>
    </div>
  );
}