"use client";

import React, { useEffect, useState } from "react";
import axiosClient from "@/lib/axiosClient";

export default function BrandHeader({ 
  brand_name, 
  tagline,
  productId,
  logo_url: propLogoUrl
}: { 
  brand_name?: string;
  tagline?: string;
  productId?: number;
  logo_url?: string;
}){
  const [logoUrl, setLogoUrl] = useState<string | null>(propLogoUrl || null);

  // Fetch department logo if productId is provided and logo_url not passed as prop
  useEffect(() => {
    if (productId && !propLogoUrl && !logoUrl) {
      const fetchDepartmentLogo = async () => {
        try {
          const res = await axiosClient.get(`/products/${productId}`);
          if (res.data?.success && res.data?.data?.department?.logo_url) {
            setLogoUrl(res.data.data.department.logo_url);
          }
        } catch (error) {
          // Silently fail - logo is optional
          console.debug("Could not fetch department logo:", error);
        }
      };
      fetchDepartmentLogo();
    }
  }, [productId, propLogoUrl, logoUrl]);

  return ( 
    <div className="flex flex-col items-center text-center py-6 px-4">
      {/* Organization/Department Logo */}
      {logoUrl && (
        <div className="mb-4">
          <img 
            src={logoUrl} 
            alt={brand_name || "Brand Logo"} 
            className="h-16 w-16 md:h-20 md:w-20 object-contain"
            onError={() => setLogoUrl(null)} // Hide logo if it fails to load
          />
        </div>
      )}
      
      {/* Brand Name */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {brand_name || "Your Brand Name"}
      </h1>
  
      {/* Tagline */}
      {tagline && (
        <p className="text-gray-600 text-base leading-relaxed max-w-md">
          {tagline}
        </p>
      )}
    </div>
  );
}
