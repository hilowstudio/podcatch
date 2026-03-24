import { z } from 'zod';

// Schema for insight extraction from AI
export const insightSchema = z.object({
    summary: z.string().describe('A concise summary of the podcast episode (2-3 sentences)'),
    keyTakeaways: z.array(z.string()).length(5).describe('Exactly 5 key bullet points from the episode'),
    links: z.array(z.string().describe('URL mentioned in the transcript. Ensure it starts with http:// or https://')).describe('All URLs mentioned in the transcript'),
    books: z.array(z.object({
        title: z.string().describe('Title of the book'),
        author: z.string().describe('Author of the book')
    })).describe('List of books mentioned in the episode'),
    socialContent: z.object({
        tweet: z.string().describe('A viral-style tweet (max 280 chars) to promote the episode'),
        linkedin: z.string().describe('A professional LinkedIn post summarizing the key value'),
        blogTitle: z.string().describe('A catchy blog post title based on the content')
    }).describe('Social media assets generated from the episode'),
    chapters: z.array(z.object({
        title: z.string().describe('Chapter title'),
        start: z.string().describe('Start timestamp in [MM:SS] format'),
        reason: z.string().describe('Why this segment is important')
    })).describe('Key segments/chapters with timestamps'),
    entities: z.array(z.object({
        name: z.string().describe('Name of the person, book, or concept'),
        type: z.enum(['PERSON', 'BOOK', 'CONCEPT', 'ORGANIZATION', 'TECHNOLOGY']).describe('Type of entity'),
        description: z.string().describe('Brief context about why this entity was mentioned')
    })).describe('List of people, books, key concepts, organizations, and technologies mentioned')
});

export type InsightData = z.infer<typeof insightSchema>;
