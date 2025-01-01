import { createClient } from '@/utils/supabase/server';
import { google } from 'googleapis';
import { oauth2Client } from '@/utils/google-auth';

interface CreateMeetingParams {
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  requestId: string;
}

export async function createMeetingWithUserAuth({
  summary,
  description,
  startTime,
  endTime,
  teacherId,
  requestId
}: CreateMeetingParams) {
  try {
    const supabase = await createClient();
    
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_google_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', teacherId)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('NO_GOOGLE_AUTH');
    }

    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry_date
    });

    // Check if token is expired or will expire soon
    const now = Date.now();
    const expiryDate = oauth2Client.credentials.expiry_date;
    if (!expiryDate || now >= expiryDate - 5 * 60 * 1000) { // 5 minutes buffer
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      await supabase
        .from('user_google_tokens')
        .update({
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || tokenData.refresh_token,
          expiry_date: credentials.expiry_date
        })
        .eq('user_id', teacherId);
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
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
    if (error instanceof Error && error.message === 'NO_GOOGLE_AUTH') {
      return {
        needsAuth: true,
        authUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google?teacherId=${teacherId}&requestId=${requestId}`
      };
    }
    throw error;
  }
}
