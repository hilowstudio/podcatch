import { handlers } from '@/auth';
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const GET = handlers.GET;

export const POST = async (req: NextRequest) => {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";

    // Clean up expired rate limits (optional, can be done via cron or periodically)
    // For simplicity, we can do it here or just check expiry.
    // We'll do a simple check + increment transaction.

    const LIMIT = 5;
    const WINDOW_SECONDS = 60 * 10; // 10 minutes

    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_SECONDS * 1000);

    try {
        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Find existing record
            let record = await tx.rateLimit.findUnique({
                where: { ip },
            });

            // If no record or expired, reset
            if (!record || record.expiresAt < now) {
                record = await tx.rateLimit.upsert({
                    where: { ip },
                    update: {
                        count: 1,
                        expiresAt: new Date(now.getTime() + WINDOW_SECONDS * 1000),
                    },
                    create: {
                        ip,
                        count: 1,
                        expiresAt: new Date(now.getTime() + WINDOW_SECONDS * 1000),
                    },
                });
                return { allowed: true };
            }

            // If not expired, check limit
            if (record.count >= LIMIT) {
                return { allowed: false };
            }

            // Increment
            await tx.rateLimit.update({
                where: { ip },
                data: {
                    count: { increment: 1 },
                },
            });

            return { allowed: true };
        });

        if (!result.allowed) {
            return new Response("Too many login attempts. Please try again later.", { status: 429 });
        }

    } catch (error) {
        console.error("Rate limit error:", error);
        // Fail open or closed? Fail open for now to avoid locking everyone out if DB is slow.
    }

    return handlers.POST(req);
};
