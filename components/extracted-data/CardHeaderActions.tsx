import { Copy, Check, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";

interface CardHeaderActionsProps {
  copied: boolean;
  isDirty: boolean;
  saving: boolean;
  onCopy: () => void;
  onReset: () => void;
  onSave: () => void;
}

export function CardHeaderActions({
  copied,
  isDirty,
  saving,
  onCopy,
  onReset,
  onSave,
}: CardHeaderActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <CardTitle className="text-2xl font-heading mb-1">Extracted & Editable Data</CardTitle>
        <p className="text-primary-foreground/70 text-sm">Review and edit before saving</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={onCopy}
          className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
        >
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied!" : "Copy JSON"}
        </Button>

        {isDirty && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        )}

        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          disabled={saving}
          className="min-w-[140px]"
        >
          {saving ? <>Saving...</> : <> <Save className="w-4 h-4 mr-2" /> Save Contact </>}
        </Button>
      </div>
    </div>
  );
}