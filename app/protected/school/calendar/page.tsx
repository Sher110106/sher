import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import CalendarView from '@/components/CalendarView';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Helper to parse schedule that might be string or object
function parseSchedule(scheduleData: any): { date: string; time: string } | null {
  if (!scheduleData) return null;
  try {
    const schedule = typeof scheduleData === 'string' 
      ? JSON.parse(scheduleData) 
      : scheduleData;
    
    if (schedule && schedule.date && schedule.time) {
      return { date: schedule.date, time: schedule.time };
    }
    return null;
  } catch (error) {
    console.error('Error parsing schedule:', error);
    return null;
  }
}

export default async function SchoolCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Fetch teaching requests with teacher info and meeting details
  const { data: requests } = await supabase
    .from('teaching_requests')
    .select(`
      *,
      teacher:teacher_profiles(name),
      meeting:meeting_details(meet_link, meet_id)
    `)
    .eq('school_id', user.id);

  // Transform data: parse schedule and include meeting info at top level
  const transformedRequests = (requests || []).map(req => {
    const parsedSchedule = parseSchedule(req.schedule);
    return {
      ...req,
      schedule: parsedSchedule,
      teacher: req.teacher,
      meeting_link: req.meeting?.[0]?.meet_link || null,
      google_event_id: req.meeting?.[0]?.meet_id || null, // meet_id serves as google event id
    };
  }).filter(req => req.schedule !== null); // Filter on client after parsing

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link href="/protected/school/dashboard">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Class Calendar</h1>
          <p className="text-muted-foreground">
            View all your scheduled teaching sessions
          </p>
        </div>
      </div>

      {/* Calendar */}
      <CalendarView requests={transformedRequests} userType="school" />
    </div>
  );
}
