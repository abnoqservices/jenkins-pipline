// components/ScanContactList.tsx
"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Building, MapPin, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { Contact } from "./ExtractedDataCard"; // Import the Contact type

interface ScanContactListProps {
  newContact?: Contact | null;
  // Optional: if you want the parent to clear the newContact after processing
  // onContactProcessed?: () => void;
}

export default function ScanContactList({
  newContact,
  // onContactProcessed,
}: ScanContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true); // simulate initial load

  // Simulate fetching initial contacts (replace with real API call if needed)
  useEffect(() => {
    // Fake delay + dummy data for demo
    setTimeout(() => {
      setContacts([]);
      setIsLoading(false);
    }, 1200);
  }, []);

  // When a new contact is saved → add it to the list
  useEffect(() => {
    if (newContact) {
      setContacts((prev) => {
        // Prevent duplicate by checking id (if real backend id exists)
        const exists = newContact.id && prev.some((c) => c.id === newContact.id);
        if (exists) return prev;

        // Add new contact at the beginning (newest first)
        return [newContact, ...prev];
      });

      // Optional: tell parent component we've processed it (so it can clear newContact)
      // onContactProcessed?.();
    }
  }, [newContact]);

  // Format date nicely (you can use date-fns or luxon instead)
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Recent Contacts</h3>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 border-t">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        Recent Saved Contacts
        <Badge variant="outline" className="text-xs">
          {contacts.length}
        </Badge>
      </h3>

      {contacts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No contacts saved yet. Save your first extracted contact!
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {contacts.map((contact) => (
            <Card key={contact.id ?? `${contact.first_name}-${contact.phone}`} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {(contact.first_name?.[0] || "") + (contact.last_name?.[0] || "")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </h4>
                        {contact.designation && contact.company && (
                          <p className="text-sm text-muted-foreground">
                            {contact.designation} @ {contact.company}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(contact.created_at)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.company && !contact.designation && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{contact.company}</span>
                        </div>
                      )}
                      {contact.full_address && (
                        <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{contact.full_address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}