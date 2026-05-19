// CompanyHeaderCompact.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, Filter, LayoutGrid, LayoutList, X } from 'lucide-react';
import { ProductFilters } from '@/lib/types/filters';   // adjust path
import { mockData } from '@/lib/mockCatalogData';
interface CompanyHeaderCompactProps {
  logo: string;
  name: string;
  tagline: string;
  onSearch?: (query: string) => void;           // optional – main header search
  viewMode?: 'grid' | 'list';
  onViewChange?: (view: 'grid' | 'list') => void;

  // NEW – filter control comes from parent
  filters: ProductFilters;
  setFilters: React.Dispatch<React.SetStateAction<ProductFilters>>;
}

export default function CompanyHeaderCompact({
  logo,
  name,
  tagline,
  onSearch,
  viewMode = 'grid',
  onViewChange,
  filters,
  setFilters,
}: CompanyHeaderCompactProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const toggleFilter = () => setIsFilterOpen(prev => !prev);

  const categories = Array.from(
    new Set(mockData.products.map(p => p.category))   // ← dynamically get unique categories
  ).sort();

  const toggleCategory = (cat: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const applyFilters = () => {
    setIsFilterOpen(false);
    // You can add analytics or scroll to products here if you want
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setIsFilterOpen(false);
  };

  return (
    <>
      {/* HEADER – same as before, just removed commented prop */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-lg border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-10 w-10 rounded-lg  from-amber-600 to-orange-600 shadow-sm overflow-hidden flex-shrink-0">
                <Image src={logo} alt={name} fill className="object-cover" />
              </div>
              <div className="min-w-0 hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{name}</h1>
                <p className="text-xs text-gray-500 truncate">{tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-2xl">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-50 " />
                <input
                  type="text"
                  value={filters.search}                     // ← controlled by parent
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <button
                onClick={toggleFilter}
                className={`p-2 text-amber-600 rounded-lg transition-colors border  ${
                  isFilterOpen ? 'bg-amber-50 border-amber-300 text-amber-700' : 'hover:bg-gray-100 border-gray-200 text-gray-600'
                }`}
                aria-label="Filters"
              >
                <Filter className="w-4 h-4" />
              </button>

              {/* View toggle – same */}
              <div className="sm:flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => onViewChange?.('grid')} className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => onViewChange?.('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* FILTER DRAWER */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white  transform transition-transform duration-300 ease-in-out ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button onClick={toggleFilter} className="p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-7">
            {/* Search inside filter – optional, since we have one in header too */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Product Name</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="e.g. Leather Tote, Wall Clock..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Price Range</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="range"
                    min={0}
                    max={100000}
                    step={500}
                    value={filters.priceMin}
                    onChange={e => setFilters(prev => ({ ...prev, priceMin: Number(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-amber-600"
                  />
                  <input
                    type="range"
                    min={0}
                    max={100000}
                    step={500}
                    value={filters.priceMax}
                    onChange={e => setFilters(prev => ({ ...prev, priceMax: Number(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-amber-600"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-700 font-medium">
                  <span>₹{filters.priceMin.toLocaleString('en-IN')}</span>
                  <span>₹{filters.priceMax.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Categories – now dynamic from mock data */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Category</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.map(cat => (
                  <label key={cat} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                    />
                    <span className="ml-2 text-sm text-gray-700">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-5 py-4 flex gap-3">
            <button
              onClick={resetFilters}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
            >
              Apply & Close
            </button>
          </div>
        </div>
      </div>

      {isFilterOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={toggleFilter} />
      )}
    </>
  );
}