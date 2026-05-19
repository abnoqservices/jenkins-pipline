import React from "react";
import { Package, Tag, Hash } from "lucide-react";

export default function ProductInfo({ data }: { data: any[] }) {
  // Find fields safely
  const nameField = data?.find((field: any) => field.name === "produtname");
  const categoryField = data?.find((field: any) => field.name === "pcategory");
  const skuField = data?.find((field: any) => field.name === "psku");
  const priceField = data?.find((field: any) => field.name === "pprice");
  const tagsField = data?.find((field: any) => field.name === "productTag");

  const productName = nameField?.value || "Product Name";
  const category = categoryField?.value || "Uncategorized";
  const sku = skuField?.value || "N/A";
  const price = priceField?.value || "0";
  const currency = ""; // You can make this dynamic later

  const taglist =
    typeof tagsField?.value === "string"
      ? tagsField.value
          .split(",")
          .map((tag: string) => tag.trim())
          .filter(Boolean)
      : [];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-2">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Hero Header */}
          <div className="h-15 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Package className="w-4 h-4" />
                {category}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-2 pt-8 pb-2 -mt-12 relative">
            <div className="bg-white rounded-2xl  px-8 py-10 text-center">
              {/* Product Title */}
              <h1 className="text-2xl md:text-2xl font-extrabold text-gray-900 leading-tight">
                {productName}
              </h1>

              {/* SKU */}
              <p className="mt-3 text-sm text-gray-500 flex items-center justify-center gap-2">
                <Hash className="w-4 h-4" />
                SKU: <span className="font-mono font-semibold">{sku}</span>
              </p>

              {/* Price */}
              <div className="mt-8 mb-10">
                <div className="inline-flex items-baseline">
                  <span className="text-2xl text-gray-500">{currency}</span>
                  <span className="text-2xl font-bold text-gray-900">{price}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Inclusive of all taxes</p>
              </div>

              {/* Fixed: Added missing closing </div> here if needed */}

              {/* Tags - FIXED PART */}
              {taglist.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                    <Tag className="w-5 h-5" />
                    <span className="font-medium">Product Tags</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {taglist.map((tag) => (
                      <span
                        key={tag}
                        className="px-5 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-full border border-indigo-200 hover:bg-indigo-100 transition"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

     
      </div>
    </div>
  );
}