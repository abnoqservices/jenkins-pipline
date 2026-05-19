import { NextResponse } from "next/server";
import {getAllCustomFields,saveCustomFields} from "@/lib/dbHealth";

// GET → fetch custom fields
export async function GET() {
  try {
    const result = await getAllCustomFields();

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, fields: result.fields },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error fetching custom fields:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// POST → save custom fields
export async function POST(request:any) {
  try {
    const body = await request.json();

    if (!body?.fields || !Array.isArray(body.fields)) {
      return NextResponse.json(
        { success: false, message: "fields array is required" },
        { status: 400 }
      );
    }

    const result = await saveCustomFields(body.fields);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Custom fields saved successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error saving custom fields:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
