export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="-mt-12 -mb-20">
            {children}
        </div>
    );
}
