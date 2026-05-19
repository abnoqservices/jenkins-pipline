// components/ProductFilter.tsx
'use client'; // if using Next.js App Router

import { useState, useEffect } from 'react';

interface FilterState {
  search: string;
  categories: string[];
  priceMin: number | '';
  priceMax: number | '';
  brands: string[];
  colors: string[];
  rating: number | null;
}

interface ProductFilterProps {
  initialFilters?: Partial<FilterState>;
  onFilterChange: (filters: FilterState) => void;
  // You can pass these from parent or fetch from API
  availableCategories?: string[];
  availableBrands?: string[];
  availableColors?: string[];
  maxPrice?: number;
}

const defaultCategories = ['T-Shirts', 'Jeans', 'Shoes', 'Jackets', 'Accessories'];
const defaultBrands = ['Nike', 'Adidas', 'Puma', 'Levis', 'Zara'];
const defaultColors = ['Red', 'Blue', 'Black', 'White', 'Green'];

export default function ProductFilter({
  initialFilters = {},
  onFilterChange,
  availableCategories = defaultCategories,
  availableBrands = defaultBrands,
  availableColors = defaultColors,
  maxPrice = 5000,
}: ProductFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: [],
    priceMin: '',
    priceMax: '',
    brands: [],
    colors: [],
    rating: null,
    ...initialFilters,
  });

  // Notify parent whenever filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const handleCategoryChange = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: toggleArrayItem(prev.categories, category),
    }));
  };

  const handleBrandChange = (brand: string) => {
    setFilters((prev) => ({
      ...prev,
      brands: toggleArrayItem(prev.brands, brand),
    }));
  };

  const handleColorChange = (color: string) => {
    setFilters((prev) => ({
      ...prev,
      colors: toggleArrayItem(prev.colors, color),
    }));
  };

  return (
    <div className="w-full lg:w-72 xl:w-80 bg-white border-r border-gray-200 p-6 space-y-8 sticky top-20 h-fit">
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900">Filters</h2>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value }))
          }
          placeholder="e.g. running shoes"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          {availableCategories.map((cat) => (
            <label key={cat} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => handleCategoryChange(cat)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-gray-700">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Price Range</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Min</label>
            <input
              type="number"
              min={0}
              value={filters.priceMin}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  priceMin: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Max</label>
            <input
              type="number"
              min={0}
              max={maxPrice}
              value={filters.priceMax}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  priceMax: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
              placeholder={maxPrice.toString()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Brands</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {availableBrands.map((brand) => (
            <label key={brand} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={() => handleBrandChange(brand)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-gray-700">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Colors</h3>
        <div className="flex flex-wrap gap-3">
          {availableColors.map((color) => (
            <label key={color} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.colors.includes(color)}
                onChange={() => handleColorChange(color)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span
                className="w-6 h-6 rounded-full border border-gray-300"
                style={{ backgroundColor: color.toLowerCase() }}
              ></span>
              <span className="text-sm text-gray-700">{color}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating (simple example) */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Rating</h3>
        {[4, 3, 2, 1].map((stars) => (
          <label key={stars} className="flex items-center mb-2">
            <input
              type="radio"
              name="rating"
              checked={filters.rating === stars}
              onChange={() =>
                setFilters((prev) => ({ ...prev, rating: stars }))
              }
              className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
            />
            <span className="ml-2 text-gray-700">
              {stars}+ Stars
            </span>
          </label>
        ))}
      </div>

      {/* Reset Button */}
      <button
        onClick={() =>
          setFilters({
            search: '',
            categories: [],
            priceMin: '',
            priceMax: '',
            brands: [],
            colors: [],
            rating: null,
          })
        }
        className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition"
      >
        Clear All Filters
      </button>
    </div>
  );
}