import Link from 'next/link';

export function SiteFooter() {
    return (
        <footer className="border-t bg-muted/20">
            <div className="container mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="font-bold text-xl flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                                P
                            </div>
                            Podcatch
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Your second brain for audio. Turn podcasts into actionable knowledge.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold mb-3">Product</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                            <li><Link href="/auth/signin" className="hover:text-foreground">Login</Link></li>
                            <li><Link href="#" className="hover:text-foreground">Changelog</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold mb-3">Legal</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold mb-3">Social</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground">Twitter</a></li>
                            <li><a href="#" className="hover:text-foreground">GitHub</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} Podcatch. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
