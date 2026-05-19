// src/app/api/forms/[id]/fields/route.ts
import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db"; // adjust this to your actual DB import

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const formId = params.id;
  const body = await req.json();

  try {
    const newField = await db.formField.create({
      data: {
        form_section_id: body.form_section_id,
        form_id: Number(formId),
        label: body.label,
        key: body.key,
        type: body.type,
        options: body.options,
        rules: body.rules,
        conditions: body.conditions,
        order: body.order,
        is_required: body.is_required,
        is_active: body.is_active,
      },
    });

    return NextResponse.json(newField, { status: 201 });
  } catch (error) {
    console.error("DB error:", error);
    return NextResponse.json({ error: "Failed to create field" }, { status: 500 });
  }
}