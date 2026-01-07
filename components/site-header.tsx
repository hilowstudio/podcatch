import Link from 'next/link';
import Image from 'next/image';
import { UserMenu } from '@/components/auth/user-menu';
import { auth } from '@/auth';

export async function SiteHeader() {
    const session = await auth();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-56 items-center justify-center px-4 relative">
                {/* Logo Centered & Enlarged */}
                <Link href="/" className="flex items-center hover:opacity-90 transition-opacity hover:scale-105 duration-200">
                    <div className="relative h-48 w-48 overflow-hidden drop-shadow-sm">
                        <Image
                            src="/podcatch.png"
                            alt="Podcatch Logo"
                            fill
                            className="object-contain"
                            sizes="192px"
                            priority
                        />
                    </div>
                </Link>

                {/* User Menu - Absolute Right */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
                    {session?.user && <UserMenu user={session.user} />}
                </div>
            </div>
        </header>
    );
}
