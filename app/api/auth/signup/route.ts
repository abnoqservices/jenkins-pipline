import { NextResponse } from "next/server";
import { createProduct } from "@/lib/dbHealth";

export async function POST(request: Request) {
  try {
    const productData = await request.json();

    // Basic validation
    if (!productData?.id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!productData?.formData) {
      return NextResponse.json(
        { success: false, message: "Product formData is required" },
        { status: 400 }
      );
    }

    // Insert product
    const result = await createProduct(productData);

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          product: result.product,
          message: "Product created successfully",
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: result.message,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Product API Error:", error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
