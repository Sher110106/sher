// app/api/webhook/route.ts
import { Resend } from 'resend';
import { createClient } from "@/utils/supabase/server";
import { render } from '@react-email/render';
import EmailTemplate from '@/emails/TeachingRequestEmail';
import { createMeeting } from '@/utils/zoom';

const resend = new Resend(process.env.RESEND_API_KEY!);

interface TeacherProfile {
  full_name: string;
  email: string;
}

interface SchoolProfile {
  school_name: string;
  email: string;
}

interface Schedule {
  date: string;
  time: string;
}

interface TeachingRequest {
  id: string;
  teacher_id: string;
  school_id: string;
  subject: string;
  schedule: Schedule;
  status: 'pending' | 'accepted' | 'rejected';
  meet_link?: string;
  meet_id?: string;
}

export async function POST(req: Request) {
  console.log('Supabase webhook received at:', new Date().toISOString());
  
  try {
    const payload = await req.json();
    console.log('Received payload:', payload);
    
    const { type, record, table, schema } = payload;
    if (!type || !record) {
      console.error('Invalid webhook payload. Missing "type" or "record".');
      return new Response('Invalid webhook payload', { status: 400 });
    }
    
    const supabase = await createClient();
    console.log('Supabase client initialized');

    const { data: teacherData, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('full_name, email')
      .eq('id', record.teacher_id)
      .single();
  
    const { data: schoolData, error: schoolError } = await supabase
      .from('school_profiles')
      .select('school_name, email')
      .eq('id', record.school_id)
      .single();

    if (teacherError || schoolError) {
      console.error('Error fetching profiles:', { teacherError, schoolError });
      return new Response('Error processing webhook', { status: 500 });
    }

    try {
      switch (record.status) {
        case 'pending':
          await sendPendingEmail(teacherData as TeacherProfile, schoolData as SchoolProfile, record as TeachingRequest);
          break;
        case 'accepted':
          await handleAcceptedRequest(teacherData as TeacherProfile, schoolData as SchoolProfile, record as TeachingRequest, supabase);
          break;
        case 'rejected':
          await sendRejectionEmail(teacherData as TeacherProfile, schoolData as SchoolProfile, record as TeachingRequest);
          break;
        default:
          console.warn('Unhandled status:', record.status);
      }
    } catch (emailError) {
      console.error('Error handling request:', emailError);
      throw emailError;
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleAcceptedRequest(
  teacherData: TeacherProfile, 
  schoolData: SchoolProfile, 
  record: TeachingRequest, 
  supabase: any
) {
  try {
    // Parse the date and time
    const [year, month, day] = record.schedule.date.split('-');
    const timeMatch = record.schedule.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    
    if (!timeMatch) {
      throw new Error('Invalid time format');
    }
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const startTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hours,
      minutes
    );
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour

    console.log('Start time:', startTime.toISOString());
    console.log('End time:', endTime.toISOString());

    const { meetingLink, meetingId } = await createMeeting({
      summary: `${record.subject} Class - ${schoolData.school_name}`,
      description: `Teaching session for ${record.subject}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    });

    await supabase
      .from('teaching_requests')
      .update({ meet_link: meetingLink, meet_id: meetingId })
      .eq('id', record.id);

    await sendAcceptanceEmails(teacherData, schoolData, record, meetingLink);
  } catch (error) {
    console.error('Error in handleAcceptedRequest:', error);
    throw error;
  }
}

async function sendAcceptanceEmails(
  teacherData: TeacherProfile,
  schoolData: SchoolProfile,
  record: TeachingRequest,
  meetingLink: string
) {
  const emailHTML = await render(
    EmailTemplate({
      teacherName: teacherData.full_name,
      schoolName: schoolData.school_name,
      subject: record.subject,
      schedule: record.schedule,
      meetingLink,
      status: 'accepted'
    })
  );

  await Promise.all([
    resend.emails.send({
      from: 'noreply@bugzer.tech',
      to: teacherData.email,
      subject: 'Teaching Request Accepted - Meeting Details',
      html: emailHTML,
    }),
    resend.emails.send({
      from: 'noreply@bugzer.tech',
      to: schoolData.email,
      subject: 'Teaching Request Accepted - Meeting Details',
      html: emailHTML,
    })
  ]);
}

async function sendPendingEmail(
  teacherData: TeacherProfile,
  schoolData: SchoolProfile,
  record: TeachingRequest
) {
  const emailHTML = await render(
    EmailTemplate({
      teacherName: teacherData.full_name,
      schoolName: schoolData.school_name,
      subject: record.subject,
      schedule: record.schedule,
      status: 'pending'
    })
  );

  await resend.emails.send({
    from: 'noreply@bugzer.tech',
    to: teacherData.email,
    subject: 'New Teaching Request',
    html: emailHTML,
  });
}

async function sendRejectionEmail(
  teacherData: TeacherProfile,
  schoolData: SchoolProfile,
  record: TeachingRequest
) {
  const emailHTML = await render(
    EmailTemplate({
      teacherName: teacherData.full_name,
      schoolName: schoolData.school_name,
      subject: record.subject,
      schedule: record.schedule,
      status: 'rejected'
    })
  );

  await resend.emails.send({
    from: 'noreply@bugzer.tech',
    to: schoolData.email,
    subject: 'Teaching Request Declined',
    html: emailHTML,
  });
}