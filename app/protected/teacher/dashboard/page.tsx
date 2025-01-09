// app/(dashboard)/teacher/page.tsx
import { TeachingRequestsList } from '@/components/TeachingRequestsProvider';
import { Button } from '@/components/ui/button';
import { createClient } from "@/utils/supabase/server";
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function TeacherDashboard() {
  const supabase=await createClient();
  const {
      data:{user} 
  }=await supabase.auth.getUser();
  if(!user){
      redirect('/sign-in')
  }
  


  // Fetch initial requests
  const { data: initialRequests } = await supabase
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
    .order('created_at', { ascending: false });

  return (
    
    <div className="max-w-4xl mx-auto p-6">
      <div className='flex flex-row justify-items-start p-5'>
      <Link href='/protected/teacher/schedule'className='mr-5' ><Button>Change Schedule</Button></Link>
      <Link href='/protected/teacher/edit'className='mr-5' ><Button>Edit Details</Button></Link>
      <Link href='/protected/teacher/past_classes'className='' ><Button>Past Classes</Button></Link>

      </div>
      <div>
      <h1 className="text-2xl font-bold mb-6">Teaching Requests</h1>

      <TeachingRequestsList initialRequests={initialRequests || []} />
      </div>
    </div>
  );
}