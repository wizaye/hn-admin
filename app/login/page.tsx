"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Settings } from "lucide-react";

function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasAdmins, setHasAdmins] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch("/api/auth/setup")
            .then((r) => r.json())
            .then((data) => {
                if (data.success && data.adminCount === 0) {
                    setHasAdmins(false);
                }
            })
            .catch(() => { });
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success("Login successful");
                router.push("/");
                router.refresh();
            } else {
                toast.error(data.message || "Invalid credentials");
            }
        } catch {
            toast.error("An error occurred during login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <form onSubmit={handleLogin}>
                <FieldGroup>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="flex flex-col items-center gap-2 font-medium">
                            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                <Settings className="size-4" />
                            </div>
                        </div>
                        <h1 className="text-xl font-bold">Welcome to HN Admin</h1>
                        <FieldDescription>
                            {!hasAdmins ? (
                                <>
                                    No admin account yet?{" "}
                                    <Link href="/signup" className="underline underline-offset-4">
                                        Set up your account
                                    </Link>
                                </>
                            ) : (
                                <>
                                    Don&apos;t have an account?{" "}
                                    <Link href="/signup" className="underline underline-offset-4">
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </FieldDescription>
                    </div>
                    <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </Field>
                    <Field>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Signing in..." : "Login"}
                        </Button>
                    </Field>
                </FieldGroup>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <LoginForm />
            </div>
            <Toaster richColors position="top-right" />
        </div>
    );
}
