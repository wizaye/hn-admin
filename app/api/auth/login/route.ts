import { NextResponse } from "next/server";
import { encrypt, verifyPassword } from "@/lib/auth";
import { getAdminByEmail } from "@/lib/db";
import { cookies } from "next/headers";

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function rateLimit(ip: string): { allowed: boolean; remainingMs?: number } {
    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (!record) {
        loginAttempts.set(ip, { count: 1, lastAttempt: now });
        return { allowed: true };
    }

    // Reset if lockout has expired
    if (now - record.lastAttempt > LOCKOUT_DURATION) {
        loginAttempts.set(ip, { count: 1, lastAttempt: now });
        return { allowed: true };
    }

    if (record.count >= MAX_ATTEMPTS) {
        const remainingMs = LOCKOUT_DURATION - (now - record.lastAttempt);
        return { allowed: false, remainingMs };
    }

    record.count++;
    record.lastAttempt = now;
    return { allowed: true };
}

function resetRateLimit(ip: string) {
    loginAttempts.delete(ip);
}

export async function POST(request: Request) {
    try {
        // Rate limiting
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        const { allowed, remainingMs } = rateLimit(ip);

        if (!allowed) {
            const minutesLeft = Math.ceil((remainingMs || 0) / 60000);
            return NextResponse.json(
                { success: false, message: `Too many login attempts. Try again in ${minutesLeft} minute(s).` },
                { status: 429 }
            );
        }

        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Email and password are required" },
                { status: 400 }
            );
        }

        // Look up user in D1
        const admin = await getAdminByEmail(email);

        if (!admin) {
            return NextResponse.json(
                { success: false, message: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Verify password against stored hash
        const isValid = await verifyPassword(password, admin.password_hash);

        if (!isValid) {
            return NextResponse.json(
                { success: false, message: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Successful login — reset rate limiter
        resetRateLimit(ip);

        // Create JWT session
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const session = await encrypt({
            user: { name: admin.name, email: admin.email },
            expires: expires.toISOString(),
        });

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set("session", session, {
            expires,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        return NextResponse.json(
            { success: true, user: { name: admin.name, email: admin.email } },
            { status: 200 }
        );
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
