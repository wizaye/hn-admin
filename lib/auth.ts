import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const secretKey = process.env.JWT_SECRET_KEY || "your-super-secret-key-replace-in-production";
const key = new TextEncoder().encode(secretKey);

const SALT_ROUNDS = 12;

// ── JWT helpers ──

export async function encrypt(payload: Record<string, unknown>) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key);
}

export async function decrypt(input: string): Promise<Record<string, unknown> | null> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ["HS256"],
        });
        return payload as Record<string, unknown>;
    } catch {
        // Token expired or invalid
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    return await decrypt(session);
}

// ── Password helpers ──

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
