// components/catalog/ProductCard.tsx
import { Badge } from '@/components/ui/badge'; // assume you moved primitives to ui/
import { ChevronRight } from 'lucide-react';

interface ProductCardProps {
  product: any;
  onClick: () => void;
  delay: number;
}

export default function ProductCard({ product, onClick, delay }: ProductCardProps) {
  return (
    <div
      className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fade-in-up cursor-pointer"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <Badge className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900 shadow">
          {product.category}
        </Badge>
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge className="bg-white text-slate-900 text-base px-5 py-2.5 shadow-lg">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>
      <div className="p-5 sm:p-6 space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-2xl font-bold text-amber-700">{product.price}</span>
          <span className="text-sm font-medium text-slate-600 group-hover:text-amber-700 flex items-center gap-1">
            View Details <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  );
}