import { signIn } from '@/auth';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function SignInPage() {
    return (
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
            {/* Left Column: Branding & Sign In */}
            <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 bg-white text-black">
                <div className="mb-12">
                    <div className="relative h-32 w-32 mb-8">
                        <Image
                            src="/podcatch.png"
                            alt="Podcatch Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-6xl font-bold tracking-tight mb-6">
                        Turn Listening <br />
                        <span className="text-zinc-500">into Knowledge.</span>
                    </h1>
                    <p className="text-xl text-zinc-600 max-w-md leading-relaxed">
                        Automatically sync podcast transcripts and AI insights directly to your Claude Projects.
                    </p>
                </div>

                <div className="max-w-sm">
                    <form
                        action={async () => {
                            'use server';
                            await signIn('google', { redirectTo: '/' });
                        }}
                    >
                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-medium bg-black hover:bg-zinc-800 text-white rounded-full transition-all"
                        >
                            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Sign in with Google
                        </Button>
                    </form>
                    <p className="mt-6 text-xs text-zinc-400">
                        By signing in, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>

            {/* Right Column: Visual */}
            <div className="hidden md:flex flex-col justify-center items-center bg-zinc-50 p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>

                {/* Abstract Visual / Hero Image representation */}
                <div className="relative w-full max-w-lg aspect-square">
                    <div className="absolute inset-0 bg-gradient-to-tr from-zinc-200 to-white rounded-3xl shadow-xl flex items-center justify-center border border-zinc-100">
                        <div className="text-center p-8">
                            <div className="text-6xl mb-4">🎙️ ➔ 🤖</div>
                            <h3 className="text-2xl font-bold text-zinc-900 mb-2">Seamless Sync</h3>
                            <p className="text-zinc-500">Your podcasts, transcribed and analyzed, waiting for you in Claude.</p>
                        </div>
                    </div>
                    {/* Floating Elements decoration */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-black rounded-2xl shadow-lg opacity-5 animate-pulse"></div>
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-zinc-300 rounded-full blur-3xl opacity-20"></div>
                </div>
            </div>
        </div>
    );
}
