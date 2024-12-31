// utils/zoom.ts
import axios from 'axios';

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
  endTime
}: MeetingParams) {
  try {
    // Calculate duration in minutes
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMinutes = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60));

    // Obtain an access token using Client ID and Client Secret
    const tokenResponse = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID!}`,
      {},
      {
        auth: {
          username: process.env.ZOOM_CLIENT_ID!,
          password: process.env.ZOOM_CLIENT_SECRET!,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Create a meeting
    const meetingResponse = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: summary,
        agenda: description,
        start_time: startTime,
        duration: durationMinutes,
        timezone: 'UTC',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          approval_type: 2,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { join_url, id } = meetingResponse.data;
    return { meetingLink: join_url, meetingId: id };
  } catch (error) {
    console.error('Error creating Zoom meeting:', 
      axios.isAxiosError(error) 
        ? error.response?.data || error.message 
        : error instanceof Error 
          ? error.message 
          : 'Unknown error'
    );
    throw error;
  }
}