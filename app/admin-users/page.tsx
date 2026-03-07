"use client";

import React, { useEffect, useState, useCallback } from "react";
import AdminSidebarLayout from "@/components/admin-sidebar-layout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { UserPlus, Trash2, ShieldCheck, Users } from "lucide-react";

interface AdminUser {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

export default function AdminUsersPage() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [canAddMore, setCanAddMore] = useState(false);
    const [maxAdmins, setMaxAdmins] = useState(3);
    const [loading, setLoading] = useState(true);
    const [currentUserEmail, setCurrentUserEmail] = useState("");

    // Add admin form state
    const [addName, setAddName] = useState("");
    const [addEmail, setAddEmail] = useState("");
    const [addPassword, setAddPassword] = useState("");
    const [addConfirmPassword, setAddConfirmPassword] = useState("");
    const [adding, setAdding] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchAdmins = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            if (data.success) {
                setAdmins(data.data || []);
                setCanAddMore(data.canAddMore);
                setMaxAdmins(data.maxAdmins);
            }
        } catch {
            toast.error("Failed to load admin users");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Get current user email
        fetch("/api/auth/session")
            .then((r) => r.json())
            .then((data) => {
                if (data.success && data.user) {
                    setCurrentUserEmail(data.user.email || "");
                }
            })
            .catch(() => { });

        fetchAdmins();
    }, [fetchAdmins]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();

        if (addPassword !== addConfirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setAdding(true);

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: addName, email: addEmail, password: addPassword }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success("Admin user created successfully");
                setAddName("");
                setAddEmail("");
                setAddPassword("");
                setAddConfirmPassword("");
                setAddDialogOpen(false);
                fetchAdmins();
            } else {
                toast.error(data.message || "Failed to create admin");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);

        try {
            const res = await fetch(`/api/admin/users?email=${encodeURIComponent(deleteTarget.email)}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success("Admin user removed");
                setDeleteTarget(null);
                fetchAdmins();
            } else {
                toast.error(data.message || "Failed to remove admin");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <AdminSidebarLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Admin Users</h1>
                        <p className="text-muted-foreground">
                            Manage who has access to this admin panel.
                        </p>
                    </div>

                    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button disabled={!canAddMore} className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Add Admin
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Admin</DialogTitle>
                                <DialogDescription>
                                    Create a new admin account. Maximum {maxAdmins} admins allowed.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="add-name" className="text-sm font-medium">
                                        Full Name
                                    </label>
                                    <Input
                                        id="add-name"
                                        placeholder="Admin User"
                                        value={addName}
                                        onChange={(e) => setAddName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="add-email" className="text-sm font-medium">
                                        Email
                                    </label>
                                    <Input
                                        id="add-email"
                                        type="email"
                                        placeholder="admin@example.com"
                                        value={addEmail}
                                        onChange={(e) => setAddEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="add-password" className="text-sm font-medium">
                                        Password
                                    </label>
                                    <Input
                                        id="add-password"
                                        type="password"
                                        placeholder="Min. 8 chars, upper, lower, number"
                                        value={addPassword}
                                        onChange={(e) => setAddPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="add-confirm-password" className="text-sm font-medium">
                                        Confirm Password
                                    </label>
                                    <Input
                                        id="add-confirm-password"
                                        type="password"
                                        placeholder="Re-enter password"
                                        value={addConfirmPassword}
                                        onChange={(e) => setAddConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={adding}>
                                        {adding ? "Creating..." : "Create Admin"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5" />
                                    Admin Accounts
                                </CardTitle>
                                <CardDescription>
                                    {admins.length} of {maxAdmins} admin slots used
                                </CardDescription>
                            </div>
                            <Badge variant={canAddMore ? "outline" : "destructive"}>
                                {admins.length}/{maxAdmins}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Spinner className="size-6 text-muted-foreground" />
                            </div>
                        ) : admins.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                <p>No admin users found</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-b-lg">
                                <Table>
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="hidden md:table-cell">Created</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {admins.map((admin) => {
                                            const isCurrentUser =
                                                admin.email.toLowerCase() === currentUserEmail.toLowerCase();
                                            return (
                                                <TableRow key={admin.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {admin.name}
                                                            {isCurrentUser && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    You
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {admin.email}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                                                        {new Date(admin.created_at).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={isCurrentUser}
                                                            onClick={() => setDeleteTarget(admin)}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Remove Admin</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to remove <strong>{deleteTarget?.name}</strong> (
                                {deleteTarget?.email})? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                                {deleting ? "Removing..." : "Remove Admin"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminSidebarLayout>
    );
}
