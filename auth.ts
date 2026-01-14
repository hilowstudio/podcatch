import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Resend from 'next-auth/providers/resend';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { Resend as ResendClient } from 'resend';

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        // Apple Removed
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID!,
            clientSecret: process.env.AUTH_GITHUB_SECRET!,
        }),
        Resend({
            apiKey: process.env.AUTH_RESEND_KEY,
            from: process.env.EMAIL_FROM,
            async sendVerificationRequest({ identifier: email, url }) {
                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    return;
                }

                const resend = new ResendClient(process.env.AUTH_RESEND_KEY);
                const { host } = new URL(url);

                await resend.emails.send({
                    from: process.env.EMAIL_FROM!,
                    to: email,
                    subject: `Sign in to ${host}`,
                    text: `Sign in to ${host}\n${url}\n\n`,
                    html: `<body><p>Sign in to ${host}</p><p><a href="${url}">Click here to sign in</a></p></body>`,
                });
            },
        }),
    ],
    callbacks: {
        authorized: async ({ auth, request: { nextUrl } }) => {
            const pathname = nextUrl.pathname;

            // Allow static assets (images, fonts, etc.)
            if (pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|js|css|json|webmanifest)$/i)) {
                return true;
            }

            // Allow public pages
            if (
                pathname === '/' ||
                pathname.startsWith('/share') ||
                pathname.startsWith('/auth') ||
                pathname.startsWith('/pricing') ||
                pathname.startsWith('/terms') ||
                pathname.startsWith('/privacy') ||
                pathname.startsWith('/api/register')
            ) {
                return true;
            }

            // Return true if user is authenticated
            return !!auth;
        },
        session({ session, user }) {
            session.user.id = user.id;
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
});
