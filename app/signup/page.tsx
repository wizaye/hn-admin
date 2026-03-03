"use client";

import { useState } from "react";
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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Settings } from "lucide-react";

function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            await fetch("/api/auth/setup", { method: "POST" });

            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success("Account created! Redirecting to dashboard...");
                router.push("/");
                router.refresh();
            } else {
                toast.error(data.message || "Failed to create account");
            }
        } catch {
            toast.error("An error occurred during signup");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <form onSubmit={handleSignup}>
                <FieldGroup>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="flex flex-col items-center gap-2 font-medium">
                            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                <Settings className="size-4" />
                            </div>
                        </div>
                        <h1 className="text-xl font-bold">Welcome to HN Admin</h1>
                        <FieldDescription>
                            Already have an account?{" "}
                            <Link href="/login" className="underline underline-offset-4">
                                Sign in
                            </Link>
                        </FieldDescription>
                    </div>
                    <Field>
                        <FieldLabel htmlFor="name">Full Name</FieldLabel>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Admin User"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoComplete="name"
                        />
                    </Field>
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
                            placeholder="Min. 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                        <Input
                            id="confirm-password"
                            type="password"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </Field>
                    <Field>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating account..." : "Create Account"}
                        </Button>
                    </Field>
                </FieldGroup>
            </form>
        </div>
    );
}

export default function SignupPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <SignupForm />
            </div>
            <Toaster richColors position="top-right" />
        </div>
    );
}
