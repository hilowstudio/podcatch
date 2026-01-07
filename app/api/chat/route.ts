
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { auth } from '@/auth';

export const maxDuration = 30;

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();

    const result = await streamText({
        model: google('gemini-1.5-pro'),
        messages,
        system: `You are an intelligent podcast assistant. You have access to the user's library of processed episodes. 
        Answer questions based on the context provided.
        (Note: Retrieval is not yet connected in this version, so answer generally or ask for context.)`,
    });

    return result.toDataStreamResponse();
}
