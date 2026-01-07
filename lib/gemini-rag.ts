
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import fs from 'fs';
import path from 'path';
import os from 'os';

const apiKey = process.env.GEMINI_API_KEY!;
const fileManager = new GoogleAIFileManager(apiKey);

export async function uploadToGemini(content: string, filename: string) {
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set');
    }

    // Create a temporary file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, filename);

    fs.writeFileSync(tempFilePath, content);

    try {
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType: "text/plain",
            displayName: filename,
        });

        console.log(`Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`);

        // Wait for processing? Usually text is fast.

        return {
            success: true,
            fileUri: uploadResult.file.uri,
            name: uploadResult.file.name
        };

    } catch (error) {
        console.error('Gemini Upload Error:', error);
        return { success: false, error: error };
    } finally {
        // Cleanup temp file
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
    }
}
