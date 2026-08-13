import { handlers } from '@/auth';
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const GET = handlers.GET;

export const POST = async (req: NextRequest) => {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";

    // Prefer rate-limiting by the target email — that's what magic-link email
    // bombing / brute force abuses. X-Forwarded-For is client-spoofable, so IP
    // alone is trivially bypassed by varying the header per request. Fall back to
    // IP for auth POSTs that carry no email (csrf, session, etc.).
    let key = `ip:${ip}`;
    try {
        const form = await req.clone().formData();
        const email = form.get("email");
        if (typeof email === "string" && email) {
            key = `email:${email.trim().toLowerCase()}`;
        }
    } catch {
        // Not a form-encoded body (JSON/csrf/session) — keep the IP key.
    }

    const LIMIT = 5;
    const WINDOW_SECONDS = 60 * 10; // 10 minutes

    const now = new Date();

    try {
        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Find existing record
            const record = await tx.rateLimit.findUnique({
                where: { ip: key },
            });

            // If no record or expired, reset
            if (!record || record.expiresAt < now) {
                await tx.rateLimit.upsert({
                    where: { ip: key },
                    update: {
                        count: 1,
                        expiresAt: new Date(now.getTime() + WINDOW_SECONDS * 1000),
                    },
                    create: {
                        ip: key,
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
                where: { ip: key },
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
        // Fail CLOSED on the email (magic-link) path — the vector an attacker
        // abuses. Other auth POSTs (csrf/session) fail open so a transient DB
        // blip doesn't lock everyone out of signing in.
        if (key.startsWith("email:")) {
            return new Response("Service temporarily unavailable. Please try again shortly.", { status: 503 });
        }
    }

    return handlers.POST(req);
};
