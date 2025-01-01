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
  console.log('Starting createMeetingWithUserAuth', {
    summary,
    startTime,
    endTime,
    teacherId,
    requestId
  });

  try {
    const supabase = await createClient();
    console.log('Connected to Supabase client');

    const { data: tokenData, error: tokenError } = await supabase
      .from('user_google_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', teacherId)
      .single();

    if (tokenError || !tokenData) {
      console.warn('No Google Auth found for user', { teacherId, tokenError });
      throw new Error('NO_GOOGLE_AUTH');
    }

    console.log('Google tokens retrieved:', tokenData);

    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry_date
    });

    const now = Date.now();
    const expiryDate = oauth2Client.credentials.expiry_date;
    if (!expiryDate || now >= expiryDate - 5 * 60 * 1000) { // 5 minutes buffer
      console.log('Token is expired or expiring soon, refreshing token');
      const { credentials } = await oauth2Client.refreshAccessToken();
      console.log('Token refreshed:', credentials);

      await supabase
        .from('user_google_tokens')
        .update({
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || tokenData.refresh_token,
          expiry_date: credentials.expiry_date
        })
        .eq('user_id', teacherId);

      console.log('Updated Google tokens in database');
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    console.log('Initialized Google Calendar API client');

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

    console.log('Inserting event into Google Calendar', event);

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
    });

    console.log('Event successfully created in Google Calendar', response.data);

    const meetingLink = response.data.conferenceData?.entryPoints?.[0]?.uri;
    const meetingId = response.data.id;

    if (!meetingLink || !meetingId) {
      console.error('Failed to retrieve meeting link or ID', { meetingLink, meetingId });
      throw new Error('Failed to create Google Meet link');
    }

    console.log('Meeting created successfully', { meetingLink, meetingId });

    return { meetingLink, meetingId };
  } catch (error) {
    console.error('Error in createMeetingWithUserAuth', {
      teacherId,
      requestId,
      error: error instanceof Error ? error.message : error
    });

    if (error instanceof Error && error.message === 'NO_GOOGLE_AUTH') {
      const authUrl = `https://sher-sable.vercel.app/api/auth/google?teacherId=${teacherId}&requestId=${requestId}`;
      console.log('Authorization required, generating auth URL:', authUrl);

      return {
        needsAuth: true,
        authUrl
      };
    }

    throw error;
  }
}
