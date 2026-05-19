"use client";

import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import axiosClient from "@/lib/axiosClient";

const DEFAULT_IMAGE =
  "https://lh3.googleusercontent.com/hzTpTV1Qwyi4crcaB_lEaRTg603ttzm_6Uw8SwBC-iQ9-PeWdFdNpejyPzFdVqWLBjf8o58sDjs8M9wV01MCyjJ3XX6GBIiUrLRiQi9ui8m0tp0";

interface GalleryImage {
  id: number;
  url: string;
  position: number;
}

interface ProductData {
  name: string;
  price: number;
  is_active?: boolean;
}

interface SliderThreeProps {
  productId: number;
}

export default function SliderThree({ productId }: SliderThreeProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) {
        setImages([{ id: 0, url: DEFAULT_IMAGE, position: 1 }]);
        setProduct(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch product name and price
        const productRes = await axiosClient.get(`public/products/${productId}`);

        if (!productRes.data?.success && !productRes.data?.name) {
          // Some APIs return data directly, others wrap in { success, data }
          throw new Error("Failed to load product details");
        }

        const productData = productRes.data.data || productRes.data;

        setProduct({
          name: productData.name || "Untitled Product",
          price: parseFloat(productData.price) || 0,
        });

        // Fetch gallery images (same as original Slider)
        const imagesRes = await axiosClient.get(`public/products/${productId}`);

        if (!imagesRes.data?.success) {
          throw new Error(imagesRes.data?.message || "API returned success: false");
        }

        const galleryImages = (imagesRes.data.data?.images || [])
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
        console.error("Error fetching data:", err);
        const message =
          err.response?.data?.message ||
          err.message ||
          "Failed to load product data";
        setError(message);
        setImages([{ id: 0, url: DEFAULT_IMAGE, position: 1 }]);
        setProduct({ name: "Product Unavailable", price: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-[1200px] mx-auto aspect-square flex items-center justify-center bg-muted rounded-xl">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-[1200px] mx-auto aspect-square flex items-center justify-center bg-destructive/10 rounded-xl">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  const title = product?.name || "No Product Name";
  const subtitle = product?.price > 0 ? `$${product.price.toFixed(2)}` : "";

  return (
    <div className="card-header-slider">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        loop={images.length > 1}
      
      >
        {images.map((img) => (
          <SwiperSlide key={img.id}>
            <div className="relative w-full  mx-auto aspect-square">
              <img
                src={img.url}
                alt={title}
                className="w-full h-full object-cover rounded-xl "
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                }}
              />

              {(title || subtitle) && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white drop- text-center w-auto px-6 py-3 bg-black/50 backdrop-blur-sm rounded-xl">
                  <h2 className="text-sl md:text-sl font-bold leading-tight">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-sl md:text-sl font-semibold mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}