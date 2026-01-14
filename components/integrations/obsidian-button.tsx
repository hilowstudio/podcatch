'use client';

import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ObsidianButtonProps {
    vaultName?: string | null;
    title: string;
    content: string; // The summary or transcript
}

export function ObsidianButton({ vaultName, title, content }: ObsidianButtonProps) {
    const handleSave = () => {
        if (!vaultName) {
            toast.error("Please configure your Obsidian Vault Name in settings first.");
            return;
        }

        const encodedVault = encodeURIComponent(vaultName);
        const encodedTitle = encodeURIComponent(title);
        const encodedContent = encodeURIComponent(content);

        // obsidian://new?vault=my%20vault&name=my%20note&content=my%20content
        const uri = `obsidian://new?vault=${encodedVault}&name=${encodedTitle}&content=${encodedContent}`;

        // Open the URI
        window.open(uri, '_self');
        toast.success("Opening Obsidian...");
    };

    return (
        <Button variant="outline" size="sm" onClick={handleSave}>
            <FileText className="mr-2 h-4 w-4" />
            Save to Obsidian
        </Button>
    );
}
