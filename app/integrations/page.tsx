"use client";
import { useState, useEffect } from 'react';
import { DashboardLayout } from "@/components/dashboard/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showToast } from "@/lib/showToast";
import { HubSpotIntegration } from '@/components/integrations/HubSpotIntegration'; // Adjust path
import { WhatsAppIntegration } from '@/components/integrations/WhatsAppIntegration'; // Adjust path
import { GoogleIntegration } from '@/components/integrations/GoogleIntegration'; // Adjust path
import { SmtpIntegration } from '@/components/integrations/SmtpIntegration';

// no curly braces!
export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("communication");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hubspotStatus = params.get("hubspot");
    const tabParam = params.get("tab");
    const googleStatus = params.get("google");
    const whatsappStatus = params.get("whatsapp");

    if (tabParam) setActiveTab(tabParam);

    if (hubspotStatus === "success") {
      showToast("HubSpot connected successfully!", "success");
    } else if (hubspotStatus === "error") {
      showToast(params.get("message") || "Failed to connect HubSpot", "error");
    }

    if (googleStatus === "success") {
      showToast("Google Gmail connected successfully!", "success");
    } else if (googleStatus === "error") {
      showToast(params.get("message") || "Failed to connect Google account", "error");
    }

    if (whatsappStatus === "success") {
      showToast("WhatsApp connected successfully!", "success");
    } else if (whatsappStatus === "error") {
      showToast(params.get("message") || "Failed to connect WhatsApp", "error");
    }

    if (hubspotStatus || whatsappStatus || googleStatus || tabParam) {
      window.history.replaceState({}, "", "/integrations");
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Connect your tools with Pexifly
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="crm">CRM</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="crm" className="space-y-6">
            <HubSpotIntegration />
          
          </TabsContent>

          <TabsContent value="communication" className="space-y-8">
            <WhatsAppIntegration />
            <GoogleIntegration />
            <SmtpIntegration />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}