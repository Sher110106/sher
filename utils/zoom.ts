import axios from 'axios';

interface MeetingParams {
  topic: string;
  agenda: string;
  startTime: string; // ISO 8601 format
  duration: number;  // Duration in minutes
}

export async function createMeeting({
  topic,
  agenda,
  startTime,
  duration,
}: MeetingParams) {
  try {
    // Obtain an access token using your Client ID and Client Secret
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
        topic,
        agenda,
        start_time: startTime,
        duration,
        timezone: 'UTC',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          approval_type: 2, // No registration required
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { start_url, join_url, id } = meetingResponse.data;

    return { startUrl: start_url, joinUrl: join_url, meetingId: id };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating Zoom meeting:', error.message);
    } else if (axios.isAxiosError(error)) {
      console.error('Error creating Zoom meeting:', error.response?.data || error.message);
    }
    throw error;
  }
}
