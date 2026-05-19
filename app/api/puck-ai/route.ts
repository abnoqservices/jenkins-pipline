import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  AI_ALLOWED_BLOCK_TYPES,
  mergePuckAppend,
  sanitizeAiPuckOutput,
  type SanitizedPuckDocument,
} from "@/lib/puck/sanitize-ai-puck";
import {
  COMPOSITION_PLAYBOOK,
  DESIGN_RULES,
  FEW_SHOT_OUTLINE_EXAMPLES,
  SCREENSHOT_MODE_PROMPT,
  buildBlockCatalogPrompt,
} from "@/lib/puck/ai-block-catalog";
import { migratePuckDocument } from "@/lib/puck/migrate-puck-document";

export const runtime = "nodejs";
export const maxDuration = 90;

const MAX_PROMPT = 6000;
/** Hard cap on the raw image bytes the route will accept (after base64 decode). 6 MB. */
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

/**
 * Default model: 2.5-pro for richer compositions. Override with GEMINI_MODEL env var.
 * Fallback: 2.5-flash if pro fails (rate limits, etc.).
 */
const PRIMARY_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-pro";
const FALLBACK_MODEL = "gemini-2.5-flash";

/* -------------------------------------------------------------------------- */
/*  Prompt builders                                                            */
/* -------------------------------------------------------------------------- */

function systemPrompt(opts: {
  mode: "replace" | "append";
  includeProduct: boolean;
  hasProductContext: boolean;
  hasScreenshot: boolean;
}): string {
  const allowedTypes = AI_ALLOWED_BLOCK_TYPES.join(", ");
  const catalog = buildBlockCatalogPrompt({ includeProduct: opts.includeProduct });

  const taskLine = opts.hasScreenshot
    ? opts.mode === "append"
      ? `An attached screenshot shows the section(s) the user wants added. Reproduce them. Output ONLY new blocks that mirror the screenshot. Do NOT repeat the existing page. Do NOT include "root". Return { "content": [...] }.`
      : `An attached screenshot shows the page the user wants. Reproduce it as faithfully as possible — section by section, top to bottom. Always wrap with NavBarBlock at the top and FooterMegaBlock at the bottom unless the screenshot is clearly a single isolated component.`
    : opts.mode === "append"
      ? `Output ONLY new blocks that fit the user's request. Do NOT repeat the existing page. Do NOT include "root". Return { "content": [...] } with the additional blocks only.`
      : `Build a cohesive, world-class landing page from scratch. Always include NavBarBlock at the top and FooterMegaBlock at the bottom unless the user explicitly says otherwise.`;

  const productHint = opts.hasProductContext
    ? `If the request is about a single physical / digital product, prefer ProductHeaderBlock + ProductGalleryBlock + ProductHighlightsBlock + ProductSpecsBlock + ProductTabsContentBlock + ProductRelatedBlock. Use {{product.name}}, {{product.description}}, {{product.price}}, {{product.image_url}}, {{product.image_1..5}}, {{product.sku}} placeholder tokens — they get hydrated server-side from the linked product. Do NOT invent a product name when the placeholder fits.`
    : `Don't use product placeholder tokens unless the user is clearly describing a product page.`;

  const screenshotSection = opts.hasScreenshot ? `\n\n${SCREENSHOT_MODE_PROMPT}` : "";

  return `You are a senior product designer building landing pages with the Lumen page builder. Output a single JSON object only — no markdown, no code fences, no commentary, no trailing newline.

## ROOT SHAPE

{
  "root": {
    "props": {
      "content": { "title": string },
      "style": {
        "pageBackground": "#hex",
        "pageText": "#hex",
        "headingColor": "#hex",
        "mutedText": "#hex",
        "accentColor": "#hex",
        "buttonTextColor": "#hex"
      },
      "layout": { /* keep all paddings at "0px" — sections own their own padding */ }
    }
  },
  "content": [ /* blocks; 8-12 ideal */ ]
}

Each block:
{
  "type": one of [${allowedTypes}],
  "id": short alphanumeric (3-12 chars; unique within content[]),
  "props": { "content": { ... }, "style": { ... }, "layout": { ... } }
}

## BLOCK CATALOG

${catalog}

${COMPOSITION_PLAYBOOK}

${DESIGN_RULES}

${FEW_SHOT_OUTLINE_EXAMPLES}${screenshotSection}

## TASK

${taskLine}
${productHint}

## STRICT OUTPUT RULES

- Single JSON object, no Markdown, no \`\`\`, no comments inside JSON.
- Strings must be valid JSON strings. Escape inner quotes as \\".
- Hex colors are 6-digit (e.g. #6366f1).
- href values are "#" or absolute URLs (https://…).
- Image src values are "" or absolute URLs (https://images.unsplash.com/…, https://i.pravatar.cc/64?img=N for avatars), or product placeholder tokens like {{product.image_1}}.
- No placeholder text like "Lorem ipsum", "Headline goes here", or "Subtitle text".
- 8-12 blocks for a full landing page; 4-6 for shorter requests.
- Every block must include "id".`;
}

