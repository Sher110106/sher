import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';
import { render } from '@react-email/render';

interface EmailTemplateProps {
  teacherName: string;
  schoolName: string;
  subject: string;
  schedule: {
    date: string;
    time: string;
  };
  meetingLink?: string;
  authUrl?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'needs_auth' | 'cancelled' | 'reschedule_proposed';
  oldSchedule?: {
    date: string;
    time: string;
  };
}

export default function EmailTemplate({
  teacherName,
  schoolName,
  subject,
  schedule,
  meetingLink,
  authUrl,
  status,
  cancellationReason,
  oldSchedule
}: EmailTemplateProps & { cancellationReason?: string }) {
  const getSubjectLine = () => {
    switch (status) {
      case 'pending': return 'New Teaching Request';
      case 'accepted': return 'Teaching Request Accepted - Meeting Details';
      case 'rejected': return 'Teaching Request Declined';
      case 'needs_auth': return 'Google Calendar Authorization Required';
      case 'cancelled': return 'Teaching Session Cancelled';
      case 'reschedule_proposed': return 'Proposed Reschedule for Teaching Session';
      default: return 'Teaching Request Update';
    }
  };

  const getContent = () => {
    switch (status) {
      case 'pending':
        return (
          <>
            <Text>Hello {teacherName},</Text>
            <Text>
              You have received a new teaching request from {schoolName} for {subject}.
              The requested schedule is on {schedule.date} at {schedule.time}.
            </Text>
            <Text>
              Please review and respond to this request through your dashboard.
            </Text>
          </>
        );
      
      case 'accepted':
        return (
          <>
            <Text>
              The teaching request for {subject} has been accepted.
              Class is scheduled for {schedule.date} at {schedule.time}.
            </Text>
            <Text>
              Join the class using this Google Meet link:{' '}
              <Link href={meetingLink}>{meetingLink}</Link>
            </Text>
          </>
        );
      
      case 'rejected':
        return (
          <>
            <Text>
              Unfortunately, the teaching request for {subject} scheduled for{' '}
              {schedule.date} at {schedule.time} has been declined.
            </Text>
            <Text>
              Please visit the platform to submit a new request or contact support
              if you have any questions.
            </Text>
          </>
        );
      
      case 'cancelled':
        return (
          <>
            <Text>
              The teaching session for {subject} scheduled for {schedule.date} at {schedule.time} has been cancelled.
            </Text>
            <Text>
              <strong>Reason:</strong> {cancellationReason || 'No reason provided'}
            </Text>
          </>
        );

      case 'reschedule_proposed':
        return (
          <>
            <Text>
              A reschedule has been proposed for the teaching session on {subject}.
            </Text>
            <Text>
              {oldSchedule && (
                <>
                  <strong>Old Schedule:</strong> {oldSchedule.date} at {oldSchedule.time}
                  <br />
                </>
              )}
              <strong>New Proposed Schedule:</strong> {schedule.date} at {schedule.time}
            </Text>
            <Text>
              <strong>Reason:</strong> {cancellationReason || 'No reason provided'}
            </Text>
            <Text>
              Please visit your dashboard to accept or decline this proposal.
            </Text>
          </>
        );

      case 'needs_auth':
        return (
          <>
            <Text>Hello {teacherName},</Text>
            <Text>
              To create the Google Meet link for your upcoming class with {schoolName},
              we need your authorization to access Google Calendar.
            </Text>
            <Text>
              Please click the link below to authorize:
              <br />
              <Link href={authUrl}>Authorize Google Calendar Access</Link>
            </Text>
            <Text>
              After authorization, the meeting will be created automatically and
              both you and the school will receive the meeting details.
            </Text>
          </>
        );
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{getSubjectLine()}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{getSubjectLine()}</Heading>
          {getContent()}
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0',
  padding: '0',
};