import { createClient } from '@/utils/supabase/server';
import NotificationBell from './NotificationBell';

export default async function NotificationBellWrapper() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return <NotificationBell userId={user.id} />;
}
