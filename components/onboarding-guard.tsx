'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface OnboardingGuardProps {
    shouldOnboard: boolean;
}

export function OnboardingGuard({ shouldOnboard }: OnboardingGuardProps) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // If user needs onboarding and is NOT on pricing page (or calling API), redirect
        // Also allow auth pages just in case (signin/signout)
        if (
            shouldOnboard &&
            !pathname.startsWith('/pricing') &&
            !pathname.startsWith('/api') &&
            !pathname.startsWith('/auth')
        ) {
            router.push('/pricing?onboarding=true');
        }
    }, [shouldOnboard, pathname, router]);

    return null;
}
