import {
    Building2, User, Briefcase, Phone, Mail, Globe, MapPin
  } from "lucide-react";
  import { EditableRow } from "./EditableRow";
  import type { CardData } from "./types";
  
  interface ContactFieldsProps {
    data: CardData;
    updateField: <K extends keyof CardData>(field: K, value: CardData[K]) => void;
  }
  
  export function ContactFields({ data, updateField }: ContactFieldsProps) {
    return (
      <>
        <EditableRow
          icon={Building2}
          label="Company"
          value={data.company_name}
          onChange={(v) => updateField("company_name", v || null)}
        />
        <EditableRow
          icon={User}
          label="Full Name"
          value={data.person_name}
          onChange={(v) => updateField("person_name", v || null)}
        />
        <EditableRow
          icon={Briefcase}
          label="Designation"
          value={data.designation}
          onChange={(v) => updateField("designation", v || null)}
        />
        <EditableRow
          icon={Phone}
          label="Phone"
          value={data.phone_numbers?.[0] ?? null}
          onChange={(v) => updateField("phone_numbers", v ? [v] : [])}
          type="tel"
        />
        <EditableRow
          icon={Mail}
          label="Email"
          value={data.email}
          onChange={(v) => updateField("email", v || null)}
          type="email"
        />
        <EditableRow
          icon={Globe}
          label="Website"
          value={data.website}
          onChange={(v) => updateField("website", v || null)}
          type="url"
        />
        <EditableRow
          icon={MapPin}
          label="Full Address"
          value={data.full_address}
          onChange={(v) => updateField("full_address", v || null)}
        />
      </>
    );
  }