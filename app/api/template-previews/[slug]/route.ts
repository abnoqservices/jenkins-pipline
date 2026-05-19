import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";

const PREVIEW_FILE_PATHS: Record<string, { path: string; contentType: string }> = {
  olivia: {
    path: "/Users/vaibhav/.cursor/projects/Users-vaibhav-Desktop-Engage/assets/image-efe95c3d-ef41-4e1c-9885-f13e58f71734.png",
    contentType: "image/png",
  },
  luminance: {
    path: "/Users/vaibhav/.cursor/projects/Users-vaibhav-Desktop-Engage/assets/image-81fc8114-442e-45a9-943c-af29e365dd3f.png",
    contentType: "image/png",
  },
  brainwave: {
    path: "/Users/vaibhav/.cursor/projects/Users-vaibhav-Desktop-Engage/assets/image-fc14043c-318a-4cf2-8d22-11bfa3a300ff.png",
    contentType: "image/png",
  },
  violetcart: {
    path: "/Users/vaibhav/.cursor/projects/Users-vaibhav-Desktop-Engage/assets/image-bfdcc876-d992-41c5-964d-781897b93607.png",
    contentType: "image/png",
  },
  cloudpillow: {
    path: "/Users/vaibhav/.cursor/projects/Users-vaibhav-Desktop-Engage/assets/image-8b24284f-5773-4846-bb65-14506c7be0b8.png",
    contentType: "image/png",
  },
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const row = PREVIEW_FILE_PATHS[slug];
  if (!row) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const data = await readFile(row.path);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": row.contentType,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new NextResponse("Preview asset unavailable", { status: 404 });
  }
}
