import { useState } from "react";
import { Check, Tag, MessageSquare, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDUSTRY_FIELDS } from "@/lib/industry-fields";

interface CardFieldSelectionProps {
  onSave: (industryField: string | null, remarks: string | null) => Promise<void>;
  onSkip: () => void;
}

const CardFieldSelection = ({ onSave, onSkip }: CardFieldSelectionProps) => {
  const [industryField, setIndustryField] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(
        industryField || null,
        remarks.trim() || null
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
   
    <div className="shadow-elevated border-0 animate-slide-up">
     <Card>
      <CardHeader className="gradient-primary text-white">
        <CardTitle className="text-xl font-heading flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Add Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Industry Field Selection */}
        <div className="space-y-2">
          <Label htmlFor="industry" className="text-sm font-medium flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Industry / Field
          </Label>
          <Select value={industryField} onValueChange={setIndustryField}>
            <SelectTrigger id="industry" className="w-full">
              <SelectValue placeholder="Select an industry..." />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {INDUSTRY_FIELDS.map((field) => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Remarks */}
        <div className="space-y-2">
          <Label htmlFor="remarks" className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Remarks / Notes
          </Label>
          <Textarea
            id="remarks"
            placeholder="Add any notes about this contact..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={isSaving}
            className="flex-1"
          >
            Skip
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 gradient-primary"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Details
              </>
            )}
          </Button>
        </div>
      </CardContent>
      </Card>
    </div>
   
  );
};

export default CardFieldSelection;
