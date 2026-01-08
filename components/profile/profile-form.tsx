'use client';

import { useState } from 'react';
import { updateProfile } from '@/actions/user-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileFormProps {
    user: {
        name: string | null;
        image: string | null;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [name, setName] = useState(user.name || '');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData();
        formData.append('name', name);

        const result = await updateProfile(formData);
        setIsLoading(false);

        if (result.success) {
            toast.success('Profile updated');
        } else {
            toast.error('Failed to update profile');
        }
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user.image || ''} />
                            <AvatarFallback>{name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">Profile Picture</p>
                            <p className="text-xs text-muted-foreground">
                                Managed by your identity provider (Google/GitHub).
                            </p>
                        </div>
                    </div>

                    <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                            />
                        </div>
                    </form>
                </div>
            </CardContent>
            <CardFooter className="justify-end border-t bg-muted/50 px-6 py-4">
                <Button type="submit" form="profile-form" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardFooter>
        </Card>
    );
}
