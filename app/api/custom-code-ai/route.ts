import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 90;

const PRIMARY_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-pro";
const FALLBACK_MODEL = "gemini-2.5-flash";

const MAX_PROMPT = 4000;
const MAX_CODE_FIELD = 60_000;
/** Hard cap on the raw image bytes the route will accept (after base64 decode). 6 MB. */
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

/* -------------------------------------------------------------------------- */
/*  Prompt                                                                     */
/* -------------------------------------------------------------------------- */

function systemPrompt(opts: {
  mode: "generate" | "refine";
  scopeClass: string;
  hasScreenshot: boolean;
}): string {
  const screenshotSection = opts.hasScreenshot
    ? `

## SCREENSHOT MODE

A reference screenshot is attached. Reproduce it as faithfully as possible inside the .${opts.scopeClass} container.

Mapping rules:
- Match the visual structure (rows / columns / stacks / grids) as you see it.
- Sample colors directly from the image (backgrounds, text, accents) and use them as CSS custom properties under .${opts.scopeClass}.
- Match font weights, sizes, spacing, corner radii, and shadow intensity.
- Match icon shapes — use inline SVGs that resemble the originals, or emoji if the screenshot uses emoji.
- Photographs / product images → emit https://images.unsplash.com/... URLs that visually match the subject; fall back to https://placehold.co/600x400 only as a last resort. Avatars → https://i.pravatar.cc/64?img=N (1..70).
- Brand logos in the screenshot → render as the visible text (e.g. "Lumen") in styled markup; do not invent a logo SVG.
- Copy: use the legible text verbatim. Approximate any stylized / blurred text.
- ${opts.mode === "refine" ? "Refine the existing code to match the screenshot, preserving structure where it already aligns." : "Build the snippet from scratch to match the screenshot."}
- The output must still be self-contained — never reference external CSS frameworks beyond the system font stack and an optional Google Fonts <link> in the HTML.`
    : "";

  return `You are a senior frontend engineer producing a self-contained UI snippet for a no-code page builder. The snippet is rendered INLINE on a Next.js / Tailwind landing page. Output a single JSON object only — no markdown, no code fences, no commentary.

## OUTPUT SHAPE

{
  "html": "<...>",
  "css": "...",
  "javascript": "..."
}

(Each field is a string. Empty string is allowed for css/javascript when not needed. Never return null.)

## STRICT RULES

CSS scoping (CRITICAL):
- All CSS rules MUST be prefixed with .${opts.scopeClass} so styles never leak to the rest of the page.
- The outermost HTML element MUST have class="${opts.scopeClass}".
- Never use !important unless absolutely necessary.
- Never set "html", "body", or "*" selectors. Never use a global @font-face — use a system stack or Google Fonts <link> in the HTML head-equivalent.

HTML:
- Use semantic, accessible markup (button, nav, section, h1-h6, etc.).
- Wrap everything inside one root element with class="${opts.scopeClass}".
- DO NOT include <html>, <head>, <body>, or <script> tags. Just the inner DOM.
- DO NOT include the css inside <style> tags inside the html — put it in the "css" field.
- Image src values: real URLs (https://images.unsplash.com/...) or placeholders like https://placehold.co/600x400. Avatars: https://i.pravatar.cc/64?img=N (1..70).
- href values: "#" or absolute URLs.

CSS:
- Modern, professional aesthetic — soft shadows, generous whitespace, smooth transitions, gradient accents.
- Mobile-first; include @media (max-width: 640px) rules where it matters.
- Use CSS variables inside .${opts.scopeClass} for the palette so the user can tweak easily.
- Typography: use the system font stack OR specify a Google font and include the <link> via a <link> tag at the top of the html field.
- Animations: prefer transform / opacity (GPU-accelerated). Keep durations under 600ms.

JavaScript:
- Vanilla JS only — NO React, Vue, jQuery, npm packages.
- All queries MUST be scoped: const root = document.querySelector(".${opts.scopeClass}"); const btn = root.querySelector("…");
- Wrap top-level code in an IIFE so variables don't leak: (() => { ... })().
- Add event listeners idempotently (the snippet may re-mount). Clean up if you set intervals/timeouts.
- DO NOT use document.write, eval, or fetch external scripts.

Quality bar — what makes the snippet "majestic":
- Composition: balanced spacing, clear visual hierarchy, distinct "moment" (a hero metric, a micro-interaction, a striking gradient).
- Polish: rounded corners 12-24px, hover states, focus rings, smooth transitions.
- Detail: emoji or inline SVG icons (don't depend on external icon libraries).
- Theme: pick ONE palette from { indigo+violet, mint+cyan, warm+orange, deep blue+sky, mono+amber, dark+pink }.

${screenshotSection}

## TASK

${
  opts.hasScreenshot
    ? "Reproduce the attached screenshot as a self-contained snippet following the SCREENSHOT MODE rules above. The user's text prompt (if any) is an override — apply their tweaks on top of the visual match."
    : opts.mode === "refine"
      ? "Modify the existing HTML/CSS/JS based on the user's request. Preserve what works; only change what they asked for. The user's existing code is provided as context."
      : "Build the snippet from scratch based on the user's description."
}

Return JSON only.`;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function extractJson(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    return trimmed;
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return null;
}

function tryParseJson(text: string): unknown | null {
  const json = extractJson(text);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    try {
      return JSON.parse(json.replace(/,(\s*[\]}])/g, "$1"));
    } catch {
      return null;
    }
  }
}

