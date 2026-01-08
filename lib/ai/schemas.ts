import { z } from 'zod';

// Schema for insight extraction from AI
export const insightSchema = z.object({
    summary: z.string().describe('A concise summary of the podcast episode (2-3 sentences)'),
    keyTakeaways: z.array(z.string()).length(5).describe('Exactly 5 key bullet points from the episode'),
    links: z.array(z.string().url()).describe('All URLs mentioned in the transcript'),
    books: z.array(z.object({
        title: z.string().describe('Title of the book'),
        author: z.string().describe('Author of the book')
    })).describe('List of books mentioned in the episode'),
});

export type InsightData = z.infer<typeof insightSchema>;
