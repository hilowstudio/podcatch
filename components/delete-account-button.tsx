'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteAccount } from '@/actions/account-actions';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';

export function DeleteAccountButton() {
    const [confirmation, setConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteAccount();
            if (result.success) {
                toast.success('Account deleted permanently');
                await signOut({ callbackUrl: '/' });
            } else {
                toast.error(result.error || 'Failed to delete account');
                setIsDeleting(false);
            }
        } catch {
            toast.error('Failed to delete account');
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" /> Delete Account
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <span className="block">
                            This action is irreversible. All your data will be permanently destroyed, including:
                        </span>
                        <span className="block text-sm">
                            Subscriptions, episodes, transcripts, AI insights, collections, custom prompts, brand voice, snips, and notification history.
                        </span>
                        <span className="block font-medium text-foreground">
                            We recommend exporting your data first from the settings page.
                        </span>
                        <span className="block text-sm">
                            Type <strong>delete my account</strong> to confirm.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                    placeholder="delete my account"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    className="mt-2"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmation('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={confirmation !== 'delete my account' || isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Deleting...</>
                        ) : (
                            'Delete Permanently'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
