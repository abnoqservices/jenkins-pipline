"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Download, Palette, Upload, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { DashboardLayout } from "@/components/dashboard/layout";

const templates = {
  "1": {
    name: "Classic",
    previewUrl: "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://example.com&ecc=H&color=000000&bgcolor=FFFFFF",
    dots: { type: "square", color: "#000000" },
    cornersSquare: { type: "square", color: "#000000" },
    cornersDot: { type: "square", color: "#000000" },
    bg: "#ffffff"
  },
  "2": {
    name: "Rounded Blue",
    previewUrl: "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://example.com&ecc=H&color=1e40af&bgcolor=FFFFFF&qzone=4&format=png",
    dots: { type: "square", color: "#1e40af" },
    cornersSquare: { type: "square", color: "#1e40af" },
    cornersDot: { type: "square", color: "#1e40af" },
    bg: "#ffffff"
  },
  "3": {
    name: "Neon Gradient",
    previewUrl: "https://quickchart.io/qr?text=https://example.com&size=100&margin=10&color=ec4899&dark=8b5cf6&light=ffffff&ecLevel=H",
    dots: { type: "square", gradient: { type: "linear", rotation: 45, colors: ["#ec4899", "#8b5cf6"] } },
    cornersSquare: { type: "square", color: "#ec4899" },
    cornersDot: { type: "square", color: "#8b5cf6" },
    bg: "#ffffff"
  },
  "4": {
    name: "Minimal Grey",
    previewUrl: "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://example.com&color=6b7280&bgcolor=FFFFFF",
    dots: { type: "square", color: "#6b7280" },
    cornersSquare: { type: "square", color: "#6b7280" },
    cornersDot: { type: "square", color: "#6b7280" },
    bg: "#ffffff"
  },
  "5": {
    name: "Bold Red",
    previewUrl: "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://example.com&color=dc2626&bgcolor=FFFFFF",
    dots: { type: "square", color: "#dc2626" },
    cornersSquare: { type: "square", color: "#dc2626" },
    cornersDot: { type: "square", color: "#dc2626" },
    bg: "#ffffff"
  },
  "6": {
    name: "Elegant Purple",
    previewUrl: "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://example.com&color=7c3aed&bgcolor=FFFFFF",
    dots: { type: "square", color: "#7c3aed" },
    cornersSquare: { type: "square", color: "#7c3aed" },
    cornersDot: { type: "square", color: "#7c3aed" },
    bg: "#ffffff"
  },
  "7": {
    name: "Ocean Wave",
    previewUrl: "https://quickchart.io/qr?text=https://example.com&size=100&color=0ea5e9&dark=06b6d4&ecLevel=H",
    dots: { type: "square", gradient: { type: "radial", colors: ["#0ea5e9", "#06b6d4"] } },
    cornersSquare: { type: "square", color: "#0ea5e9" },
    cornersDot: { type: "square", color: "#06b6d4" },
    bg: "#ffffff"
  },
  "8": {
    name: "Forest Classy",
    previewUrl: "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://example.com&color=059669&bgcolor=f0fdf4",
    dots: { type: "square", color: "#059669" },
    cornersSquare: { type: "square", color: "#059669" },
    cornersDot: { type: "square", color: "#059669" },
    bg: "#f0fdf4"
  },
} as const;
const dotShapes = [
  { value: "square", label: "Square" },
  { value: "dots", label: "Dots" },
  { value: "rounded", label: "Rounded" },
  { value: "extra-rounded", label: "Extra Rounded" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy Rounded" },
];
const cornerSquareShapes = [
  { value: "none", label: "None" },           // ← use "none" instead of ""
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
  { value: "extra-rounded", label: "Extra Rounded" },
];
const cornerDotShapes = [
  { value: "none", label: "None" },           // ← same here
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
];

const gradientTypes = [
  { value: "linear", label: "Linear" },
  { value: "radial", label: "Radial" },
];

const errorCorrectionLevels = [
  { value: "L", label: "L (Low - 7%)" },
  { value: "M", label: "M (Medium - 15%)" },
  { value: "Q", label: "Q (Quartile - 25%)" },
  { value: "H", label: "H (High - 30%)" },
];

export default function QRDesigner() {
  const [url, setUrl] = React.useState("https://qr-code-styling.com");
  const [selectedTemplate, setSelectedTemplate] = React.useState("1");

  const [width, setWidth] = React.useState(300);
  const [height, setHeight] = React.useState(300);
  const [margin, setMargin] = React.useState(10);

  const [dotShape, setDotShape] = React.useState("square");
  const [dotColorType, setDotColorType] = React.useState("single");
  const [dotColor, setDotColor] = React.useState("#000000");
  const [dotGradientType, setDotGradientType] = React.useState("linear");
  const [dotGradientColor1, setDotGradientColor1] = React.useState("#ec4899");
  const [dotGradientColor2, setDotGradientColor2] = React.useState("#8b5cf6");
  const [dotGradientRotation, setDotGradientRotation] = React.useState(0);

  const [cornerSquareShape, setCornerSquareShape] = React.useState("square");
  const [cornerSquareColorType, setCornerSquareColorType] = React.useState("single");
  const [cornerSquareColor, setCornerSquareColor] = React.useState("#000000");
  const [cornerSquareGradientType, setCornerSquareGradientType] = React.useState("linear");
  const [cornerSquareGradientColor1, setCornerSquareGradientColor1] = React.useState("#ec4899");
  const [cornerSquareGradientColor2, setCornerSquareGradientColor2] = React.useState("#8b5cf6");
  const [cornerSquareGradientRotation, setCornerSquareGradientRotation] = React.useState(0);

  const [cornerDotShape, setCornerDotShape] = React.useState("square");
  const [cornerDotColorType, setCornerDotColorType] = React.useState("single");
  const [cornerDotColor, setCornerDotColor] = React.useState("#000000");
  const [cornerDotGradientType, setCornerDotGradientType] = React.useState("linear");
  const [cornerDotGradientColor1, setCornerDotGradientColor1] = React.useState("#ec4899");
  const [cornerDotGradientColor2, setCornerDotGradientColor2] = React.useState("#8b5cf6");
  const [cornerDotGradientRotation, setCornerDotGradientRotation] = React.useState(0);

  const [bgColorType, setBgColorType] = React.useState("single");
  const [bgColor, setBgColor] = React.useState("#ffffff");
  const [bgGradientType, setBgGradientType] = React.useState("linear");
  const [bgGradientColor1, setBgGradientColor1] = React.useState("#ffffff");
  const [bgGradientColor2, setBgGradientColor2] = React.useState("#f3f4f6");
  const [bgGradientRotation, setBgGradientRotation] = React.useState(0);

  const [customLogo, setCustomLogo] = React.useState<string | null>(null);
  const [hideBackgroundDots, setHideBackgroundDots] = React.useState(true);
  const [imageSize, setImageSize] = React.useState(0.4);
  const [imageMargin, setImageMargin] = React.useState(10);

  const [errorCorrectionLevel, setErrorCorrectionLevel] = React.useState("H");

  const previewRef = React.useRef<HTMLDivElement>(null);

  const applyTemplate = (templateId: string) => {
    const t = templates[templateId as keyof typeof templates];
    if (!t) return;

    setDotShape(t.dots.type);
    if (t.dots.gradient) {
      setDotColorType("gradient");
      setDotGradientType(t.dots.gradient.type);
      setDotGradientColor1(t.dots.gradient.colors[0]);
      setDotGradientColor2(t.dots.gradient.colors[1]);
      setDotGradientRotation(t.dots.gradient.rotation || 0);
    } else {
      setDotColorType("single");
      setDotColor(t.dots.color);
    }

    setCornerSquareShape(t.cornersSquare.type);
    setCornerSquareColorType("single");
    setCornerSquareColor(t.cornersSquare.color);

    setCornerDotShape(t.cornersDot.type || "");
    setCornerDotColorType("single");
    setCornerDotColor(t.cornersDot.color);

    setBgColor(t.bg);
    setBgColorType("single");
  };

  React.useEffect(() => {
    if (!previewRef.current) return;

    previewRef.current.innerHTML = "";

    import("qr-code-styling").then((module) => {
      const QRCodeStyling = module.default;

      const options: any = {
        width,
        height,
        data: url || "https://example.com",
        margin,
        qrOptions: { errorCorrectionLevel },
        backgroundOptions: bgColorType === "single"
          ? { color: bgColor }
          : { gradient: { type: bgGradientType, rotation: bgGradientRotation * Math.PI / 180, colorStops: [{ offset: 0, color: bgGradientColor1 }, { offset: 1, color: bgGradientColor2 }] } },
        dotsOptions: dotColorType === "single"
          ? { type: dotShape, color: dotColor }
          : { type: dotShape, gradient: { type: dotGradientType, rotation: dotGradientRotation * Math.PI / 180, colorStops: [{ offset: 0, color: dotGradientColor1 }, { offset: 1, color: dotGradientColor2 }] } },
        cornersSquareOptions: cornerSquareShape ? (
          cornerSquareColorType === "single"
            ? { type: cornerSquareShape, color: cornerSquareColor }
            : { type: cornerSquareShape, gradient: { type: cornerSquareGradientType, rotation: cornerSquareGradientRotation * Math.PI / 180, colorStops: [{ offset: 0, color: cornerSquareGradientColor1 }, { offset: 1, color: cornerSquareGradientColor2 }] } }
        ) : undefined,
        cornersDotOptions: cornerDotShape ? (
          cornerDotColorType === "single"
            ? { type: cornerDotShape, color: cornerDotColor }
            : { type: cornerDotShape, gradient: { type: cornerDotGradientType, rotation: cornerDotGradientRotation * Math.PI / 180, colorStops: [{ offset: 0, color: cornerDotGradientColor1 }, { offset: 1, color: cornerDotGradientColor2 }] } }
        ) : undefined,
      };

      if (customLogo) {
        options.image = customLogo;
        options.imageOptions = {
          hideBackgroundDots,
          imageSize,
          margin: imageMargin,
          crossOrigin: "anonymous",
        };
      }

      const qr = new QRCodeStyling(options);
      qr.append(previewRef.current!);
    });
  }, [
    url, width, height, margin,
    dotShape, dotColorType, dotColor, dotGradientType, dotGradientColor1, dotGradientColor2, dotGradientRotation,
    cornerSquareShape, cornerSquareColorType, cornerSquareColor, cornerSquareGradientType, cornerSquareGradientColor1, cornerSquareGradientColor2, cornerSquareGradientRotation,
    cornerDotShape, cornerDotColorType, cornerDotColor, cornerDotGradientType, cornerDotGradientColor1, cornerDotGradientColor2, cornerDotGradientRotation,
    bgColorType, bgColor, bgGradientType, bgGradientColor1, bgGradientColor2, bgGradientRotation,
    customLogo, hideBackgroundDots, imageSize, imageMargin, errorCorrectionLevel
  ]);

  const downloadQR = (format: "png" | "jpeg") => {
    const canvas = previewRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${Date.now()}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`);
    link.click();
    link.click();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setCustomLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };


    return (
      <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3 text-slate-800">
                <Palette className="h-10 w-10 text-purple-600" />
                QR Code Designer
              </h1>
              <p className="text-slate-600 mt-2">Professional QR code generator with full styling</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => downloadQR("png")} size="lg" className="gap-2">
                <Download className="h-5 w-5" /> PNG
              </Button>
              <Button onClick={() => downloadQR("jpeg")} size="lg" variant="outline" className="gap-2">
                <Download className="h-5 w-5" /> JPEG
              </Button>
            </div>
          </div>
  
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Controls */}
            <div className="space-y-6">
              {/* Templates Card */}
              <Card>
                <CardHeader className="bg-gradient-to-r">
                  <CardTitle>Quick Templates</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
    {Object.entries(templates).map(([id, template]) => (
      <button
        key={id}
        onClick={() => {
          setSelectedTemplate(id);
          applyTemplate(id);
        }}
        className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
          selectedTemplate === id
            ? "border-purple-600  ring-4 ring-purple-200"
            : "border-slate-200 hover:border-purple-400"
        }`}
      >
        {/* QR Preview Image */}
        <div className="aspect-square relative bg-white p-4">
          <img
            src={template.previewUrl}
            alt={template.name}
            className="w-full h-full object-contain rounded-lg  group-hover: transition-shadow"
            loading="lazy"
          />
          {/* Optional overlay on hover */}
          <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/20 transition-colors rounded-lg" />
        </div>

        {/* Name Label */}
        <div className="py-3 px-2 text-center">
          <p className="text-sm font-semibold text-slate-700 group-hover:text-purple-700 transition-colors">
            {template.name}
          </p>
        </div>

        {/* Selected Indicator */}
        {selectedTemplate === id && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </button>
    ))}
  </div>
