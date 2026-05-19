"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

interface TestimonialItem {
  image?: string;
  name?: string;
  designation?: string;
  rating?: string | number;
  description?: string;
}

interface Field {
  name: string;
  items?: TestimonialItem[];
}

interface TestimonialSliderProps {
  data?: Field[];           // ← make it optional
}

export default function TestimonialSlider({ data = [] }: TestimonialSliderProps) {
  const DEFAULT_IMAGE =
    "https://lh3.googleusercontent.com/hzTpTV1Qwyi4crcaB_lEaRTg603ttzm_6Uw8SwBC-iQ9-PeWdFdNpejyPzFdVqWLBjf8o58sDjs8M9wV01MCyjJ3XX6GBIiUrLRiQi9ui8m0tp0";

  // Safeguard: if data is not an array or is undefined → empty array
  const fields = Array.isArray(data) ? data : [];

  // 1. Find the "Testimonials" field safely
  const testimonialField = fields.find((f) => f.name === "Testimonials");

  // 2. Get items with fallback
  const items = testimonialField?.items ?? [];

  // 3. Prepare slides (with defaults)
  const slides = items.length > 0
    ? items.map((item, index) => ({
        id: index + 1,
        image: item.image || DEFAULT_IMAGE,
        name: item.name || "Anonymous",
        designation: item.designation || "Customer",
        rating: Number(item.rating) || 5,
        description:
          item.description ||
          "Great experience! Highly recommended.",
      }))
    : [
        // Fallback slide when no testimonials exist
        {
          id: 1,
          image: DEFAULT_IMAGE,
          name: "No testimonials yet",
          designation: "",
          rating: 5,
          description: "Be the first to share your experience!",
        },
      ];

  return (
    <div className="card-header py-8">
      <Swiper
        modules={[Pagination, Autoplay]}
        slidesPerView={1}
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop={slides.length > 1}           // only loop if > 1 slide
        className="pb-10"
      >
        {slides.map((item) => (
          <SwiperSlide key={item.id}>
            <div className="flex flex-col items-center text-center gap-4 max-w-[420px] mx-auto px-4">
              {/* Avatar */}
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-gray-200 shadow-sm"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_IMAGE;
                }}
              />

              {/* Name & Role */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                {item.designation && (
                  <p className="text-sm text-gray-500 mt-1">{item.designation}</p>
                )}
              </div>

              {/* Stars */}
              <div className="flex gap-1 text-yellow-400 text-2xl">
                {Array.from({ length: Math.round(item.rating) }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-600 text-base leading-relaxed italic px-6 max-w-prose">
                "{item.description}"
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}