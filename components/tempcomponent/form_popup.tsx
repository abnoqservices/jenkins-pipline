"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Form from "./form";

interface FormPopupProps {
  productId?: number;
  title?: string;
  form_id?: string;
  popup_trigger?: string; // "time_over" or "page_scroll"
  time_seconds?: number;
  scroll_pixels?: number;
}

export default function FormPopup({
  productId,
  title,
  form_id,
  popup_trigger = "time_over",
  time_seconds = 5,
  scroll_pixels = 500,
}: FormPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (!form_id || hasTriggered) return;

    if (popup_trigger === "time_over") {
      // Show popup after specified seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasTriggered(true);
      }, (time_seconds || 5) * 1000);

      return () => clearTimeout(timer);
    } else if (popup_trigger === "page_scroll") {
      // Check initial scroll position
      const checkInitialScroll = () => {
        const scrollY = window.scrollY || window.pageYOffset;
        const threshold = scroll_pixels || 500;

        if (scrollY >= threshold && !hasTriggered) {
          setIsOpen(true);
          setHasTriggered(true);
          return true;
        }
        return false;
      };

      // Check on mount
      if (checkInitialScroll()) {
        return;
      }

      // Show popup after scrolling specified pixels
      const handleScroll = () => {
        if (checkInitialScroll()) {
          window.removeEventListener("scroll", handleScroll);
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [form_id, popup_trigger, time_seconds, scroll_pixels, hasTriggered]);

  if (!form_id) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {title || "Get in Touch"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Form
            productId={productId}
            form_id={form_id}
            form_title={title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
