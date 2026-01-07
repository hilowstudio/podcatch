
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

function getOAuthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXTAUTH_URL}/api/integrations/google/callback`
    );
}

export function getAuthUrl() {
    const oauth2Client = getOAuthClient();
    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Force refresh token
        prompt: 'consent',
        scope: SCOPES,
    });
}

export async function getTokens(code: string) {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

interface DrivePayload {
    refreshToken: string;
    title: string;
    content: string; // Markdown/Text content
    folderId?: string; // Optional folder
}

interface DriveResult {
    success: boolean;
    error?: string;
    fileId?: string;
    webViewLink?: string;
}

export async function saveToDrive(payload: DrivePayload): Promise<DriveResult> {
    if (!payload.refreshToken) {
        return { success: false, error: 'Missing Refresh Token' };
    }

    try {
        const auth = getOAuthClient();
        auth.setCredentials({ refresh_token: payload.refreshToken });

        const drive = google.drive({ version: 'v3', auth });

        // Create a Google Doc from the text content
        const fileMetadata = {
            name: payload.title,
            mimeType: 'application/vnd.google-apps.document', // Convert to Google Doc
        };

        const media = {
            mimeType: 'text/plain',
            body: payload.content,
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id,webViewLink',
        });

        return {
            success: true,
            fileId: response.data.id || undefined,
            webViewLink: response.data.webViewLink || undefined
        };

    } catch (error: any) {
        console.error('Google Drive API Error:', error);
        return { success: false, error: error.message || 'Unknown error saving to Drive' };
    }
}
