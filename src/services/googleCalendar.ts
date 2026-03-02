import { google } from "googleapis";

type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

function getGoogleOAuthConfigRaw() {
  const appUrl = process.env.APP_URL?.trim() || "http://localhost:3000";
  return {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim() || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() || "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI?.trim() || `${appUrl}/api/auth/google/callback`,
  };
}

export function getMissingGoogleOAuthFields() {
  const config = getGoogleOAuthConfigRaw();
  const missing: string[] = [];

  if (!config.clientId) missing.push("GOOGLE_CLIENT_ID");
  if (!config.clientSecret) missing.push("GOOGLE_CLIENT_SECRET");
  return missing;
}

function requireGoogleOAuthConfig(): GoogleOAuthConfig {
  const config = getGoogleOAuthConfigRaw();
  const missing = getMissingGoogleOAuthFields();

  if (missing.length > 0) {
    throw new Error(`Google OAuth no configurado. Faltan: ${missing.join(", ")}`);
  }

  return config;
}

function createOAuthClient() {
  const config = requireGoogleOAuthConfig();
  return new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
}

export const getAuthUrl = () => {
  const oauth2Client = createOAuthClient();
  const scopes = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
};

export const getTokens = async (code: string) => {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

export const getCalendarEvents = async (tokens: any, timeMin: string, timeMax: string) => {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items;
};
