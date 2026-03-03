import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * Returns the current session user data.
 * Used by the sidebar to display the logged-in admin's name and email.
 */
export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json(
                { success: false, user: null },
                { status: 401 }
            );
        }

        const user = session.user as { name?: string; email?: string };

        return NextResponse.json({
            success: true,
            user: {
                name: user.name || "Admin",
                email: user.email || "",
            },
        });
    } catch {
        return NextResponse.json(
            { success: false, user: null },
            { status: 500 }
        );
    }
}
