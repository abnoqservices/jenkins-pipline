"use client";

import React, { useEffect, useRef } from "react";
import { SECTION_COMPONENTS } from "@/components/tempcomponent";

const Template1: React.FC<{ data: any; productId: number }> = ({ data, productId }) => {
  const { sections = [], styles = {} } = data;
  const containerRef = useRef<HTMLDivElement>(null);

  // Build inline style object from styles prop
  const pageStyle: React.CSSProperties = {
    backgroundColor: styles.backgroundColor || "#FFFFFF",
    color: styles.textColor || "#000000",
    minHeight: "100vh",
  };

  // Apply scoped styles only within the template container
  useEffect(() => {
    if (!containerRef.current) return;

    const styleId = 'template-custom-styles-' + productId;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Use a unique class to scope styles to this template instance
    const templateClass = `template-wrapper-${productId || 'preview'}`;
    if (containerRef.current) {
      containerRef.current.className = `min-h-screen ${templateClass}`;
    }

    const css = `
      .${templateClass} {
        background-color: ${styles.backgroundColor || "#FFFFFF"} !important;
        color: ${styles.textColor || "#000000"} !important;
      }
      .${templateClass} a {
        color: ${styles.linkColor || styles.accentColor || "#007BFF"} !important;
      }
      .${templateClass} button,
      .${templateClass} .button,
      .${templateClass} [role="button"] {
        background-color: ${styles.buttonBackgroundColor || styles.accentColor || "#007BFF"} !important;
        color: ${styles.buttonTextColor || "#FFFFFF"} !important;
      }
      .${templateClass} .text-gray-600 {
        color: ${styles.secondaryTextColor || "#666666"} !important;
      }
      .${templateClass} .text-gray-900 {
        color: ${styles.textColor || "#000000"} !important;
      }
    `;

    styleElement.textContent = css;

    return () => {
      // Cleanup on unmount
      const element = document.getElementById(styleId);
      if (element) {
        element.remove();
      }
    };
  }, [styles, productId]);

  return (
    <div ref={containerRef} className="min-h-screen" style={pageStyle}>
      <div className="container mx-auto px-1 py-2">
      {sections
            .filter((s: any) => s.content !== undefined)
            .map((item: any, index: number) => {
              
              const sectionName = item.section.split('_dept_')[0]; // 👈 extract base name
              const Component = SECTION_COMPONENTS[sectionName];
              if (!Component) {
                console.warn(`Missing component for section: ${item.section}`);
                return null;
              }

              return (
                <Component
                  key={`${sectionName}-${index}`}
                  {...item.content}
                  productId={productId}
                />
              );
            })}
      </div>
    </div>
  );
};

export default Template1;