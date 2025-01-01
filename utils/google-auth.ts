import { google } from 'googleapis';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !REDIRECT_URI) {
  console.error('Google OAuth environment variables are missing:', {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  });
  throw new Error('Missing required Google OAuth environment variables');
}

console.log('Initializing Google OAuth2 client with redirect URI:', REDIRECT_URI);

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

export function getAuthUrl(state: string) {
  if (!state) {
    console.error('State parameter is missing while generating auth URL');
    throw new Error('State parameter is required to generate auth URL');
  }

  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state,
      prompt: 'consent',
    });

    console.log('Generated Google OAuth2 auth URL:', authUrl);
    return authUrl;
  } catch (error) {
    console.error('Error generating Google OAuth2 auth URL:', error);
    throw error;
  }
}
