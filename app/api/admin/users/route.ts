import { NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import {
    getAllAdmins,
    getAdminCount,
    getAdminByEmail,
    createAdminUser,
    createAdminUsersTable,
    deleteAdminByEmail,
} from "@/lib/db";

const MAX_ADMINS = 3;

// Password strength validation
function validatePassword(password: string): string | null {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    return null;
}

function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * GET /api/admin/users — List all admin users
 */
export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await createAdminUsersTable();
        const admins = await getAllAdmins();
        const count = await getAdminCount();

        return NextResponse.json({
            success: true,
            data: admins,
            maxAdmins: MAX_ADMINS,
            canAddMore: count < MAX_ADMINS,
        });
    } catch (error) {
        console.error("Error listing admins:", error);
        return NextResponse.json(
            { success: false, message: "Failed to list admin users" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/users — Create a new admin user
 */
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { name, email, password } = await request.json();

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

        await createAdminUsersTable();

        const adminCount = await getAdminCount();
        if (adminCount >= MAX_ADMINS) {
            return NextResponse.json(
                { success: false, message: `Maximum of ${MAX_ADMINS} admin accounts allowed` },
                { status: 403 }
            );
        }

        const existing = await getAdminByEmail(email.toLowerCase().trim());
        if (existing) {
            return NextResponse.json(
                { success: false, message: "An admin with this email already exists" },
                { status: 409 }
            );
        }

        const passwordHash = await hashPassword(password);
        await createAdminUser(name.trim(), email.toLowerCase().trim(), passwordHash);

        return NextResponse.json({ success: true, message: "Admin user created successfully" }, { status: 201 });
    } catch (error) {
        console.error("Error creating admin:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create admin user" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/users — Remove an admin user
 */
export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { success: false, message: "Email is required" },
                { status: 400 }
            );
        }

        // Prevent self-deletion
        const currentUser = session.user as { email?: string };
        if (currentUser.email?.toLowerCase() === email.toLowerCase()) {
            return NextResponse.json(
                { success: false, message: "You cannot delete your own account" },
                { status: 400 }
            );
        }

        const existing = await getAdminByEmail(email.toLowerCase());
        if (!existing) {
            return NextResponse.json(
                { success: false, message: "Admin user not found" },
                { status: 404 }
            );
        }

        await deleteAdminByEmail(email.toLowerCase());

        return NextResponse.json({ success: true, message: "Admin user removed successfully" });
    } catch (error) {
        console.error("Error deleting admin:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete admin user" },
            { status: 500 }
        );
    }
}
