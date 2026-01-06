import Link from 'next/link';
import Image from 'next/image';
import { UserMenu } from '@/components/auth/user-menu';
import { auth } from '@/auth';

export async function SiteHeader() {
    const session = await auth();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-20 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                    <div className="relative h-12 w-12 overflow-hidden">
                        <Image
                            src="/podcatch.png"
                            alt="Podcatch Logo"
                            fill
                            className="object-contain"
                            sizes="48px"
                        />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">Podcatch</span>
                </Link>
                <div className="flex items-center gap-4">
                    {session?.user && <UserMenu user={session.user} />}
                </div>
            </div>
        </header>
    );
}
