"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PopupProps {
  popup_title?: string;
  popup_appear_after?: 'time' | 'scroll' | 'exit_intent';
  time_seconds?: number;
  scroll_percent?: number;
  popup_id?: string;
  children?: React.ReactNode;
}

export default function Popup({
  popup_title,
  popup_appear_after = 'time',
  time_seconds = 5,
  scroll_percent = 50,
  popup_id,
  children
}: PopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (hasTriggered || !popup_id) return;

    const handleTrigger = () => {
      if (!hasTriggered) {
        setIsOpen(true);
        setHasTriggered(true);
      }
    };

    if (popup_appear_after === 'time') {
      const timer = setTimeout(handleTrigger, (time_seconds || 5) * 1000);
      return () => clearTimeout(timer);
    } else if (popup_appear_after === 'scroll') {
      const handleScroll = () => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
        
        if (scrollPercentage >= (scroll_percent || 50)) {
          handleTrigger();
        }
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    } else if (popup_appear_after === 'exit_intent') {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          handleTrigger();
        }
      };

      document.addEventListener('mouseleave', handleMouseLeave);
      return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }
  }, [popup_appear_after, time_seconds, scroll_percent, popup_id, hasTriggered]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          {popup_title && <DialogTitle>{popup_title}</DialogTitle>}
        </DialogHeader>
        <div className="mt-4">
          {children || (
            <p className="text-gray-600">
              This is a popup with ID: {popup_id}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
