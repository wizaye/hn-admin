import { NextResponse } from "next/server";
import { encrypt, hashPassword, getSession } from "@/lib/auth";
import { createAdminUser, getAdminByEmail, getAdminCount, createAdminUsersTable } from "@/lib/db";
import { cookies } from "next/headers";

// Password strength validation
function validatePassword(password: string): string | null {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    return null;
}

// Email validation
function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json();

        // Validate input
        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, message: "Name, email, and password are required" },
                { status: 400 }
            );
        }

        if (name.trim().length < 2) {
            return NextResponse.json(
                { success: false, message: "Name must be at least 2 characters" },
                { status: 400 }
            );
        }

        if (!validateEmail(email)) {
            return NextResponse.json(
                { success: false, message: "Please enter a valid email address" },
                { status: 400 }
            );
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return NextResponse.json(
                { success: false, message: passwordError },
                { status: 400 }
            );
        }

        // Ensure the table exists
        await createAdminUsersTable();

        // Security: Only allow signup if no admins exist OR if the requester is already authenticated
        const adminCount = await getAdminCount();
        if (adminCount > 0) {
            const session = await getSession();
            if (!session?.user) {
                return NextResponse.json(
                    { success: false, message: "Signup is restricted. Contact an existing admin for access." },
                    { status: 403 }
                );
            }
        }

        // Check if an admin with this email already exists
        const existing = await getAdminByEmail(email);
        if (existing) {
            return NextResponse.json(
                { success: false, message: "An admin with this email already exists" },
                { status: 409 }
            );
        }

        // Hash password and create user
        const passwordHash = await hashPassword(password);
        await createAdminUser(name.trim(), email.toLowerCase().trim(), passwordHash);

        // Auto-login after signup: create a session
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const session = await encrypt({ user: { name: name.trim(), email: email.toLowerCase().trim() }, expires: expires.toISOString() });

        const cookieStore = await cookies();
        cookieStore.set("session", session, {
            expires,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
