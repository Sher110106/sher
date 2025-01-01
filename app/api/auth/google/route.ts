import { getAuthUrl } from '@/utils/google-auth';

export async function GET(request: Request) {
    const searchParams = new URL(request.url).searchParams;
    const teacherId = searchParams.get('teacherId');
    const requestId = searchParams.get('requestId');
    
    if (!teacherId || !requestId) {
      return new Response('Missing parameters', { status: 400 });
    }
  
    const state = Buffer.from(JSON.stringify({
      teacherId,
      requestId
    })).toString('base64');
  
    const authUrl = getAuthUrl(state);
  
    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl,
        'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
      }
    });
  }