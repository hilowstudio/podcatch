'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { updateIntegrations } from '../../actions/profile-actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface IntegrationsSettingsProps {
    slackWebhookUrl?: string | null;
    obsidianVaultName?: string | null;
}

export function IntegrationsSettings({
    slackWebhookUrl: initialSlack,
    obsidianVaultName: initialObsidian
}: IntegrationsSettingsProps) {
    const [slackWebhook, setSlackWebhook] = useState(initialSlack || '');
    const [obsidianVault, setObsidianVault] = useState(initialObsidian || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateIntegrations({
                slackWebhookUrl: slackWebhook || null,
                obsidianVaultName: obsidianVault || null
            });
            toast.success("Integrations updated successfully");
        } catch (error) {
            toast.error("Failed to update integrations");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">Integrations</CardTitle>
                <CardDescription>
                    Connect your favorite tools to share and sync your insights.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Slack Section */}
                    <div className="space-y-3">
                        <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                        <Input
                            id="slackWebhook"
                            placeholder="https://hooks.slack.com/services/..."
                            value={slackWebhook}
                            onChange={(e) => setSlackWebhook(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Create an Incoming Webhook in your Slack App settings to post messages to a channel.
                        </p>
                    </div>

                    {/* Obsidian Section */}
                    <div className="space-y-3">
                        <Label htmlFor="obsidianVault">Obsidian Vault Name</Label>
                        <Input
                            id="obsidianVault"
                            placeholder="My Knowledge Base"
                            value={obsidianVault}
                            onChange={(e) => setObsidianVault(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            The exact name of your local Obsidian vault. Required for "Save to Obsidian" links to work.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
