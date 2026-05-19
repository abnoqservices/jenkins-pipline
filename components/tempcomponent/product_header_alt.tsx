import React, { useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";

interface PropheaderProps {
  productId: number;
  pro_p_header?: boolean; // Optional, defaults to true
}

interface ProductData {
  id: number;
  name: string;
  sku: string;
  category: string | { name: string }; // Can be string or object with name
  price: string;
  description: string;
  images: Array<{ url?: string }>;
}

export default function Propheader({ productId, pro_p_header = true }: PropheaderProps) {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/products/${productId}`);
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
      <div className="flex flex-col items-center text-center py-8">
        <p className="text-gray-600">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center text-center py-8">
        <p className="text-red-600">{error || "Product not found"}</p>
      </div>
    );
  }

  if (!pro_p_header) {
    return null;
  }

  // Extract category name safely
  const category =
    typeof product.category === "string"
      ? product.category
      : product.category?.name || "Uncategorized";

  // Truncate description to ~200 characters
  const MAX_CHARS = 200;
  const description = product.description || "";
  const shouldTruncate = description.length > MAX_CHARS;
  const truncatedDescription = description.slice(0, MAX_CHARS);
  const displayDescription = isExpanded ? description : truncatedDescription;

  return (
    <div className="card-header ">
      {/* Product Title */}
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        {product.name}
      </h1>

      {/* Category */}
      <p className="text-lg text-gray-600 mb-6">
        Category: <span className="font-medium text-gray-800">{category}</span>
      </p>

      {/* Description with Read More/Less */}
      <div className="text-gray-700 text-base leading-relaxed text-justify">
        <p className="whitespace-pre-line">
          {displayDescription}
          {!isExpanded && shouldTruncate && <span>...</span>}
        </p>

        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm focus:outline-none transition"
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
    </div>
  );
}