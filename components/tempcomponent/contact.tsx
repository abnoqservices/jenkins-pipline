import React, { useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";

interface ContactProps {
  productId: number;
  Contact?: boolean; // Optional, defaults to true
}

interface ContactData {
  phone?: string;
  email?: string;
  address?: string;
  directionButtonText?: string;
  directionUrl?: string;
}

export default function Contact({ productId, Contact = true }: ContactProps) {
  const [contact, setContact] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/auth/me`);

        if (response.data.success) {
          const product = response.data.data;

          // Extract contact fields from custom_field_values (common pattern)
          const customFields = product.custom_field_values || [];

          const getFieldValue = (name: string) =>
            customFields.find((f: any) => f.name === name || f.field_name === name)?.value || "";

          setContact({
            phone: getFieldValue("phone") || getFieldValue("Phone"),
            email: getFieldValue("email") || getFieldValue("Email"),
            address: getFieldValue("address") || getFieldValue("Address"),
            directionButtonText: getFieldValue("directionButtonText") || "Get Directions",
            directionUrl: getFieldValue("directionUrl") || "https://maps.google.com",
          });
        }
      } catch (err) {
        console.error("Error fetching contact details:", err);
        // Fallback to sample data if API fails (great for development/preview)
        setContact({
          phone: "+1 (555) 123-4567",
          email: "sales@example.com",
          address: "123 Business Street\nSuite 100\nNew York, NY 10001\nUnited States",
          directionButtonText: "Get Directions",
          directionUrl: "https://maps.google.com?q=123+Business+Street+New+York",
        });
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  if (!Contact) return null;

  if (loading) {
    return (
      <div className="card-header py-10 text-center">
        <p className="text-gray-500">Loading contact information...</p>
      </div>
    );
  }

  if (!contact) {
    return null; // Or show "No contact info available"
  }

  const {
    phone = "",
    email = "",
    address = "",
    directionButtonText = "Get Directions",
    directionUrl = "#",
  } = contact;

  return (
    <div className="card-header-social-contact">
      {/* Centered Heading */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900">Contact Us</h2>
        <div className="w-20 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
      </div>

      {/* Contact Details - Left Aligned */}
      <div className="space-y-8 text-left max-w-lg mx-auto">
        {/* Phone */}
        {phone && (
          <div className="flex items-start gap-5">
            <div className="text-3xl shrink-0">📞</div>
            <div>
              <p className="font-semibold text-gray-800">Phone</p>
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="text-blue-600 hover:underline break-all"
              >
                {phone}
              </a>
            </div>
          </div>
        )}

        {/* Email */}
        {email && (
          <div className="flex items-start gap-5">
            <div className="text-3xl shrink-0">✉️</div>
            <div>
              <p className="font-semibold text-gray-800">Email</p>
              <a
                href={`mailto:${email}`}
                className="text-blue-600 hover:underline break-all"
              >
                {email}
              </a>
            </div>
          </div>
        )}

        {/* Address */}
        {address && (
          <div className="flex items-start gap-5">
            <div className="text-3xl shrink-0">📍</div>
            <div>
              <p className="font-semibold text-gray-800">Address</p>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                {address}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Direction Button */}
      {directionUrl && directionUrl !== "#" && (
        <div className="mt-10 text-center">
          <a
            href={directionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg 
                       font-semibold hover:bg-blue-700 transition "
          >
            {directionButtonText}
            <span className="text-xl">→</span>
          </a>
        </div>
      )}
    </div>
  );
}
