import React, { useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";

interface PheaderProps {
  productId: number;
  product_header?: boolean; // Optional, defaults to true
}

interface ProductData {
  id: number;
  name: string;
  sku: string;
  category: string; // From top-level "category" string (e.g., "Smartphones")
  price: string;
  description: string;
  images: Array<{ url?: string }>; // Adjust based on actual images structure
  // Add other fields if needed
}

export default function Pheader({ productId, product_header = true }: PheaderProps) {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {axiosClient.get(`public/products/${productId}`);
        setLoading(true);
       
        const response = await axiosClient.get(`public/products/${productId}`);
        if (response.data.success) {
          setProduct(response.data.data);
        } else {
          setError("Failed to fetch product");
        }
      } catch (err) {
        setError("An error occurred while fetching the product");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className="card-header flex flex-col items-center text-center py-6 px-4">
        <p className="text-gray-600">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="card-header flex flex-col items-center text-center py-6 px-4">
        <p className="text-red-600">{error || "Product not found"}</p>
      </div>
    );
  }
  if (!product_header) {
    return null;
  }
  // Use first image if available, otherwise fallback
  const productImage = product.images?.[0]?.url || "/F1.jpg";
  // Use top-level category string (e.g., "Smartphones")
  const category = typeof product.category === 'string'
  ? product.category
  : product.category?.name || "Uncategorized";

  return (
    <div className="card-header flex flex-col items-center text-center py-6 px-4">
      {/* Shadow Wrapper - Product Image */}
      <div className="rounded-full shadow-xl p-1 mb-6">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = "/fallback-logo.png")}
          />
        </div>
      </div>

      {/* Product Title */}
      <h1 className="text-4xl font-bold text-gray-900 mb-3">
        {product.name}
      </h1>

      {/* Price */}
      <p className="text-3xl font-semibold text-green-600 mb-4">
        ${product.price}
      </p>

      {/* SKU & Category */}
      <div className="flex gap-4 text-sm text-gray-500 mb-4">
        <span>SKU: {product.sku}</span>
        <span>•</span>
        <span>Category: {category}</span>
      </div>

      {/* Description / Subtitle */}
      <p className="text-gray-600 text-base leading-relaxed max-w-lg">
        {product.description}
      </p>
    </div>
  );
}