import { google } from 'googleapis';

interface MeetingParams {
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
}

export async function createMeeting({
  summary,
  description,
  startTime,
  endTime,
}: MeetingParams) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    const calendar = google.calendar({ version: 'v3', auth });
    const event = {
      summary,
      description,
      start: {
        dateTime: startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime,
        timeZone: 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: `teaching_${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        },
      },
    };
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
    });
    
    const meetingLink = response.data.conferenceData?.entryPoints?.[0]?.uri;
    const meetingId = response.data.id;
    
    if (!meetingLink || !meetingId) {
      throw new Error('Failed to create Google Meet link');
    }
    
    return { meetingLink, meetingId };
  } catch (error) {
    console.error('Error creating Google Meet:', error);
    throw error;
  }
}