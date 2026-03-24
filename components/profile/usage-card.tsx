import { getEpisodeUsage } from '@/lib/usage';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity } from 'lucide-react';

export async function UsageCard({ userId }: { userId: string }) {
    const [usage, plan] = await Promise.all([
        getEpisodeUsage(userId),
        getUserSubscriptionPlan(),
    ]);

    const limit = plan.maxEpisodesPerMonth;
    const percentage = limit > 0 ? Math.round((usage / limit) * 100) : 0;

    // Calculate reset date (1st of next month UTC)
    const now = new Date();
    const resetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Monthly Usage
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                        {plan.name} Plan
                    </span>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold">{usage}</span>
                        <span className="text-sm text-muted-foreground">
                            of {limit} episodes
                        </span>
                    </div>
                    <Progress value={usage} max={limit} />
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{limit - usage} remaining</span>
                    <span>Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}</span>
                </div>

                {percentage >= 90 && (
                    <p className="text-sm text-status-danger">
                        You're approaching your monthly limit. Consider upgrading for more episodes.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
