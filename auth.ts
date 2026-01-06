import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
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
        Resend({
            apiKey: process.env.AUTH_RESEND_KEY,
            from: process.env.EMAIL_FROM,
        }),
    ],
    callbacks: {
        authorized: async ({ auth }) => {
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
