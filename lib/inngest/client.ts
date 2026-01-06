import { Inngest, EventSchemas } from 'inngest';

// Define event schemas for type safety
type Events = {
    'feed/check.requested': {
        data: {
            feedId?: string; // Optional: check specific feed, or all if not provided
        };
    };
    'episode/process.requested': {
        data: {
            episodeId: string;
        };
    };
};

// Create the Inngest client
export const inngest = new Inngest({
    id: 'podcatch',
    schemas: new EventSchemas().fromRecord<Events>(),
    // Event key and signing key are optional for local development
    eventKey: process.env.INNGEST_EVENT_KEY,
});
