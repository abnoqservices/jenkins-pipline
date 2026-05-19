// app/products/settings/qr-codes/qr-template/page.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QRCodeStyling from "qr-code-styling";

const templates = {
  "1": { name: "Classic",     dots: "square",       color: "#000000" },
  "2": { name: "Rounded",     dots: "rounded",      color: "#1e40af" },
  "3": { name: "Neon",        dots: "dots",         color: "#ec4899", gradient: ["#ec4899", "#8b5cf6"] },
  "4": { name: "Minimal",     dots: "classy",       color: "#6b7280" },
  "5": { name: "Bold Red",    dots: "extra-rounded",color: "#dc2626" },
  "6": { name: "Elegant",     dots: "classy-rounded",color: "#7c3aed" },
  "7": { 
    name: "Heart", 
    dots: "dots", 
    color: "#ff1493",
    image: "https://raw.githubusercontent.com/kozakdenys/qr-code-styling/master/examples/images/heart.svg",
    imageSize: 0.35
  },
};

const templateGroups = {
  all:     { name: "All Templates",   ids: ["1","2","3","4","5","6","7"] },
  minimal: { name: "Minimal",         ids: ["1","4"] },
  modern:  { name: "Modern",          ids: ["2","6"] },
  bold:    { name: "Bold & Colorful", ids: ["3","5","7"] },
};

function StyledQR({ id }: { id: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

 React.useEffect(() => {
   if (!ref.current) return;
   ref.current.innerHTML = "";

   const t = templates[id as keyof typeof templates];
   if (!t) return;

   const config: any = {
     width: 100,
     height: 100,
     data: "https://example.com",
     margin: 0,
     qrOptions: { errorCorrectionLevel: "H" },
     backgroundOptions: { color: "#ffffff" },
     dotsOptions: {
       type: t.dots,
       color: t.color,
       ...(t.gradient && {
         gradient: {
           type: "linear",
           rotation: 45,
           colorStops: t.gradient.map((c, i) => ({ offset: i, color: c })),
         },
       }),
     },
     cornersSquareOptions: { type: "square" },
     cornersDotOptions: { type: "dots" },
   };

   // Add image safely
   if (t.image) {
     config.image = t.image;
     config.imageOptions = {
       hideBackgroundDots: true,
       imageSize: t.imageSize || 0.3,
       margin: 8,
       crossOrigin: "anonymous",
     };
   }

   const qr = new QRCodeStyling(config);
   qr.append(ref.current);
 }, [id]);

 return <div ref={ref} className="flex justify-center items-center w-full h-full" />;
}

// Export as default so you can import without { }
export default function Qrtemplate({
  activeTemplateId,
  setActiveTemplateId,
}: {
  activeTemplateId: string;
  setActiveTemplateId: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Choose a Template</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {Object.entries(templateGroups).map(([key, group]) => (
              <TabsTrigger key={key} value={key}>{group.name}</TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(templateGroups).map(([key, group]) => (
            <TabsContent key={key} value={key} className="mt-0">
              <div className="grid grid-cols-3 gap-4">
                {group.ids.map((id) => {
                  const t = templates[id as keyof typeof templates];
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTemplateId(id)}
                      className={`p-5 rounded-xl border-2 transition-all text-center group ${
                        activeTemplateId === id
                          ? "border-primary bg-primary/5  ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50 hover:bg-accent/30"
                      }`}
                    >
                      <div className="bg-white rounded-lg p-4 mb-3 w-24 h-24 mx-auto  group-hover:">
                        <StyledQR id={id} />
                      </div>
                      <p className="text-sm font-medium">{t?.name || "Template"}</p>
                    </button>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}