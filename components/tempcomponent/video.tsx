import React, { useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";

interface YouTubeProps {
  productId: number;
  YouTube?: boolean;
}

interface ProductData {
  video_url?: string;
}

export default function YouTube({ productId, YouTube = true }: YouTubeProps) {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isYouTube, setIsYouTube] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`public/products/${productId}`);

        if (response.data.success) {
          const url = response.data.data.video_url?.trim() || "";

          if (url) {
            setVideoUrl(url);
            const isYt =
              url.includes("youtube.com") ||
              url.includes("youtu.be") ||
              url.includes("youtube-nocookie.com");
            setIsYouTube(isYt);
          } else {
            setVideoUrl("");
            setIsYouTube(false);
          }
        }
      } catch (err) {
        console.error("Error fetching product video:", err);
        setVideoUrl("");
        setIsYouTube(false);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return "";

    let videoId: string | undefined;

    if (url.includes("v=")) {
      videoId = url.split("v=")[1]?.split("&")[0]?.split("#")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0]?.split("#")[0];
    } else if (url.includes("/embed/")) {
      videoId = url.split("/embed/")[1]?.split("?")[0];
    } else if (url.includes("/shorts/")) {
      videoId = url.split("/shorts/")[1]?.split("?")[0];
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  };

  const embedUrl = isYouTube ? getYouTubeEmbedUrl(videoUrl) : "";

  // Early returns
  if (!YouTube) return null;

  if (loading) {
    return (
      <div className="w-full aspect-video flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Loading video...</p>
      </div>
    );
  }

  if (!videoUrl) {
    return null; // No video at all
  }

  return (
    <div className="card-header">
    <div className="w-full aspect-video relative rounded-lg overflow-hidden  bg-black py-4">
      {/* YouTube Video - Only render iframe if embedUrl is valid */}
      {isYouTube && embedUrl ? (
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="Product Video"
        />
      ) : (
        /* Direct Video File (MP4, etc.) */
        <video
          className="absolute top-0 left-0 w-full h-full object-contain bg-black"
          controls
          playsInline
          preload="metadata"
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
    </div>
  );
}