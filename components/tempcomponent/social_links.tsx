import React, { useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  MessageCircle,
} from "lucide-react";

interface SocialProps {
  productId: number;
  Social?: boolean;
}

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  whatsapp?: string;
}

export default function Social({ productId, Social = true }: SocialProps) {
  const [links, setLinks] = useState<SocialLinks>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/auth/me`);

        if (response.data.success) {
          const customFields = response.data.data.custom_field_values || [];

          const getField = (names: string[]) =>
            customFields.find((f: any) =>
              names.some((n) => f.name?.toLowerCase() === n.toLowerCase())
            )?.value?.trim() || "";

          setLinks({
            facebook: getField(["facebook", "fb"]),
            instagram: getField(["instagram", "ig"]),
            twitter: getField(["twitter", "x"]),
            youtube: getField(["youtube", "yt"]),
            linkedin: getField(["linkedin"]),
            whatsapp: getField(["whatsapp", "wa"]),
          });
        }
      } catch (err) {
        console.error("Error fetching social links:", err);
        // Sample fallback data
        setLinks({
          facebook: "https://facebook.com/example",
          instagram: "https://instagram.com/example",
          youtube: "https://youtube.com/@example",
          whatsapp: "https://wa.me/15551234567",
        });
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const socialPlatforms = [
    { name: "Facebook", icon: Facebook, link: links.facebook, color: "bg-blue-600 hover:bg-blue-700" },
    { name: "Instagram", icon: Instagram, link: links.instagram, color: "bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 hover:opacity-90" },
    { name: "Twitter / X", icon: Twitter, link: links.twitter, color: "bg-black hover:bg-gray-800" },
    { name: "YouTube", icon: Youtube, link: links.youtube, color: "bg-red-600 hover:bg-red-700" },
    { name: "LinkedIn", icon: Linkedin, link: links.linkedin, color: "bg-blue-700 hover:bg-blue-800" },
    { name: "WhatsApp", icon: MessageCircle, link: links.whatsapp, color: "bg-green-500 hover:bg-green-600" },
  ];

  const validLinks = socialPlatforms.filter((p) => p.link && p.link !== "");

  if (!Social) return null;

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Loading social connections...</p>
      </div>
    );
  }

  if (validLinks.length === 0) return null;

  return (
    <div className="card-header-social-contact">
      {/* Header */}
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-gray-900 mb-3">Connect With Us</h3>
        <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
        <p className="text-gray-600 mt-4">Stay updated with our latest news and offers</p>
      </div>

      {/* Vertical Stack of Social Buttons */}
      <div className="space-y-4">
        {validLinks.map((platform) => {
          const Icon = platform.icon;
          return (
            <a
              key={platform.name}
              href={platform.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                w-full flex items-center justify-between
                px-8 py-6 rounded-2xl
                ${platform.color}
                text-white 
                transition-all duration-300
                hover:shadow-2xl hover:-translate-y-1
                active:scale-[0.98]
              `}
            >
              <div className="flex items-center gap-5">
                <Icon className="w-8 h-8" />
                <span className="text-lg font-medium">{platform.name}</span>
              </div>
              <span className="text-2xl">→</span>
            </a>
          );
        })}
      </div>

      <p className="text-center text-gray-500 text-sm mt-10">
        Follow us for exclusive updates and behind-the-scenes content
      </p>
    </div>
  );
}