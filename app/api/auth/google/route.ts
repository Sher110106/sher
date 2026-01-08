import { getAuthUrl } from '@/utils/google-auth';
import { rateLimit } from '@/utils/rate-limit';

const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  if (limiter.isRateLimited(ip, 10)) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const teacherId = searchParams.get('teacherId');
    const requestId = searchParams.get('requestId'); // Now optional

    if (!teacherId) {
      console.error('GET Request Error: Missing required teacherId parameter.');
      return new Response('Missing teacherId parameter', { status: 400 });
    }

    console.log('Generating OAuth state for request:', {
      teacherId,
      requestId,
    });

    const state = Buffer.from(
      JSON.stringify({ teacherId, requestId })
    ).toString('base64');

    let authUrl;
    try {
      authUrl = getAuthUrl(state);
    } catch (error) {
      console.error('Error generating Google OAuth URL:', error);
      return new Response('Failed to generate auth URL', { status: 500 });
    }

    console.log('Successfully generated auth URL:', authUrl);

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl,
        'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`,
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET handler:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
