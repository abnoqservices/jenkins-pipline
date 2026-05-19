"use client";

import React, { useState } from 'react';
import FormPopup from './form_popup';

interface CTAProps {
  cta_text?: string;
  cta_action?: 'popup' | 'url';
  popup_id?: string;
  url?: string;
  no_follow?: boolean;
  open_new_tab?: boolean;
  productId?: number;
}

export default function CTA({ 
  cta_text, 
  cta_action = 'url',
  popup_id,
  url,
  no_follow = false,
  open_new_tab = false,
  productId 
}: CTAProps) {
  const [showPopup, setShowPopup] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (cta_action === 'popup' && popup_id) {
      e.preventDefault();
      setShowPopup(true);
    }
  };

  const linkProps = {
    rel: no_follow ? 'nofollow' : undefined,
    target: open_new_tab ? '_blank' : undefined,
  };

  return (
    <>
      <section className="card-header py-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          {/* Dynamic Heading */}
          <h5 className="core-header-title">
            {cta_text || "Ready to Get Started?"}
          </h5>
          <div className="w-12 h-1 bg-gray-100 mx-auto mb-4 rounded-full"></div>
          
          {/* CTA Button */}
          <div className="flex justify-center">
            {cta_action === 'popup' && popup_id ? (
              <button
                onClick={handleClick}
                className="inline-flex items-center gap-3 bg-blue-600 text-white font-bold text-xl 
                           px-10 py-5 rounded-2xl shadow-xl hover:bg-blue-700 
                           transform hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <span>Start Now</span>
                <svg xmlns="http://www.w3.org/2000/svg" 
                     className="w-7 h-7" 
                     fill="none" 
                     viewBox="0 0 24 24" 
                     stroke="currentColor">
                  <path strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2.5} 
                        d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            ) : (
              <a
                href={url || "#"}
                {...linkProps}
                className="inline-flex items-center gap-3 bg-blue-600 text-white font-bold text-xl 
                           px-10 py-5 rounded-2xl shadow-xl hover:bg-blue-700 
                           transform hover:scale-105 transition-all duration-300"
              >
                <span>Start Now</span>
                <svg xmlns="http://www.w3.org/2000/svg" 
                     className="w-7 h-7" 
                     fill="none" 
                     viewBox="0 0 24 24" 
                     stroke="currentColor">
                  <path strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2.5} 
                        d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            )}
          </div>

          {/* Optional subtext */}
          <p className="mt-6 text-gray-600 text-sm">
            No credit card required • Free trial available
          </p>
        </div>
      </section>

      {/* Popup Modal */}
      {showPopup && popup_id && (
        <FormPopup
          productId={productId}
          title=""
          form_id={popup_id}
          popup_trigger="time_over"
          time_seconds={0}
        />
      )}
    </>
  );
}
