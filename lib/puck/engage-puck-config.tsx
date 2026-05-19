"use client";

import * as React from "react";
import type { Config } from "@measured/puck";
import { ArrowRight } from "lucide-react";
import { DEFAULT_ROOT_STYLE } from "@/lib/puck/root-theme-defaults";
import {
  DEFAULT_LAYOUT_PROPS,
  layoutObjectFields,
  layoutToStyle,
} from "@/lib/puck/layout-fields";
import {
  puckStyleHeadingField,
  puckColorPickerField,
  puckRangeSliderField,
  puckBindingTextField,
  puckBindingTextareaField,
} from "@/lib/puck/puck-binding-custom-fields";
import { puckImageSrcField } from "@/lib/puck/puck-image-src-field";
import { saasLandingBlockConfigs } from "@/lib/puck/saas-landing-blocks";
import { productDetailBlockConfigs } from "@/lib/puck/product-detail-blocks";
import { extraProductBlockConfigs } from "@/lib/puck/extra-product-blocks";
import { cmsBlockConfigs } from "@/lib/puck/cms-blocks";
import { embedBlockConfigs } from "@/lib/puck/embed-blocks";
import {
  ACCENT_FALLBACK,
  ACCENT_FALLBACK_2,
  EyebrowChip,
  SafeImage,
  containerMaxWidthPx,
  highlightDynamicTags,
  premiumButtonStyle,
  puckPresetField,
  radiusPresetToPx,
  shadowPresetToCss,
  toPx,
} from "@/lib/puck/puck-design-system";
import { cn } from "@/lib/utils";

const rootContentFields = {
  title: puckBindingTextField("Page title"),
};

const rootStyleFields = {
  pageBackground: { type: "text" as const, label: "Page background" },
  pageText: { type: "text" as const, label: "Body text" },
  headingColor: { type: "text" as const, label: "Heading color (CSS vars)" },
  mutedText: { type: "text" as const, label: "Muted text" },
  accentColor: { type: "text" as const, label: "Accent / default buttons" },
  buttonTextColor: { type: "text" as const, label: "Default button text" },
};

const containerPresetField = puckPresetField(
  "Container width",
  [
    { value: "narrow", label: "Narrow", hint: "768px" },
    { value: "normal", label: "Normal", hint: "1100px" },
    { value: "wide", label: "Wide", hint: "1280px" },
    { value: "full", label: "Full", hint: "1536px" },
  ]
);

const radiusPresetField = puckPresetField(
  "Corner style",
  [
    { value: "sharp", label: "Sharp", hint: "4px" },
    { value: "soft", label: "Soft", hint: "12px" },
    { value: "round", label: "Round", hint: "24px" },
    { value: "pill", label: "Pill", hint: "Full" },
  ]
);

const shadowPresetField = puckPresetField(
  "Shadow",
  [
    { value: "none", label: "None" },
    { value: "soft", label: "Soft" },
    { value: "medium", label: "Medium" },
    { value: "elevated", label: "Elevated" },
    { value: "glow", label: "Glow" },
  ]
);

