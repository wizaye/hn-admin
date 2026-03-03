import { NextResponse } from "next/server";
import { createAdminUsersTable, getAdminCount } from "@/lib/db";

/**
 * One-time setup endpoint.
 * Creates the admin_users table if it doesn't exist.
 * Returns the current admin count so the frontend knows if signup is needed.
 */
export async function POST() {
    try {
        await createAdminUsersTable();
        const count = await getAdminCount();
        return NextResponse.json({ success: true, adminCount: count });
    } catch (error) {
        console.error("Setup error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to set up database" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        let count = 0;
        try {
            count = await getAdminCount();
        } catch {
            // Table might not exist yet — that's fine, count stays 0
            await createAdminUsersTable();
        }
        return NextResponse.json({ success: true, adminCount: count });
    } catch (error) {
        console.error("Setup check error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to check setup" },
            { status: 500 }
        );
    }
}
