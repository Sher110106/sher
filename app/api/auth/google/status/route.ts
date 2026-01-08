import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Google tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_google_tokens')
      .select('user_id, expiry_date')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      return Response.json({
        connected: false
      });
    }

    // Get user email from profile for display
    const { data: profileData } = await supabase
      .from('teacher_profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    return Response.json({
      connected: true,
      email: profileData?.email || user.email,
      expiresAt: tokenData.expiry_date
    });
  } catch (error) {
    console.error('Error checking Google status:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
