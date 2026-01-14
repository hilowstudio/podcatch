import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Resend from 'next-auth/providers/resend';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

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
        }),
    ],
    callbacks: {
        authorized: async ({ auth, request: { nextUrl } }) => {
            const pathname = nextUrl.pathname;

            // Allow static assets (images, fonts, etc.)
            if (pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i)) {
                return true;
            }

            // Allow public pages
            if (
                pathname === '/' ||
                pathname.startsWith('/share') ||
                pathname.startsWith('/auth') ||
                pathname.startsWith('/pricing') ||
                pathname.startsWith('/terms') ||
                pathname.startsWith('/privacy')
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
