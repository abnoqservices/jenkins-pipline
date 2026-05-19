import {checkUserAuthenticated} from '@/lib/dbHealth';
export async function POST(request) {
    try {
      const { email, password } = await request.json();
      
      if (!email || !password) {
        return Response.json(
          { error: 'Email and password required' },
          { status: 400 }
        );
      }
      
      const result = await checkUserAuthenticated(email, password);
      
      if (result.authenticated) {
        // Set session/JWT token here
        return Response.json({
          success: true,
          user: result.user,
          message: result.message
        }, { status: 200 });
      }
      
      return Response.json(
        { error: result.message },
        { status: 401 }
      );
    } catch (error) {
      return Response.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  }