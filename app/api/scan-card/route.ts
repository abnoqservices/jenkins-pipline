import { NextResponse } from 'next/server';

// Define the precise schema for Gemini to follow
const CARD_SCHEMA = {
  type: "OBJECT",
  properties: {
    company_name: { type: "STRING", nullable: true },
    person_name: { type: "STRING", nullable: true },
    designation: { type: "STRING", nullable: true },
    phone_numbers: { 
      type: "ARRAY", 
      items: { type: "STRING" } 
    },
    email: { type: "STRING", nullable: true },
    website: { type: "STRING", nullable: true },
    full_address: { type: "STRING", nullable: true },
    city: { type: "STRING", nullable: true },
    pincode: { type: "STRING", nullable: true },
    social_handles: {
      type: "OBJECT",
      properties: {
        linkedin: { type: "STRING", nullable: true },
        instagram: { type: "STRING", nullable: true },
        facebook: { type: "STRING", nullable: true },
        x: { type: "STRING", nullable: true },
        youtube: { type: "STRING", nullable: true },
        other: { type: "STRING", nullable: true }
      },
      nullable: true
    },
    industry_field: { type: "STRING", nullable: true },
    remarks: { type: "STRING", nullable: true }
  },
  required: ["company_name", "person_name", "phone_numbers", "email"] 
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const imageDataUrl = body.image;

    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing or invalid image' }, { status: 400 });
    }

    // ── 1. Robust Regex for Data URL ─────────────────────────────────────
    // Captures mime type and the base64 string safely
    const matches = imageDataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/i);

    if (!matches || matches.length !== 3) {
      return NextResponse.json({ success: false, error: 'Invalid data URL format' }, { status: 400 });
    }

    const [, mimeType, base64Data] = matches;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    // ── 2. Use the correct efficient model ──────────────────────────────
    // gemini-2.5-flash is the current standard for speed/cost (2026)
    const MODEL = 'gemini-2.5-flash'; 

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
      contents: [{
        role: 'user',
        parts: [
          {
            text: `You are an expert at extracting structured data from business/visiting cards. Your job is to:
            1. Perform high-accuracy OCR on the card image
            2. Intelligently identify and extract specific fields
            3. Return data in perfect JSON format
            
            CRITICAL RULES:
            - Only extract information that is VISIBLE on the card
            - Never add or guess information that isn't present
            - If a field is missing, return null
            - Clean and normalize phone numbers (remove spaces, hyphens)
            - Normalize email to lowercase
            - Differentiate carefully between company name, person name, and designation
            - Look for social media handles and URLs carefully
            
            Return ONLY valid JSON in this exact format:
            {
              "company_name": string | null,
              "person_name": string | null,
              "designation": string | null,
              "phone_numbers": string[],
              "email": string | null,
              "website": string | null,
              "full_address": string | null,
              "city": string | null,
              "pincode": string | null,
              "social_handles": {
                "linkedin": string | null,
                "instagram": string | null,
                "facebook": string | null,
                "x": string | null,
                "youtube": string | null,
                "other": string | null
              }
            }`
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1, // Low temp for factual extraction
        response_mime_type: "application/json",
        response_schema: CARD_SCHEMA // <── THE MAGIC SAUCE
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Gemini API error:', res.status, errorText);
      
      // Handle Free Tier limits gracefully
      if (res.status === 429) {
        return NextResponse.json(
          { success: false, error: 'System is busy, please try again in a moment.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { success: false, error: `AI Processing failed: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    // With response_schema, the text is GUARANTEED to be valid JSON
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error('No data returned from AI');
    }

    const parsedData = JSON.parse(textResponse);

    return NextResponse.json({ success: true, data: parsedData });

  } catch (e) {
    console.error('Scan-card error:', e);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}