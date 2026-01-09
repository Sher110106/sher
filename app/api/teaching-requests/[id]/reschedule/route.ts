import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { updateMeeting } from "@/utils/google-meet";
import { sendEmail } from "@/utils/email";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teaching_request_id } = await context.params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    const body = await req.json();
    const { new_schedule, reason } = body;

    if (!new_schedule) {
      return NextResponse.json({ error: "New schedule is required" }, { status: 400 });
    }

    // 1. Fetch current request and profiles
    const { data: request, error: requestError } = await supabase
      .from('teaching_requests')
      .select(`
        *,
        teacher:teacher_profiles (full_name, email),
        school:school_profiles (school_name, email)
      `)
      .eq('id', teaching_request_id)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.school_id !== user.id && request.teacher_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Insert reschedule request
    const { data: rescheduleData, error: insertError } = await supabase
      .from('reschedule_requests')
      .insert({
        teaching_request_id,
        proposed_by: userId,
        old_schedule: request.schedule,
        new_schedule,
        cancellation_reason: reason,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 3. Send notification to the other party
    const isTeacherProposing = userId === request.teacher_id;
    const recipientEmail = isTeacherProposing ? request.school.email : request.teacher.email;
    const recipientId = isTeacherProposing ? request.school_id : request.teacher_id;
    
    try {
        await Promise.all([
          sendEmail({
              to: recipientEmail,
              subject: `Reschedule Proposed: ${request.subject}`,
              teacherName: request.teacher.full_name,
              schoolName: request.school.school_name,
              teachingSubject: request.subject,
              schedule: new_schedule,
              oldSchedule: request.schedule,
              status: 'reschedule_proposed',
              cancellationReason: reason
          }),
          supabase.from('notifications').insert({
            user_id: recipientId,
            type: 'reschedule_proposed',
            title: 'Reschedule Proposed',
            message: `${isTeacherProposing ? request.teacher.full_name : request.school.school_name} has proposed to reschedule ${request.subject}`,
            data: { request_id: teaching_request_id, reschedule_id: rescheduleData.id }
          })
        ]);
    } catch (err) {
        console.error('Failed to send reschedule notification:', err);
    }

    return NextResponse.json({ success: true, data: rescheduleData });
  } catch (error) {
    console.error('Reschedule proposal error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Handle accept/reject reschedule
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: teaching_request_id } = await context.params;
      const supabase = await createClient();
  
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const userId = user.id;
  
      const body = await req.json();
      const { reschedule_id, status } = body; // 'accepted' or 'rejected'
  
      if (!reschedule_id || !status) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      // Verify the user is the opposite of who proposed it?
      // For now, any participant can handle it if it's pending.
      // But typically, the receiver should handle it.
  
      const { data: reschedule, error: fetchError } = await supabase
        .from('reschedule_requests')
        .select('*')
        .eq('id', reschedule_id)
        .eq('status', 'pending')
        .single();
  
      if (fetchError || !reschedule) {
        return NextResponse.json({ error: "Reschedule request not found or already handled" }, { status: 404 });
      }

      if (reschedule.proposed_by === userId) {
          return NextResponse.json({ error: "You cannot handle your own proposal" }, { status: 403 });
      }

      // Fetch the main request to get teacher_id for calendar update
      const { data: request, error: reqError } = await supabase
        .from('teaching_requests')
        .select(`
            *,
            teacher:teacher_profiles (full_name, email),
            school:school_profiles (school_name, email)
        `)
        .eq('id', teaching_request_id)
        .single();

      if (reqError || !request) {
        return NextResponse.json({ error: "Main request not found" }, { status: 404 });
      }
  
      if (status === 'accepted') {
          // 1. Update the main teaching request schedule
          await supabase
            .from('teaching_requests')
            .update({ schedule: reschedule.new_schedule })
            .eq('id', teaching_request_id);

          // 2. Update Google Calendar IF meeting exists
          const { data: meeting } = await supabase
            .from('meeting_details')
            .select('*')
            .eq('teaching_request_id', teaching_request_id)
            .single();

          if (meeting) {
            try {
              // Parse date and time to ISO
              const date = reschedule.new_schedule.date;
              const time = reschedule.new_schedule.time;
              const [timeStr, modifier] = time.split(' ');
              let [hours, minutes] = timeStr.split(':');
              let h = parseInt(hours, 10);
              if (h === 12) h = 0;
              if (modifier === 'PM') h += 12;
              
              const startDateTime = new Date(`${date}T${h.toString().padStart(2, '0')}:${minutes}:00`).toISOString();
              const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();

              await updateMeeting({
                teacherId: request.teacher_id, // Teaching request has teacher_id
                meetingId: meeting.meet_id,
                summary: meeting.summary,
                description: meeting.description,
                startTime: startDateTime,
                endTime: endDateTime
              });
              console.log('Google Calendar meeting updated');
            } catch (calError) {
              console.error('Failed to update Google Calendar meeting:', calError);
            }
          }

          // 3. Send notification to the proposer
          const recipientEmail = reschedule.proposed_by === request.teacher_id ? request.teacher.email : request.school.email;
          const recipientId = reschedule.proposed_by;
          try {
              await Promise.all([
                sendEmail({
                    to: recipientEmail,
                    subject: `Reschedule Accepted: ${request.subject}`,
                    teacherName: request.teacher.full_name,
                    schoolName: request.school.school_name,
                    teachingSubject: request.subject,
                    schedule: reschedule.new_schedule,
                    status: 'accepted'
                }),
                supabase.from('notifications').insert({
                  user_id: recipientId,
                  type: 'reschedule_accepted',
                  title: 'Reschedule Accepted',
                  message: `Your reschedule request for ${request.subject} has been accepted`,
                  data: { request_id: teaching_request_id }
                })
              ]);
          } catch (err) {
              console.error('Failed to send reschedule accepted notification:', err);
          }
      } else if (status === 'rejected') {
          // Send notification to the proposer
          const recipientEmail = reschedule.proposed_by === request.teacher_id ? request.teacher.email : request.school.email;
          const recipientId = reschedule.proposed_by;
          try {
              await Promise.all([
                sendEmail({
                    to: recipientEmail,
                    subject: `Reschedule Declined: ${request.subject}`,
                    teacherName: request.teacher.full_name,
                    schoolName: request.school.school_name,
                    teachingSubject: request.subject,
                    schedule: reschedule.old_schedule,
                    status: 'rejected'
                }),
                supabase.from('notifications').insert({
                  user_id: recipientId,
                  type: 'reschedule_declined',
                  title: 'Reschedule Declined',
                  message: `Your reschedule request for ${request.subject} has been declined`,
                  data: { request_id: teaching_request_id }
                })
              ]);
          } catch (err) {
              console.error('Failed to send reschedule rejected notification:', err);
          }
      }

      // 5. Update reschedule request status
      await supabase
        .from('reschedule_requests')
        .update({ status })
        .eq('id', reschedule_id);
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Reschedule handling error:', error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
