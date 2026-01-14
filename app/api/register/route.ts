import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { email, captchaToken } = await req.json();

        if (!email || !captchaToken) {
            return NextResponse.json({ error: "Email and CAPTCHA are required" }, { status: 400 });
        }

        // 1. Verify the CAPTCHA with Cloudflare
        const formData = new FormData();
        formData.append('secret', process.env.CLOUDFLARE_TURNSTILE_SECRET!);
        formData.append('response', captchaToken);

        const captchaRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        });

        const captchaOutcome = await captchaRes.json();
        if (!captchaOutcome.success) {
            return NextResponse.json({ error: "Invalid CAPTCHA" }, { status: 400 });
        }

        // 2. Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            // We return 409 Conflict, or we can just return 200 and let them know "If you have an account..." 
            // but strictly following the prompt: "Return message: Account already exists"
            return NextResponse.json({ message: "Account already exists. Please sign in." }, { status: 409 });
        }

        // 3. Create the user
        await prisma.user.create({
            data: { email },
        });

        // 4. Return success
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
