'use client';

import { signInWithEmail, signInWithGoogle, signInWithGitHub } from '@/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Mail, Sparkles, Brain, Zap, MessageSquare, FileText, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

const features = [
    { icon: Brain, label: 'AI Summaries', desc: 'Instant episode insights' },
    { icon: FileText, label: 'Transcripts', desc: 'Full text from any episode' },
    { icon: Search, label: 'Deep Discovery', desc: 'Search across all episodes' },
    { icon: MessageSquare, label: 'Key Takeaways', desc: 'Never miss the point' },
];

const testimonials = [
    { quote: "If you knew what I used to do just to get half this functionality before, you'd have built this a long time ago.", author: "Reuben C." },
    { quote: "Yeah. This is gonna be a hit.", author: "James S." },
    { quote: "I can literally stop using like five tools. LOVE THIS.", author: "Chloe M." },
];

export default function SignInPage() {
    const [activeTestimonial, setActiveTestimonial] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 text-white overflow-hidden">
            {/* Animated background gradient */}
            <div className="fixed inset-0 opacity-30">
                <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-600 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-12">
                {/* Left Column: Hero + Features */}
                <div className="flex flex-col justify-center max-w-xl mx-auto lg:mx-0">
                    {/* Logo with glow */}
                    <div className="mb-8 animate-fade-in">
                        <div className="relative h-20 w-20 mb-6">
                            <div className="absolute inset-0 bg-indigo-500/40 rounded-2xl blur-xl animate-pulse" />
                            <Image
                                src="/podcatch.png"
                                alt="Podcatch Logo"
                                fill
                                className="object-contain relative z-10"
                                priority
                            />
                        </div>
                    </div>

                    {/* Hero Text */}
                    <div className="space-y-4 mb-10">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight animate-slide-up">
                            Your Second Brain
                            <br />
                            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                for Audio
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-400 max-w-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            Transform any podcast into actionable insights. AI-powered transcripts, summaries, and semantic search.
                        </p>
                    </div>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        {features.map((feature, i) => (
                            <div
                                key={feature.label}
                                className="group flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition-all duration-300 animate-slide-up"
                                style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                            >
                                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/30 transition-colors">
                                    <feature.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-white">{feature.label}</div>
                                    <div className="text-xs text-zinc-500">{feature.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Rotating Testimonial */}
                    <div className="relative h-24 animate-slide-up" style={{ animationDelay: '0.6s' }}>
                        {testimonials.map((t, i) => (
                            <div
                                key={i}
                                className={`absolute inset-0 transition-all duration-700 ${i === activeTestimonial
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-4'
                                    }`}
                            >
                                <blockquote className="border-l-2 border-indigo-500 pl-4">
                                    <p className="text-zinc-300 italic text-sm md:text-base">&quot;{t.quote}&quot;</p>
                                    <footer className="mt-2 text-xs font-semibold text-indigo-400">— {t.author}</footer>
                                </blockquote>
                            </div>
                        ))}
                        {/* Dots */}
                        <div className="absolute -bottom-6 left-4 flex gap-2">
                            {testimonials.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveTestimonial(i)}
                                    className={`w-2 h-2 rounded-full transition-all ${i === activeTestimonial ? 'bg-indigo-500 w-6' : 'bg-zinc-600 hover:bg-zinc-500'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Sign In Card */}
                <div className="flex items-center justify-center lg:justify-end">
                    <div className="w-full max-w-md animate-fade-in-scale">
                        <div className="relative">
                            {/* Glowing border effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-30 animate-pulse" />

                            <div className="relative bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
                                        <Sparkles className="h-3 w-3" />
                                        Free to start
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Get Started</h2>
                                    <p className="text-zinc-400 text-sm">Sign in to unlock your podcast superpowers</p>
                                </div>

                                <div className="space-y-3">
                                    {/* Google Button */}
                                    <form action={signInWithGoogle}>
                                        <Button
                                            type="submit"
                                            className="w-full h-12 text-base font-medium rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            Continue with Google
                                        </Button>
                                    </form>

                                    {/* GitHub Button */}
                                    <form action={signInWithGitHub}>
                                        <Button
                                            type="submit"
                                            variant="outline"
                                            className="w-full h-12 text-base font-medium rounded-xl border-white/20 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                            </svg>
                                            Continue with GitHub
                                        </Button>
                                    </form>

                                    {/* Divider */}
                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-white/10" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-zinc-900 px-3 text-zinc-500">Or use email</span>
                                        </div>
                                    </div>

                                    {/* Email Form */}
                                    <form action={signInWithEmail} className="space-y-3">
                                        <div className="flex gap-2">
                                            <Input
                                                type="email"
                                                name="email"
                                                placeholder="name@example.com"
                                                className="h-11 text-sm bg-white/5 border-white/10 focus:border-indigo-500 rounded-xl"
                                                required
                                            />
                                            <Button
                                                type="submit"
                                                className="h-11 px-4 whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <Mail className="mr-2 h-4 w-4" />
                                                Send
                                            </Button>
                                        </div>
                                    </form>
                                </div>

                                <p className="mt-6 text-xs text-center text-zinc-500">
                                    By signing in, you agree to our Terms of Service and Privacy Policy.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }
                .animate-slide-up {
                    opacity: 0;
                    animation: slide-up 0.6s ease-out forwards;
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 0.6s ease-out forwards;
                    animation-delay: 0.3s;
                    opacity: 0;
                }
            `}</style>
        </div>
    );
}