/* -------------------------------------------------------------------------- */
/*  JSON extraction — be tolerant of ```json wrappers or trailing prose        */
/* -------------------------------------------------------------------------- */

function extractJson(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Already plain JSON?
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    return trimmed;
  }

  // ```json ... ``` fenced
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();

  // First {...} block heuristic
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return null;
}

function tryParseJson(text: string): unknown | null {
  const json = extractJson(text);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    // Last-ditch fix: trailing commas
    try {
      const cleaned = json.replace(/,(\s*[\]}])/g, "$1");
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Generation runner — retry with fallback model + repair pass                */
/* -------------------------------------------------------------------------- */

type GenAttempt = {
  model: string;
  ok: boolean;
  error?: string;
  raw?: string;
  parsed?: unknown;
};

type ScreenshotPart = { mimeType: string; data: string };

async function callModel(
  apiKey: string,
  model: string,
  systemMessage: string,
  userMessage: string,
  temperature: number,
  screenshot?: ScreenshotPart
): Promise<GenAttempt> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const m = genAI.getGenerativeModel({
      model,
      systemInstruction: systemMessage,
      generationConfig: {
        temperature,
        topP: 0.9,
        maxOutputTokens: 16384,
        responseMimeType: "application/json",
      },
    });

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> =
      screenshot
        ? [
            { inlineData: { mimeType: screenshot.mimeType, data: screenshot.data } },
            { text: userMessage },
          ]
        : [{ text: userMessage }];

    const result = await m.generateContent(parts);
    const text = result.response.text();
    if (!text) {
      return { model, ok: false, error: "Empty response from model" };
    }
    const parsed = tryParseJson(text);
    if (!parsed) {
      return { model, ok: false, error: "Model did not return valid JSON", raw: text };
    }
    return { model, ok: true, raw: text, parsed };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Model request failed";
    return { model, ok: false, error: message };
  }
}

async function runWithFallback(
  apiKey: string,
  systemMessage: string,
  userMessage: string,
  temperature: number,
  screenshot?: ScreenshotPart
): Promise<GenAttempt> {
  const primary = await callModel(apiKey, PRIMARY_MODEL, systemMessage, userMessage, temperature, screenshot);
  if (primary.ok) return primary;

  // If primary failed for any reason, try the fallback model.
  if (PRIMARY_MODEL !== FALLBACK_MODEL) {
    const fallback = await callModel(apiKey, FALLBACK_MODEL, systemMessage, userMessage, temperature, screenshot);
    if (fallback.ok) return fallback;
    return fallback;
  }
  return primary;
}

/* -------------------------------------------------------------------------- */
/*  Quality check — was the output substantial enough?                         */
/* -------------------------------------------------------------------------- */

function isSubstantial(doc: SanitizedPuckDocument, mode: "replace" | "append"): boolean {
  const minBlocks = mode === "append" ? 1 : 4;
  return doc.content.length >= minBlocks;
}

