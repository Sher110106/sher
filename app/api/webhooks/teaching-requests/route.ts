import { Resend } from 'resend';
import { createClient } from "@/utils/supabase/server";
import { render } from '@react-email/render';
import EmailTemplate from '@/emails/TeachingRequestEmail';
import { createMeetingWithUserAuth } from '@/utils/google-meet';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  console.log('Webhook received:', new Date().toISOString());
  try {
    const payload = await req.json();
    const { type, record, table, schema } = payload;
    
    if (!type || !record) {
      return new Response('Invalid payload', { status: 400 });
    }
    
    const supabase = await createClient();
    
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
      console.error('Profile fetch error:', { teacherError, schoolError });
      return new Response('Error processing webhook', { status: 500 });
    }

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
    }

    return new Response('Success', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal error', { status: 500 });
  }
}

async function handleAcceptedRequest(teacherData: any, schoolData: any, record: any, supabase: any) {
  try {
    const [year, month, day] = record.schedule.date.split('-');
    const timeMatch = record.schedule.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
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

    const result = await createMeetingWithUserAuth({
      summary: `${record.subject} Class - ${schoolData.school_name}`,
      description: `Teaching session for ${record.subject}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      teacherId: record.teacher_id,
      requestId: record.id
    });

    if (result.needsAuth) {
      await sendAuthorizationEmail(teacherData, schoolData, record, result.authUrl!);
      return;
    }

    await supabase
      .from('teaching_requests')
      .update({ meet_link: result.meetingLink!, meet_id: result.meetingId! })
      .eq('id', record.id);

    await sendAcceptanceEmails(teacherData, schoolData, record, result.meetingLink!);
  } catch (error) {
    console.error('Accept request error:', error);
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

async function sendAuthorizationEmail(teacherData: any, schoolData: any, record: any, authUrl: string) {
  const emailHTML = await render(
    EmailTemplate({
      teacherName: teacherData.full_name,
      schoolName: schoolData.school_name,
      subject: record.subject,
      schedule: record.schedule,
      authUrl,
      status: 'needs_auth'
    })
  );

  await resend.emails.send({
    from: 'noreply@bugzer.tech',
    to: teacherData.email,
    subject: 'Google Calendar Authorization Required',
    html: emailHTML,
  });
}

async function sendAcceptanceEmails(teacherData: any, schoolData: any, record: any, meetingLink: string) {
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