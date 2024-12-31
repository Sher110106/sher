// app/api/webhook/route.ts
import { Resend } from 'resend';
import { createClient } from "@/utils/supabase/server";
import { render } from '@react-email/render';
import EmailTemplate from '@/emails/TeachingRequestEmail';
import { createMeeting } from '@/utils/google-meet';

const resend = new Resend(process.env.RESEND_API_KEY!);

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
          await sendPendingEmail(teacherData, schoolData, record);
          break;
        case 'accepted':
          await handleAcceptedRequest(teacherData, schoolData, record, supabase);
          break;
        case 'rejected':
          await sendRejectionEmail(teacherData, schoolData, record);
          break;
        default:
          console.warn('Unhandled status:', record.status);
      }
    } catch (emailError) {
      console.error('Error handling request:', emailError);
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleAcceptedRequest(teacherData: any, schoolData: any, record: any, supabase: any) {
  try {
    // Convert schedule to ISO string format
    const [year, month, day] = record.schedule.date.split('-');
    const [hours, minutes] = record.schedule.time.split(':');
    const startTime = new Date(year, month - 1, day, hours, minutes);
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
  } catch (error) {
    console.error('Error in handleAcceptedRequest:', error);
    throw error;
  }
}

async function sendPendingEmail(teacherData: any, schoolData: any, record: any) {
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

async function sendRejectionEmail(teacherData: any, schoolData: any, record: any) {
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