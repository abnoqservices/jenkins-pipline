// components/ExtractedDataCard.tsx
"use client";

import { useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";
import { Tag } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import type { CardData, ExtractedDataCardProps } from "./types";
import { EditableRow } from "./EditableRow";
import { CardPreview } from "./CardPreview";
import { CardHeaderActions } from "./CardHeaderActions";
import { ContactFields } from "./ContactFields";
import { AddressFields } from "./AddressFields";
import { RemarksField } from "./RemarksField";
import { SocialLinksSection } from "./SocialLinksSection";
import { showToast } from "@/lib/showToast";
import ScanContactList from "./ScanContactList";
import CameraScanner from "@/components/CameraScanner";

// Contact type
export type Contact = {
  id?: string | number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  designation: string | null;
  website?: string | null;
  full_address?: string | null;
  created_at?: string;
};

interface ExtendedExtractedDataCardProps extends ExtractedDataCardProps {
  onContactSaved?: (contact: Contact) => void;
}

export default function ExtractedDataCard({
  data,
  previewImage,
  onContactSaved,
}: ExtendedExtractedDataCardProps) {
  const [editedData, setEditedData] = useState<CardData>(() => ({
    ...data,
    // Ensure social_handles is always an object to prevent null/undefined errors
    social_handles: data.social_handles ?? {
      linkedin: null,
      twitter: null,
      facebook: null,
      instagram: null,
      // Add other platforms if you support more
    },
  }));

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Track the most recently saved contact
  const [justSavedContact, setJustSavedContact] = useState<Contact | null>(null);

  useEffect(() => {
    setEditedData({
      ...data,
      social_handles: data.social_handles ?? {
        linkedin: null,
        twitter: null,
        facebook: null,
        instagram: null,
      },
    });
    setIsDirty(false);
    setJustSavedContact(null);
  }, [data]);

  const updateField = <K extends keyof CardData>(field: K, value: CardData[K]) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const updateSocial = (platform: keyof CardData["social_handles"], value: string | null) => {
    setEditedData((prev) => ({
      ...prev,
      social_handles: {
        ...(prev.social_handles ?? {}),
        [platform]: value,
      },
    }));
    setIsDirty(true);
  };

  const copyToClipboard = () => {
    const json = JSON.stringify(editedData, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    showToast("JSON copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const resetChanges = () => {
    setEditedData({
      ...data,
      social_handles: data.social_handles ?? {
        linkedin: null,
        twitter: null,
        facebook: null,
        instagram: null,
      },
    });
    setIsDirty(false);
    showToast("Changes discarded", "info");
  };

  const handleSaveContact = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const nameParts = (editedData.person_name || "").trim().split(/\s+/);
      const first_name = nameParts[0] || null;
      const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

      const payload = {
        first_name,
        last_name,
        email: editedData.email || null,
        phone: editedData.phone_numbers?.[0] || null,
        company: editedData.company_name || null,
        contact_type: "ai_detection",
        contact_source: "factors_ai",
        source_metadata: {
          designation: editedData.designation || null,
          website: editedData.website || null,
          full_address: editedData.full_address || null,
          city: editedData.city || null,
          pincode: editedData.pincode || null,
          industry: editedData.industry_field || null,
          remarks: editedData.remarks || null,
          social_handles: editedData.social_handles,
          extraction_method: "business_card_ai",
        },
        status: "active",
        deduplicate: true,
      };

      const response = await axiosClient.post("/contacts", payload);

      const savedContactFromBackend = response.data?.data || response.data;

      const contactToAdd: Contact = {
        id: savedContactFromBackend?.id || Date.now(),
        first_name,
        last_name,
        email: editedData.email || null,
        phone: editedData.phone_numbers?.[0] || null,
        company: editedData.company_name || null,
        designation: editedData.designation || null,
        website: editedData.website || null,
        full_address: editedData.full_address || null,
        created_at: new Date().toISOString(),
      };

      setJustSavedContact(contactToAdd);
      showToast("Contact saved successfully", "success");
      onContactSaved?.(contactToAdd);

    } catch (error: any) {
      let msg = "Failed to save contact.";
      if (error.response) {
        const { status, data } = error.response;
        if (status === 422) {
          msg = Object.values(data.errors || {}).flat().join("\n") || "Validation failed";
        } else if (status === 409 || data?.message?.toLowerCase().includes("duplicate")) {
          msg = "Contact already exists";
        } else if (data?.message) {
          msg = data.message;
        }
      }
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  // Safe check for social handles
  const hasSocial = editedData.social_handles 
    ? Object.values(editedData.social_handles).some(Boolean)
    : false;

  return (
    <div className="space-y-6">
      <CameraScanner />
      <CardPreview previewImage={previewImage} />

      <div className="rounded-2xl shadow-elevated border-0 overflow-hidden">
        <CardHeader className="gradient-primary text-primary-foreground p-6">
          <CardHeaderActions
            copied={copied}
            isDirty={isDirty}
            saving={saving}
            onCopy={copyToClipboard}
            onReset={resetChanges}
            onSave={handleSaveContact}
          />
        </CardHeader>

        <CardContent className="p-6 space-y-5 gradient-card">
          <ContactFields data={editedData} updateField={updateField} />
          <AddressFields data={editedData} updateField={updateField} />

          <EditableRow
            icon={Tag}
            label="Industry / Field"
            value={editedData.industry_field ?? null}
            onChange={(v) => updateField("industry_field", v || null)}
          />

          <RemarksField
            value={editedData.remarks ?? ""}
            onChange={(v) => updateField("remarks", v || null)}
          />

          {(hasSocial || isDirty) && (
            <SocialLinksSection 
              social={editedData.social_handles} 
              updateSocial={updateSocial} 
            />
          )}
        </CardContent>

        <ScanContactList newContact={justSavedContact} />
      </div>
    </div>
  );
}