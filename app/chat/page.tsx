'use client';

import { useChat } from '@ai-sdk/react';
import { useAudio } from '@/components/audio-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Bot, Sparkles, PlayCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Helper to parse text with timestamps [MM:SS] or [MM:SS|id:uuid]
function MessageContent({ content }: { content: string }) {
    const { seek, play, currentEpisode } = useAudio();

    // Regex for [MM:SS] or [HH:MM:SS] optionally with |id:uuid
    // Group 1: Optional hours
    // Group 2: MM:SS
    // Group 3: Optional |id:uuid
    const timestampRegex = /\[(\d{1,2}:)?(\d{1,2}:\d{2})(?:\|id:([a-zA-Z0-9-]+))?\]/g;

    // Manual iteration is better than split for complex regex
    const elements = [];
    let lastIndex = 0;
    let match;

    // Reset regex state
    timestampRegex.lastIndex = 0;

    while ((match = timestampRegex.exec(content)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            elements.push(<span key={lastIndex}>{content.substring(lastIndex, match.index)}</span>);
        }

        const fullMatch = match[0];
        const timeString = (match[1] || '') + match[2]; // HH:MM:SS or MM:SS
        const episodeId = match[3];

        // Calculate seconds
        const timeParts = timeString.split(':').map(Number);
        let seconds = 0;
        if (timeParts.length === 3) {
            seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
        } else {
            seconds = timeParts[0] * 60 + timeParts[1];
        }

        // Add button
        elements.push(
            <CitationButton
                key={match.index}
                seconds={seconds}
                label={timeString}
                episodeId={episodeId}
            />
        );

        lastIndex = timestampRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        elements.push(<span key={lastIndex}>{content.substring(lastIndex)}</span>);
    }

    return <p className="whitespace-pre-wrap text-sm leading-relaxed">{elements}</p>;
}

import { getEpisodeForPlayer } from '@/actions/episode-actions';
import { Loader2 } from 'lucide-react';

function CitationButton({ seconds, label, episodeId }: { seconds: number, label: string, episodeId?: string }) {
    const { seek, play, currentEpisode } = useAudio();
    const [isLoading, setIsLoading] = useState(false);

    async function handleClick() {
        // Check if we need to switch episodes
        if (episodeId && currentEpisode?.id !== episodeId) {
            setIsLoading(true);
            try {
                const episode = await getEpisodeForPlayer(episodeId);
                if (episode) {
                    play({ ...episode, feedTitle: episode.feedTitle || undefined });
                    // Short delay to allow audio to load slightly? play() handles src setting.
                    // Seek after loadedmetadata? AudioProvider resets currentTime to 0 on new src.
                    // We might need to seek *after* play logic finishes.
                    // AudioProvider's play() is async but fire-and-forget mostly.
                    // Let's rely on checking if it's the right episode and then seek.

                    // Actually, modifying `play` to accept a `startTime` would be cleaner, but for now:
                    setTimeout(() => seek(seconds), 500); // Hacky but functional for "Smart Player"
                }
            } catch (error) {
                console.error("Failed to load episode", error);
            } finally {
                setIsLoading(false);
            }
        } else {
            // Same episode or no ID, just seek
            seek(seconds);
        }
    }

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className="inline-flex items-center gap-1 mx-1 text-xs font-medium text-blue-600 hover:underline cursor-pointer bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 disabled:opacity-50"
        >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlayCircle className="h-3 w-3" />}
            {label}
        </button>
    );
}

export default function ChatPage() {
    // @ai-sdk/react useChat returns { messages, sendMessage, status, ... }
    const { messages, sendMessage, status } = useChat();

    const isLoading = status === 'submitted' || status === 'streaming';

    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        // Clear input immediately?
        setInput('');

        // Send message
        // Note: sendMessage usually appends the user message and sends request.
        // Typescript will validate if sendMessage accepts this object.
        // If sendMessage is not available, we might need 'append'.
        // But 'UseChatHelpers' picked 'sendMessage'.
        await sendMessage(userMessage as any);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto p-4 mb-20"> {/* Adjusted height for sticky player */}
            <div className="mb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-purple-500" />
                    Chat with your Library
                </h1>
                <p className="text-muted-foreground">
                    Ask questions about any episode. Click timestamps (e.g. [12:30]) to jump to audio.
                </p>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col border-2 shadow-sm">
                <CardContent className="flex-1 p-0 flex flex-col">
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-6">
                            {messages.length === 0 && (
                                <div className="text-center text-muted-foreground mt-20">
                                    <p>Try asking "What was the main takeaway from the last episode?"</p>
                                </div>
                            )}
                            {messages.map((m: any) => (
                                <div
                                    key={m.id}
                                    className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''
                                        }`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        {m.role === 'user' ? (
                                            <User className="h-4 w-4" />
                                        ) : (
                                            <Bot className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div
                                        className={`rounded-lg px-4 py-3 max-w-[85%] shadow-sm ${m.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted/50 border'
                                            }`}
                                    >
                                        <MessageContent content={m.content} />
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <Bot className="h-4 w-4 animate-pulse" />
                                    </div>
                                    <div className="bg-muted/50 border rounded-lg px-4 py-3">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce delay-75" />
                                            <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce delay-150" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
                        <form onSubmit={handleFormSubmit} className="flex gap-2">
                            <Input
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Ask about your podcasts..."
                                className="flex-1"
                            />
                            <Button type="submit" disabled={isLoading || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
