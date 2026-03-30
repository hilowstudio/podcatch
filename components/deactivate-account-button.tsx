'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { PauseCircle, Loader2 } from 'lucide-react';
import { deactivateAccount } from '@/actions/account-actions';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';

export function DeactivateAccountButton() {
    const [isDeactivating, setIsDeactivating] = useState(false);

    const handleDeactivate = async () => {
        setIsDeactivating(true);
        try {
            const result = await deactivateAccount();
            if (result.success) {
                toast.success('Account deactivated');
                await signOut({ callbackUrl: '/' });
            } else {
                toast.error(result.error || 'Failed to deactivate');
                setIsDeactivating(false);
            }
        } catch {
            toast.error('Failed to deactivate account');
            setIsDeactivating(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <PauseCircle className="h-4 w-4" /> Deactivate Account
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate your account?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <span className="block">
                            Deactivation pauses your account. Your data is retained and you can reactivate at any time by logging back in.
                        </span>
                        <span className="block text-sm">
                            This is different from deletion — no data is destroyed.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivate} disabled={isDeactivating}>
                        {isDeactivating ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Deactivating...</>
                        ) : (
                            'Deactivate'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
