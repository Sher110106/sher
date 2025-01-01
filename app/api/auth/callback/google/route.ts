import { createClient } from '@/utils/supabase/server';
import { oauth2Client } from '@/utils/google-auth';

export async function GET(request: Request) {
  console.log('OAuth callback initiated:', { url: request.url });

  try {
    const searchParams = new URL(request.url).searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const storedState = request.headers.get('cookie')?.match(/oauth_state=([^;]+)/)?.[1];

    console.log('Extracted query params:', { code, state, storedState });

    if (!code || !state || !storedState || state !== storedState) {
      console.warn('Invalid or mismatched state parameter', { code, state, storedState });
      return new Response('Invalid request', { status: 400 });
    }

    // Clear the state cookie
    const headers = new Headers();
    headers.append('Set-Cookie', 'oauth_state=; Max-Age=0');
    console.log('Cleared oauth_state cookie');

    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { teacherId, requestId } = stateData;
    console.log('Decoded state data:', stateData);

    const { tokens } = await oauth2Client.getToken(code!);
    console.log('Retrieved tokens from Google:', tokens);

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      console.error('Missing required token data:', tokens);
      throw new Error('Missing required token data');
    }

    const supabase = await createClient();
    console.log('Connected to Supabase client');

    const upsertResponse = await supabase
      .from('user_google_tokens')
      .upsert({
        user_id: teacherId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      })
      .eq('user_id', teacherId);

    if (upsertResponse.error) {
      console.error('Error upserting tokens in Supabase:', upsertResponse.error);
      throw upsertResponse.error;
    }

    console.log('Tokens upserted successfully for user:', teacherId);

    if (requestId) {
      console.log('Processing teaching request:', { requestId });

      const { data: requestData, error: requestError } = await supabase
        .from('teaching_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) {
        console.error('Error fetching teaching request:', requestError);
        throw requestError;
      }

      if (requestData) {
        console.log('Fetched teaching request data:', requestData);

        const webhookResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/teaching-requests`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'UPDATE',
              table: 'teaching_requests',
              record: requestData,
              schema: 'public',
            }),
          }
        );

        if (!webhookResponse.ok) {
          console.error('Webhook failed:', await webhookResponse.text());
          throw new Error('Webhook call failed');
        }

        console.log('Webhook triggered successfully');
      }
    }

    console.log('OAuth callback successful');
    return Response.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?oauth=success`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?oauth=error`);
  }
}
