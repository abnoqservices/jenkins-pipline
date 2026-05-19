import {checkDatabaseConnection} from '@/lib/dbHealth';
export async function GET() {
    const health = await checkDatabaseConnection();
    
    if (health.connected) {
      return Response.json(health, { status: 200 });
    }
    
    return Response.json(health, { status: 503 });
  }