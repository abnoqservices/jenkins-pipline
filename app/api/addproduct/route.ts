import { NextResponse } from "next/server";
import { createProduct ,getAllProducts} from "@/lib/dbHealth";

export async function POST(request: Request) {
  try {
    const productData = await request.json();

    if (!productData?.id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!productData?.formData) {
      return NextResponse.json(
        { success: false, message: "formData is required" },
        { status: 400 }
      );
    }

    const result = await createProduct(productData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        product: result.product,
        message: "Product created successfully",
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
    try {
      const result = await getAllProducts();
  
      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: 400 }
        );
      }
  
      // ✅ FIXED — formdata instead of formData
      const formatted = result.products.map((p: any) => {
        const f = p.formdata || {}; // shortcut
  
        return {
          id: p.id,
  
          // Image handling
          image: p.images?.[0]?.url || "/placeholder.png",
  
          // Basic fields
          name: f.name || "Untitled Product",
          sku: f.sku || "-",
          category: f.category || "-",
  
          // Price formatting
          price: f.price ? `₹${f.price}` : "₹0",
  
          // Tracking metrics
          scans: p.scans ?? 0,
          views: p.views ?? 0,
          leads: p.leads ?? 0,
  
          // Activation status
          status: f.isActive ?? true,
        };
      });
  
      return NextResponse.json(
        { success: true, products: formatted },
        { status: 200 }
      );
  
    } catch (error) {
      console.error("API Error fetching products:", error);
  
      return NextResponse.json(
        { success: false, message: "Server error" },
        { status: 500 }
      );
    }
  }
  