function clip(s: unknown, max: number): string {
  const str = typeof s === "string" ? s : "";
  return str.length <= max ? str : str.slice(0, max);
}

function sanitizeOutput(parsed: unknown): { html: string; css: string; javascript: string } | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  const html = clip(o.html, MAX_CODE_FIELD);
  const css = clip(o.css, MAX_CODE_FIELD);
  const javascript = clip(o.javascript ?? o.js, MAX_CODE_FIELD);
  if (!html.trim() && !css.trim() && !javascript.trim()) return null;
  return { html, css, javascript };
}

function makeScopeClass(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return `lp-cc-${c.randomUUID().slice(0, 8)}`;
  return `lp-cc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

type GenAttempt = {
  ok: boolean;
  parsed?: unknown;
  error?: string;
  model?: string;
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
        topP: 0.92,
        maxOutputTokens: 12288,
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
    if (!text) return { ok: false, error: "Empty response from model", model };
    const parsed = tryParseJson(text);
    if (!parsed) return { ok: false, error: "Model did not return valid JSON", model };
    return { ok: true, parsed, model };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Request failed", model };
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
  if (PRIMARY_MODEL !== FALLBACK_MODEL) {
    return await callModel(apiKey, FALLBACK_MODEL, systemMessage, userMessage, temperature, screenshot);
  }
  return primary;
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

  const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, MAX_PROMPT) : "";

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

  const mode = body.mode === "refine" ? "refine" : "generate";

  // Reuse existing scope class if the user is refining, so styles don't break.
  let scopeClass = "";
  const existingScope = typeof body.scopeClass === "string" ? body.scopeClass.trim() : "";
  if (mode === "refine" && /^lp-cc-[a-z0-9-]+$/i.test(existingScope)) {
    scopeClass = existingScope;
  } else {
    scopeClass = makeScopeClass();
  }

  const currentHtml = clip(body.currentHtml, MAX_CODE_FIELD);
  const currentCss = clip(body.currentCss, MAX_CODE_FIELD);
  const currentJs = clip(body.currentJs, MAX_CODE_FIELD);

  let contextStr = "";
  if (mode === "refine" && (currentHtml || currentCss || currentJs)) {
    contextStr = `\n\n## EXISTING CODE\n\n=== HTML ===\n${currentHtml}\n\n=== CSS ===\n${currentCss}\n\n=== JS ===\n${currentJs}`;
  }

  const sysMessage = systemPrompt({ mode, scopeClass, hasScreenshot: !!screenshot });
  const promptLine = prompt
    ? `User request:\n${prompt}`
    : `User request:\n(no text prompt — match the attached screenshot)`;
  const userMessage = `${promptLine}${contextStr}\n\nThe scope class for this snippet is: .${scopeClass}\nALL CSS selectors must start with .${scopeClass}, and the root HTML element must have class="${scopeClass}".`;

  // Code generation does best at lower temperatures; vision-mode wants high fidelity.
  const baseTemperature = screenshot ? 0.35 : 0.45;
  const first = await runWithFallback(
    apiKey,
    sysMessage,
    userMessage,
    baseTemperature,
    screenshot ?? undefined
  );
  let candidate = first.parsed;
  let lastError = first.error;

  // Repair pass on JSON failure.
  if (!candidate) {
    const repair = await runWithFallback(
      apiKey,
      sysMessage,
      `${userMessage}\n\nIMPORTANT: Your previous output failed to parse. Re-emit a single, strict JSON object: { "html": "...", "css": "...", "javascript": "..." }. No markdown, no code fences. Start with { and end with }.`,
      0.2,
      screenshot ?? undefined
    );
    if (repair.parsed) candidate = repair.parsed;
    else lastError = repair.error || lastError;
  }

  const sanitized = candidate ? sanitizeOutput(candidate) : null;
  if (!sanitized) {
    return NextResponse.json(
      { success: false, error: lastError || "Could not generate code from the model." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      ...sanitized,
      scopeClass,
      meta: { model: first.model || FALLBACK_MODEL, mode, vision: !!screenshot },
    },
  });
}
