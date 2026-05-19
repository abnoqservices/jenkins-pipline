import {checkUserExists} from '@/lib/dbHealth';

export async function GET(request, { params }) {
  // Await params first (Next.js 15+)
  const { slug } = await params;
  
  try {
    const result = await checkUserExists(slug);
    
    if (result.exists) {
      return Response.json(result, { status: 200 });
    }
    
    return Response.json(
      { message: `User not found ${slug}` },
      { status: 404 }
    );
  } catch (error) {
    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}