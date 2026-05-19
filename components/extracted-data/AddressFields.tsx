import { MapPin } from "lucide-react";
import { EditableRow } from "./EditableRow";
import type { CardData } from "./types";

interface AddressFieldsProps {
  data: CardData;
  updateField: <K extends keyof CardData>(field: K, value: CardData[K]) => void;
}

export function AddressFields({ data, updateField }: AddressFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <EditableRow
        icon={MapPin}
        label="City"
        value={data.city}
        onChange={(v) => updateField("city", v || null)}
      />
      <EditableRow
        icon={MapPin}
        label="Pincode"
        value={data.pincode}
        onChange={(v) => updateField("pincode", v || null)}
      />
    </div>
  );
}