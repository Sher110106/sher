import { createClient } from "@/utils/supabase/server";
import { createMeetingWithUserAuth } from '@/utils/google-meet';
import { sendEmail } from '@/utils/email';

interface TeacherProfile {
  full_name: string;
  email: string;
}

interface SchoolProfile {
  school_name: string;
  email: string;
}

interface TeachingRequest {
  id: string;
  teacher_id: string;
  school_id: string;
  subject: string;
  schedule: {
    date: string;
    time: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  cancellation_reason?: string;
}

async function createNotification(supabase: any, data: {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}) {
  const { error } = await supabase
    .from('notifications')
    .insert([data]);
  if (error) console.error('Error creating notification:', error);
}

export async function POST(req: Request) {
  console.log('Webhook received:', new Date().toISOString());
  try {
    const rawBody = await req.text();
    
    // Verify Webhook Secret if configured
    const secret = process.env.WEBHOOK_SECRET;
    if (secret) {
        const signature = req.headers.get('x-webhook-secret');
        if (signature !== secret) {
            console.error('Invalid webhook signature');
            return new Response('Unauthorized', { status: 401 });
        }
    }

    const payload = JSON.parse(rawBody);
    const { record } = payload;
    
    if (!record) {
      return new Response('Invalid payload', { status: 400 });
    }
    
    const supabase = await createClient();
    const { data: teacherData } = await supabase
      .from('teacher_profiles')
      .select('full_name, email')
      .eq('id', record.teacher_id)
      .single();
  
    const { data: schoolData } = await supabase
      .from('school_profiles')
      .select('school_name, email')
      .eq('id', record.school_id)
      .single();

    if (!teacherData || !schoolData) {
      console.error('Profile fetch error');
      return new Response('Error processing webhook', { status: 500 });
    }
    
    const requestDetails = `${record.subject} - ${record.schedule.date} at ${record.schedule.time}`;

    switch (record.status) {
      case 'pending':
        // Notify Teacher
        await Promise.all([
          sendEmail({
            to: teacherData.email,
            subject: 'New Teaching Request',
            teacherName: teacherData.full_name,
            schoolName: schoolData.school_name,
            teachingSubject: record.subject,
            schedule: record.schedule,
            status: 'pending'
          }),
          createNotification(supabase, {
            user_id: record.teacher_id,
            type: 'new_request',
            title: 'New Teaching Request',
            message: `${schoolData.school_name} has requested you for ${requestDetails}`,
            data: { request_id: record.id }
          })
        ]);
        break;
      case 'accepted':
        // Email handled inside handleAcceptedRequest
        await handleAcceptedRequest(teacherData, schoolData, record, supabase);
        // Notify School
        await createNotification(supabase, {
          user_id: record.school_id,
          type: 'request_accepted',
          title: 'Request Accepted',
          message: `${teacherData.full_name} has accepted your request for ${requestDetails}`,
          data: { request_id: record.id }
        });
        break;
      case 'rejected':
        // Notify School
        await Promise.all([
          sendEmail({
            to: schoolData.email,
            subject: 'Teaching Request Declined',
            teacherName: teacherData.full_name,
            schoolName: schoolData.school_name,
            teachingSubject: record.subject,
            schedule: record.schedule,
            status: 'rejected'
          }),
          createNotification(supabase, {
            user_id: record.school_id,
            type: 'request_rejected',
            title: 'Request Declined',
            message: `${teacherData.full_name} has declined your request for ${requestDetails}`,
            data: { request_id: record.id }
          })
        ]);
        break;
      case 'cancelled':
        // Notify Both
        await Promise.all([
          sendEmail({
            to: [teacherData.email, schoolData.email],
            subject: 'Teaching Session Cancelled',
            teacherName: teacherData.full_name,
            schoolName: schoolData.school_name,
            teachingSubject: record.subject,
            schedule: record.schedule,
            status: 'cancelled',
            cancellationReason: record.cancellation_reason
          }),
          createNotification(supabase, {
            user_id: record.teacher_id,
            type: 'class_cancelled',
            title: 'Session Cancelled',
            message: `The session for ${requestDetails} has been cancelled`,
            data: { request_id: record.id }
          }),
          createNotification(supabase, {
            user_id: record.school_id,
            type: 'class_cancelled',
            title: 'Session Cancelled',
            message: `The session for ${requestDetails} has been cancelled`,
            data: { request_id: record.id }
          })
        ]);
        break;
    }

    return new Response('Success', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal error', { status: 500 });
  }
}


async function handleAcceptedRequest(
  teacherData: TeacherProfile,
  schoolData: SchoolProfile,
  record: TeachingRequest,
  supabase: any
) {
  try {
    console.log('Handling accepted request:', { recordId: record.id, teacherId: record.teacher_id });
    const { data: existingMeeting } = await supabase
      .from('meeting_details')
      .select('id')
      .eq('teaching_request_id', record.id)
      .single();

    if (existingMeeting) {
      console.log('Meeting already exists for request:', record.id);
      return;
    }

    // Parse schedule details
    console.log('Parsing schedule details:', record.schedule);
    const [year, month, day] = record.schedule.date.split('-');
    const timeMatch = record.schedule.time.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (!timeMatch) {
      console.error('Time format error:', record.schedule.time);
      throw new Error('Invalid time format in schedule');
    }

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const startTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hours,
      minutes
    );
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    console.log('Parsed start and end times:', { startTime, endTime });

    // Create Google Meet link
    console.log('Creating Google Meet link with user authentication...');
    const result = await createMeetingWithUserAuth({
      summary: `${record.subject} Class - ${schoolData.school_name}`,
      description: `Teaching session for ${record.subject}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      teacherId: record.teacher_id,
      requestId: record.id
    });
    
    if (result.needsAuth) {
      console.warn('Authorization required for Google Meet. Email suppressed per new flow.', { teacherId: record.teacher_id });
      return;
    }

    if (!result.meetingLink || !result.meetingId) {
      throw new Error('Missing meeting details from Google Meet');
    }

    console.log('Google Meet link created:', { meetingLink: result.meetingLink, meetingId: result.meetingId });

    // Update database with meeting details
    console.log('Updating database with meeting details...');
    const meetingSummary = `${record.subject} Class`;
    const meetingDescription = `Teacher: ${teacherData.full_name}\nSchool: ${schoolData.school_name}`;
    const { error: updateError } = await supabase
      .from('meeting_details')
      .insert({
        teaching_request_id: record.id,
        meet_link: result.meetingLink,
        meet_id: result.meetingId,
        summary: meetingSummary,
        description: meetingDescription,
        teacher_id:record.teacher_id
      });

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update teaching request with meeting details');
    }

    console.log('Database successfully updated. Sending acceptance emails...');
    await sendEmail({
        to: [teacherData.email, schoolData.email],
        subject: 'Teaching Request Accepted - Meeting Details',
        teacherName: teacherData.full_name,
        schoolName: schoolData.school_name,
        teachingSubject: record.subject,
        schedule: record.schedule,
        meetingLink: result.meetingLink,
        status: 'accepted'
    });

    console.log('Acceptance emails sent successfully.');
  } catch (error) {
    console.error('Error in handleAcceptedRequest:', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      teacherData,
      schoolData,
      record
    });
    throw error;
  }
}