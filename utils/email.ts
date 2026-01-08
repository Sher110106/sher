import { Resend } from 'resend';
import { render } from '@react-email/render';
import EmailTemplate from '@/emails/TeachingRequestEmail';

const resend = new Resend(process.env.RESEND_API_KEY!);

interface SendEmailProps {
    to: string | string[];
    subject: string;
    teacherName: string;
    schoolName: string;
    teachingSubject: string; // Renamed to avoid conflict with email subject
    schedule: { date: string; time: string };
    meetingLink?: string;
    authUrl?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'needs_auth' | 'cancelled' | 'reschedule_proposed';
    cancellationReason?: string;
    oldSchedule?: { date: string; time: string };
}

export async function sendEmail({
    to,
    subject,
    teacherName,
    schoolName,
    teachingSubject,
    schedule,
    meetingLink,
    authUrl,
    status,
    cancellationReason,
    oldSchedule
}: SendEmailProps) {
    const emailHTML = await render(
        EmailTemplate({
            teacherName,
            schoolName,
            subject: teachingSubject,
            schedule,
            meetingLink,
            authUrl,
            status,
            cancellationReason,
            oldSchedule
        })
    );

    return resend.emails.send({
        from: 'noreply@bugzer.xyz',
        to,
        subject,
        html: emailHTML,
    });
}
