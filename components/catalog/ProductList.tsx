// components/catalog/ProductList.tsx
import { ChevronRight } from 'lucide-react';

interface Product {
  id?: number | string;
  image: string;
  name: string;
  price: string;
  cta?: string;
  category?: string;
  inStock?: boolean;
  description?: string;
  shortDescription?: string;
  rating?: number;
  reviewCount?: number;
}

interface ProductListProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
  viewMode?: 'grid' | 'list';   // optional – if you want to support list view later
}

// Helper to group products by category
function groupByCategory(products: Product[]) {
  const groups: Record<string, Product[]> = {};

  products.forEach((product) => {
    const cat = product.category || 'Other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(product);
  });

  // Sort categories alphabetically
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

export default function ProductList({
  products,
  onProductClick,
  viewMode = 'grid', // default to grid
}: ProductListProps) {
  const groupedProducts = groupByCategory(products);
  const isListView = viewMode === 'list';

  // If no products match filters
  if (products.length === 0) {
    return (
      <section className="py-16 md:py-24 bg-[#f9f7f4] min-h-screen">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <h2 className="text-3xl font-serif font-bold text-gray-800 mb-4">
              No products found
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              No items match your current filters. Try adjusting price range, category, or search term.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-[#f9f7f4] min-h-screen">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-gray-900 tracking-tight">
            Premium Collection Catalogue
          </h2>
          <p className="mt-4 text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto font-light italic">
            Curated • Timeless • Handcrafted
          </p>
          <div className="w-20 h-0.5 bg-amber-800 mx-auto mt-6"></div>
        </div>

        {groupedProducts.map(([category, items]) => (
          <div key={category} className="mb-20 last:mb-0">
            {/* Category Title */}
            <h3 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 mb-10 text-center">
              <span className="inline-block border-b-4 border-amber-400 pb-2">
                {category}
              </span>
            </h3>

            {/* Products – Grid or List */}
            <div
              className={`
                ${isListView 
                  ? 'space-y-6 divide-y divide-gray-200'
                  : `
                    grid gap-6 sm:gap-8 md:gap-10 lg:gap-12
                    grid-cols-2
                    sm:grid-cols-3
                    md:grid-cols-4
                    lg:grid-cols-5
                    xl:grid-cols-6
                    2xl:grid-cols-7
                  `}
              `}
            >
              {items.map((product) => (
                <div
                  key={product.id ?? product.name}
                  onClick={() => onProductClick?.(product)}
                  className={`
                    group relative bg-white rounded-lg overflow-hidden
                    border border-gray-200/80 shadow-sm hover:shadow-lg
                    transition-all duration-300 cursor-pointer
                    ${isListView 
                      ? 'flex items-center gap-6 p-4 hover:bg-gray-50'
                      : 'flex flex-col h-full'}
                  `}
                >
                  {/* Image */}
                  <div className={`
                    ${isListView 
                      ? 'w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0'
                      : 'relative aspect-square overflow-hidden bg-gray-50'}
                  `}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`
                        h-full w-full object-cover
                        ${isListView 
                          ? 'rounded-lg'
                          : 'transition-transform duration-700 group-hover:scale-[1.04]'}
                      `}
                      loading="lazy"
                    />

                    {/* Price tag */}
                    <span className="
                      absolute top-3 left-3 z-10
                      bg-white/90 backdrop-blur-sm px-2.5 py-1
                      text-xs font-medium text-gray-800
                      rounded border border-gray-200/70 shadow-sm
                    ">
                      {product.price}
                    </span>
                  </div>

                  {/* Content */}
                  <div className={`
                    ${isListView 
                      ? 'flex-1 flex flex-col justify-between'
                      : 'p-4 flex flex-col flex-grow space-y-2'}
                  `}>
                    <div>
                      <h3 className={`
                        font-serif font-semibold text-gray-900 leading-snug
                        group-hover:text-amber-800 transition-colors
                        ${isListView 
                          ? 'text-lg sm:text-xl line-clamp-2'
                          : 'text-sm sm:text-base line-clamp-2 min-h-[2.6em]'}
                      `}>
                        {product.name}
                      </h3>

                      {product.shortDescription && !isListView && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {product.shortDescription}
                        </p>
                      )}
                    </div>

                    {/* Bottom row */}
                    <div className={`
                      flex items-center justify-between
                      ${isListView ? 'mt-2' : 'mt-auto border-t border-gray-200 pt-3'}
                    `}>
                      {isListView && product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 flex-1 pr-4">
                          {product.description}
                        </p>
                      )}

                      <button
                        className={`
                          inline-flex items-center gap-1.5 text-sm font-medium
                          ${
                            product.inStock !== false
                              ? 'text-amber-800 hover:text-amber-950'
                              : 'text-gray-400 cursor-not-allowed opacity-60'
                          }
                          transition-colors
                        `}
                        disabled={product.inStock === false}
                      >
                        {product.cta || 'View Details'}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Optional browse more button */}
        {products.length > 20 && (
          <div className="mt-16 text-center">
            <button className="
              inline-flex items-center gap-3
              rounded-full bg-gray-900 px-10 py-5
              text-lg font-semibold text-white
              hover:bg-gray-800 transition-colors shadow-md
            ">
              Browse Complete Catalogue
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}