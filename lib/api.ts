// -------------------------------------------------------------------
// Business Card API Client - Improved & more robust version
// -------------------------------------------------------------------

export interface CardData {
  id: string;
  user_id: string | null;
  image_url: string | null;
  company_name: string | null;
  person_name: string | null;
  designation: string | null;
  phone_numbers: string[];
  email: string | null;
  website: string | null;
  full_address: string | null;
  city: string | null;
  pincode: string | null;
  social_handles: {
    linkedin: string | null;
    instagram: string | null;
    facebook: string | null;
    x: string | null;
    youtube: string | null;
    other: string | null;
  } | null;
  industry_field: string | null;
  remarks: string | null;
  created_at: string;
}

export interface ScanResponse {
  success: boolean;
  data?: Omit<CardData, 'id' | 'created_at' | 'image_url'>;
  card_id?: string;
  image_url?: string;
  error?: string;
}

// Better error handling helper
async function handleResponse<T>(res: Response): Promise<T> {
  let data: any;

  try {
    data = await res.json();
  } catch (e) {
    throw new Error(
      `Server returned invalid JSON - Status: ${res.status} ${res.statusText}`
    );
  }

  if (!res.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      data?.errorMessage ||
      `Request failed (${res.status} ${res.statusText})`
    );
  }

  return data as T;
}

/**
 * Clean and normalize base64 image string
 */
function normalizeBase64Image(imageInput: string): string {
  let base64 = imageInput.trim();

  if (base64.startsWith('data:')) {
    const matches = base64.match(/^data:image\/[a-z]+;base64,(.+)$/);
    if (!matches?.[1]) throw new Error('Invalid data URL format');
    base64 = matches[1];
  }

  base64 = base64.replace(/\s+/g, '');

  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
    throw new Error('Base64 string contains invalid characters');
  }

  return base64;
}

export async function scanCard(imageData: string): Promise<ScanResponse> {
  try {
    const cleanBase64 = normalizeBase64Image(imageData);

    // We ALWAYS send full data URL - most reliable way
    const fullDataUrl = `data:image/jpeg;base64,${cleanBase64}`;

    const payload = {
      image: fullDataUrl,           // ← important: field name must be "image"
    };

    const res = await fetch('/api/scan-card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    const result = await handleResponse<ScanResponse>(res);

    if (!result.success) {
      throw new Error(result.error || 'Card scanning failed');
    }

    return result;
  } catch (err: any) {
    console.error('Scan card failed:', err);
    throw new Error(
      err.message?.includes('Invalid image')
        ? 'Invalid or corrupted image. Please try another photo.'
        : err.message || 'Failed to process business card. Try again.'
    );
  }
}

