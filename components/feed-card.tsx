import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileAudio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DeleteFeedButton } from '@/components/delete-feed-button';

type FeedCardProps = {
    id: string;
    title: string | null;
    image: string | null;
    url: string;
    episodeCount: number;
    lastEpisodeDate: Date | null;
};

export function FeedCard({ id, title, image, episodeCount, lastEpisodeDate }: FeedCardProps) {
    return (
        <Card className="group overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]">
            <Link href={`/feeds/${id}`} className="block">
                <CardHeader className="p-0">
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
                        {image ? (
                            <Image
                                src={image}
                                alt={title || 'Podcast'}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                <FileAudio className="h-16 w-16 text-muted-foreground/40" />
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2 text-lg flex-1">
                            {title || 'Untitled Feed'}
                        </CardTitle>
                        <div onClick={(e) => e.preventDefault()} className="flex-shrink-0">
                            <DeleteFeedButton feedId={id} feedTitle={title || 'Untitled Feed'} />
                        </div>
                    </div>
                    <CardDescription className="mt-2 flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                            <FileAudio className="h-4 w-4" />
                            {episodeCount} {episodeCount === 1 ? 'episode' : 'episodes'}
                        </span>
                        {lastEpisodeDate && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDistanceToNow(lastEpisodeDate, { addSuffix: true })}
                            </span>
                        )}
                    </CardDescription>
                </CardContent>
            </Link>
        </Card>
    );
}