/* -------------------------------------------------------------------------- */
/*  POST handler                                                               */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Gemini is not configured. Add GEMINI_API_KEY to your environment (e.g. pexifly/.env.local).",
      },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt =
    typeof body.prompt === "string" ? body.prompt.trim().slice(0, MAX_PROMPT) : "";

  /* Optional screenshot — base64-encoded image used for vision-mode generation. */
  let screenshot: ScreenshotPart | null = null;
  if (body.screenshot && typeof body.screenshot === "object") {
    const s = body.screenshot as Record<string, unknown>;
    const mimeType = typeof s.mimeType === "string" ? s.mimeType.toLowerCase() : "";
    const data = typeof s.data === "string" ? s.data.replace(/^data:[^;]+;base64,/, "") : "";
    if (!ALLOWED_IMAGE_MIME.has(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported image type "${mimeType}". Use PNG, JPEG, WEBP, or GIF.`,
        },
        { status: 400 }
      );
    }
    if (!data) {
      return NextResponse.json(
        { success: false, error: "Screenshot was empty." },
        { status: 400 }
      );
    }
    // Base64 decoded length is roughly (data.length * 3) / 4. Reject anything way over the cap.
    const approxBytes = Math.floor((data.length * 3) / 4);
    if (approxBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Screenshot too large (${(approxBytes / 1024 / 1024).toFixed(1)} MB). Max is ${(MAX_IMAGE_BYTES / 1024 / 1024).toFixed(0)} MB. Compress or resize and try again.`,
        },
        { status: 413 }
      );
    }
    screenshot = { mimeType, data };
  }

  if (!prompt && !screenshot) {
    return NextResponse.json(
      { success: false, error: "Either a prompt or a screenshot is required." },
      { status: 400 }
    );
  }

  const mode = body.mode === "append" ? "append" : "replace";
  const productContext = body.productContext;
  const hasProductContext =
    productContext != null &&
    typeof productContext === "object" &&
    Object.keys(productContext as Record<string, unknown>).length > 0;

  // Allow callers to opt-out of product blocks (useful when "no product is associated")
  const includeProduct =
    typeof body.includeProductBlocks === "boolean"
      ? body.includeProductBlocks
      : hasProductContext || /\bproduct\b|\bpdp\b|\bshop\b|\bcommerce\b|\bstore\b/i.test(prompt);

  let contextStr = "";
  if (hasProductContext) {
    const pc = productContext as Record<string, unknown>;
    const name = typeof pc.name === "string" ? pc.name.slice(0, 300) : "";
    const desc = typeof pc.description === "string" ? pc.description.slice(0, 2000) : "";
    const price = typeof pc.price === "string" ? pc.price.slice(0, 60) : "";
    const sku = typeof pc.sku === "string" ? pc.sku.slice(0, 100) : "";
    const lines: string[] = [];
    if (name) lines.push(`name: ${name}`);
    if (desc) lines.push(`description: ${desc}`);
    if (price) lines.push(`price: ${price}`);
    if (sku) lines.push(`sku: ${sku}`);
    if (lines.length) {
      contextStr = `\n\n## PRODUCT CONTEXT\n${lines.join("\n")}\n`;
    }
  }

  let currentStr = "";
  if (mode === "append" && body.currentDocument && typeof body.currentDocument === "object") {
    try {
      const slim = JSON.stringify(body.currentDocument).slice(0, 16000);
      currentStr = `\n\n## EXISTING PAGE (do not duplicate, only add new sections that fit the request)\n${slim}\n`;
    } catch {
      /* ignore */
    }
  }

  const sysMessage = systemPrompt({
    mode,
    includeProduct,
    hasProductContext,
    hasScreenshot: !!screenshot,
  });
  const promptLine = prompt
    ? `User request:\n${prompt}`
    : `User request:\n(no text prompt — reproduce the attached screenshot as faithfully as possible)`;
  const userMessage = `${promptLine}${contextStr}${currentStr}`;

  // Lower the temperature when a screenshot is present — we want fidelity, not flair.
  const baseTemperature = screenshot ? 0.45 : 0.85;

  // First pass.
  const first = await runWithFallback(apiKey, sysMessage, userMessage, baseTemperature, screenshot ?? undefined);
  let candidate: unknown = first.parsed ?? null;
  let lastError = first.error;

  // Repair pass: if first parse failed, ask again (lower temperature, simpler ask).
  if (!candidate) {
    const repair = await runWithFallback(
      apiKey,
      sysMessage,
      `${userMessage}\n\nIMPORTANT: Your previous output failed to parse. Re-emit the SAME page as a single, strict JSON object with no markdown, no commentary, no code fences. Start with { and end with }.`,
      0.3,
      screenshot ?? undefined
    );
    if (repair.parsed) candidate = repair.parsed;
    else lastError = repair.error || lastError;
  }

  if (!candidate) {
    return NextResponse.json(
      { success: false, error: lastError || "Could not generate a valid page from the model." },
      { status: 502 }
    );
  }

  let sanitized = sanitizeAiPuckOutput(candidate);

  // Quality pass: if the model returned a thin output, ask it to expand.
  // Skip when the screenshot is clearly a single component (mode "append" or thin input).
  if (!isSubstantial(sanitized, mode) && !screenshot) {
    const expand = await runWithFallback(
      apiKey,
      sysMessage,
      `${userMessage}\n\nNOTE: Your previous draft had only ${sanitized.content.length} block${sanitized.content.length === 1 ? "" : "s"}. A great landing page has 8-12 sections. Expand it: include NavBarBlock, HeroSplitBlock, social proof, features, benefits, pricing or CTA, testimonials, FAQ, a closing CTA banner, and FooterMegaBlock. Use the BLOCK CATALOG and COMPOSITION PLAYBOOK from the system prompt.`,
      0.7
    );
    if (expand.parsed) {
      const expanded = sanitizeAiPuckOutput(expand.parsed);
      if (expanded.content.length > sanitized.content.length) {
        sanitized = expanded;
      }
    }
  }

  let puck_document: SanitizedPuckDocument;
  if (mode === "append" && body.currentDocument && typeof body.currentDocument === "object") {
    const migrated = migratePuckDocument(body.currentDocument as Record<string, unknown>);
    const currentSanitized = sanitizeAiPuckOutput({
      root: migrated.root,
      content: migrated.content,
    });
    puck_document = mergePuckAppend(currentSanitized, sanitized);
  } else if (mode === "append") {
    puck_document = mergePuckAppend(sanitizeAiPuckOutput({}), sanitized);
  } else {
    puck_document = sanitized;
  }

  return NextResponse.json({
    success: true,
    data: {
      puck_document,
      meta: {
        model: first.ok ? first.model : FALLBACK_MODEL,
        blocks: puck_document.content.length,
        vision: !!screenshot,
      },
    },
  });
}
