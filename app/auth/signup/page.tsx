'use client';

import { signInWithGoogle, signInWithGitHub } from '@/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import Turnstile from 'react-turnstile';
import { signIn } from 'next-auth/react';

const features = [
    "Transcribe unlimited podcasts",
    "Chat with your audio library",
    "Sync to Notion & Obsidian",
    "3-day Pro trial included"
];

export default function SignUpPage() {
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            // 1. Call your secure API to create the user
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, captchaToken: token }),
            });

            const data = await res.json();

            if (res.ok) {
                // 2. Now that the user exists, trigger the standard NextAuth magic link
                // We use "resend" provider ID or "email" depending on configuration, 
                // but usually "resend" works if imported as such.
                // However, falling back to 'email' is often safer for magic links if mapped.
                // We will try 'resend' first as per my investigation, but if it fails, the user can try login.
                const result = await signIn("resend", {
                    email,
                    redirect: false,
                    callbackUrl: "/dashboard" // Or wherever they should go
                });

                if (result?.error) {
                    setMessage("Error sending login email.");
                    console.error(result.error);
                } else {
                    setMessage("Account created! Check your email to sign in.");
                }
            } else {
                setMessage(data.message || data.error || "Registration failed.");
            }
        } catch (err) {
            console.error(err);
            setMessage("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
            {/* Left Column: Branding & Sign Up */}
            <div className="flex flex-col items-center justify-center px-8 md:px-16 lg:px-24 bg-white text-black text-center">
                <div className="mb-12 animate-fade-in-up">
                    <div className="relative h-48 w-48 mb-6 mx-auto transition-transform duration-300 hover:scale-105">
                        <Image
                            src="/podcatch.png"
                            alt="Podcatch Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight mb-4">
                        Create account
                    </h1>
                    <p className="text-lg text-zinc-600 max-w-md">
                        Start building your second brain for audio. <br />
                        No credit card required.
                    </p>
                </div>

                <div
                    className="max-w-sm w-full space-y-4 animate-fade-in-up"
                    style={{ animationDelay: '150ms' }}
                >
                    {/* Primary Social Logins */}
                    <div className="space-y-3">
                        <form action={signInWithGoogle}>
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full h-12 text-base font-medium rounded-full border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-md transition-all duration-200 relative active:scale-[0.98]"
                            >
                                <svg className="mr-3 h-5 w-5 absolute left-4" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Sign up with Google
                            </Button>
                        </form>


                        <form action={signInWithGitHub}>
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full h-12 text-base font-medium rounded-full border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-md transition-all duration-200 relative active:scale-[0.98]"
                            >
                                <svg className="mr-3 h-5 w-5 absolute left-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                Sign up with GitHub
                            </Button>
                        </form>
                    </div>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-zinc-400">Or using email</span>
                        </div>
                    </div>

                    <form
                        onSubmit={handleEmailSignUp}
                        className="space-y-4"
                    >
                        <div className="space-y-4">
                            <Input
                                type="email"
                                inputMode="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="h-10 text-sm bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-indigo-500/20 transition-shadow"
                                required
                                autoComplete="email"
                                aria-label="Email address"
                            />

                            <div className="flex justify-center">
                                <Turnstile
                                    sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                                    onVerify={(token) => setToken(token)}
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="secondary"
                                className="w-full h-10 px-4 whitespace-nowrap bg-zinc-100 hover:bg-zinc-200 text-zinc-900 hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                                disabled={!token || loading}
                            >
                                <Mail className="mr-2 h-4 w-4" />
                                {loading ? "Creating Account..." : "Sign Up"}
                            </Button>

                            {message && (
                                <p className={`text-sm text-center font-medium ${message.includes('Account created') ? 'text-green-600' : 'text-red-500'}`}>
                                    {message}
                                </p>
                            )}
                        </div>
                    </form>

                    <div className="pt-6">
                        <p className="text-sm text-zinc-500 mb-2">Already have an account?</p>
                        <Link href="/auth/signin" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
                            Log in instead
                        </Link>
                    </div>

                    <p className="pt-4 text-xs text-center text-zinc-400">
                        By signing up, you agree to our <Link href="/terms" className="underline hover:text-zinc-500">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-zinc-500">Privacy Policy</Link>.
                    </p>
                </div>
            </div>

            {/* Right Column: Visual */}
            <div className="hidden md:flex relative min-h-screen bg-zinc-900 overflow-hidden">
                {/* Background Image */}
                <img
                    src="/woman4.png"
                    alt="Podcast Listener"
                    className="absolute inset-0 w-full h-full object-cover object-right-top animate-zoom-out-enter"
                />

                {/* Dark gradient overlay for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

                {/* Content positioned at bottom-left with glassmorphism */}
                <div
                    className="absolute bottom-12 left-8 right-8 z-10 animate-fade-in-up"
                    style={{ animationDelay: '300ms' }}
                >
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl max-w-md">
                        <h2 className="text-2xl font-bold text-white mb-6">Everything you need to master your audio library.</h2>
                        <ul className="space-y-4">
                            {features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-white/90">
                                    <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
