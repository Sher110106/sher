import { createClient } from '@/utils/supabase/server';
import { oauth2Client } from '@/utils/google-auth';

export async function GET(request: Request) {
    try {
      const searchParams = new URL(request.url).searchParams;
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const storedState = request.headers.get('cookie')?.match(/oauth_state=([^;]+)/)?.[1];
  
      if (!code || !state || !storedState || state !== storedState) {
        return new Response('Invalid request', { status: 400 });
      }
  
      // Clear the cookie
      const headers = new Headers();
      headers.append('Set-Cookie', 'oauth_state=; Max-Age=0');
  
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      const { teacherId, requestId } = stateData;
  
      const { tokens } = await oauth2Client.getToken(code);
      const supabase = await createClient();
  
      await supabase
        .from('user_google_tokens')
        .upsert({
          user_id: teacherId,
          access_token: tokens.access_token!,
          refresh_token: tokens.refresh_token!,
          expiry_date: tokens.expiry_date!
        })
        .eq('user_id', teacherId);
  
      if (requestId) {
        const { data: requestData } = await supabase
          .from('teaching_requests')
          .select('*')
          .eq('id', requestId)
          .single();
  
        if (requestData) {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'UPDATE',
              table: 'teaching_requests',
              record: requestData,
              schema: 'public'
            })
          });
        }
      }
  
      return Response.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?oauth=success`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      return Response.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?oauth=error`);
    }
  }