</CardContent>
              </Card>
  
              {/* Main Options */}
           
  
              {/* Customization Tabs */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle>Customize</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Tabs defaultValue="image" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="image">Logo</TabsTrigger>
                      <TabsTrigger value="dots">Dots</TabsTrigger>
                      <TabsTrigger value="corners-sq">Square</TabsTrigger>
                      <TabsTrigger value="corners-dot">Dot</TabsTrigger>
                      <TabsTrigger value="background">BG</TabsTrigger>
                     
                    </TabsList>
  
                    {/* Dots Tab */}
                    <TabsContent value="dots" className="space-y-6 mt-6">
    <div>
      <Label>Data Dots Style</Label>
      <Select value={dotShape} onValueChange={setDotShape}>
        <SelectTrigger className="mt-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {dotShapes.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div>
      <Label>Color Type</Label>
      <div className="flex gap-6 mt-2">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={dotColorType === "single"}
            onChange={() => setDotColorType("single")}
          />
          <span>Single</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={dotColorType === "gradient"}
            onChange={() => setDotColorType("gradient")}
          />
          <span>Gradient</span>
        </label>
      </div>
    </div>

    {dotColorType === "single" ? (
      <div className="flex gap-3 items-center">
        <Input
          type="color"
          value={dotColor}
          onChange={(e) => setDotColor(e.target.value)}
          className="w-16 h-10 p-1"
        />
        <Input
          value={dotColor}
          onChange={(e) => setDotColor(e.target.value)}
        />
      </div>
    ) : (
      <>
        <div>
          <Label>Gradient Type</Label>
          <Select value={dotGradientType} onValueChange={setDotGradientType}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {gradientTypes.map((g) => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Color 1</Label>
            <Input
              type="color"
              value={dotGradientColor1}
              onChange={(e) => setDotGradientColor1(e.target.value)}
              className="w-full h-10 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Color 2</Label>
            <Input
              type="color"
              value={dotGradientColor2}
              onChange={(e) => setDotGradientColor2(e.target.value)}
              className="w-full h-10 mt-1"
            />
          </div>
        </div>

        <div>
          <Label>Rotation: {dotGradientRotation}°</Label>
          <Slider
            value={[dotGradientRotation]}
            onValueChange={([v]) => setDotGradientRotation(v)}
            min={0}
            max={360}
            step={15}
            className="mt-2"
          />
        </div>
      </>
    )}
  </TabsContent>
  
                    {/* CORNERS SQUARE TAB – THIS WAS THE BUGGY ONE */}
                    <TabsContent value="corners-sq" className="space-y-4 mt-6">
                      <div>
                        <Label>Corners Square Style</Label>
                        <Select value={cornerSquareShape} onValueChange={setCornerSquareShape}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {cornerSquareShapes.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
  
                      {cornerSquareShape && cornerSquareShape !== "" && (
                        <>
                          <div>
                            <Label>Color Type</Label>
                            <div className="flex gap-6 mt-2">
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  checked={cornerSquareColorType === "single"}
                                  onChange={() => setCornerSquareColorType("single")}
                                />
                                <span>Single</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  checked={cornerSquareColorType === "gradient"}
                                  onChange={() => setCornerSquareColorType("gradient")}
                                />
                                <span>Gradient</span>
                              </label>
                            </div>
                          </div>
  
                          {cornerSquareColorType === "single" ? (
                            <div className="flex gap-3 items-center">
                              <Input
                                type="color"
                                value={cornerSquareColor}
                                onChange={(e) => setCornerSquareColor(e.target.value)}
                                className="w-16 h-10 p-1"
                              />
                              <Input
                                value={cornerSquareColor}
                                onChange={(e) => setCornerSquareColor(e.target.value)}
                              />
                            </div>
                          ) : (
                            <>
                              {/* Gradient Type Select */}
                              <div>
                                <Label>Gradient Type</Label>
                                <Select value={cornerSquareGradientType} onValueChange={setCornerSquareGradientType}>
                                  <SelectTrigger className="mt-2">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {gradientTypes.map((g) => (
                                      <SelectItem key={g.value} value={g.value}>
                                        {g.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
  
                              {/* Color Pickers */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Color 1</Label>
                                  <Input
                                    type="color"
                                    value={cornerSquareGradientColor1}
                                    onChange={(e) => setCornerSquareGradientColor1(e.target.value)}
                                    className="w-full h-10 mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Color 2</Label>
                                  <Input
                                    type="color"
                                    value={cornerSquareGradientColor2}
                                    onChange={(e) => setCornerSquareGradientColor2(e.target.value)}
                                    className="w-full h-10 mt-1"
                                  />
                                </div>
                              </div>
  
                              {/* Rotation Slider */}
                              <div>
                                <Label>Rotation: {cornerSquareGradientRotation}°</Label>
                                <Slider
                                  value={[cornerSquareGradientRotation]}
                                  onValueChange={([v]) => setCornerSquareGradientRotation(v)}
                                  min={0}
                                  max={360}
                                  step={15}
                                  className="mt-2"
                                />
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </TabsContent>
                    <TabsContent value="corners-dot" className="space-y-4 mt-6">
    <div>
      <Label>Corners Dot Style</Label>
      <Select value={cornerDotShape} onValueChange={setCornerDotShape}>
        <SelectTrigger className="mt-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {cornerDotShapes.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {cornerDotShape && cornerDotShape !== "none" && (
      <>
        <div>
          <Label>Color Type</Label>
          <div className="flex gap-6 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={cornerDotColorType === "single"}
                onChange={() => setCornerDotColorType("single")}
              />
              <span>Single</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={cornerDotColorType === "gradient"}
                onChange={() => setCornerDotColorType("gradient")}
              />
              <span>Gradient</span>
            </label>
          </div>
        </div>

        {cornerDotColorType === "single" ? (
          <div className="flex gap-3 items-center">
            <Input
              type="color"
              value={cornerDotColor}
              onChange={(e) => setCornerDotColor(e.target.value)}
              className="w-16 h-10 p-1"
            />
            <Input
              value={cornerDotColor}
              onChange={(e) => setCornerDotColor(e.target.value)}
            />
          </div>
        ) : (
          <>
            <div>
              <Label>Gradient Type</Label>
              <Select value={cornerDotGradientType} onValueChange={setCornerDotGradientType}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gradientTypes.map((g) => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Color 1</Label>
                <Input
                  type="color"
                  value={cornerDotGradientColor1}
                  onChange={(e) => setCornerDotGradientColor1(e.target.value)}
                  className="w-full h-10 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Color 2</Label>
                <Input
                  type="color"
                  value={cornerDotGradientColor2}
                  onChange={(e) => setCornerDotGradientColor2(e.target.value)}
                  className="w-full h-10 mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Rotation: {cornerDotGradientRotation}°</Label>
              <Slider
                value={[cornerDotGradientRotation]}
                onValueChange={([v]) => setCornerDotGradientRotation(v)}
                min={0}
                max={360}
                step={15}
                className="mt-2"
              />
            </div>
          </>
        )}
      </>
    )}
  </TabsContent>
                    <TabsContent value="background" className="space-y-6 mt-6">
    <div>
      <Label>Background Type</Label>
      <div className="flex gap-6 mt-2">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={bgColorType === "single"}
            onChange={() => setBgColorType("single")}
          />
          <span>Solid</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={bgColorType === "gradient"}
            onChange={() => setBgColorType("gradient")}
          />
          <span>Gradient</span>
        </label>
      </div>
    </div>

    {bgColorType === "single" ? (
      <div className="flex gap-3 items-center">
        <Input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          className="w-16 h-10 p-1"
        />
        <Input
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
        />
      </div>
    ) : (
      <>
        <div>
          <Label>Gradient Type</Label>
          <Select value={bgGradientType} onValueChange={setBgGradientType}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {gradientTypes.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Color 1</Label>
            <Input
              type="color"
              value={bgGradientColor1}
              onChange={(e) => setBgGradientColor1(e.target.value)}
              className="w-full h-10 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Color 2</Label>
            <Input
              type="color"
              value={bgGradientColor2}
              onChange={(e) => setBgGradientColor2(e.target.value)}
              className="w-full h-10 mt-1"
            />
          </div>
        </div>

        <div>
          <Label>Rotation: {bgGradientRotation}°</Label>
          <Slider
            value={[bgGradientRotation]}
            onValueChange={([v]) => setBgGradientRotation(v)}
            min={0}
            max={360}
            step={15}
            className="mt-2"
          />
        </div>
      </>
    )}
  </TabsContent>
                    <TabsContent value="image" className="space-y-6 mt-6">
    <div>
      <Label>Upload Logo (optional)</Label>
      <div className="mt-2 flex items-center gap-4">
        <label className="cursor-pointer">
          <Input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            <Upload className="h-4 w-4" />
            Upload Image
          </div>
        </label>
        {customLogo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCustomLogo(null)}
            className="text-red-600"
          >
            <X className="h-4 w-4" /> Remove
          </Button>
        )}
      </div>
      {customLogo && (
        <div className="mt-4">
          <img src={customLogo} alt="Logo preview" className="h-20 w-20 object-contain border rounded" />
        </div>
      )}
    </div>

    {customLogo && (
      <>
        <div className="flex items-center justify-between">
          <Label>Hide dots behind logo</Label>
          <Switch
            checked={hideBackgroundDots}
            onCheckedChange={setHideBackgroundDots}
          />
        </div>

        <div>
          <Label>Logo Size: { (imageSize * 100).toFixed(0) }%</Label>
          <Slider
            value={[imageSize]}
            onValueChange={([v]) => setImageSize(v)}
            min={0.1}
            max={0.6}
            step={0.05}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Logo Margin: {imageMargin}px</Label>
          <Slider
            value={[imageMargin]}
            onValueChange={([v]) => setImageMargin(v)}
            min={0}
            max={30}
            step={2}
            className="mt-2"
          />
        </div>
      </>
    )}
  </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
  
              {/* QR Options Card */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                  <CardTitle>QR Options</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Label>Error Correction Level</Label>
                  <Select value={errorCorrectionLevel} onValueChange={setErrorCorrectionLevel}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {errorCorrectionLevels.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
  
            {/* Preview */}
            <div className="flex flex-col">
              <Card className="sticky top-8 shadow-2xl">
                <CardHeader className="text-center bg-gradient-to-r">
                  <CardTitle className="text-2xl">Live Preview</CardTitle>
                  <p className="text-sm text-slate-600">
                    {templates[selectedTemplate]?.name || "Custom Design"}
                  </p>
                </CardHeader>
                <CardContent className="p-10 bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center min-h-[500px]">
                  <div ref={previewRef} className="shadow-2xl rounded-xl overflow-hidden" />
                </CardContent>
               
                
                <CardContent className="space-y-6 pt-6">
                  <div>
                    <Label>Data (URL or Text)</Label>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Width: {width}px</Label>
                      <Slider value={[width]} onValueChange={([v]) => setWidth(v)} min={200} max={600} step={10} className="mt-2" />
                    </div>
                    <div>
                      <Label>Height: {height}px</Label>
                      <Slider value={[height]} onValueChange={([v]) => setHeight(v)} min={200} max={600} step={10} className="mt-2" />
                    </div>
                    <div>
                      <Label>Margin: {margin}</Label>
                      <Slider value={[margin]} onValueChange={([v]) => setMargin(v)} min={0} max={50} step={5} className="mt-2" />
                    </div>
                  </div>
                </CardContent>
             
              </Card>
            </div>
          </div>
        </div>
      </div>
      </DashboardLayout>
    );
  }