export function SiteFooter() {
    return (
        <footer className="border-t bg-muted/20">
            <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Podcatch. All rights reserved.
            </div>
        </footer>
    );
}
