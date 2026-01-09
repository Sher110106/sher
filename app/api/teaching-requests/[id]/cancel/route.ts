import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { deleteMeeting } from "@/utils/google-meet";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { reason } = body;

    // 1. Fetch request details to verify ownership
    const { data: request, error: requestError } = await supabase
      .from('teaching_requests')
      .select('school_id, teacher_id, status')
      .eq('id', id)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.school_id !== user.id && request.teacher_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Handle Google Calendar cleanup for accepted requests
    if (request.status === 'accepted') {
        const { data: meeting } = await supabase
            .from('meeting_details')
            .select('meet_id, teacher_id')
            .eq('teaching_request_id', id)
            .single();
        
        if (meeting?.meet_id) {
            try {
                await deleteMeeting({ 
                    teacherId: meeting.teacher_id, 
                    meetingId: meeting.meet_id 
                });
            } catch (err) {
                console.error('Failed to delete Google Calendar event:', err);
                // We proceed with DB cancellation even if Google fails
            }
        }
    }

    // 3. Update request status
    const { error: updateError } = await supabase
      .from('teaching_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: reason
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // NEW: Create in-app notifications for both parties
    try {
      const { data: requestDetails } = await supabase
        .from('teaching_requests')
        .select(`
          subject,
          schedule,
          teacher:teacher_profiles(full_name),
          school:school_profiles(school_name)
        `)
        .eq('id', id)
        .single();

      if (requestDetails) {
        const message = `The session for ${requestDetails.subject} on ${requestDetails.schedule.date} at ${requestDetails.schedule.time} has been cancelled.`;
        
        await Promise.all([
          supabase.from('notifications').insert({
            user_id: request.teacher_id,
            type: 'class_cancelled',
            title: 'Session Cancelled',
            message: message,
            data: { request_id: id }
          }),
          supabase.from('notifications').insert({
            user_id: request.school_id,
            type: 'class_cancelled',
            title: 'Session Cancelled',
            message: message,
            data: { request_id: id }
          })
        ]);
      }
    } catch (notifError) {
      console.error("Failed to create cancellation notifications:", notifError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
