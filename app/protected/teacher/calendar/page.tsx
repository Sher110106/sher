import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import CalendarView from '@/components/CalendarView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function TeacherCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Fetch teaching requests with school info and meeting details
  const { data: requests } = await supabase
    .from('teaching_requests')
    .select(`
      *,
      school:school_profiles(school_name),
      meeting:meeting_details(meeting_link, google_event_id)
    `)
    .eq('teacher_id', user.id)
    .not('schedule', 'is', null);

  // Transform data to include meeting info at top level
  const transformedRequests = (requests || []).map(req => ({
    ...req,
    school: req.school,
    meeting_link: req.meeting?.[0]?.meeting_link || null,
    google_event_id: req.meeting?.[0]?.google_event_id || null,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link href="/protected/teacher/dashboard">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">My Calendar</h1>
          <p className="text-muted-foreground">
            View all your scheduled teaching sessions
          </p>
        </div>
      </div>

      {/* Calendar */}
      <CalendarView requests={transformedRequests} userType="teacher" />
    </div>
  );
}
