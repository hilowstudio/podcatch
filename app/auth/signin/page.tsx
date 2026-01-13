'use client';

import { signInWithEmail, signInWithGoogle, signInWithGitHub } from '@/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import Image from 'next/image';
import { Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

const testimonials = [
    { quote: "If you knew what I used to do just to get half this functionality before, you'd have built this a long time ago. Take my money.", author: "Reuben C." },
    { quote: "Yeah. This is gonna be a hit.", author: "James S." },
    { quote: "I can literally stop using like five tools. LOVE THIS.", author: "Chloe M." },
];

export default function SignInPage() {
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
            {/* Left Column: Branding & Sign In */}
            <div className="flex flex-col items-center justify-center px-8 md:px-16 lg:px-24 bg-white text-black text-center">
                <div
                    className={`mb-12 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                >
                    <div className="relative h-48 w-48 mb-8 mx-auto transition-transform duration-300 hover:scale-105">
                        <Image
                            src="/podcatch.png"
                            alt="Podcatch Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight mb-4">
                        Welcome back
                    </h1>
                    <p className="text-lg text-zinc-600 max-w-md">
                        Sign in to sync your podcasts and AI insights.
                    </p>
                </div>

                <div
                    className={`max-w-sm w-full space-y-4 transition-all duration-700 ease-out delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
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
                                Continue with Google
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
                                Continue with GitHub
                            </Button>
                        </form>
                    </div>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-zinc-400">Or use email</span>
                        </div>
                    </div>

                    <form
                        action={signInWithEmail}
                        className="space-y-4"
                    >
                        <div className="flex gap-2">
                            <Input
                                type="email"
                                name="email"
                                placeholder="name@example.com"
                                className="h-10 text-sm bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-indigo-500/20 transition-shadow"
                                required
                            />
                            <Button
                                type="submit"
                                variant="secondary"
                                className="h-10 px-4 whitespace-nowrap bg-zinc-100 hover:bg-zinc-200 text-zinc-900 hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                            >
                                <Mail className="mr-2 h-4 w-4" />
                                Send Link
                            </Button>
                        </div>
                    </form>

                    <p className="pt-4 text-xs text-center text-zinc-400">
                        By signing in, you agree to our <Link href="/terms" className="underline hover:text-zinc-500">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-zinc-500">Privacy Policy</Link>.
                    </p>
                </div>
            </div>

            {/* Right Column: Visual */}
            <div className="hidden md:flex relative min-h-screen bg-zinc-900 overflow-hidden">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 via-transparent to-zinc-700/20 animate-gradient-shift" />

                <Image
                    src="/podcast.png"
                    alt="Podcast listening experience"
                    fill
                    className={`object-cover object-top transition-all duration-1000 ${mounted ? 'opacity-60 scale-100' : 'opacity-0 scale-105'
                        }`}
                    priority
                />

                {/* Layered gradients for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/30 to-transparent" />

                {/* Floating accent shapes */}
                <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-40 right-40 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-float-delayed" />

                <div
                    className={`absolute bottom-12 left-8 right-8 z-10 text-white transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                        }`}
                >
                    {/* Rotating testimonials with glass card design */}
                    <div className="relative h-44">
                        {testimonials.map((t, i) => (
                            <div
                                key={i}
                                className={`absolute inset-0 transition-all duration-700 ${i === activeTestimonial
                                    ? 'opacity-100 translate-y-0 scale-100'
                                    : 'opacity-0 translate-y-4 scale-95'
                                    }`}
                            >
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
                                    <svg
                                        className="h-8 w-8 text-white/60 mb-3"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                    </svg>
                                    <blockquote>
                                        <p className="text-lg md:text-xl font-medium text-white leading-relaxed mb-4">
                                            {t.quote}
                                        </p>
                                        <footer className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold text-sm">
                                                {t.author.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-white">{t.author}</span>
                                        </footer>
                                    </blockquote>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Indicator dots */}
                    <div className="flex justify-center gap-2 mt-4">
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveTestimonial(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${i === activeTestimonial
                                    ? 'w-8 bg-white'
                                    : 'w-2 bg-white/30 hover:bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(-5deg); }
                }
                @keyframes gradient-shift {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.5; }
                }
                .animate-float {
                    animation: float 8s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 10s ease-in-out infinite;
                    animation-delay: 2s;
                }
                .animate-gradient-shift {
                    animation: gradient-shift 6s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
