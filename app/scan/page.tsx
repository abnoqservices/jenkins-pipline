"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CameraScanner from "@/components/CameraScanner";
import ExtractedDataCard, { Contact } from "@/components/extracted-data/ExtractedDataCard";
import ScanContactList from "@/components/extracted-data/ScanContactList"; // ← assuming this exists

import { ScanLine, Database, List, Sparkles, Zap, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/dashboard/layout";

const Index = () => {
  const router = useRouter();

  // Controls refresh of the saved contacts list
  const [listRefreshKey, setListRefreshKey] = useState(0);

  // Current active tab
  const [activeTab, setActiveTab] = useState("scan");

  // Latest scanned & extracted contact data (passed to ExtractedDataCard)
  const [latestExtractedData, setLatestExtractedData] = useState<any>(null);
  const [latestPreviewImage, setLatestPreviewImage] = useState<string | null>(null);

  // When a card is successfully scanned → show result in Scan tab
  const handleCardScanned = (extractedData: any, previewImage?: string) => {
    setLatestExtractedData(extractedData);
    setLatestPreviewImage(previewImage || null);
    // Stay on scan tab (already there)
  };

  // When user saves contact from ExtractedDataCard
  const handleContactSaved = (savedContact: Contact) => {
    // Trigger refresh of the list tab
    setListRefreshKey((prev) => prev + 1);
    // Optional: show success message, stay on scan tab so user can scan next card
    // You can also do: setActiveTab("saved"); if you prefer auto-switch
  };

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-6 md:py-10">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12 animate-slide-up">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4 leading-tight">
            Scan Cards with <span className="text-gradient">AI Precision</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            Extract data from visiting cards instantly. Powered by advanced AI.
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as string)}
          className="max-w-5xl mx-auto"
        >
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="scan">
              <ScanLine className="mr-2 h-4 w-4" />
              Scan
            </TabsTrigger>
            <TabsTrigger value="saved">
              <List className="mr-2 h-4 w-4" />
              Saved
            </TabsTrigger>
          
          </TabsList>

          {/* ── Scan Tab ── */}
          <TabsContent value="scan" className="animate-fade-in space-y-8">
            <CameraScanner onCardScanned={handleCardScanned} />

            {/* Show extracted data card only after scan happened */}
            {latestExtractedData && (
              <div className="mt-8">
                <ExtractedDataCard
                  data={latestExtractedData}
                  previewImage={latestPreviewImage}
                  onContactSaved={handleContactSaved}
                />
              </div>
            )}

            {/* Features grid */}
            <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  icon: ScanLine,
                  title: "Camera Capture",
                  description: "Scan directly with real-time preview",
                  color: "from-primary/20 to-primary/5",
                },
                {
                  icon: Sparkles,
                  title: "AI-Powered OCR",
                  description: "High-accuracy text & field detection",
                  color: "from-accent/20 to-accent/5",
                },
                {
                  icon: Zap,
                  title: "Instant Save",
                  description: "Saved contacts appear in your list instantly",
                  color: "from-primary/20 to-accent/5",
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className={`group relative p-6 rounded-2xl bg-gradient-to-br ${feature.color} border border-border/50 hover-lift stagger-${
                    idx + 1
                  } opacity-0 animate-fade-in`}
                >
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── Saved / List Tab ── */}
          <TabsContent value="saved" className="animate-fade-in">
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="p-5 border-b">
                <h3 className="text-xl font-semibold">Saved Contacts</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  All business cards you've scanned and saved
                </p>
              </div>

              <ScanContactList refreshKey={listRefreshKey} />
            </div>
          </TabsContent>

         
        </Tabs>
      </main>
    </DashboardLayout>
  );
};

export default Index;