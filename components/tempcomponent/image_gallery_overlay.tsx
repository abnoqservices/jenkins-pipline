'use client'

import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import axiosClient from "@/lib/axiosClient";

const DEFAULT_IMAGE =
  "https://lh3.googleusercontent.com/hzTpTV1Qwyi4crcaB_lEaRTg603ttzm_6Uw8SwBC-iQ9-PeWdFdNpejyPzFdVqWLBjf8o58sDjs8M9wV01MCyjJ3XX6GBIiUrLRiQi9ui8m0tp0";

interface GalleryImage {
  id: number;
  url: string;
  position: number;
}

interface SliderTwoProps {
  productId: number;
}

export default function SliderTwo({ productId }: SliderTwoProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      if (!productId) {
        setImages([{ id: 0, url: DEFAULT_IMAGE, position: 1 }]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await axiosClient.get(`public/products/${productId}`);
        if (!res.data?.success) {
          throw new Error(res.data?.message || "API returned success: false");
        }

        const galleryImages = (res.data.data?.images || [])
          .filter((item: any) => item.type === "gallery" && item.url?.trim())
          .map((item: any) => ({
            id: item.id,
            url: item.url.trim(),
            position: item.position ?? 999,
          }))
          .sort((a: GalleryImage, b: GalleryImage) => a.position - b.position);

        setImages(
          galleryImages.length > 0
            ? galleryImages
            : [{ id: 0, url: DEFAULT_IMAGE, position: 1 }]
        );
      } catch (err: any) {
        console.error("Error fetching images:", err);
        const message =
          err.response?.data?.message ||
          err.message ||
          "Failed to load gallery images";
        setError(message);
        setImages([{ id: 0, url: DEFAULT_IMAGE, position: 1 }]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [productId]);

  // Loading state – same look as previous sliders
  if (loading) {
    return (
      <div className="w-full max-w-[900px] mx-auto h-[300px] flex items-center justify-center bg-muted rounded-xl">
        <p className="text-muted-foreground">Loading beautiful slides...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-[900px] mx-auto h-[300px] flex items-center justify-center bg-destructive/10 rounded-xl">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  // No images (won’t happen because we always have fallback)
  if (images.length === 0) return null;

  return (
    <Swiper
      effect="coverflow"
      grabCursor={true}
      centeredSlides={true}
      slidesPerView={"auto"}
      loop={images.length > 1} // only loop if more than 1 image
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      coverflowEffect={{
        rotate: 50,
        stretch: 30,
        depth: 350,
        modifier: 19,
        slideShadows: true,
      }}
      pagination={{ clickable: true }}
      modules={[EffectCoverflow, Autoplay, Pagination]}
     
    >
      {images.map((img) => (
        <SwiperSlide key={img.id}>
          {/* PERFECT SQUARE BOX – exactly your original */}
          <div className="card-header-slider">
            <img
              src={img.url}
              className="w-full h-full object-cover rounded-xl"
              alt="Gallery slide"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
              }}
            />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}