"use client";

import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import axiosClient from "@/lib/axiosClient";

const DEFAULT_IMAGE =
  "https://lh3.googleusercontent.com/hzTpTV1Qwyi4crcaB_lEaRTg603ttzm_6Uw8SwBC-iQ9-PeWdFdNpejyPzFdVqWLBjf8o58sDjs8M9wV01MCyjJ3XX6GBIiUrLRiQi9ui8m0tp0";

interface GalleryImage {
  id: number;
  url: string;
  position: number;
}

interface SliderProps {
  productId: number;
  product_gallery?: boolean;
}

export default function ProductImageSlider({ 
  productId, 
  product_gallery = true 
}: SliderProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!product_gallery) {
      setImages([]);
      setLoading(false);
      return;
    }

    if (!productId) {
      setImages([{ id: 0, url: DEFAULT_IMAGE, position: 0 }]);
      setLoading(false);
      return;
    }

    const fetchImages = async () => {
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
            position: Number(item.position ?? 999),
          }))
          .sort((a, b) => a.position - b.position);

        setImages(
          galleryImages.length > 0
            ? galleryImages
            : [{ id: 0, url: DEFAULT_IMAGE, position: 0 }]
        );
      } catch (err: any) {
        console.error("Failed to load product images:", err);
        const message =
          err.response?.data?.message ||
          err.message ||
          "Failed to load product images";
        setError(message);
        setImages([{ id: 0, url: DEFAULT_IMAGE, position: 0 }]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [productId, product_gallery]);

  if (!product_gallery) return null;

  if (loading) {
    return (
      <div className="w-full aspect-[4/5] md:aspect-square bg-muted/40 rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading gallery...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-[4/5] md:aspect-square bg-destructive/10 rounded-xl flex items-center justify-center p-4 text-center">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  if (images.length === 0) return null;

  return (
    <div className="product-gallery-slider w-full">
      <Swiper
        modules={[Pagination, Autoplay]}
        loop={images.length > 1}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{ 
          clickable: true,
          dynamicBullets: true,
        }}
        spaceBetween={12}
        className="!pb-12 md:!pb-14"
      >
        {images.map((img) => (
          <SwiperSlide key={img.id}>
            <div className="relative w-full overflow-hidden rounded-xl bg-black/5">
              <div className="relative pb-[100%] md:pb-[100%]"> {/* square */}
                <img
                  src={img.url}
                  alt="Product gallery"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                    (e.target as HTMLImageElement).classList.add("opacity-70");
                  }}
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}