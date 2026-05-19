// components/catalog/ProductModal.tsx
'use client';

import { useState } from 'react';
import { X, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProductModalProps {
  product: any;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product || !product.images?.length) {
    return (
      <div className="p-8 text-center text-slate-600">
        No images available for this product
      </div>
    );
  }

  const currentImage = product.images[currentImageIndex];
  const hasMultipleImages = product.images.length > 1;

  const handlePrev = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="grid md:grid-cols-2 gap-0 max-h-[90vh] md:max-h-[85vh]">
      {/* Left: Image Gallery Section */}
      <div className="flex flex-col h-full">
        {/* Main Image - Reduced heights for mobile */}
        <div className="relative h-[250px] sm:h-[320px] md:h-[420px] bg-slate-50 overflow-hidden group">
          <img
            src={currentImage}
            alt={`${product.name} - view ${currentImageIndex + 1}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
          />

          {/* Navigation arrows */}
          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/70 p-2 shadow-md hover:bg-white transition-all opacity-70 hover:opacity-100"
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-slate-800" />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/70 p-2 shadow-md hover:bg-white transition-all opacity-70 hover:opacity-100"
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-slate-800" />
              </button>

              {/* Image counter */}
              <div className="absolute bottom-3 right-3 bg-black/65 text-white text-xs px-2 py-1 rounded-full">
                {currentImageIndex + 1} / {product.images.length}
              </div>
            </>
          )}

          {/* Category badge */}
          {product.category && (
            <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-800 shadow-sm text-xs px-2 py-0.5">
              {product.category}
            </Badge>
          )}
        </div>

        {/* Thumbnails - Smaller on mobile */}
        {hasMultipleImages && (
          <div className="p-2 md:p-3 bg-slate-50 border-t border-slate-200">
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-slate-100">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`
                    flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-md overflow-hidden 
                    border-2 transition-all duration-200 snap-start
                    ${idx === currentImageIndex 
                      ? 'border-amber-600 scale-105 shadow-md ring-1 ring-amber-400' 
                      : 'border-transparent opacity-75 hover:opacity-100 hover:border-amber-300 hover:scale-105'}
                  `}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Product Details - Scrollable with smaller sizing */}
      <div className="p-4 sm:p-5 md:p-6 lg:p-8 overflow-y-auto">
        <div className="space-y-4 md:space-y-5">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              {product.name}
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-amber-700">
                {product.price}
              </span>
              {product.inStock ? (
                <Badge className="bg-green-100 text-green-800 border border-green-200 text-xs px-2 py-0.5">
                  In Stock
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 border border-red-200 text-xs px-2 py-0.5">
                  Out of Stock
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-base md:text-lg font-semibold text-slate-900">Description</h3>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description || "No detailed description available."}
            </p>
          </div>

          {/* Features */}
          {product.features?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-base md:text-lg font-semibold text-slate-900">Key Features</h3>
              <ul className="space-y-1.5 text-sm md:text-base text-slate-700">
                {product.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 text-xs md:text-sm border-t border-slate-100 pt-4">
            {product.dimensions && (
              <div>
                <p className="text-slate-600 font-medium">Dimensions</p>
                <p className="font-semibold">{product.dimensions}</p>
              </div>
            )}
            {product.weight && (
              <div>
                <p className="text-slate-600 font-medium">Weight</p>
                <p className="font-semibold">{product.weight}</p>
              </div>
            )}
            {product.material && (
              <div>
                <p className="text-slate-600 font-medium">Material</p>
                <p className="font-semibold">{product.material}</p>
              </div>
            )}
          </div>

          {/* Call to Action */}
          <div className="pt-4 md:pt-6">
            <Button
              className="w-full py-4 md:py-5 text-sm md:text-base shadow-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 transition-all"
              disabled={!product.inStock}
              onClick={() => alert(`Added ${product.name} to cart!`)}
            >
              <ShoppingCart className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              {product.inStock ? product.cta || 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}