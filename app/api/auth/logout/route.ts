import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("session");

        // You could also redirect from here if you prefer server-side redirect, 
        // but usually it's handled on the client after the API call.
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
