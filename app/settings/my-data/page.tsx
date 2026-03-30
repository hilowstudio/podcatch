import { getDataInventory } from '@/actions/data-inventory-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Database, User, Plug, Settings2, BarChart3 } from 'lucide-react';

export default async function MyDataPage() {
    const data = await getDataInventory();

    if (!data) {
        redirect('/auth/signin');
    }

    return (
        <div>
            <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
                <ArrowLeft className="h-3 w-3" /> Back to Settings
            </Link>

            <h2 className="text-xl font-semibold mb-2">My Data Inventory</h2>
            <p className="text-muted-foreground mb-6">
                A real-time view of all data Podcatch holds about you. Last checked: now.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4" /> Account
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <Row label="Name" value={data.account.name || 'Not set'} />
                        <Row label="Email" value={data.account.email} />
                        <Row label="Avatar" value={data.account.hasAvatar ? 'Set' : 'Not set'} />
                        <Row label="Member since" value={new Date(data.account.createdAt).toLocaleDateString()} />
                        <Row label="Subscription" value={data.account.hasSubscription ? 'Active' : 'Free'} />
                        {data.account.subscriptionEnd && (
                            <Row label="Period ends" value={new Date(data.account.subscriptionEnd).toLocaleDateString()} />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Database className="h-4 w-4" /> Content
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <Row label="Subscriptions" value={data.content.subscriptions.toString()} />
                        <Row label="Episodes processed" value={data.content.episodesProcessed.toString()} />
                        <Row label="Collections" value={data.content.collections.toString()} />
                        <Row label="Custom prompts" value={data.content.customPrompts.toString()} />
                        <Row label="Snips" value={data.content.snips.toString()} />
                        <Row label="Entities (knowledge graph)" value={data.content.entities.toString()} />
                        <Row label="Notifications" value={data.content.notifications.toString()} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Plug className="h-4 w-4" /> Integrations
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        {Object.entries(data.integrations).map(([key, connected]) => (
                            <Row key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={connected ? 'Connected' : 'Not connected'} badge={connected} />
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Settings2 className="h-4 w-4" /> Preferences
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <Row label="Brand Voice" value={data.preferences.hasBrandVoice ? 'Configured' : 'Not set'} />
                        <Row label="Digest" value={data.preferences.digestFrequency} />
                        <Row label="Timezone" value={data.preferences.timezone || 'UTC (default)'} />
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" /> Usage (This Month)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <Row label="Episodes processed" value={data.usage.processedThisMonth.toString()} />
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 flex gap-3 text-sm">
                <Link href="/settings" className="text-primary hover:underline">Export my data</Link>
                <span className="text-muted-foreground">|</span>
                <Link href="/help/data-format" className="text-primary hover:underline">Export format docs</Link>
            </div>
        </div>
    );
}

function Row({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{label}</span>
            {badge !== undefined ? (
                <Badge variant={badge ? 'default' : 'secondary'} className="text-xs">{value}</Badge>
            ) : (
                <span className="font-medium">{value}</span>
            )}
        </div>
    );
}
