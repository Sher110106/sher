// app/(dashboard)/teacher/page.tsx
import { Button } from "@/components/ui/button";
import TeachingRequestsWrapper from '@/components/TeachingRequestsWrapper';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';


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
      <div className='flex flex-row justify-items-start p-5'>
      <Link href='/protected/teacher/schedule'className='mr-5' ><Button>Change Schedule</Button></Link>
      <Link href='/protected/teacher/edit'className='mr-5' ><Button>Edit Details</Button></Link>
      <Link href='/protected/teacher/past_classes'className='' ><Button>Past Classes</Button></Link>

      </div>
      <h1 className="text-2xl font-bold mb-6">Teaching Requests</h1>
      <TeachingRequestsWrapper 
        initialRequests={requests || []}
        userId={user.id}
      />
    </div>
  );
}