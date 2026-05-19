import { MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface RemarksFieldProps {
  value: string;
  onChange: (value: string | null) => void;
}

export function RemarksField({ value, onChange }: RemarksFieldProps) {
  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <MessageSquare className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Remarks</p>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Add any extra notes or observations..."
          className="min-h-[80px] bg-background/60 backdrop-blur-sm"
        />
      </div>
    </div>
  );
}