export const engagePuckConfig: Config = {
  categories: {
    basics: {
      title: "Basics",
      defaultExpanded: false,
      components: ["HeroBlock", "TextBlock", "CtaBlock", "ImageBlock"],
    },
    landing: {
      title: "Landing sections",
      defaultExpanded: false,
      components: [
        "NavBarBlock",
        "HeroSplitBlock",
        "LogoCloudBlock",
        "SupportFeaturesBlock",
        "FeatureGridBlock",
        "BenefitsShowcaseBlock",
        "StatsBlock",
        "PricingPlansBlock",
        "TestimonialLeadBlock",
        "FaqBlock",
        "CtaBannerBlock",
        "FooterMegaBlock",
      ],
    },
    product: {
      title: "Product sections",
      defaultExpanded: false,
      components: [
        "ProductHeaderBlock",
        "ProductGalleryBlock",
        "ProductSpecsBlock",
        "ProductHighlightsBlock",
        "ProductTabsContentBlock",
        "ProductRelatedBlock",
        "RelatedModelsBlock",
        "VideoBlock",
        "SocialIconsBlock",
      ],
    },
    cms: {
      title: "CMS (WordPress)",
      defaultExpanded: false,
      components: ["CmsWpPostsBlock", "CmsBlogPostSlotBlock"],
    },
    integrations: {
      title: "Integrations & code",
      defaultExpanded: false,
      components: ["FormEmbedBlock", "CustomCodeBlock", "GtmBlock"],
    },
  },
  root: {
    fields: {
      content: {
        type: "object",
        label: "Content",
        objectFields: rootContentFields,
      },
      style: {
        type: "object",
        label: "Style",
        objectFields: rootStyleFields,
      },
      layout: {
        type: "object",
        label: "Advanced",
        objectFields: layoutObjectFields,
      },
    },
    defaultProps: {
      content: { title: "{{product.name}}" },
      style: { ...DEFAULT_ROOT_STYLE },
      layout: { ...DEFAULT_LAYOUT_PROPS },
    },
    render: ({ children, style, layout }: { children: React.ReactNode; style?: Record<string, string>; layout?: Record<string, string> }) => {
      const s = style || {};
      const l = layout || {};
      return (
        <div
          className="min-h-full w-full antialiased"
          style={{
            ...layoutToStyle(l),
            backgroundColor: s.pageBackground,
            color: s.pageText,
            ["--lp-heading" as string]: s.headingColor,
            ["--lp-muted" as string]: s.mutedText,
            ["--lp-accent" as string]: s.accentColor,
            ["--lp-btn-text" as string]: s.buttonTextColor,
          }}
        >
          {children}
        </div>
      );
    },
  },
  components: {
    ...saasLandingBlockConfigs,
    ...productDetailBlockConfigs,
    ...extraProductBlockConfigs,
    ...cmsBlockConfigs,
    ...embedBlockConfigs,

    HeroBlock: {
      label: "Hero (simple)",
      fields: {
        content: {
          type: "object",
          label: "Content",
          objectFields: {
            eyebrow: puckBindingTextField("Eyebrow chip"),
            title: puckBindingTextField("Title"),
            subtitle: puckBindingTextareaField("Subtitle"),
          },
        },
        style: {
          type: "object",
          label: "Style",
          objectFields: {
            sectionHeader: puckStyleHeadingField("Section background"),
            sectionBackgroundColor: { type: "text", label: "Section background" },
            decoration: puckPresetField("Decoration", [
              { value: "none", label: "None" },
              { value: "gradient", label: "Gradient" },
              { value: "noise", label: "Noise" },
            ]),
            textHeader: puckStyleHeadingField("Text"),
            headingColor: puckColorPickerField("Title color"),
            subtitleColor: puckColorPickerField("Subtitle color"),
            align: puckPresetField("Alignment", [
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]),
            borderHeader: puckStyleHeadingField("Border"),
            borderColor: puckColorPickerField("Bottom border color"),
            containerWidth: containerPresetField,
          },
        },
        layout: {
          type: "object",
          label: "Advanced",
          objectFields: layoutObjectFields,
        },
      },
      defaultProps: {
        content: {
          eyebrow: "",
          title: "{{product.name}}",
          subtitle: "{{product.description}}",
        },
        style: {
          sectionBackgroundColor: "",
          decoration: "none",
          headingColor: "",
          subtitleColor: "",
          align: "center",
          borderColor: "",
          containerWidth: "normal",
        },
        layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "32px", paddingBottom: "32px" },
      },
      render: ({ content, style, layout }) => {
        const c = (content || {}) as { eyebrow?: string; title?: string; subtitle?: string };
        const st = (style || {}) as Record<string, string>;
        const l = (layout || {}) as Record<string, string>;
        const align = st.align || "center";
        const decoration = st.decoration || "none";
        const alignCls =
          align === "center" ? "items-center text-center" : align === "right" ? "items-end text-right" : "items-start text-left";

        return (
          <section
            className="relative isolate overflow-hidden"
            style={{
              ...layoutToStyle(l),
              backgroundColor: st.sectionBackgroundColor || undefined,
              borderBottom: st.borderColor ? `1px solid ${st.borderColor}` : undefined,
            }}
          >
            {decoration === "gradient" ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 20% 0%, ${ACCENT_FALLBACK}22, transparent 50%), radial-gradient(circle at 80% 100%, ${ACCENT_FALLBACK_2}22, transparent 50%)`,
                }}
              />
            ) : null}
            <div
              className={cn("relative mx-auto flex w-full flex-col gap-4 px-4", alignCls)}
              style={{ maxWidth: containerMaxWidthPx(st.containerWidth) }}
            >
              {c.eyebrow?.trim() ? <EyebrowChip>{highlightDynamicTags(c.eyebrow)}</EyebrowChip> : null}
              <h1
                className="text-balance text-3xl font-bold tracking-tight md:text-4xl"
                style={{ color: st.headingColor || "var(--lp-heading, inherit)" }}
              >
                {highlightDynamicTags(c.title)}
              </h1>
              {c.subtitle?.trim() ? (
                <p
                  className="max-w-2xl whitespace-pre-wrap text-base leading-relaxed md:text-lg"
                  style={{ color: st.subtitleColor || "var(--lp-muted, inherit)" }}
                >
                  {highlightDynamicTags(c.subtitle)}
                </p>
              ) : null}
            </div>
          </section>
        );
      },
    },

    TextBlock: {
      label: "Text",
      fields: {
        content: {
          type: "object",
          label: "Content",
          objectFields: {
            text: puckBindingTextareaField("Text"),
          },
        },
        style: {
          type: "object",
          label: "Style",
          objectFields: {
            textHeader: puckStyleHeadingField("Text"),
            textColor: puckColorPickerField("Text color"),
            sectionHeader: puckStyleHeadingField("Section background"),
            backgroundColor: puckColorPickerField("Background"),
            align: puckPresetField("Alignment", [
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]),
            sizing: puckPresetField("Text size", [
              { value: "sm", label: "Small" },
              { value: "base", label: "Base" },
              { value: "lg", label: "Large" },
              { value: "xl", label: "X-Large" },
            ]),
            containerWidth: containerPresetField,
          },
        },
        layout: {
          type: "object",
          label: "Advanced",
          objectFields: layoutObjectFields,
        },
      },
      defaultProps: {
        content: {
          text: "Use {{product.description}} or {{section_key.field_key}} from section builder data.",
        },
        style: { textColor: "", backgroundColor: "", align: "left", sizing: "base", containerWidth: "normal" },
        layout: { ...DEFAULT_LAYOUT_PROPS },
      },
      render: ({ content, style, layout }) => {
        const c = (content || {}) as { text?: string };
        const st = (style || {}) as Record<string, string>;
        const l = (layout || {}) as Record<string, string>;
        const sizeCls =
          st.sizing === "sm"
            ? "text-sm"
            : st.sizing === "lg"
              ? "text-lg"
              : st.sizing === "xl"
                ? "text-xl md:text-2xl"
                : "text-base";
        const alignCls =
          st.align === "center" ? "text-center" : st.align === "right" ? "text-right" : "text-left";

        return (
          <div style={{ ...layoutToStyle(l), backgroundColor: st.backgroundColor || undefined }}>
            <div
              className={cn("mx-auto whitespace-pre-wrap leading-relaxed", sizeCls, alignCls)}
              style={{
                maxWidth: containerMaxWidthPx(st.containerWidth),
                color: st.textColor || undefined,
              }}
            >
              {highlightDynamicTags(c.text)}
            </div>
          </div>
        );
      },
    },

    CtaBlock: {
      label: "Button / CTA",
      fields: {
        content: {
          type: "object",
          label: "Content",
          objectFields: {
            label: puckBindingTextField("Label"),
            href: puckBindingTextField("Link URL"),
            secondaryLabel: puckBindingTextField("Secondary label (optional)"),
            secondaryHref: puckBindingTextField("Secondary URL"),
          },
        },
        style: {
          type: "object",
          label: "Style",
          objectFields: {
            buttonHeader: puckStyleHeadingField("Button"),
            alignment: puckPresetField("Alignment", [
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]),
            variant: puckPresetField("Style", [
              { value: "solid", label: "Solid" },
              { value: "ghost", label: "Ghost" },
              { value: "gradient", label: "Gradient" },
            ]),
            size: puckPresetField("Size", [
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
            ]),
            buttonBackgroundColor: puckColorPickerField("Background"),
            buttonTextColor: puckColorPickerField("Text color"),
            buttonBorderColor: puckColorPickerField("Border color"),
            buttonRadius: radiusPresetField,
            buttonShadow: shadowPresetField,
            buttonRadiusPx: puckRangeSliderField("Custom corner radius (overrides preset)", {
              min: 0,
              max: 40,
              step: 1,
              suffix: " px",
            }),
            buttonFontWeight: puckPresetField("Font weight", [
              { value: "500", label: "Normal" },
              { value: "600", label: "Semibold" },
              { value: "700", label: "Bold" },
            ]),
          },
        },
        layout: {
          type: "object",
          label: "Advanced",
          objectFields: layoutObjectFields,
        },
      },
      defaultProps: {
        content: { label: "Get started", href: "#", secondaryLabel: "", secondaryHref: "#" },
        style: {
          alignment: "center",
          variant: "solid",
          size: "md",
          buttonBackgroundColor: "",
          buttonTextColor: "",
          buttonBorderColor: "",
          buttonRadius: "soft",
          buttonShadow: "soft",
          buttonRadiusPx: "",
          buttonFontWeight: "600",
        },
        layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "16px", paddingBottom: "16px" },
      },
      render: ({ content, style, layout }) => {
        const c = (content || {}) as { label?: string; href?: string; secondaryLabel?: string; secondaryHref?: string };
        const st = (style || {}) as Record<string, string>;
        const l = (layout || {}) as Record<string, string>;
        const align = st.alignment || "center";
        const variant = st.variant || "solid";
        const size = st.size || "md";
        const fontWeight = (st.buttonFontWeight as "500" | "600" | "700") || "600";
        const radius = st.buttonRadiusPx?.trim() ? toPx(st.buttonRadiusPx, 12) : radiusPresetToPx(st.buttonRadius, 12);
        const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

        const sizeStyles =
          size === "sm"
            ? { padX: 14, padY: 8, fontSize: 13 }
            : size === "lg"
              ? { padX: 24, padY: 14, fontSize: 16 }
              : { padX: 18, padY: 11, fontSize: 14 };

        const renderButton = (
          label: string,
          href: string,
          isPrimary: boolean
        ) => {
          const baseStyle: React.CSSProperties = {
            padding: `${sizeStyles.padY}px ${sizeStyles.padX}px`,
            fontSize: `${sizeStyles.fontSize}px`,
            fontWeight: Number(fontWeight) as 500 | 600 | 700,
            borderRadius: `${radius}px`,
          };
          let resolvedStyle: React.CSSProperties;
          if (variant === "ghost" || !isPrimary) {
            resolvedStyle = {
              ...baseStyle,
              background: "transparent",
              borderColor: st.buttonBorderColor?.trim() || "rgba(15,23,42,0.16)",
              borderWidth: "1.5px",
              borderStyle: "solid",
              color: st.buttonTextColor?.trim() || "var(--lp-heading, #0b1220)",
            };
          } else if (variant === "gradient") {
            resolvedStyle = {
              ...baseStyle,
              background:
                st.buttonBackgroundColor?.trim() ||
                `linear-gradient(135deg, ${ACCENT_FALLBACK}, ${ACCENT_FALLBACK_2})`,
              color: st.buttonTextColor?.trim() || "#ffffff",
              boxShadow: shadowPresetToCss(st.buttonShadow || "glow"),
            };
          } else {
            resolvedStyle = {
              ...baseStyle,
              ...premiumButtonStyle({
                bg: st.buttonBackgroundColor,
                fg: st.buttonTextColor,
                shadow: st.buttonShadow || "soft",
                radiusPx: radius,
              }),
            };
          }
          return (
            <a
              key={label}
              href={href || "#"}
              className="group inline-flex items-center justify-center gap-2 transition hover:scale-[1.02]"
              style={resolvedStyle}
            >
              {highlightDynamicTags(label)}
              {isPrimary ? (
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
              ) : null}
            </a>
          );
        };

        return (
          <div style={layoutToStyle(l)}>
            <div className="flex flex-wrap items-center gap-3 px-4 py-2" style={{ justifyContent: justify }}>
              {c.label?.trim() ? renderButton(c.label, c.href || "#", true) : null}
              {c.secondaryLabel?.trim() ? renderButton(c.secondaryLabel, c.secondaryHref || "#", false) : null}
            </div>
          </div>
        );
      },
    },

    ImageBlock: {
      label: "Image",
      fields: {
        content: {
          type: "object",
          label: "Content",
          objectFields: {
            src: puckImageSrcField("Image URL"),
            alt: puckBindingTextField("Alt text"),
            caption: puckBindingTextField("Caption (optional)"),
            href: puckBindingTextField("Link URL (optional — wraps image)"),
            openInNewTab: {
              type: "radio",
              label: "Link target",
              options: [
                { label: "Same tab", value: "no" },
                { label: "New tab", value: "yes" },
              ],
            },
          },
        },
        style: {
          type: "object",
          label: "Style",
          objectFields: {
            sizingHeader: puckStyleHeadingField("Sizing"),
            sizeMode: puckPresetField(
              "Size mode",
              [
                { value: "ratio", label: "Aspect ratio", hint: "Fits to ratio" },
                { value: "fixed", label: "Fixed size", hint: "px W × H" },
                { value: "auto", label: "Auto", hint: "Intrinsic" },
                { value: "full", label: "Full bleed", hint: "100% wide" },
              ],
              "Pick how the image is sized — the rest of the controls below apply to the chosen mode."
            ),
            ratio: puckPresetField(
              "Aspect ratio",
              [
                { value: "16/9", label: "16:9" },
                { value: "4/3", label: "4:3" },
                { value: "1/1", label: "1:1" },
                { value: "3/4", label: "3:4" },
                { value: "21/9", label: "21:9" },
                { value: "3/2", label: "3:2" },
              ]
            ),
            widthPx: puckRangeSliderField("Width", { min: 80, max: 1600, step: 10, suffix: " px" }),
            heightPx: puckRangeSliderField("Height", { min: 80, max: 1200, step: 10, suffix: " px" }),
            maxWidthPx: puckRangeSliderField("Max width inside container", { min: 120, max: 1600, step: 10, suffix: " px" }),
            fit: puckPresetField("Image fit", [
              { value: "cover", label: "Cover" },
              { value: "contain", label: "Contain" },
              { value: "fill", label: "Fill" },
              { value: "scale-down", label: "Scale down" },
              { value: "none", label: "None" },
            ]),
            position: puckPresetField(
              "Image position (when fit doesn't fill)",
              [
                { value: "center", label: "Center" },
                { value: "top", label: "Top" },
                { value: "bottom", label: "Bottom" },
                { value: "left", label: "Left" },
                { value: "right", label: "Right" },
              ]
            ),
            align: puckPresetField("Block alignment", [
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]),
            containerWidth: containerPresetField,

            appearanceHeader: puckStyleHeadingField("Appearance"),
            backgroundColor: puckColorPickerField("Frame background (behind image)"),
            sectionBackgroundColor: puckColorPickerField("Section background (around figure)"),
            radiusPx: puckRangeSliderField("Corner radius", { min: 0, max: 200, step: 1, suffix: " px" }),
            borderWidthPx: puckRangeSliderField("Border width", { min: 0, max: 12, step: 1, suffix: " px" }),
            borderColor: puckColorPickerField("Border color"),
            shadow: shadowPresetField,
            filter: puckPresetField("Filter", [
              { value: "none", label: "None" },
              { value: "grayscale", label: "Grayscale" },
              { value: "sepia", label: "Sepia" },
              { value: "blur", label: "Soft blur" },
              { value: "brighten", label: "Brighten" },
              { value: "dim", label: "Dim" },
              { value: "contrast", label: "High contrast" },
            ]),
            hoverEffect: puckPresetField("Hover effect", [
              { value: "none", label: "None" },
              { value: "scale", label: "Zoom" },
              { value: "lift", label: "Lift + shadow" },
              { value: "brighten", label: "Brighten" },
              { value: "tilt", label: "Subtle tilt" },
            ]),
            opacityPct: puckRangeSliderField("Opacity", { min: 10, max: 100, step: 5, suffix: " %" }),

            captionHeader: puckStyleHeadingField("Caption"),
            captionAlign: puckPresetField("Caption alignment", [
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]),
            captionSize: puckPresetField("Caption size", [
              { value: "sm", label: "Small" },
              { value: "base", label: "Base" },
              { value: "lg", label: "Large" },
            ]),
            captionColor: puckColorPickerField("Caption color"),
          },
        },
        layout: {
          type: "object",
          label: "Advanced",
          objectFields: layoutObjectFields,
        },
      },
      defaultProps: {
        content: {
          src: "",
          alt: "{{product.name}}",
          caption: "",
          href: "",
          openInNewTab: "no",
        },
        style: {
          sizeMode: "ratio",
          ratio: "16/9",
          widthPx: "640",
          heightPx: "420",
          maxWidthPx: "1100",
          fit: "cover",
          position: "center",
          align: "center",
          containerWidth: "wide",
          backgroundColor: "",
          sectionBackgroundColor: "",
          radiusPx: "20",
          borderWidthPx: "0",
          borderColor: "",
          shadow: "soft",
          filter: "none",
          hoverEffect: "none",
          opacityPct: "100",
          captionAlign: "center",
          captionSize: "sm",
          captionColor: "",
        },
        layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "16px", paddingBottom: "16px" },
      },
      render: ({ content, style, layout }) => {
        const c = (content || {}) as {
          src?: string;
          alt?: string;
          caption?: string;
          href?: string;
          openInNewTab?: string;
        };
        const st = (style || {}) as Record<string, string>;
        const l = (layout || {}) as Record<string, string>;

        const sizeMode = (st.sizeMode || "ratio") as "auto" | "ratio" | "fixed" | "full";
        const ratio = st.ratio || "16/9";
        const widthPx = toPx(st.widthPx, 640);
        const heightPx = toPx(st.heightPx, 420);
        const maxWidthPx = toPx(st.maxWidthPx, 1100);
        const radiusPx = toPx(st.radiusPx, 20);
        const borderWidthPx = toPx(st.borderWidthPx, 0);
        const opacityPct = Math.max(10, Math.min(100, toPx(st.opacityPct, 100)));

        const fit = ((): React.CSSProperties["objectFit"] => {
          switch (st.fit) {
            case "contain":
            case "fill":
            case "scale-down":
            case "none":
              return st.fit;
            default:
              return "cover";
          }
        })();
        const position = ((): string => {
          switch (st.position) {
            case "top":
              return "center top";
            case "bottom":
              return "center bottom";
            case "left":
              return "left center";
            case "right":
              return "right center";
            default:
              return "center center";
          }
        })();

        const align = (st.align || "center") as "left" | "center" | "right";
        const alignClass =
          align === "left" ? "mr-auto" : align === "right" ? "ml-auto" : "mx-auto";

        const filterCss = ((): string | undefined => {
          switch (st.filter) {
            case "grayscale":
              return "grayscale(100%)";
            case "sepia":
              return "sepia(60%)";
            case "blur":
              return "blur(2px)";
            case "brighten":
              return "brightness(1.1) saturate(1.05)";
            case "dim":
              return "brightness(0.85)";
            case "contrast":
              return "contrast(1.15) saturate(1.1)";
            default:
              return undefined;
          }
        })();

        const hoverClass = ((): string => {
          switch (st.hoverEffect) {
            case "scale":
              return "transition-transform duration-500 hover:scale-[1.03]";
            case "lift":
              return "transition duration-300 hover:-translate-y-1 hover:shadow-2xl";
            case "brighten":
              return "transition duration-300 hover:brightness-110";
            case "tilt":
              return "transition-transform duration-500 hover:-rotate-1 hover:scale-[1.01]";
            default:
              return "";
          }
        })();

        // Outer wrapper handles container max-width + block alignment.
        const containerMax = containerMaxWidthPx(st.containerWidth || "wide");

        // Compute the inner frame's sizing based on sizeMode.
        const frameStyle: React.CSSProperties = {
          borderRadius: radiusPx,
          boxShadow: shadowPresetToCss(st.shadow || "soft"),
          borderWidth: borderWidthPx ? `${borderWidthPx}px` : undefined,
          borderStyle: borderWidthPx ? "solid" : undefined,
          borderColor: borderWidthPx ? st.borderColor?.trim() || "rgba(15,23,42,0.16)" : undefined,
          backgroundColor: st.backgroundColor?.trim() || undefined,
          opacity: opacityPct / 100,
          overflow: "hidden",
        };

        let frameSizing: React.CSSProperties = {};
        if (sizeMode === "ratio") {
          frameSizing = { width: "100%", maxWidth: Math.min(maxWidthPx, containerMax), aspectRatio: ratio };
        } else if (sizeMode === "fixed") {
          frameSizing = { width: widthPx, height: heightPx, maxWidth: "100%" };
        } else if (sizeMode === "full") {
          frameSizing = { width: "100%", maxWidth: "100%", aspectRatio: ratio };
        } else {
          // auto — intrinsic image sizing, capped by maxWidth
          frameSizing = { display: "inline-block", maxWidth: Math.min(maxWidthPx, containerMax) };
        }

        const imgEl = (
          <SafeImage
            src={c.src}
            alt={c.alt || "Sample image"}
            role="photo"
            className={cn("block h-full w-full", hoverClass)}
            fallbackClassName={cn("h-full w-full", hoverClass)}
            style={{
              objectFit: fit,
              objectPosition: position,
              width: sizeMode === "auto" ? "auto" : "100%",
              height: sizeMode === "auto" ? "auto" : "100%",
              maxWidth: "100%",
              filter: filterCss,
            }}
          />
        );

        const linked = c.href?.trim() ? (
          <a
            href={c.href.trim()}
            target={c.openInNewTab === "yes" ? "_blank" : undefined}
            rel={c.openInNewTab === "yes" ? "noreferrer noopener" : undefined}
            className="block h-full w-full"
          >
            {imgEl}
          </a>
        ) : (
          imgEl
        );

        const captionSize = st.captionSize === "lg" ? "text-base" : st.captionSize === "base" ? "text-sm" : "text-xs";
        const captionAlign =
          st.captionAlign === "left" ? "text-left" : st.captionAlign === "right" ? "text-right" : "text-center";

        return (
          <div
            style={{
              ...layoutToStyle(l),
              backgroundColor: st.sectionBackgroundColor?.trim() || undefined,
            }}
          >
            <figure
              className="px-4"
              style={{ maxWidth: containerMax, marginLeft: "auto", marginRight: "auto" }}
            >
              <div
                className={cn(alignClass, "ring-1 ring-black/5")}
                style={{ ...frameSizing, ...frameStyle }}
              >
                {linked}
              </div>
              {c.caption?.trim() ? (
                <figcaption
                  className={cn("mt-3 leading-relaxed", captionSize, captionAlign)}
                  style={{ color: st.captionColor?.trim() || "var(--lp-muted, #6b7280)" }}
                >
                  {highlightDynamicTags(c.caption)}
                </figcaption>
              ) : null}
            </figure>
          </div>
        );
      },
    },
  },
};

export function defaultEngagePuckData() {
  return {
    root: {
      props: {
        content: { title: "{{product.name}}" },
        style: { ...DEFAULT_ROOT_STYLE },
        layout: { ...DEFAULT_LAYOUT_PROPS },
      },
    },
    content: [] as unknown[],
  };
}
