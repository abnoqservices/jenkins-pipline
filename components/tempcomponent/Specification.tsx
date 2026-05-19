import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function Specification({ data }) {
  const specField = data?.find(f => f.name === "specifications");
  const features = specField?.items || [];
  const [isOpen, setIsOpen] = useState(false);

  if (features.length === 0) return null;

  const visibleItems = isOpen ? features : features.slice(0, 4);
  const hasMore = features.length > 4;

  return (
    <section className="card-header-specification py-6 px-4 -mx-4 bg-gray-50 sm:mx-0 sm:rounded-2xl">
      <div className="max-w-4xl mx-auto">

        {/* Centered Title */}
        <h2 className="core-header-title">
          Specifications
        </h2>
        <div className="w-12 h-1 bg-gray-100 mx-auto mb-4 rounded-full"></div>
        {/* Always visible: first 4 (or all if ≤4) */}
        <div className="space-y-3.5">
          {visibleItems.map((item, index) => (
            <div key={index} className="flex gap-3">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-600 mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* "+X more" centered button – only if needed */}
        {hasMore && !isOpen && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full  font-medium text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all"
            >
              <span>+ {features.length - 4} more specifications</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Optional: "Show less when expanded */}
        {isOpen && hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-emerald-600 font-medium text-sm hover:underline"
            >
              Show less
            </button>
          </div>
        )}

      </div>
    </section>
  );
}