import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete Google tokens for this user
    const { error: deleteError } = await supabase
      .from('user_google_tokens')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error disconnecting Google account:', deleteError);
      return Response.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    console.log('Google account disconnected for user:', user.id);
    
    return Response.json({
      success: true,
      message: 'Google account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Google account:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
