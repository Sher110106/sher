// app/(dashboard)/teacher/page.tsx
import TeachingRequestsWrapper from '@/components/TeachingRequestsWrapper';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

// In your page.tsx
export default async function TeacherDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/sign-in')
  }
  
  const { data: requests } = await supabase
    .from('teaching_requests')
    .select(`
      *,
      school:school_profiles(
        school_name,
        state,
        district,
        cluster,
        block
      )
    `)
    .eq('teacher_id', user.id);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Teaching Requests</h1>
      <TeachingRequestsWrapper 
        initialRequests={requests || []}
        userId={user.id}
      />
    </div>
  );
}